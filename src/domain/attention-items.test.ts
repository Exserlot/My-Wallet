import { describe, expect, it } from 'vitest';

import type { MonthlyBudget } from './budgets';
import type { FixedCostOccurrence } from './fixed-costs';
import { buildDashboardAttentionItems } from './attention-items';

function occurrence(overrides: Partial<FixedCostOccurrence> = {}): FixedCostOccurrence {
  return {
    id: 'occurrence-1',
    scheduleId: 'schedule-1',
    scheduleName: 'ค่าอินเทอร์เน็ต',
    categoryId: 'category-1',
    categoryName: 'บิล',
    walletId: 'wallet-1',
    walletName: 'บัญชีหลัก',
    estimatedMinor: 50000,
    dueAt: '2026-09-11T00:00:00.000Z',
    status: 'upcoming',
    expenseId: null,
    actualMinor: null,
    ...overrides,
  };
}

function budget(overrides: Partial<MonthlyBudget> = {}): MonthlyBudget {
  return {
    id: 'budget-1',
    startAt: '2026-09-01T00:00:00.000Z',
    endAt: '2026-10-01T00:00:00.000Z',
    totalMinor: 1000000,
    currency: 'THB',
    allocations: [],
    spentMinor: 0,
    reservedFixedCostMinor: 0,
    unallocatedMinor: 0,
    remainingMinor: 1000000,
    availableAfterReservationsMinor: 1000000,
    updatedAt: '2026-09-08T00:00:00.000Z',
    ...overrides,
  };
}

describe('dashboard attention items', () => {
  it('shows fixed costs from three days before due and keeps overdue items urgent', () => {
    const items = buildDashboardAttentionItems({
      budget: null,
      occurrences: [
        occurrence(),
        occurrence({ id: 'far-away', dueAt: '2026-09-12T00:00:00.000Z' }),
        occurrence({ id: 'overdue', dueAt: '2026-09-07T00:00:00.000Z', status: 'overdue' }),
        occurrence({ id: 'paid', status: 'paid' }),
      ],
      now: new Date('2026-09-08T12:00:00+07:00'),
    });

    expect(items.map((item) => item.id)).toEqual(['fixed-cost:overdue', 'fixed-cost:occurrence-1']);
    expect(items[0]?.level).toBe('urgent');
  });

  it('shows monthly and allocation warnings at 80 percent and urgency at 100 percent', () => {
    const items = buildDashboardAttentionItems({
      budget: budget({
        spentMinor: 800000,
        allocations: [
          { categoryId: 'food', categoryName: 'อาหาร', allocatedMinor: 200000, spentMinor: 200000 },
          { categoryId: 'travel', categoryName: 'เดินทาง', allocatedMinor: 100000, spentMinor: 79000 },
          { categoryId: 'none', categoryName: 'ไม่ได้ตั้งงบ', allocatedMinor: 0, spentMinor: 5000 },
        ],
      }),
      occurrences: [],
    });

    expect(items.map((item) => [item.id, item.level])).toEqual([
      ['budget-allocation:budget-1:food', 'urgent'],
      ['monthly-budget:budget-1', 'warning'],
    ]);
  });

  it('returns no item while every value remains below its threshold', () => {
    expect(buildDashboardAttentionItems({ budget: budget({ spentMinor: 799999 }), occurrences: [] })).toEqual([]);
  });
});
