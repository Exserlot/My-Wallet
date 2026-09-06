import type { TransactionKind } from '@/domain/transactions';
import type { ExpenseCategory } from '@/domain/expense-categories';
import type { Wallet } from '@/domain/wallets';

export type WebTransaction = Readonly<{
  id: string;
  walletId: string;
  kind: TransactionKind;
  amountMinor: number;
  occurredAt: string;
  createdAt: string;
  categoryId: string | null;
  note: string | null;
  source: 'manual' | 'bank-slip';
}>;

export type WebBudgetCycle = Readonly<{
  id: string;
  startAt: string;
  endAt: string;
  totalMinor: number;
  createdAt: string;
  updatedAt: string;
  closedAt: string | null;
  allocations: readonly Readonly<{ categoryId: string; amountMinor: number }>[];
}>;

export type WebBudgetRevision = Readonly<{
  id: string;
  budgetCycleId: string;
  totalMinor: number;
  allocations: readonly Readonly<{ categoryId: string; amountMinor: number }>[];
  createdAt: string;
}>;

export type WebDatabase = Readonly<{
  version: 4;
  wallets: Wallet[];
  transactions: WebTransaction[];
  expenseCategories: ExpenseCategory[];
  budgetCycles: WebBudgetCycle[];
  budgetRevisions: WebBudgetRevision[];
}>;

type LegacyDatabase = Readonly<{
  wallets?: Wallet[];
  openingBalances?: readonly {
    id: string;
    walletId: string;
    amountMinor: number;
    occurredAt: string;
  }[];
}>;

type VersionTwoDatabase = Readonly<{
  version: 2;
  wallets: Wallet[];
  transactions: WebTransaction[];
}>;

type VersionThreeDatabase = Readonly<{
  version: 3;
  wallets: Wallet[];
  transactions: WebTransaction[];
  expenseCategories: ExpenseCategory[];
}>;

const storageKey = 'my-wallet.database.v4';
const versionThreeStorageKey = 'my-wallet.database.v3';
const versionTwoStorageKey = 'my-wallet.database.v2';
const legacyStorageKey = 'my-wallet.database.v1';

const emptyDatabase = (): WebDatabase => ({
  version: 4,
  wallets: [],
  transactions: [],
  expenseCategories: [],
  budgetCycles: [],
  budgetRevisions: [],
});

function migrateLegacyDatabase(): WebDatabase | null {
  const legacyValue = localStorage.getItem(legacyStorageKey);
  if (!legacyValue) return null;

  try {
    const legacy = JSON.parse(legacyValue) as LegacyDatabase;
    const createdAt = new Date().toISOString();
    return {
      version: 4,
      wallets: legacy.wallets ?? [],
      transactions: (legacy.openingBalances ?? []).map((balance) => ({
        ...balance,
        kind: 'opening-balance',
        createdAt,
        categoryId: null,
        note: null,
        source: 'manual',
      })),
      expenseCategories: [],
      budgetCycles: [],
      budgetRevisions: [],
    };
  } catch {
    return null;
  }
}

export function readWebDatabase(): WebDatabase {
  if (typeof localStorage === 'undefined') return emptyDatabase();
  const value = localStorage.getItem(storageKey);

  if (!value) {
    const versionThreeValue = localStorage.getItem(versionThreeStorageKey);
    if (versionThreeValue) {
      try {
        const versionThree = JSON.parse(versionThreeValue) as VersionThreeDatabase;
        const migrated: WebDatabase = { ...versionThree, version: 4, budgetCycles: [], budgetRevisions: [] };
        writeWebDatabase(migrated);
        return migrated;
      } catch {
        // Fall through to an older migration or an empty database.
      }
    }
    const versionTwoValue = localStorage.getItem(versionTwoStorageKey);
    if (versionTwoValue) {
      try {
        const versionTwo = JSON.parse(versionTwoValue) as VersionTwoDatabase;
        const migrated: WebDatabase = { ...versionTwo, version: 4, expenseCategories: [], budgetCycles: [], budgetRevisions: [] };
        writeWebDatabase(migrated);
        return migrated;
      } catch {
        // Fall through to the older migration or an empty database.
      }
    }
    const migrated = migrateLegacyDatabase();
    if (migrated) writeWebDatabase(migrated);
    return migrated ?? emptyDatabase();
  }

  try {
    return JSON.parse(value) as WebDatabase;
  } catch {
    return emptyDatabase();
  }
}

export function writeWebDatabase(database: WebDatabase) {
  if (typeof localStorage === 'undefined') return;
  localStorage.setItem(storageKey, JSON.stringify(database));
}
