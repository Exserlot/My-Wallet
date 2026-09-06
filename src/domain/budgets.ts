import type { CurrencyCode } from './transactions';

export type BudgetAllocation = Readonly<{
  categoryId: string;
  categoryName: string;
  allocatedMinor: number;
  spentMinor: number;
}>;

export type MonthlyBudget = Readonly<{
  id: string;
  startAt: string;
  endAt: string;
  totalMinor: number;
  currency: CurrencyCode;
  allocations: BudgetAllocation[];
  spentMinor: number;
  reservedFixedCostMinor: number;
  unallocatedMinor: number;
  remainingMinor: number;
  availableAfterReservationsMinor: number;
  updatedAt: string;
}>;

export type BudgetPlan = Readonly<{
  totalMinor: number;
  allocations: readonly Readonly<{ categoryId: string; amountMinor: number }>[];
}>;

export function allocatedTotalMinor(allocations: BudgetPlan['allocations']): number {
  return allocations.reduce((sum, allocation) => sum + allocation.amountMinor, 0);
}

export function validateBudgetPlan(plan: BudgetPlan): string | null {
  if (!Number.isSafeInteger(plan.totalMinor) || plan.totalMinor <= 0) return 'Budget total must be positive minor units';
  if (plan.allocations.some((allocation) => !Number.isSafeInteger(allocation.amountMinor) || allocation.amountMinor < 0)) {
    return 'Allocation must be non-negative minor units';
  }
  if (new Set(plan.allocations.map((allocation) => allocation.categoryId)).size !== plan.allocations.length) {
    return 'Each category can be allocated once';
  }
  if (allocatedTotalMinor(plan.allocations) > plan.totalMinor) return 'Allocations exceed budget total';
  return null;
}

export function budgetUsagePercent(spentMinor: number, totalMinor: number): number {
  if (totalMinor <= 0) return 0;
  return Math.round((spentMinor / totalMinor) * 100);
}
