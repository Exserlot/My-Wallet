import { beforeEach, describe, expect, it, vi } from 'vitest';

import { writeWebDatabase, type WebDatabase } from './web-database';

vi.mock('expo-crypto', () => ({ randomUUID: () => 'new-id' }));

class MemoryStorage implements Storage {
  private values = new Map<string, string>(); get length() { return this.values.size; } clear() { this.values.clear(); }
  getItem(key: string) { return this.values.get(key) ?? null; } key(index: number) { return [...this.values.keys()][index] ?? null; }
  removeItem(key: string) { this.values.delete(key); } setItem(key: string, value: string) { this.values.set(key, value); }
}

const database = (): WebDatabase => ({
  version: 9,
  wallets: [{ id: 'cash', name: 'เงินสด', type: 'cash', currency: 'THB', createdAt: '2026-09-01' }],
  transactions: [],
  expenseCategories: [{ id: 'food', name: 'อาหาร', createdAt: '2026-09-01', archivedAt: null }],
  budgetCycles: [], budgetRevisions: [],
  fixedCostSchedules: [{ id: 'rent', name: 'ค่าเช่า', categoryId: 'food', estimatedMinor: 500000, walletId: 'cash', frequency: 'monthly', intervalMonths: 1, dueDay: 1, firstDueAt: '2026-09-01T00:00:00.000Z', payee: null, note: null, remindersEnabled: true, createdAt: '2026-09-01', archivedAt: null }],
  fixedCostOccurrences: [{ id: 'future', scheduleId: 'rent', categoryId: 'food', walletId: 'cash', estimatedMinor: 500000, dueAt: '2026-10-01T00:00:00.000Z', status: 'upcoming', expenseId: null, createdAt: '2026-09-01' }, { id: 'paid', scheduleId: 'rent', categoryId: 'food', walletId: 'cash', estimatedMinor: 500000, dueAt: '2026-09-01T00:00:00.000Z', status: 'paid', expenseId: 'expense', createdAt: '2026-09-01' }],
  plannedPurchases: [{ id: 'phone', name: 'โทรศัพท์', quantity: 1, estimatedUnitMinor: null, categoryId: null, merchant: null, note: null, priority: 'normal', status: 'active', expenseId: null, createdAt: '2026-09-01', purchasedAt: null, archivedAt: null }],
  bankSlipImports: [], transfers: [], walletAdjustments: [],
});

describe('editable planning data', () => {
  beforeEach(() => { vi.stubGlobal('localStorage', new MemoryStorage()); writeWebDatabase(database()); });

  it('renames, archives, and restores a category without changing its identity', async () => {
    const { expenseCategoryRepository } = await import('./expense-category-store.web');
    expect((await expenseCategoryRepository.updateCategory('food', ' ของกิน ')).name).toBe('ของกิน');
    await expenseCategoryRepository.archiveCategory('food');
    await expenseCategoryRepository.restoreCategory('food');
    expect((await expenseCategoryRepository.listCategories())[0]).toMatchObject({ id: 'food', name: 'ของกิน', archivedAt: null });
  });

  it('updates an active planned purchase', async () => {
    const { plannedPurchaseRepository } = await import('./planned-purchase-store.web');
    const updated = await plannedPurchaseRepository.update('phone', { name: 'มือถือ', quantity: 2, estimatedUnitMinor: 1200000, categoryId: 'food', merchant: 'ร้าน A', note: 'สีดำ', priority: 'high' });
    expect(updated).toMatchObject({ id: 'phone', name: 'มือถือ', quantity: 2, priority: 'high' });
  });

  it('updates a fixed cost while preserving resolved history', async () => {
    const { fixedCostRepository } = await import('./fixed-cost-store.web');
    await fixedCostRepository.updateSchedule({ id: 'rent', name: 'ค่าเช่าบ้าน', categoryId: 'food', estimatedMinor: 550000, walletId: 'cash', frequency: 'monthly', intervalMonths: 1, dueDay: 5, firstDueAt: '2026-09-05T00:00:00.000Z', payee: null, note: null, remindersEnabled: true });
    const all = await fixedCostRepository.listSchedules();
    expect(all[0]).toMatchObject({ name: 'ค่าเช่าบ้าน', estimatedMinor: 550000, dueDay: 5 });
  });
});
