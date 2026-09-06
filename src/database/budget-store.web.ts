import { randomUUID } from 'expo-crypto';

import { validateBudgetPlan, type BudgetPlan, type MonthlyBudget } from '@/domain/budgets';

import type { BudgetRepository, SaveBudgetInput } from './budget-repository';
import { readWebDatabase, writeWebDatabase, type WebBudgetCycle } from './web-database';

function toMonthlyBudget(cycle: WebBudgetCycle): MonthlyBudget {
  const database = readWebDatabase();
  const expenses = database.transactions.filter((transaction) => (
    transaction.kind === 'expense' && transaction.occurredAt >= cycle.startAt && transaction.occurredAt < cycle.endAt
  ));
  const spentMinor = expenses.reduce((sum, expense) => sum + expense.amountMinor, 0);
  const allocatedMinor = cycle.allocations.reduce((sum, allocation) => sum + allocation.amountMinor, 0);
  const reservedFixedCostMinor = database.fixedCostOccurrences
    .filter((occurrence) => occurrence.dueAt >= cycle.startAt && occurrence.dueAt < cycle.endAt)
    .filter((occurrence) => occurrence.status === 'upcoming' || occurrence.status === 'due' || occurrence.status === 'overdue')
    .reduce((sum, occurrence) => sum + occurrence.estimatedMinor, 0);
  return {
    id: cycle.id,
    startAt: cycle.startAt,
    endAt: cycle.endAt,
    totalMinor: cycle.totalMinor,
    currency: 'THB',
    allocations: cycle.allocations.map((allocation) => ({
      categoryId: allocation.categoryId,
      categoryName: database.expenseCategories.find((category) => category.id === allocation.categoryId)?.name ?? 'หมวดที่ไม่พบ',
      allocatedMinor: allocation.amountMinor,
      spentMinor: expenses
        .filter((expense) => expense.categoryId === allocation.categoryId)
        .reduce((sum, expense) => sum + expense.amountMinor, 0),
    })),
    spentMinor,
    reservedFixedCostMinor,
    unallocatedMinor: cycle.totalMinor - allocatedMinor - reservedFixedCostMinor,
    remainingMinor: cycle.totalMinor - spentMinor,
    availableAfterReservationsMinor: cycle.totalMinor - spentMinor - reservedFixedCostMinor,
    updatedAt: cycle.updatedAt,
  };
}

function validateCategories(input: SaveBudgetInput) {
  const database = readWebDatabase();
  if (input.allocations.some((allocation) => !database.expenseCategories.some((category) => category.id === allocation.categoryId))) {
    throw new Error('Expense category not found');
  }
}

export const budgetRepository: BudgetRepository = {
  async getBudget(startAt, endAt) {
    const cycle = readWebDatabase().budgetCycles.find((item) => item.startAt === startAt && item.endAt === endAt);
    return cycle ? toMonthlyBudget(cycle) : null;
  },

  async getLatestPlanBefore(startAt) {
    const database = readWebDatabase();
    const cycle = database.budgetCycles
      .filter((item) => item.startAt < startAt)
      .sort((left, right) => right.startAt.localeCompare(left.startAt))[0];
    if (!cycle) return null;
    const activeIds = new Set(database.expenseCategories.filter((category) => category.archivedAt === null).map((category) => category.id));
    const plan: BudgetPlan = {
      totalMinor: cycle.totalMinor,
      allocations: cycle.allocations.filter((allocation) => activeIds.has(allocation.categoryId)),
    };
    return plan;
  },

  async saveBudget(input) {
    const validationError = validateBudgetPlan(input);
    if (validationError) throw new Error(validationError);
    if (input.startAt >= input.endAt) throw new Error('Budget cycle end must follow its start');
    validateCategories(input);
    const database = readWebDatabase();
    const existing = database.budgetCycles.find((cycle) => cycle.startAt === input.startAt && cycle.endAt === input.endAt);
    if (existing?.closedAt) throw new Error('Closed budget cycles are read-only');
    const now = new Date().toISOString();
    const cycle: WebBudgetCycle = {
      id: existing?.id ?? randomUUID(),
      startAt: input.startAt,
      endAt: input.endAt,
      totalMinor: input.totalMinor,
      createdAt: existing?.createdAt ?? now,
      updatedAt: now,
      closedAt: null,
      allocations: input.allocations.filter((allocation) => allocation.amountMinor > 0),
    };
    writeWebDatabase({
      ...database,
      budgetCycles: existing
        ? database.budgetCycles.map((item) => item.id === existing.id ? cycle : item)
        : [...database.budgetCycles, cycle],
      budgetRevisions: [...database.budgetRevisions, {
        id: randomUUID(),
        budgetCycleId: cycle.id,
        totalMinor: input.totalMinor,
        allocations: input.allocations,
        createdAt: now,
      }],
    });
    return toMonthlyBudget(cycle);
  },
};
