import { openDatabaseAsync, type SQLiteDatabase } from 'expo-sqlite';

let databasePromise: Promise<SQLiteDatabase> | null = null;

async function migrate(database: SQLiteDatabase) {
  await database.execAsync('PRAGMA journal_mode = WAL; PRAGMA foreign_keys = ON;');
  const result = await database.getFirstAsync<{ user_version: number }>('PRAGMA user_version');
  let currentVersion = result?.user_version ?? 0;

  if (currentVersion === 0) {
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
    currentVersion = 1;
  }

  if (currentVersion === 1) {
    await database.execAsync(`
      ALTER TABLE transactions ADD COLUMN category_id TEXT;
      ALTER TABLE transactions ADD COLUMN note TEXT;
      ALTER TABLE transactions ADD COLUMN source TEXT NOT NULL DEFAULT 'manual';
      CREATE INDEX IF NOT EXISTS transactions_occurred_at_idx ON transactions(occurred_at DESC);
      PRAGMA user_version = 2;
    `);
    currentVersion = 2;
  }

  if (currentVersion === 2) {
    await database.execAsync(`
      CREATE TABLE IF NOT EXISTS expense_categories (
        id TEXT PRIMARY KEY NOT NULL,
        name TEXT NOT NULL COLLATE NOCASE UNIQUE,
        created_at TEXT NOT NULL,
        archived_at TEXT
      );
      PRAGMA user_version = 3;
    `);
    currentVersion = 3;
  }

  if (currentVersion === 3) {
    await database.execAsync(`
      CREATE TABLE IF NOT EXISTS budget_cycles (
        id TEXT PRIMARY KEY NOT NULL,
        start_at TEXT NOT NULL,
        end_at TEXT NOT NULL,
        total_minor INTEGER NOT NULL CHECK (total_minor > 0),
        currency TEXT NOT NULL CHECK (currency = 'THB'),
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL,
        closed_at TEXT,
        UNIQUE(start_at, end_at)
      );
      CREATE TABLE IF NOT EXISTS budget_allocations (
        budget_cycle_id TEXT NOT NULL REFERENCES budget_cycles(id) ON DELETE CASCADE,
        category_id TEXT NOT NULL REFERENCES expense_categories(id),
        amount_minor INTEGER NOT NULL CHECK (amount_minor >= 0),
        PRIMARY KEY (budget_cycle_id, category_id)
      );
      CREATE TABLE IF NOT EXISTS budget_plan_revisions (
        id TEXT PRIMARY KEY NOT NULL,
        budget_cycle_id TEXT NOT NULL REFERENCES budget_cycles(id) ON DELETE CASCADE,
        total_minor INTEGER NOT NULL,
        allocations_json TEXT NOT NULL,
        created_at TEXT NOT NULL
      );
      CREATE INDEX IF NOT EXISTS budget_plan_revisions_cycle_idx
        ON budget_plan_revisions(budget_cycle_id, created_at DESC);
      PRAGMA user_version = 4;
    `);
  }
}

export async function getDatabase() {
  if (!databasePromise) {
    databasePromise = openDatabaseAsync('my-wallet.db').then(async (database) => {
      await migrate(database);
      return database;
    });
  }
  return databasePromise;
}
