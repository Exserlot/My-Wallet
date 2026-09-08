import { beforeEach, describe, expect, it, vi } from 'vitest';

import { readWebDatabase, writeWebDatabase, type WebDatabase } from './web-database';

vi.mock('expo-crypto', () => ({ randomUUID: () => 'transfer-1' }));

class MemoryStorage implements Storage {
  private values = new Map<string, string>();
  get length() { return this.values.size; }
  clear() { this.values.clear(); }
  getItem(key: string) { return this.values.get(key) ?? null; }
  key(index: number) { return [...this.values.keys()][index] ?? null; }
  removeItem(key: string) { this.values.delete(key); }
  setItem(key: string, value: string) { this.values.set(key, value); }
}

const database = (): WebDatabase => ({
  version: 9,
  wallets: [
    { id: 'cash', name: 'เงินสด', type: 'cash', currency: 'THB', createdAt: '2026-09-01' },
    { id: 'bank', name: 'ธนาคาร', type: 'bank-account', currency: 'THB', createdAt: '2026-09-02' },
  ],
  transactions: [
    { id: 'cash-opening', walletId: 'cash', kind: 'opening-balance', amountMinor: 100000, occurredAt: '2026-09-01', createdAt: '2026-09-01', categoryId: null, note: null, source: 'manual' },
    { id: 'bank-opening', walletId: 'bank', kind: 'opening-balance', amountMinor: 50000, occurredAt: '2026-09-01', createdAt: '2026-09-01', categoryId: null, note: null, source: 'manual' },
  ],
  expenseCategories: [], budgetCycles: [], budgetRevisions: [], fixedCostSchedules: [], fixedCostOccurrences: [], plannedPurchases: [], bankSlipImports: [], transfers: [], walletAdjustments: [],
});

describe('web wallet transfer', () => {
  beforeEach(() => { vi.stubGlobal('localStorage', new MemoryStorage()); writeWebDatabase(database()); });

  it('moves value between wallets without changing their combined balance', async () => {
    const { transferRepository } = await import('./transfer-store.web');
    const { walletRepository } = await import('./wallet-store.web');
    await transferRepository.createTransfer({ fromWalletId: 'cash', toWalletId: 'bank', amountMinor: 25000, occurredAt: '2026-09-08', note: null });
    const wallets = await walletRepository.listWallets();
    expect(wallets.map((wallet) => wallet.balanceMinor)).toEqual([75000, 75000]);
    expect(wallets.reduce((sum, wallet) => sum + wallet.balanceMinor, 0)).toBe(150000);
    expect(readWebDatabase().transfers).toHaveLength(1);
  });
});
