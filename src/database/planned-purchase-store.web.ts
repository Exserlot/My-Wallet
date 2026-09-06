import { randomUUID } from 'expo-crypto';

import { validatePlannedPurchase, type PlannedPurchase } from '@/domain/planned-purchases';

import type { PlannedPurchaseRepository } from './planned-purchase-repository';
import { readWebDatabase, writeWebDatabase, type WebPlannedPurchase } from './web-database';

function toPlannedPurchase(item: WebPlannedPurchase): PlannedPurchase {
  const categoryName = readWebDatabase().expenseCategories.find((category) => category.id === item.categoryId)?.name ?? null;
  return { ...item, categoryName };
}

export const plannedPurchaseRepository: PlannedPurchaseRepository = {
  async create(input) {
    const validationError = validatePlannedPurchase(input);
    if (validationError) throw new Error(validationError);
    const database = readWebDatabase();
    if (input.categoryId && !database.expenseCategories.some((category) => category.id === input.categoryId && category.archivedAt === null)) {
      throw new Error('Expense category not found');
    }
    const item: WebPlannedPurchase = {
      id: randomUUID(),
      name: input.name.trim(),
      quantity: input.quantity,
      estimatedUnitMinor: input.estimatedUnitMinor,
      categoryId: input.categoryId,
      merchant: input.merchant?.trim() || null,
      note: input.note?.trim() || null,
      priority: input.priority,
      status: 'active',
      expenseId: null,
      createdAt: new Date().toISOString(),
      purchasedAt: null,
      archivedAt: null,
    };
    writeWebDatabase({ ...database, plannedPurchases: [...database.plannedPurchases, item] });
    return toPlannedPurchase(item);
  },

  async list(options) {
    const priorityOrder = { high: 0, normal: 1, low: 2 } as const;
    return readWebDatabase().plannedPurchases
      .filter((item) => options?.includeCompleted ? item.status !== 'archived' : item.status === 'active')
      .sort((left, right) => priorityOrder[left.priority] - priorityOrder[right.priority] || right.createdAt.localeCompare(left.createdAt))
      .map(toPlannedPurchase);
  },

  async getMany(ids) {
    const selected = new Set(ids);
    return readWebDatabase().plannedPurchases.filter((item) => selected.has(item.id)).map(toPlannedPurchase);
  },

  async archive(id) {
    const database = readWebDatabase();
    const item = database.plannedPurchases.find((candidate) => candidate.id === id && candidate.status === 'active');
    if (!item) throw new Error('Active planned purchase not found');
    writeWebDatabase({
      ...database,
      plannedPurchases: database.plannedPurchases.map((candidate) => candidate.id === id
        ? { ...candidate, status: 'archived', archivedAt: new Date().toISOString() }
        : candidate),
    });
  },

  async purchase(input) {
    const itemIds = [...new Set(input.itemIds)];
    if (itemIds.length === 0) throw new Error('Select at least one item');
    if (!Number.isSafeInteger(input.actualMinor) || input.actualMinor <= 0) throw new Error('Actual amount must be positive minor units');
    const database = readWebDatabase();
    if (!database.wallets.some((wallet) => wallet.id === input.walletId)) throw new Error('Wallet not found');
    if (input.categoryId && !database.expenseCategories.some((category) => category.id === input.categoryId && category.archivedAt === null)) {
      throw new Error('Expense category not found');
    }
    const selected = new Set(itemIds);
    const items = database.plannedPurchases.filter((item) => selected.has(item.id) && item.status === 'active');
    if (items.length !== itemIds.length) throw new Error('A selected planned purchase is no longer active');
    const expenseId = randomUUID();
    const now = new Date().toISOString();
    writeWebDatabase({
      ...database,
      transactions: [...database.transactions, {
        id: expenseId,
        walletId: input.walletId,
        kind: 'expense',
        amountMinor: input.actualMinor,
        occurredAt: input.occurredAt,
        createdAt: now,
        categoryId: input.categoryId,
        note: input.note?.trim() || items.map((item) => item.name).join(', ').slice(0, 120),
        source: 'manual',
      }],
      plannedPurchases: database.plannedPurchases.map((item) => selected.has(item.id)
        ? { ...item, status: 'purchased', expenseId, purchasedAt: now }
        : item),
    });
    return expenseId;
  },
};
