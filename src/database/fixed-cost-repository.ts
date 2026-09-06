import type { FixedCostFrequency, FixedCostOccurrence, FixedCostSchedule } from '@/domain/fixed-costs';

export type CreateFixedCostScheduleInput = Readonly<{
  name: string;
  categoryId: string;
  estimatedMinor: number;
  walletId: string;
  frequency: FixedCostFrequency;
  intervalMonths: number;
  dueDay: number;
  firstDueAt: string;
  payee: string | null;
  note: string | null;
  remindersEnabled: boolean;
}>;

export interface FixedCostRepository {
  createSchedule(input: CreateFixedCostScheduleInput): Promise<FixedCostSchedule>;
  listSchedules(options?: { includeArchived?: boolean }): Promise<FixedCostSchedule[]>;
  listOccurrences(startAt: string, endAt: string): Promise<FixedCostOccurrence[]>;
  archiveSchedule(id: string): Promise<void>;
}
