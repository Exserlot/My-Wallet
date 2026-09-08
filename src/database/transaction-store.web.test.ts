import { beforeEach, describe, expect, it, vi } from 'vitest';

import { readWebDatabase, writeWebDatabase, type WebDatabase } from './web-database';

vi.mock('expo-crypto', () => ({ randomUUID: () => 'unused' }));

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
  version: 8,
  wallets: [
    { id: 'cash', name: 'เงินสด', type: 'cash', currency: 'THB', createdAt: '2026-09-01' },
    { id: 'bank', name: 'ธนาคาร', type: 'bank-account', currency: 'THB', createdAt: '2026-09-01' },
  ],
  transactions: [
    { id: 'income-1', walletId: 'cash', kind: 'income', amountMinor: 10000, occurredAt: '2026-09-01T10:00:00.000Z', createdAt: '2026-09-01', categoryId: null, note: 'เดิม', source: 'manual' },
  ],
  expenseCategories: [{ id: 'food', name: 'อาหาร', archivedAt: null, createdAt: '2026-09-01' }],
  budgetCycles: [], budgetRevisions: [], fixedCostSchedules: [], fixedCostOccurrences: [], plannedPurchases: [], bankSlipImports: [], transfers: [],
});

describe('web transaction editing', () => {
  beforeEach(() => { vi.stubGlobal('localStorage', new MemoryStorage()); writeWebDatabase(database()); });

  it('updates amount, wallet, kind, category, date, and note without replacing its identity', async () => {
    const { transactionRepository } = await import('./transaction-store.web');
    const updated = await transactionRepository.updateTransaction('income-1', {
      walletId: 'bank', kind: 'expense', amountMinor: 2550, categoryId: 'food',
      occurredAt: '2026-09-02T10:00:00.000Z', note: 'มื้อกลางวัน',
    });

    expect(updated).toMatchObject({ id: 'income-1', walletId: 'bank', kind: 'expense', categoryId: 'food', note: 'มื้อกลางวัน', source: 'manual' });
    expect(updated.amount.amountMinor).toBe(2550);
    expect(readWebDatabase().transactions).toHaveLength(1);
  });

  it('rejects invalid amounts and opening balance edits', async () => {
    const { transactionRepository } = await import('./transaction-store.web');
    const input = { walletId: 'cash', kind: 'income' as const, amountMinor: 0, categoryId: null, occurredAt: '2026-09-02', note: null };
    await expect(transactionRepository.updateTransaction('income-1', input)).rejects.toThrow('Amount must be positive');
    const current = readWebDatabase();
    writeWebDatabase({ ...current, transactions: [{ ...current.transactions[0], id: 'opening', kind: 'opening-balance' }] });
    await expect(transactionRepository.updateTransaction('opening', { ...input, amountMinor: 100 })).rejects.toThrow('Cash flow transaction not found');
  });

  it('keeps the expense kind for a transaction linked to another workflow', async () => {
    const current = readWebDatabase();
    writeWebDatabase({ ...current, transactions: [{ ...current.transactions[0], kind: 'expense', source: 'bank-slip' }] });
    const { transactionRepository } = await import('./transaction-store.web');
    await expect(transactionRepository.updateTransaction('income-1', {
      walletId: 'cash', kind: 'income', amountMinor: 10000, categoryId: null, occurredAt: '2026-09-02', note: null,
    })).rejects.toThrow('Linked transaction kind cannot be changed');
  });

  it('deletes only a manual transaction that is not linked', async () => {
    const { transactionRepository } = await import('./transaction-store.web');
    await transactionRepository.deleteTransaction('income-1');
    expect(readWebDatabase().transactions).toHaveLength(0);

    writeWebDatabase({ ...database(), transactions: [{ ...database().transactions[0], source: 'bank-slip' }] });
    await expect(transactionRepository.deleteTransaction('income-1')).rejects.toThrow('Linked transaction cannot be deleted');
    expect(readWebDatabase().transactions).toHaveLength(1);
  });
});
