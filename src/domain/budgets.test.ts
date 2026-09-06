import { describe, expect, it } from 'vitest';

import { allocatedTotalMinor, budgetUsagePercent, validateBudgetPlan } from './budgets';

const allocations = [
  { categoryId: 'food', amountMinor: 250000 },
  { categoryId: 'travel', amountMinor: 100000 },
];

describe('budget plan', () => {
  it('calculates allocated money and permits an unallocated reserve', () => {
    expect(allocatedTotalMinor(allocations)).toBe(350000);
    expect(validateBudgetPlan({ totalMinor: 1000000, allocations })).toBeNull();
  });

  it('rejects allocations above the monthly budget', () => {
    expect(validateBudgetPlan({ totalMinor: 300000, allocations })).toBe('Allocations exceed budget total');
  });

  it('rejects duplicate categories and invalid money', () => {
    expect(validateBudgetPlan({ totalMinor: 100000, allocations: [{ categoryId: 'food', amountMinor: 50000 }, { categoryId: 'food', amountMinor: 10000 }] })).toBe('Each category can be allocated once');
    expect(validateBudgetPlan({ totalMinor: 0, allocations: [] })).toBe('Budget total must be positive minor units');
  });
});

describe('budgetUsagePercent', () => {
  it('can exceed 100 percent without blocking expense recording', () => {
    expect(budgetUsagePercent(125000, 100000)).toBe(125);
  });
});
