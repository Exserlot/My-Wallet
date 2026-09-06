import { randomUUID } from 'expo-crypto';

import { validatePlannedPurchase, type PlannedPurchase, type PlannedPurchasePriority, type PlannedPurchaseStatus } from '@/domain/planned-purchases';

import { getDatabase } from './database';
import type { CreatePlannedPurchaseInput, PlannedPurchaseRepository, PurchasePlannedItemsInput } from './planned-purchase-repository';

type PlannedPurchaseRow = {
  id: string;
  name: string;
  quantity: number;
  estimated_unit_minor: number | null;
  category_id: string | null;
  category_name: string | null;
  merchant: string | null;
  note: string | null;
  priority: PlannedPurchasePriority;
  status: PlannedPurchaseStatus;
  expense_id: string | null;
  created_at: string;
  purchased_at: string | null;
  archived_at: string | null;
};

const selectPlannedPurchase = `SELECT
  planned_purchases.id,
  planned_purchases.name,
  planned_purchases.quantity,
  planned_purchases.estimated_unit_minor,
  planned_purchases.category_id,
  expense_categories.name AS category_name,
  planned_purchases.merchant,
  planned_purchases.note,
  planned_purchases.priority,
  planned_purchases.status,
  planned_purchases.expense_id,
  planned_purchases.created_at,
  planned_purchases.purchased_at,
  planned_purchases.archived_at
FROM planned_purchases
LEFT JOIN expense_categories ON expense_categories.id = planned_purchases.category_id`;

function toPlannedPurchase(row: PlannedPurchaseRow): PlannedPurchase {
  return {
    id: row.id,
    name: row.name,
    quantity: row.quantity,
    estimatedUnitMinor: row.estimated_unit_minor,
    categoryId: row.category_id,
    categoryName: row.category_name,
    merchant: row.merchant,
    note: row.note,
    priority: row.priority,
    status: row.status,
    expenseId: row.expense_id,
    createdAt: row.created_at,
    purchasedAt: row.purchased_at,
    archivedAt: row.archived_at,
  };
}

async function validateCategory(categoryId: string | null) {
  if (!categoryId) return;
  const database = await getDatabase();
  const category = await database.getFirstAsync<{ id: string }>('SELECT id FROM expense_categories WHERE id = ? AND archived_at IS NULL', categoryId);
  if (!category) throw new Error('Expense category not found');
}

async function findMany(ids: string[]): Promise<PlannedPurchase[]> {
  const uniqueIds = [...new Set(ids)];
  if (uniqueIds.length === 0) return [];
  const database = await getDatabase();
  const placeholders = uniqueIds.map(() => '?').join(', ');
  const rows = await database.getAllAsync<PlannedPurchaseRow>(`${selectPlannedPurchase} WHERE planned_purchases.id IN (${placeholders})`, ...uniqueIds);
  return rows.map(toPlannedPurchase);
}

export const plannedPurchaseRepository: PlannedPurchaseRepository = {
  async create(input: CreatePlannedPurchaseInput) {
    const validationError = validatePlannedPurchase(input);
    if (validationError) throw new Error(validationError);
    await validateCategory(input.categoryId);
    const database = await getDatabase();
    const id = randomUUID();
    const createdAt = new Date().toISOString();
    await database.runAsync(
      `INSERT INTO planned_purchases
        (id, name, quantity, estimated_unit_minor, category_id, merchant, note, priority, status, expense_id, created_at, purchased_at, archived_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'active', NULL, ?, NULL, NULL)`,
      id,
      input.name.trim(),
      input.quantity,
      input.estimatedUnitMinor,
      input.categoryId,
      input.merchant?.trim() || null,
      input.note?.trim() || null,
      input.priority,
      createdAt,
    );
    const [created] = await findMany([id]);
    if (!created) throw new Error('Planned purchase was not found after insert');
    return created;
  },

  async list(options) {
    const database = await getDatabase();
    const rows = await database.getAllAsync<PlannedPurchaseRow>(
      `${selectPlannedPurchase}
       ${options?.includeCompleted ? "WHERE planned_purchases.status <> 'archived'" : "WHERE planned_purchases.status = 'active'"}
       ORDER BY CASE planned_purchases.priority WHEN 'high' THEN 0 WHEN 'normal' THEN 1 ELSE 2 END, planned_purchases.created_at DESC`,
    );
    return rows.map(toPlannedPurchase);
  },

  getMany: findMany,

  async archive(id) {
    const database = await getDatabase();
    const result = await database.runAsync(
      "UPDATE planned_purchases SET status = 'archived', archived_at = ? WHERE id = ? AND status = 'active'",
      new Date().toISOString(),
      id,
    );
    if (result.changes !== 1) throw new Error('Active planned purchase not found');
  },

  async purchase(input: PurchasePlannedItemsInput) {
    const itemIds = [...new Set(input.itemIds)];
    if (itemIds.length === 0) throw new Error('Select at least one item');
    if (!Number.isSafeInteger(input.actualMinor) || input.actualMinor <= 0) throw new Error('Actual amount must be positive minor units');
    const database = await getDatabase();
    const expenseId = randomUUID();
    const now = new Date().toISOString();
    const placeholders = itemIds.map(() => '?').join(', ');
    await database.withExclusiveTransactionAsync(async (transaction) => {
      const wallet = await transaction.getFirstAsync<{ id: string }>('SELECT id FROM wallets WHERE id = ?', input.walletId);
      if (!wallet) throw new Error('Wallet not found');
      if (input.categoryId) {
        const category = await transaction.getFirstAsync<{ id: string }>('SELECT id FROM expense_categories WHERE id = ? AND archived_at IS NULL', input.categoryId);
        if (!category) throw new Error('Expense category not found');
      }
      const items = await transaction.getAllAsync<{ name: string }>(
        `SELECT name FROM planned_purchases WHERE id IN (${placeholders}) AND status = 'active'`,
        ...itemIds,
      );
      if (items.length !== itemIds.length) throw new Error('A selected planned purchase is no longer active');
      const note = input.note?.trim() || items.map((item) => item.name).join(', ').slice(0, 120);
      await transaction.runAsync(
        `INSERT INTO transactions
          (id, wallet_id, kind, amount_minor, currency, occurred_at, created_at, category_id, note, source)
         VALUES (?, ?, 'EXPENSE', ?, 'THB', ?, ?, ?, ?, 'manual')`,
        expenseId,
        input.walletId,
        input.actualMinor,
        input.occurredAt,
        now,
        input.categoryId,
        note,
      );
      const result = await transaction.runAsync(
        `UPDATE planned_purchases SET status = 'purchased', expense_id = ?, purchased_at = ?
         WHERE id IN (${placeholders}) AND status = 'active'`,
        expenseId,
        now,
        ...itemIds,
      );
      if (result.changes !== itemIds.length) throw new Error('A selected planned purchase changed while purchasing');
    });
    return expenseId;
  },
};
