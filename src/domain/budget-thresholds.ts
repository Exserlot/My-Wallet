import type { MonthlyBudget } from './budgets';

export type BudgetThresholdLevel = 'below' | 'warning' | 'urgent';
export type BudgetThresholdState = Readonly<Record<string, BudgetThresholdLevel>>;

export type BudgetThresholdTarget = Readonly<{
  id: string;
  name: string;
  level: BudgetThresholdLevel;
  spentMinor: number;
  limitMinor: number;
}>;

function thresholdLevel(spentMinor: number, limitMinor: number): BudgetThresholdLevel {
  if (limitMinor <= 0 || spentMinor / limitMinor < 0.8) return 'below';
  return spentMinor >= limitMinor ? 'urgent' : 'warning';
}

export function budgetThresholdTargets(budget: MonthlyBudget): BudgetThresholdTarget[] {
  return [
    { id: `budget:${budget.id}`, name: 'งบรวมเดือนนี้', level: thresholdLevel(budget.spentMinor, budget.totalMinor), spentMinor: budget.spentMinor, limitMinor: budget.totalMinor },
    ...budget.allocations.map((allocation) => ({
      id: `allocation:${budget.id}:${allocation.categoryId}`,
      name: `งบ${allocation.categoryName}`,
      level: thresholdLevel(allocation.spentMinor, allocation.allocatedMinor),
      spentMinor: allocation.spentMinor,
      limitMinor: allocation.allocatedMinor,
    })),
  ];
}

export function updateBudgetThresholdState(previous: BudgetThresholdState, budget: MonthlyBudget): Readonly<{
  next: BudgetThresholdState;
  newlyUrgent: readonly BudgetThresholdTarget[];
}> {
  const targets = budgetThresholdTargets(budget);
  return {
    next: Object.fromEntries(targets.map((target) => [target.id, target.level])),
    newlyUrgent: targets.filter((target) => target.level === 'urgent' && previous[target.id] !== 'urgent'),
  };
}
