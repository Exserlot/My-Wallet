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
    currentVersion = 4;
  }

  if (currentVersion === 4) {
    await database.execAsync(`
      CREATE TABLE IF NOT EXISTS fixed_cost_schedules (
        id TEXT PRIMARY KEY NOT NULL,
        name TEXT NOT NULL,
        category_id TEXT NOT NULL REFERENCES expense_categories(id),
        estimated_minor INTEGER NOT NULL CHECK (estimated_minor > 0),
        wallet_id TEXT NOT NULL REFERENCES wallets(id),
        frequency TEXT NOT NULL CHECK (frequency IN ('monthly', 'every-n-months', 'yearly', 'once')),
        interval_months INTEGER NOT NULL CHECK (interval_months >= 1),
        due_day INTEGER NOT NULL CHECK (due_day BETWEEN 1 AND 31),
        first_due_at TEXT NOT NULL,
        payee TEXT,
        note TEXT,
        reminders_enabled INTEGER NOT NULL DEFAULT 1,
        created_at TEXT NOT NULL,
        archived_at TEXT
      );
      CREATE TABLE IF NOT EXISTS fixed_cost_occurrences (
        id TEXT PRIMARY KEY NOT NULL,
        schedule_id TEXT NOT NULL REFERENCES fixed_cost_schedules(id),
        category_id TEXT NOT NULL REFERENCES expense_categories(id),
        wallet_id TEXT NOT NULL REFERENCES wallets(id),
        estimated_minor INTEGER NOT NULL CHECK (estimated_minor > 0),
        due_at TEXT NOT NULL,
        status TEXT NOT NULL CHECK (status IN ('upcoming', 'due', 'overdue', 'paid', 'skipped')),
        expense_id TEXT REFERENCES transactions(id),
        created_at TEXT NOT NULL,
        UNIQUE(schedule_id, due_at)
      );
      CREATE INDEX IF NOT EXISTS fixed_cost_occurrences_due_idx
        ON fixed_cost_occurrences(due_at, status);
      PRAGMA user_version = 5;
    `);
    currentVersion = 5;
  }

  if (currentVersion === 5) {
    await database.execAsync(`
      CREATE TABLE IF NOT EXISTS planned_purchases (
        id TEXT PRIMARY KEY NOT NULL,
        name TEXT NOT NULL,
        quantity INTEGER NOT NULL CHECK (quantity >= 1),
        estimated_unit_minor INTEGER CHECK (estimated_unit_minor >= 0),
        category_id TEXT REFERENCES expense_categories(id),
        merchant TEXT,
        note TEXT,
        priority TEXT NOT NULL CHECK (priority IN ('low', 'normal', 'high')),
        status TEXT NOT NULL CHECK (status IN ('active', 'purchased', 'archived')),
        expense_id TEXT REFERENCES transactions(id),
        created_at TEXT NOT NULL,
        purchased_at TEXT,
        archived_at TEXT
      );
      CREATE INDEX IF NOT EXISTS planned_purchases_status_idx
        ON planned_purchases(status, priority, created_at DESC);
      PRAGMA user_version = 6;
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
