export const fixedCostFrequencies = ['monthly', 'every-n-months', 'yearly', 'once'] as const;

export type FixedCostFrequency = (typeof fixedCostFrequencies)[number];
export type FixedCostOccurrenceStatus = 'upcoming' | 'due' | 'overdue' | 'paid' | 'skipped';

export type FixedCostSchedule = Readonly<{
  id: string;
  name: string;
  categoryId: string;
  categoryName: string;
  estimatedMinor: number;
  walletId: string;
  walletName: string;
  frequency: FixedCostFrequency;
  intervalMonths: number;
  dueDay: number;
  firstDueAt: string;
  payee: string | null;
  note: string | null;
  remindersEnabled: boolean;
  createdAt: string;
  archivedAt: string | null;
}>;

export type FixedCostOccurrence = Readonly<{
  id: string;
  scheduleId: string;
  scheduleName: string;
  categoryId: string;
  categoryName: string;
  walletId: string;
  walletName: string;
  estimatedMinor: number;
  dueAt: string;
  status: FixedCostOccurrenceStatus;
  expenseId: string | null;
  actualMinor: number | null;
}>;

type RecurrenceRule = Readonly<{
  frequency: FixedCostFrequency;
  intervalMonths: number;
  dueDay: number;
  firstDueAt: string;
}>;

export function validateFixedCostSchedule(input: Readonly<{
  name: string;
  estimatedMinor: number;
  intervalMonths: number;
  dueDay: number;
}>): string | null {
  const name = input.name.trim();
  if (!name || name.length > 80) return 'Fixed cost name must contain 1 to 80 characters';
  if (!Number.isSafeInteger(input.estimatedMinor) || input.estimatedMinor <= 0) return 'Estimated amount must be positive minor units';
  if (!Number.isSafeInteger(input.intervalMonths) || input.intervalMonths < 1 || input.intervalMonths > 120) return 'Interval must be from 1 to 120 months';
  if (!Number.isInteger(input.dueDay) || input.dueDay < 1 || input.dueDay > 31) return 'Due day must be from 1 to 31';
  return null;
}

function daysInMonth(year: number, monthIndex: number): number {
  return new Date(year, monthIndex + 1, 0).getDate();
}

export function clampedDueDate(year: number, monthIndex: number, dueDay: number): Date {
  return new Date(year, monthIndex, Math.min(dueDay, daysInMonth(year, monthIndex)));
}

export function occurrenceDueAtForMonth(rule: RecurrenceRule, year: number, monthIndex: number): string | null {
  const first = new Date(rule.firstDueAt);
  const candidate = clampedDueDate(year, monthIndex, rule.dueDay);
  const firstMonth = first.getFullYear() * 12 + first.getMonth();
  const candidateMonth = year * 12 + monthIndex;
  const monthDifference = candidateMonth - firstMonth;
  if (monthDifference < 0) return null;
  if (rule.frequency === 'once' && monthDifference !== 0) return null;
  if (rule.frequency === 'yearly' && monthDifference % 12 !== 0) return null;
  if (rule.frequency === 'every-n-months' && monthDifference % rule.intervalMonths !== 0) return null;
  return candidate.toISOString();
}

export function occurrenceStatus(dueAt: string, now = new Date()): FixedCostOccurrenceStatus {
  const due = new Date(dueAt);
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const dueDay = new Date(due.getFullYear(), due.getMonth(), due.getDate());
  if (dueDay.getTime() === today.getTime()) return 'due';
  return dueDay < today ? 'overdue' : 'upcoming';
}

export function frequencyLabel(frequency: FixedCostFrequency, intervalMonths: number): string {
  if (frequency === 'monthly') return 'ทุกเดือน';
  if (frequency === 'every-n-months') return `ทุก ${intervalMonths} เดือน`;
  if (frequency === 'yearly') return 'ทุกปี';
  return 'ครั้งเดียว';
}

export function canResolveFixedCostOccurrence(status: FixedCostOccurrenceStatus): boolean {
  return status === 'upcoming' || status === 'due' || status === 'overdue';
}
