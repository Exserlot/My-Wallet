import type { MonthlyBudget } from './budgets';
import { budgetUsagePercent } from './budgets';
import type { FixedCostOccurrence } from './fixed-costs';

export type AttentionLevel = 'warning' | 'urgent';

export type DashboardAttentionItem =
  | Readonly<{
      id: string;
      kind: 'fixed-cost';
      level: AttentionLevel;
      occurrence: FixedCostOccurrence;
      daysUntilDue: number;
    }>
  | Readonly<{
      id: string;
      kind: 'monthly-budget';
      level: AttentionLevel;
      usagePercent: number;
      spentMinor: number;
      limitMinor: number;
    }>
  | Readonly<{
      id: string;
      kind: 'budget-allocation';
      level: AttentionLevel;
      categoryId: string;
      categoryName: string;
      usagePercent: number;
      spentMinor: number;
      limitMinor: number;
    }>;

const DAY_IN_MS = 24 * 60 * 60 * 1000;

function localDayNumber(date: Date): number {
  return Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()) / DAY_IN_MS;
}

function isAtLeast(spentMinor: number, limitMinor: number, threshold: number): boolean {
  return limitMinor > 0 && spentMinor / limitMinor >= threshold;
}

function attentionLevel(spentMinor: number, limitMinor: number): AttentionLevel {
  return isAtLeast(spentMinor, limitMinor, 1) ? 'urgent' : 'warning';
}

export function buildDashboardAttentionItems(input: Readonly<{
  budget: MonthlyBudget | null;
  occurrences: readonly FixedCostOccurrence[];
  now?: Date;
}>): DashboardAttentionItem[] {
  const now = input.now ?? new Date();
  const today = localDayNumber(now);
  const items: DashboardAttentionItem[] = [];

  for (const occurrence of input.occurrences) {
    if (occurrence.status === 'paid' || occurrence.status === 'skipped') continue;
    const daysUntilDue = localDayNumber(new Date(occurrence.dueAt)) - today;
    if (daysUntilDue > 3) continue;
    items.push({
      id: `fixed-cost:${occurrence.id}`,
      kind: 'fixed-cost',
      level: daysUntilDue < 0 || occurrence.status === 'overdue' ? 'urgent' : 'warning',
      occurrence,
      daysUntilDue,
    });
  }

  if (input.budget) {
    const usagePercent = budgetUsagePercent(input.budget.spentMinor, input.budget.totalMinor);
    if (isAtLeast(input.budget.spentMinor, input.budget.totalMinor, 0.8)) {
      items.push({
        id: `monthly-budget:${input.budget.id}`,
        kind: 'monthly-budget',
        level: attentionLevel(input.budget.spentMinor, input.budget.totalMinor),
        usagePercent,
        spentMinor: input.budget.spentMinor,
        limitMinor: input.budget.totalMinor,
      });
    }

    for (const allocation of input.budget.allocations) {
      const allocationUsage = budgetUsagePercent(allocation.spentMinor, allocation.allocatedMinor);
      if (!isAtLeast(allocation.spentMinor, allocation.allocatedMinor, 0.8)) continue;
      items.push({
        id: `budget-allocation:${input.budget.id}:${allocation.categoryId}`,
        kind: 'budget-allocation',
        level: attentionLevel(allocation.spentMinor, allocation.allocatedMinor),
        categoryId: allocation.categoryId,
        categoryName: allocation.categoryName,
        usagePercent: allocationUsage,
        spentMinor: allocation.spentMinor,
        limitMinor: allocation.allocatedMinor,
      });
    }
  }

  return items.sort((left, right) => {
    const levelDifference = Number(right.level === 'urgent') - Number(left.level === 'urgent');
    if (levelDifference !== 0) return levelDifference;
    if (left.kind === 'fixed-cost' && right.kind === 'fixed-cost') return left.daysUntilDue - right.daysUntilDue;
    if (left.kind === 'fixed-cost') return -1;
    if (right.kind === 'fixed-cost') return 1;
    return right.usagePercent - left.usagePercent;
  });
}
