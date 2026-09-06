import { describe, expect, it } from 'vitest';

import { clampedDueDate, occurrenceDueAtForMonth, occurrenceStatus, validateFixedCostSchedule } from './fixed-costs';

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
