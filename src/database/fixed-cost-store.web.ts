import { randomUUID } from 'expo-crypto';

import { occurrenceDueAtForMonth, occurrenceStatus, validateFixedCostSchedule, type FixedCostOccurrence, type FixedCostSchedule } from '@/domain/fixed-costs';

import type { FixedCostRepository } from './fixed-cost-repository';
import { readWebDatabase, writeWebDatabase, type WebFixedCostOccurrence, type WebFixedCostSchedule } from './web-database';

function toSchedule(schedule: WebFixedCostSchedule): FixedCostSchedule {
  const database = readWebDatabase();
  const category = database.expenseCategories.find((item) => item.id === schedule.categoryId);
  const wallet = database.wallets.find((item) => item.id === schedule.walletId);
  if (!category || !wallet) throw new Error('Fixed cost reference not found');
  return { ...schedule, categoryName: category.name, walletName: wallet.name };
}

function toOccurrence(occurrence: WebFixedCostOccurrence): FixedCostOccurrence {
  const database = readWebDatabase();
  const schedule = database.fixedCostSchedules.find((item) => item.id === occurrence.scheduleId);
  const category = database.expenseCategories.find((item) => item.id === occurrence.categoryId);
  const wallet = database.wallets.find((item) => item.id === occurrence.walletId);
  if (!schedule || !category || !wallet) throw new Error('Fixed cost occurrence reference not found');
  return { ...occurrence, scheduleName: schedule.name, categoryName: category.name, walletName: wallet.name };
}

function ensureOccurrences(startAt: string, endAt: string) {
  const database = readWebDatabase();
  const occurrences = [...database.fixedCostOccurrences];
  const start = new Date(startAt);
  const end = new Date(endAt);
  const cursor = new Date(start.getFullYear(), start.getMonth(), 1);
  const now = new Date();
  for (const schedule of database.fixedCostSchedules.filter((item) => item.archivedAt === null)) {
    for (const month = new Date(cursor); month < end; month.setMonth(month.getMonth() + 1)) {
      const dueAt = occurrenceDueAtForMonth(schedule, month.getFullYear(), month.getMonth());
      if (!dueAt || dueAt < startAt || dueAt >= endAt) continue;
      if (!occurrences.some((item) => item.scheduleId === schedule.id && item.dueAt === dueAt)) {
        occurrences.push({
          id: randomUUID(),
          scheduleId: schedule.id,
          categoryId: schedule.categoryId,
          walletId: schedule.walletId,
          estimatedMinor: schedule.estimatedMinor,
          dueAt,
          status: occurrenceStatus(dueAt, now),
          expenseId: null,
          createdAt: now.toISOString(),
        });
      }
    }
  }
  const updated = occurrences.map((occurrence) => (
    occurrence.status === 'paid' || occurrence.status === 'skipped'
      ? occurrence
      : { ...occurrence, status: occurrenceStatus(occurrence.dueAt, now) }
  ));
  writeWebDatabase({ ...database, fixedCostOccurrences: updated });
  return updated;
}

export const fixedCostRepository: FixedCostRepository = {
  async createSchedule(input) {
    const validationError = validateFixedCostSchedule(input);
    if (validationError) throw new Error(validationError);
    const database = readWebDatabase();
    if (!database.expenseCategories.some((category) => category.id === input.categoryId && category.archivedAt === null)) throw new Error('Expense category not found');
    if (!database.wallets.some((wallet) => wallet.id === input.walletId)) throw new Error('Wallet not found');
    const schedule: WebFixedCostSchedule = {
      id: randomUUID(),
      name: input.name.trim(),
      categoryId: input.categoryId,
      estimatedMinor: input.estimatedMinor,
      walletId: input.walletId,
      frequency: input.frequency,
      intervalMonths: input.frequency === 'every-n-months' ? input.intervalMonths : 1,
      dueDay: input.dueDay,
      firstDueAt: input.firstDueAt,
      payee: input.payee?.trim() || null,
      note: input.note?.trim() || null,
      remindersEnabled: input.remindersEnabled,
      createdAt: new Date().toISOString(),
      archivedAt: null,
    };
    writeWebDatabase({ ...database, fixedCostSchedules: [...database.fixedCostSchedules, schedule] });
    return toSchedule(schedule);
  },

  async listSchedules(options) {
    return readWebDatabase().fixedCostSchedules
      .filter((schedule) => options?.includeArchived || schedule.archivedAt === null)
      .sort((left, right) => left.createdAt.localeCompare(right.createdAt))
      .map(toSchedule);
  },

  async listOccurrences(startAt, endAt) {
    return ensureOccurrences(startAt, endAt)
      .filter((occurrence) => occurrence.dueAt >= startAt && occurrence.dueAt < endAt)
      .sort((left, right) => left.dueAt.localeCompare(right.dueAt))
      .map(toOccurrence);
  },

  async archiveSchedule(id) {
    const database = readWebDatabase();
    const archivedAt = new Date().toISOString();
    writeWebDatabase({
      ...database,
      fixedCostSchedules: database.fixedCostSchedules.map((schedule) => (
        schedule.id === id && schedule.archivedAt === null ? { ...schedule, archivedAt } : schedule
      )),
      fixedCostOccurrences: database.fixedCostOccurrences.filter((occurrence) => (
        occurrence.scheduleId !== id || occurrence.status !== 'upcoming' || occurrence.dueAt < archivedAt
      )),
    });
  },
};
