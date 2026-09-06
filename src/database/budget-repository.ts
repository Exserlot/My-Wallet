import type { BudgetPlan, MonthlyBudget } from '@/domain/budgets';

export type SaveBudgetInput = Readonly<{
  startAt: string;
  endAt: string;
  totalMinor: number;
  allocations: readonly Readonly<{ categoryId: string; amountMinor: number }>[];
}>;

export interface BudgetRepository {
  getBudget(startAt: string, endAt: string): Promise<MonthlyBudget | null>;
  getLatestPlanBefore(startAt: string): Promise<BudgetPlan | null>;
  saveBudget(input: SaveBudgetInput): Promise<MonthlyBudget>;
}
