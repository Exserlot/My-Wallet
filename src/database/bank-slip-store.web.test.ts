import { beforeEach, describe, expect, it, vi } from 'vitest';

import { readWebDatabase, writeWebDatabase, type WebDatabase } from './web-database';

vi.mock('expo-crypto', () => ({ randomUUID: () => 'expense-from-slip' }));

class MemoryStorage implements Storage {
  private values = new Map<string, string>();

  get length() { return this.values.size; }
  clear() { this.values.clear(); }
  getItem(key: string) { return this.values.get(key) ?? null; }
  key(index: number) { return [...this.values.keys()][index] ?? null; }
  removeItem(key: string) { this.values.delete(key); }
  setItem(key: string, value: string) { this.values.set(key, value); }
}

const emptyDatabase = (): WebDatabase => ({
  version: 7,
  wallets: [{ id: 'wallet-1', name: 'บัญชีทดสอบ', type: 'bank-account', currency: 'THB', createdAt: '2026-09-08T00:00:00.000Z' }],
  transactions: [],
  expenseCategories: [],
  budgetCycles: [],
  budgetRevisions: [],
  fixedCostSchedules: [],
  fixedCostOccurrences: [],
  plannedPurchases: [],
  bankSlipImports: [],
});

describe('web bank slip repository', () => {
  beforeEach(() => {
    vi.stubGlobal('localStorage', new MemoryStorage());
    writeWebDatabase(emptyDatabase());
  });

  it('creates one uncategorized expense and stores only its fingerprint', async () => {
    const { bankSlipRepository } = await import('./bank-slip-store.web');
    const expenseId = await bankSlipRepository.createExpense({
      fingerprint: 'sha256-fingerprint',
      walletId: 'wallet-1',
      amountMinor: 11_500,
      occurredAt: '2026-09-08T05:00:00.000Z',
      note: 'สลิปทดสอบ',
    });

    const database = readWebDatabase();
    expect(expenseId).toBe('expense-from-slip');
    expect(database.transactions).toHaveLength(1);
    expect(database.transactions[0]).toMatchObject({ kind: 'expense', categoryId: null, source: 'bank-slip', amountMinor: 11_500 });
    expect(database.bankSlipImports).toEqual([{ fingerprint: 'sha256-fingerprint', expenseId, importedAt: expect.any(String) }]);
    expect(JSON.stringify(database)).not.toContain('rawQr');
  });

  it('blocks a repeated fingerprint without creating another expense', async () => {
    const { bankSlipRepository } = await import('./bank-slip-store.web');
    const input = { fingerprint: 'same-slip', walletId: 'wallet-1', amountMinor: 11_500, occurredAt: '2026-09-08T05:00:00.000Z', note: null };
    await bankSlipRepository.createExpense(input);
    await expect(bankSlipRepository.createExpense(input)).rejects.toThrow('Duplicate bank slip');
    expect(readWebDatabase().transactions).toHaveLength(1);
  });
});
