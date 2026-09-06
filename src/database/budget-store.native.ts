import { randomUUID } from 'expo-crypto';

import { validateBudgetPlan, type MonthlyBudget } from '@/domain/budgets';

import type { BudgetRepository, SaveBudgetInput } from './budget-repository';
import { getDatabase } from './database';

type BudgetCycleRow = {
  id: string;
  start_at: string;
  end_at: string;
  total_minor: number;
  updated_at: string;
  closed_at: string | null;
};

type AllocationRow = {
  category_id: string;
  category_name: string;
  amount_minor: number;
  spent_minor: number;
};

async function findBudget(startAt: string, endAt: string): Promise<MonthlyBudget | null> {
  const database = await getDatabase();
  const cycle = await database.getFirstAsync<BudgetCycleRow>(
    'SELECT id, start_at, end_at, total_minor, updated_at, closed_at FROM budget_cycles WHERE start_at = ? AND end_at = ?',
    startAt,
    endAt,
  );
  if (!cycle) return null;
  const allocations = await database.getAllAsync<AllocationRow>(
    `SELECT
      budget_allocations.category_id,
      expense_categories.name AS category_name,
      budget_allocations.amount_minor,
      COALESCE(SUM(transactions.amount_minor), 0) AS spent_minor
    FROM budget_allocations
    JOIN expense_categories ON expense_categories.id = budget_allocations.category_id
    LEFT JOIN transactions
      ON transactions.category_id = budget_allocations.category_id
      AND transactions.kind = 'EXPENSE'
      AND transactions.occurred_at >= ?
      AND transactions.occurred_at < ?
    WHERE budget_allocations.budget_cycle_id = ?
    GROUP BY budget_allocations.category_id, expense_categories.name, budget_allocations.amount_minor
    ORDER BY expense_categories.name COLLATE NOCASE`,
    startAt,
    endAt,
    cycle.id,
  );
  const totalSpent = await database.getFirstAsync<{ spent_minor: number }>(
    `SELECT COALESCE(SUM(amount_minor), 0) AS spent_minor
     FROM transactions
     WHERE kind = 'EXPENSE' AND occurred_at >= ? AND occurred_at < ?`,
    startAt,
    endAt,
  );
  const spentMinor = totalSpent?.spent_minor ?? 0;
  const allocatedMinor = allocations.reduce((sum, allocation) => sum + allocation.amount_minor, 0);
  return {
    id: cycle.id,
    startAt: cycle.start_at,
    endAt: cycle.end_at,
    totalMinor: cycle.total_minor,
    currency: 'THB',
    allocations: allocations.map((allocation) => ({
      categoryId: allocation.category_id,
      categoryName: allocation.category_name,
      allocatedMinor: allocation.amount_minor,
      spentMinor: allocation.spent_minor,
    })),
    spentMinor,
    unallocatedMinor: cycle.total_minor - allocatedMinor,
    remainingMinor: cycle.total_minor - spentMinor,
    updatedAt: cycle.updated_at,
  };
}

async function validateCategories(input: SaveBudgetInput) {
  if (input.allocations.length === 0) return;
  const database = await getDatabase();
  const placeholders = input.allocations.map(() => '?').join(', ');
  const row = await database.getFirstAsync<{ category_count: number }>(
    `SELECT COUNT(*) AS category_count FROM expense_categories WHERE id IN (${placeholders})`,
    ...input.allocations.map((allocation) => allocation.categoryId),
  );
  if (row?.category_count !== input.allocations.length) throw new Error('Expense category not found');
}

export const budgetRepository: BudgetRepository = {
  getBudget: findBudget,

  async getLatestPlanBefore(startAt) {
    const database = await getDatabase();
    const cycle = await database.getFirstAsync<{ id: string; total_minor: number }>(
      'SELECT id, total_minor FROM budget_cycles WHERE start_at < ? ORDER BY start_at DESC LIMIT 1',
      startAt,
    );
    if (!cycle) return null;
    const allocations = await database.getAllAsync<{ category_id: string; amount_minor: number }>(
      `SELECT budget_allocations.category_id, budget_allocations.amount_minor
       FROM budget_allocations
       JOIN expense_categories ON expense_categories.id = budget_allocations.category_id
       WHERE budget_allocations.budget_cycle_id = ? AND expense_categories.archived_at IS NULL`,
      cycle.id,
    );
    return {
      totalMinor: cycle.total_minor,
      allocations: allocations.map((allocation) => ({ categoryId: allocation.category_id, amountMinor: allocation.amount_minor })),
    };
  },

  async saveBudget(input) {
    const validationError = validateBudgetPlan(input);
    if (validationError) throw new Error(validationError);
    if (input.startAt >= input.endAt) throw new Error('Budget cycle end must follow its start');
    await validateCategories(input);
    const database = await getDatabase();
    const now = new Date().toISOString();
    let cycleId = '';

    await database.withExclusiveTransactionAsync(async (transaction) => {
      const existing = await transaction.getFirstAsync<{ id: string; closed_at: string | null }>(
        'SELECT id, closed_at FROM budget_cycles WHERE start_at = ? AND end_at = ?',
        input.startAt,
        input.endAt,
      );
      if (existing?.closed_at) throw new Error('Closed budget cycles are read-only');
      cycleId = existing?.id ?? randomUUID();
      if (existing) {
        await transaction.runAsync('UPDATE budget_cycles SET total_minor = ?, updated_at = ? WHERE id = ?', input.totalMinor, now, cycleId);
        await transaction.runAsync('DELETE FROM budget_allocations WHERE budget_cycle_id = ?', cycleId);
      } else {
        await transaction.runAsync(
          'INSERT INTO budget_cycles (id, start_at, end_at, total_minor, currency, created_at, updated_at, closed_at) VALUES (?, ?, ?, ?, ?, ?, ?, NULL)',
          cycleId,
          input.startAt,
          input.endAt,
          input.totalMinor,
          'THB',
          now,
          now,
        );
      }
      for (const allocation of input.allocations) {
        if (allocation.amountMinor === 0) continue;
        await transaction.runAsync(
          'INSERT INTO budget_allocations (budget_cycle_id, category_id, amount_minor) VALUES (?, ?, ?)',
          cycleId,
          allocation.categoryId,
          allocation.amountMinor,
        );
      }
      await transaction.runAsync(
        'INSERT INTO budget_plan_revisions (id, budget_cycle_id, total_minor, allocations_json, created_at) VALUES (?, ?, ?, ?, ?)',
        randomUUID(),
        cycleId,
        input.totalMinor,
        JSON.stringify(input.allocations),
        now,
      );
    });

    const saved = await findBudget(input.startAt, input.endAt);
    if (!saved) throw new Error('Budget was not found after save');
    return saved;
  },
};
