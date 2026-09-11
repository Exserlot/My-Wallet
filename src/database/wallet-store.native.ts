import { randomUUID } from 'expo-crypto';

import { validateWalletName, type WalletSummary, type WalletType } from '@/domain/wallets';

import { getDatabase } from './database';
import type { WalletRepository } from './wallet-repository';

type WalletRow = {
  id: string;
  name: string;
  type: WalletType;
  currency: 'THB';
  created_at: string;
  archived_at: string | null;
  balance_minor: number;
};

function toWalletSummary(row: WalletRow): WalletSummary {
  return {
    id: row.id,
    name: row.name,
    type: row.type,
    currency: row.currency,
    createdAt: row.created_at,
    archivedAt: row.archived_at,
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
      archivedAt: null,
      balanceMinor: input.openingBalanceMinor,
    };
  },

  async listWallets(options) {
    const database = await getDatabase();
    const rows = await database.getAllAsync<WalletRow>(`
      SELECT
        wallets.id,
        wallets.name,
        wallets.type,
        wallets.currency,
        wallets.created_at,
        wallets.archived_at,
        COALESCE((SELECT SUM(
          CASE
            WHEN wallet_transactions.kind IN ('OPENING_BALANCE', 'INCOME') THEN wallet_transactions.amount_minor
            WHEN wallet_transactions.kind = 'EXPENSE' THEN -wallet_transactions.amount_minor
            ELSE 0
          END
        ) FROM transactions wallet_transactions WHERE wallet_transactions.wallet_id = wallets.id), 0)
        + COALESCE((SELECT SUM(amount_minor) FROM wallet_transfers WHERE to_wallet_id = wallets.id), 0)
        - COALESCE((SELECT SUM(amount_minor) FROM wallet_transfers WHERE from_wallet_id = wallets.id), 0)
        + COALESCE((SELECT SUM(delta_minor) FROM wallet_adjustments WHERE wallet_id = wallets.id), 0) AS balance_minor
      FROM wallets
      ${options?.includeArchived ? '' : 'WHERE wallets.archived_at IS NULL'}
      ORDER BY wallets.created_at ASC
    `);
    return rows.map(toWalletSummary);
  },

  async updateWallet(input) {
    const nameError = validateWalletName(input.name);
    if (nameError) throw new Error(nameError);
    const database = await getDatabase();
    const result = await database.runAsync('UPDATE wallets SET name = ?, type = ? WHERE id = ?', input.name.trim(), input.type, input.id);
    if (result.changes !== 1) throw new Error('Wallet not found');
    const wallet = (await walletRepository.listWallets()).find((item) => item.id === input.id);
    if (!wallet) throw new Error('Wallet not found after update');
    return wallet;
  },

  async archiveWallet(id) {
    const database = await getDatabase();
    const activeCount = await database.getFirstAsync<{ count: number }>('SELECT COUNT(*) AS count FROM wallets WHERE archived_at IS NULL');
    if ((activeCount?.count ?? 0) <= 1) throw new Error('At least one wallet must remain active');
    const schedule = await database.getFirstAsync<{ id: string }>('SELECT id FROM fixed_cost_schedules WHERE wallet_id = ? AND archived_at IS NULL', id);
    if (schedule) throw new Error('Wallet is used by an active fixed cost');
    const result = await database.runAsync('UPDATE wallets SET archived_at = ? WHERE id = ? AND archived_at IS NULL', new Date().toISOString(), id);
    if (result.changes !== 1) throw new Error('Active wallet not found');
  },

  async restoreWallet(id) {
    const database = await getDatabase();
    await database.runAsync('UPDATE wallets SET archived_at = NULL WHERE id = ?', id);
  },

  async setWalletBalance(input) {
    if (!Number.isSafeInteger(input.targetBalanceMinor)) throw new Error('Target balance must be safe minor units');
    const wallet = (await walletRepository.listWallets()).find((item) => item.id === input.walletId);
    if (!wallet) throw new Error('Wallet not found');
    const deltaMinor = input.targetBalanceMinor - wallet.balanceMinor;
    if (!Number.isSafeInteger(deltaMinor) || deltaMinor === 0) throw new Error('Balance adjustment must be non-zero');
    const database = await getDatabase();
    const id = randomUUID();
    await database.runAsync(
      'INSERT INTO wallet_adjustments (id, wallet_id, delta_minor, occurred_at, note, created_at) VALUES (?, ?, ?, ?, ?, ?)',
      id, wallet.id, deltaMinor, input.occurredAt, input.note?.trim() || null, new Date().toISOString(),
    );
    return { id, walletId: wallet.id, walletName: wallet.name, deltaMinor, occurredAt: input.occurredAt, note: input.note?.trim() || null };
  },
};
