import { randomUUID } from 'expo-crypto';
import { openDatabaseAsync, type SQLiteDatabase } from 'expo-sqlite';

import type { WalletSummary, WalletType } from '@/domain/wallets';

import type { WalletRepository } from './wallet-repository';

type WalletRow = {
  id: string;
  name: string;
  type: WalletType;
  currency: 'THB';
  created_at: string;
  balance_minor: number;
};

let databasePromise: Promise<SQLiteDatabase> | null = null;

async function migrate(database: SQLiteDatabase) {
  await database.execAsync('PRAGMA journal_mode = WAL; PRAGMA foreign_keys = ON;');
  const result = await database.getFirstAsync<{ user_version: number }>('PRAGMA user_version');
  const currentVersion = result?.user_version ?? 0;
  if (currentVersion >= 1) return;

  await database.execAsync(`
    CREATE TABLE IF NOT EXISTS wallets (
      id TEXT PRIMARY KEY NOT NULL,
      name TEXT NOT NULL,
      type TEXT NOT NULL CHECK (type IN ('cash', 'bank-account', 'e-wallet')),
      currency TEXT NOT NULL CHECK (currency = 'THB'),
      created_at TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS transactions (
      id TEXT PRIMARY KEY NOT NULL,
      wallet_id TEXT NOT NULL REFERENCES wallets(id),
      kind TEXT NOT NULL CHECK (kind IN ('OPENING_BALANCE', 'INCOME', 'EXPENSE')),
      amount_minor INTEGER NOT NULL CHECK (amount_minor >= 0),
      currency TEXT NOT NULL CHECK (currency = 'THB'),
      occurred_at TEXT NOT NULL,
      created_at TEXT NOT NULL
    );
    CREATE INDEX IF NOT EXISTS transactions_wallet_id_idx ON transactions(wallet_id);
    PRAGMA user_version = 1;
  `);
}

async function getDatabase() {
  if (!databasePromise) {
    databasePromise = openDatabaseAsync('my-wallet.db').then(async (database) => {
      await migrate(database);
      return database;
    });
  }
  return databasePromise;
}

function toWalletSummary(row: WalletRow): WalletSummary {
  return {
    id: row.id,
    name: row.name,
    type: row.type,
    currency: row.currency,
    createdAt: row.created_at,
    balanceMinor: row.balance_minor,
  };
}

export const walletRepository: WalletRepository = {
  async createWallet(input) {
    const database = await getDatabase();
    const walletId = randomUUID();
    const createdAt = new Date().toISOString();

    await database.withExclusiveTransactionAsync(async (transaction) => {
      await transaction.runAsync(
        'INSERT INTO wallets (id, name, type, currency, created_at) VALUES (?, ?, ?, ?, ?)',
        walletId,
        input.name.trim(),
        input.type,
        'THB',
        createdAt,
      );

      if (input.openingBalanceMinor > 0) {
        await transaction.runAsync(
          'INSERT INTO transactions (id, wallet_id, kind, amount_minor, currency, occurred_at, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)',
          randomUUID(),
          walletId,
          'OPENING_BALANCE',
          input.openingBalanceMinor,
          'THB',
          input.occurredAt,
          createdAt,
        );
      }
    });

    return {
      id: walletId,
      name: input.name.trim(),
      type: input.type,
      currency: 'THB',
      createdAt,
      balanceMinor: input.openingBalanceMinor,
    };
  },

  async listWallets() {
    const database = await getDatabase();
    const rows = await database.getAllAsync<WalletRow>(`
      SELECT
        wallets.id,
        wallets.name,
        wallets.type,
        wallets.currency,
        wallets.created_at,
        COALESCE(SUM(
          CASE
            WHEN transactions.kind IN ('OPENING_BALANCE', 'INCOME') THEN transactions.amount_minor
            WHEN transactions.kind = 'EXPENSE' THEN -transactions.amount_minor
            ELSE 0
          END
        ), 0) AS balance_minor
      FROM wallets
      LEFT JOIN transactions ON transactions.wallet_id = wallets.id
      GROUP BY wallets.id
      ORDER BY wallets.created_at ASC
    `);
    return rows.map(toWalletSummary);
  },
};
