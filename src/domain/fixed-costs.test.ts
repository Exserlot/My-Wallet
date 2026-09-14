import { describe, expect, it } from 'vitest';

import { canResolveFixedCostOccurrence, clampedDueDate, firstDueAtForFixedCostEdit, occurrenceDueAtForMonth, occurrenceStatus, validateFixedCostSchedule } from './fixed-costs';

describe('fixed cost due dates', () => {
  it('uses the final day when a month has no requested day', () => {
    expect(clampedDueDate(2027, 1, 31).getDate()).toBe(28);
    expect(clampedDueDate(2028, 1, 31).getDate()).toBe(29);
  });

  it('supports every N months and yearly schedules', () => {
    const everyTwoMonths = { frequency: 'every-n-months' as const, intervalMonths: 2, dueDay: 15, firstDueAt: new Date(2026, 0, 15).toISOString() };
    expect(occurrenceDueAtForMonth(everyTwoMonths, 2026, 1)).toBeNull();
    expect(occurrenceDueAtForMonth(everyTwoMonths, 2026, 2)).not.toBeNull();
    const yearly = { ...everyTwoMonths, frequency: 'yearly' as const };
    expect(occurrenceDueAtForMonth(yearly, 2026, 1)).toBeNull();
    expect(occurrenceDueAtForMonth(yearly, 2027, 0)).not.toBeNull();
  });

  it('moves an edited monthly schedule back to this month when the new due day is still ahead', () => {
    const now = new Date(2026, 8, 12, 12);
    const firstDueAt = firstDueAtForFixedCostEdit('monthly', 1, 14, 'next-cycle', now);
    expect(occurrenceDueAtForMonth({ frequency: 'monthly', intervalMonths: 1, dueDay: 14, firstDueAt }, 2026, 8)).not.toBeNull();
  });

  it('respects the edit choice when the new due day has already passed', () => {
    const now = new Date(2026, 8, 12, 12);
    const overdue = firstDueAtForFixedCostEdit('monthly', 1, 5, 'include-overdue', now);
    const nextCycle = firstDueAtForFixedCostEdit('monthly', 1, 5, 'next-cycle', now);
    expect(new Date(overdue).getMonth()).toBe(8);
    expect(new Date(nextCycle).getMonth()).toBe(9);
  });
});

describe('fixed cost status', () => {
  it('derives upcoming, due, and overdue without marking anything paid', () => {
    const now = new Date(2026, 8, 6, 12);
    expect(occurrenceStatus(new Date(2026, 8, 5).toISOString(), now)).toBe('overdue');
    expect(occurrenceStatus(new Date(2026, 8, 6).toISOString(), now)).toBe('due');
    expect(occurrenceStatus(new Date(2026, 8, 7).toISOString(), now)).toBe('upcoming');
  });
});

describe('validateFixedCostSchedule', () => {
  it('validates required schedule rules', () => {
    expect(validateFixedCostSchedule({ name: 'ค่าเน็ต', estimatedMinor: 129000, intervalMonths: 1, dueDay: 31 })).toBeNull();
    expect(validateFixedCostSchedule({ name: '', estimatedMinor: 129000, intervalMonths: 1, dueDay: 31 })).not.toBeNull();
    expect(validateFixedCostSchedule({ name: 'ค่าเน็ต', estimatedMinor: 0, intervalMonths: 1, dueDay: 31 })).not.toBeNull();
    expect(validateFixedCostSchedule({ name: 'ค่าเน็ต', estimatedMinor: 129000, intervalMonths: 1, dueDay: 32 })).not.toBeNull();
  });
});

describe('canResolveFixedCostOccurrence', () => {
  it('prevents paid or skipped occurrences from being resolved twice', () => {
    expect(canResolveFixedCostOccurrence('upcoming')).toBe(true);
    expect(canResolveFixedCostOccurrence('overdue')).toBe(true);
    expect(canResolveFixedCostOccurrence('paid')).toBe(false);
    expect(canResolveFixedCostOccurrence('skipped')).toBe(false);
  });
});
