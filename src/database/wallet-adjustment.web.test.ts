import { beforeEach, describe, expect, it, vi } from 'vitest';

import { readWebDatabase, writeWebDatabase, type WebDatabase } from './web-database';

vi.mock('expo-crypto', () => ({ randomUUID: () => 'adjustment-1' }));

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
  wallets: [{ id: 'cash', name: 'เงินสด', type: 'cash', currency: 'THB', createdAt: '2026-09-01' }],
  transactions: [{ id: 'opening', walletId: 'cash', kind: 'opening-balance', amountMinor: 100000, occurredAt: '2026-09-01', createdAt: '2026-09-01', categoryId: null, note: null, source: 'manual' }],
  expenseCategories: [], budgetCycles: [], budgetRevisions: [], fixedCostSchedules: [], fixedCostOccurrences: [], plannedPurchases: [], bankSlipImports: [], transfers: [], walletAdjustments: [],
});

describe('web wallet balance adjustment', () => {
  beforeEach(() => { vi.stubGlobal('localStorage', new MemoryStorage()); writeWebDatabase(database()); });

  it('sets the displayed wallet balance without creating income or expense', async () => {
    const { walletRepository } = await import('./wallet-store.web');
    const adjustment = await walletRepository.setWalletBalance({ walletId: 'cash', targetBalanceMinor: 87550, occurredAt: '2026-09-09', note: 'นับเงินจริง' });
    expect(adjustment.deltaMinor).toBe(-12450);
    expect((await walletRepository.listWallets())[0].balanceMinor).toBe(87550);
    expect(readWebDatabase().transactions).toHaveLength(1);
    expect(readWebDatabase().walletAdjustments).toHaveLength(1);
  });

  it('rejects an adjustment when the balance is already correct', async () => {
    const { walletRepository } = await import('./wallet-store.web');
    await expect(walletRepository.setWalletBalance({ walletId: 'cash', targetBalanceMinor: 100000, occurredAt: '2026-09-09', note: null })).rejects.toThrow('non-zero');
  });

  it('renames a wallet without changing its balance or transactions', async () => {
    const { walletRepository } = await import('./wallet-store.web');
    const updated = await walletRepository.updateWallet({ id: 'cash', name: ' เงินสดหน้าร้าน ', type: 'cash' });
    expect(updated.name).toBe('เงินสดหน้าร้าน');
    expect(updated.balanceMinor).toBe(100000);
    expect(readWebDatabase().transactions).toHaveLength(1);
  });
});
