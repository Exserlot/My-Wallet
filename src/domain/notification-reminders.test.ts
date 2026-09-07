import { describe, expect, it } from 'vitest';

import type { FixedCostOccurrence, FixedCostSchedule } from './fixed-costs';
import { buildFixedCostReminderGroups } from './notification-reminders';

function schedule(id: string, remindersEnabled = true): FixedCostSchedule {
  return { id, name: id, categoryId: 'category', categoryName: 'บิล', estimatedMinor: 10000, walletId: 'wallet', walletName: 'หลัก', frequency: 'monthly', intervalMonths: 1, dueDay: 12, firstDueAt: '2026-09-12T00:00:00.000Z', payee: null, note: null, remindersEnabled, createdAt: '2026-09-01T00:00:00.000Z', archivedAt: null };
}

function occurrence(id: string, scheduleId: string): FixedCostOccurrence {
  return { id, scheduleId, scheduleName: scheduleId, categoryId: 'category', categoryName: 'บิล', walletId: 'wallet', walletName: 'หลัก', estimatedMinor: 10000, dueAt: '2026-09-12T00:00:00.000Z', status: 'upcoming', expenseId: null, actualMinor: null };
}

describe('fixed cost reminder groups', () => {
  it('schedules three private reminder moments at local 09:00', () => {
    const groups = buildFixedCostReminderGroups({ schedules: [schedule('s1')], occurrences: [occurrence('o1', 's1')], now: new Date('2026-09-08T08:00:00+07:00') });
    expect(groups.map((group) => [group.phase, new Date(group.triggerAt).getDate(), new Date(group.triggerAt).getHours()])).toEqual([
      ['three-days-before', 9, 9],
      ['due', 12, 9],
      ['overdue', 13, 9],
    ]);
  });

  it('combines items at the same reminder moment and ignores disabled schedules', () => {
    const groups = buildFixedCostReminderGroups({
      schedules: [schedule('s1'), schedule('s2'), schedule('disabled', false)],
      occurrences: [occurrence('o2', 's2'), occurrence('o1', 's1'), occurrence('ignored', 'disabled')],
      now: new Date('2026-09-08T08:00:00+07:00'),
    });
    expect(groups).toHaveLength(3);
    expect(groups[0]?.occurrenceIds).toEqual(['o1', 'o2']);
  });

  it('does not schedule past moments or resolved occurrences', () => {
    const groups = buildFixedCostReminderGroups({
      schedules: [schedule('s1')],
      occurrences: [occurrence('open', 's1'), { ...occurrence('paid', 's1'), status: 'paid' }],
      now: new Date('2026-09-12T10:00:00+07:00'),
    });
    expect(groups).toHaveLength(1);
    expect(groups[0]).toMatchObject({ phase: 'overdue', occurrenceIds: ['open'] });
  });
});
