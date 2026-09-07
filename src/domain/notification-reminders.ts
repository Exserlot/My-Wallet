import type { FixedCostOccurrence, FixedCostSchedule } from './fixed-costs';

export type FixedCostReminderPhase = 'three-days-before' | 'due' | 'overdue';

export type FixedCostReminderGroup = Readonly<{
  id: string;
  phase: FixedCostReminderPhase;
  triggerAt: string;
  occurrenceIds: readonly string[];
}>;

const reminderOffsets: readonly Readonly<{ phase: FixedCostReminderPhase; days: number }>[] = [
  { phase: 'three-days-before', days: -3 },
  { phase: 'due', days: 0 },
  { phase: 'overdue', days: 1 },
];

function reminderDate(dueAt: string, days: number, hour: number, minute: number): Date {
  const due = new Date(dueAt);
  return new Date(due.getFullYear(), due.getMonth(), due.getDate() + days, hour, minute, 0, 0);
}

export function buildFixedCostReminderGroups(input: Readonly<{
  schedules: readonly FixedCostSchedule[];
  occurrences: readonly FixedCostOccurrence[];
  now?: Date;
  hour?: number;
  minute?: number;
}>): FixedCostReminderGroup[] {
  const now = input.now ?? new Date();
  const hour = input.hour ?? 9;
  const minute = input.minute ?? 0;
  const enabledScheduleIds = new Set(input.schedules.filter((schedule) => schedule.archivedAt === null && schedule.remindersEnabled).map((schedule) => schedule.id));
  const grouped = new Map<string, { phase: FixedCostReminderPhase; triggerAt: string; occurrenceIds: string[] }>();

  for (const occurrence of input.occurrences) {
    if (!enabledScheduleIds.has(occurrence.scheduleId) || occurrence.status === 'paid' || occurrence.status === 'skipped') continue;
    for (const reminder of reminderOffsets) {
      const trigger = reminderDate(occurrence.dueAt, reminder.days, hour, minute);
      if (trigger <= now) continue;
      const triggerAt = trigger.toISOString();
      const key = `${reminder.phase}:${triggerAt}`;
      const current = grouped.get(key) ?? { phase: reminder.phase, triggerAt, occurrenceIds: [] };
      current.occurrenceIds.push(occurrence.id);
      grouped.set(key, current);
    }
  }

  return [...grouped.entries()]
    .map(([id, group]) => ({ id, ...group, occurrenceIds: [...group.occurrenceIds].sort() }))
    .sort((left, right) => left.triggerAt.localeCompare(right.triggerAt) || left.phase.localeCompare(right.phase));
}
