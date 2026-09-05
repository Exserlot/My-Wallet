import type { TransactionKind } from '@/domain/transactions';
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

export type WebDatabase = Readonly<{
  version: 2;
  wallets: Wallet[];
  transactions: WebTransaction[];
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

const storageKey = 'my-wallet.database.v2';
const legacyStorageKey = 'my-wallet.database.v1';

const emptyDatabase = (): WebDatabase => ({ version: 2, wallets: [], transactions: [] });

function migrateLegacyDatabase(): WebDatabase | null {
  const legacyValue = localStorage.getItem(legacyStorageKey);
  if (!legacyValue) return null;

  try {
    const legacy = JSON.parse(legacyValue) as LegacyDatabase;
    const createdAt = new Date().toISOString();
    return {
      version: 2,
      wallets: legacy.wallets ?? [],
      transactions: (legacy.openingBalances ?? []).map((balance) => ({
        ...balance,
        kind: 'opening-balance',
        createdAt,
        categoryId: null,
        note: null,
        source: 'manual',
      })),
    };
  } catch {
    return null;
  }
}

export function readWebDatabase(): WebDatabase {
  if (typeof localStorage === 'undefined') return emptyDatabase();
  const value = localStorage.getItem(storageKey);

  if (!value) {
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
