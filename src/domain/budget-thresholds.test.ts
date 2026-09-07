import { describe, expect, it } from 'vitest';

import type { MonthlyBudget } from './budgets';
import { updateBudgetThresholdState } from './budget-thresholds';

function budget(spentMinor: number): MonthlyBudget {
  return { id: 'september', startAt: '2026-09-01', endAt: '2026-10-01', totalMinor: 100000, currency: 'THB', allocations: [{ categoryId: 'food', categoryName: 'อาหาร', allocatedMinor: 40000, spentMinor }], spentMinor, reservedFixedCostMinor: 0, unallocatedMinor: 60000, remainingMinor: 100000 - spentMinor, availableAfterReservationsMinor: 100000 - spentMinor, updatedAt: '2026-09-08' };
}

describe('budget threshold transitions', () => {
  it('notifies only targets that newly reach 100 percent', () => {
    const first = updateBudgetThresholdState({}, budget(40000));
    expect(first.newlyUrgent.map((target) => target.name)).toEqual(['งบอาหาร']);
    const repeated = updateBudgetThresholdState(first.next, budget(45000));
    expect(repeated.newlyUrgent).toEqual([]);
  });

  it('can notify again after usage falls below the threshold', () => {
    const urgent = updateBudgetThresholdState({}, budget(40000));
    const reset = updateBudgetThresholdState(urgent.next, budget(30000));
    expect(reset.next['allocation:september:food']).toBe('below');
    expect(updateBudgetThresholdState(reset.next, budget(40000)).newlyUrgent).toHaveLength(1);
  });
});
