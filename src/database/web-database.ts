import type { TransactionKind } from '@/domain/transactions';
import type { ExpenseCategory } from '@/domain/expense-categories';
import type { FixedCostFrequency, FixedCostOccurrenceStatus } from '@/domain/fixed-costs';
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

export type WebFixedCostSchedule = Readonly<{
  id: string;
  name: string;
  categoryId: string;
  estimatedMinor: number;
  walletId: string;
  frequency: FixedCostFrequency;
  intervalMonths: number;
  dueDay: number;
  firstDueAt: string;
  payee: string | null;
  note: string | null;
  remindersEnabled: boolean;
  createdAt: string;
  archivedAt: string | null;
}>;

export type WebFixedCostOccurrence = Readonly<{
  id: string;
  scheduleId: string;
  categoryId: string;
  walletId: string;
  estimatedMinor: number;
  dueAt: string;
  status: FixedCostOccurrenceStatus;
  expenseId: string | null;
  createdAt: string;
}>;

export type WebDatabase = Readonly<{
  version: 5;
  wallets: Wallet[];
  transactions: WebTransaction[];
  expenseCategories: ExpenseCategory[];
  budgetCycles: WebBudgetCycle[];
  budgetRevisions: WebBudgetRevision[];
  fixedCostSchedules: WebFixedCostSchedule[];
  fixedCostOccurrences: WebFixedCostOccurrence[];
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

type VersionFourDatabase = Readonly<{
  version: 4;
  wallets: Wallet[];
  transactions: WebTransaction[];
  expenseCategories: ExpenseCategory[];
  budgetCycles: WebBudgetCycle[];
  budgetRevisions: WebBudgetRevision[];
}>;

const storageKey = 'my-wallet.database.v5';
const versionFourStorageKey = 'my-wallet.database.v4';
const versionThreeStorageKey = 'my-wallet.database.v3';
const versionTwoStorageKey = 'my-wallet.database.v2';
const legacyStorageKey = 'my-wallet.database.v1';

const emptyDatabase = (): WebDatabase => ({
  version: 5,
  wallets: [],
  transactions: [],
  expenseCategories: [],
  budgetCycles: [],
  budgetRevisions: [],
  fixedCostSchedules: [],
  fixedCostOccurrences: [],
});

function migrateLegacyDatabase(): WebDatabase | null {
  const legacyValue = localStorage.getItem(legacyStorageKey);
  if (!legacyValue) return null;

  try {
    const legacy = JSON.parse(legacyValue) as LegacyDatabase;
    const createdAt = new Date().toISOString();
    return {
      version: 5,
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
      fixedCostSchedules: [],
      fixedCostOccurrences: [],
    };
  } catch {
    return null;
  }
}

export function readWebDatabase(): WebDatabase {
  if (typeof localStorage === 'undefined') return emptyDatabase();
  const value = localStorage.getItem(storageKey);

  if (!value) {
    const versionFourValue = localStorage.getItem(versionFourStorageKey);
    if (versionFourValue) {
      try {
        const versionFour = JSON.parse(versionFourValue) as VersionFourDatabase;
        const migrated: WebDatabase = { ...versionFour, version: 5, fixedCostSchedules: [], fixedCostOccurrences: [] };
        writeWebDatabase(migrated);
        return migrated;
      } catch {
        // Fall through to an older migration or an empty database.
      }
    }
    const versionThreeValue = localStorage.getItem(versionThreeStorageKey);
    if (versionThreeValue) {
      try {
        const versionThree = JSON.parse(versionThreeValue) as VersionThreeDatabase;
        const migrated: WebDatabase = { ...versionThree, version: 5, budgetCycles: [], budgetRevisions: [], fixedCostSchedules: [], fixedCostOccurrences: [] };
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
        const migrated: WebDatabase = { ...versionTwo, version: 5, expenseCategories: [], budgetCycles: [], budgetRevisions: [], fixedCostSchedules: [], fixedCostOccurrences: [] };
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
