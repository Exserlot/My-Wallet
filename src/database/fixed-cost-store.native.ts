import { randomUUID } from 'expo-crypto';

import {
  occurrenceDueAtForMonth,
  occurrenceStatus,
  validateFixedCostSchedule,
  canResolveFixedCostOccurrence,
  type FixedCostFrequency,
  type FixedCostOccurrence,
  type FixedCostOccurrenceStatus,
  type FixedCostSchedule,
} from '@/domain/fixed-costs';

import { getDatabase } from './database';
import type { CreateFixedCostScheduleInput, FixedCostRepository, PayFixedCostOccurrenceInput } from './fixed-cost-repository';

type ScheduleRow = {
  id: string;
  name: string;
  category_id: string;
  category_name: string;
  estimated_minor: number;
  wallet_id: string;
  wallet_name: string;
  frequency: FixedCostFrequency;
  interval_months: number;
  due_day: number;
  first_due_at: string;
  payee: string | null;
  note: string | null;
  reminders_enabled: number;
  created_at: string;
  archived_at: string | null;
};

type OccurrenceRow = {
  id: string;
  schedule_id: string;
  schedule_name: string;
  category_id: string;
  category_name: string;
  wallet_id: string;
  wallet_name: string;
  estimated_minor: number;
  due_at: string;
  status: FixedCostOccurrenceStatus;
  expense_id: string | null;
  actual_minor: number | null;
};

function toSchedule(row: ScheduleRow): FixedCostSchedule {
  return {
    id: row.id,
    name: row.name,
    categoryId: row.category_id,
    categoryName: row.category_name,
    estimatedMinor: row.estimated_minor,
    walletId: row.wallet_id,
    walletName: row.wallet_name,
    frequency: row.frequency,
    intervalMonths: row.interval_months,
    dueDay: row.due_day,
    firstDueAt: row.first_due_at,
    payee: row.payee,
    note: row.note,
    remindersEnabled: row.reminders_enabled === 1,
    createdAt: row.created_at,
    archivedAt: row.archived_at,
  };
}

function toOccurrence(row: OccurrenceRow): FixedCostOccurrence {
  return {
    id: row.id,
    scheduleId: row.schedule_id,
    scheduleName: row.schedule_name,
    categoryId: row.category_id,
    categoryName: row.category_name,
    walletId: row.wallet_id,
    walletName: row.wallet_name,
    estimatedMinor: row.estimated_minor,
    dueAt: row.due_at,
    status: row.status,
    expenseId: row.expense_id,
    actualMinor: row.actual_minor,
  };
}

const scheduleSelect = `SELECT
  fixed_cost_schedules.id,
  fixed_cost_schedules.name,
  fixed_cost_schedules.category_id,
  expense_categories.name AS category_name,
  fixed_cost_schedules.estimated_minor,
  fixed_cost_schedules.wallet_id,
  wallets.name AS wallet_name,
  fixed_cost_schedules.frequency,
  fixed_cost_schedules.interval_months,
  fixed_cost_schedules.due_day,
  fixed_cost_schedules.first_due_at,
  fixed_cost_schedules.payee,
  fixed_cost_schedules.note,
  fixed_cost_schedules.reminders_enabled,
  fixed_cost_schedules.created_at,
  fixed_cost_schedules.archived_at
FROM fixed_cost_schedules
JOIN expense_categories ON expense_categories.id = fixed_cost_schedules.category_id
JOIN wallets ON wallets.id = fixed_cost_schedules.wallet_id`;

async function findSchedule(id: string): Promise<FixedCostSchedule | null> {
  const database = await getDatabase();
  const row = await database.getFirstAsync<ScheduleRow>(`${scheduleSelect} WHERE fixed_cost_schedules.id = ?`, id);
  return row ? toSchedule(row) : null;
}

const occurrenceSelect = `SELECT
  fixed_cost_occurrences.id,
  fixed_cost_occurrences.schedule_id,
  fixed_cost_schedules.name AS schedule_name,
  fixed_cost_occurrences.category_id,
  expense_categories.name AS category_name,
  fixed_cost_occurrences.wallet_id,
  wallets.name AS wallet_name,
  fixed_cost_occurrences.estimated_minor,
  fixed_cost_occurrences.due_at,
  fixed_cost_occurrences.status,
  fixed_cost_occurrences.expense_id,
  transactions.amount_minor AS actual_minor
FROM fixed_cost_occurrences
JOIN fixed_cost_schedules ON fixed_cost_schedules.id = fixed_cost_occurrences.schedule_id
JOIN expense_categories ON expense_categories.id = fixed_cost_occurrences.category_id
JOIN wallets ON wallets.id = fixed_cost_occurrences.wallet_id
LEFT JOIN transactions ON transactions.id = fixed_cost_occurrences.expense_id`;

async function findOccurrence(id: string): Promise<FixedCostOccurrence | null> {
  const database = await getDatabase();
  const row = await database.getFirstAsync<OccurrenceRow>(`${occurrenceSelect} WHERE fixed_cost_occurrences.id = ?`, id);
  return row ? toOccurrence(row) : null;
}

async function validateReferences(input: CreateFixedCostScheduleInput) {
  const database = await getDatabase();
  const [category, wallet] = await Promise.all([
    database.getFirstAsync<{ id: string }>('SELECT id FROM expense_categories WHERE id = ? AND archived_at IS NULL', input.categoryId),
    database.getFirstAsync<{ id: string }>('SELECT id FROM wallets WHERE id = ?', input.walletId),
  ]);
  if (!category) throw new Error('Expense category not found');
  if (!wallet) throw new Error('Wallet not found');
}

async function ensureOccurrences(startAt: string, endAt: string) {
  const database = await getDatabase();
  const rows = await database.getAllAsync<ScheduleRow>(`${scheduleSelect} WHERE fixed_cost_schedules.archived_at IS NULL`);
  const start = new Date(startAt);
  const end = new Date(endAt);
  const cursor = new Date(start.getFullYear(), start.getMonth(), 1);
  const now = new Date();
  for (const row of rows) {
    const schedule = toSchedule(row);
    for (const month = new Date(cursor); month < end; month.setMonth(month.getMonth() + 1)) {
      const dueAt = occurrenceDueAtForMonth(schedule, month.getFullYear(), month.getMonth());
      if (!dueAt || dueAt < startAt || dueAt >= endAt) continue;
      await database.runAsync(
        `INSERT OR IGNORE INTO fixed_cost_occurrences
          (id, schedule_id, category_id, wallet_id, estimated_minor, due_at, status, expense_id, created_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, NULL, ?)`,
        randomUUID(),
        schedule.id,
        schedule.categoryId,
        schedule.walletId,
        schedule.estimatedMinor,
        dueAt,
        occurrenceStatus(dueAt, now),
        now.toISOString(),
      );
    }
  }
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();
  const tomorrow = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1).toISOString();
  await database.runAsync("UPDATE fixed_cost_occurrences SET status = 'overdue' WHERE status IN ('upcoming', 'due') AND due_at < ?", today);
  await database.runAsync("UPDATE fixed_cost_occurrences SET status = 'due' WHERE status IN ('upcoming', 'overdue') AND due_at >= ? AND due_at < ?", today, tomorrow);
  await database.runAsync("UPDATE fixed_cost_occurrences SET status = 'upcoming' WHERE status IN ('due', 'overdue') AND due_at >= ?", tomorrow);
}

export const fixedCostRepository: FixedCostRepository = {
  async createSchedule(input) {
    const validationError = validateFixedCostSchedule(input);
    if (validationError) throw new Error(validationError);
    await validateReferences(input);
    const database = await getDatabase();
    const id = randomUUID();
    await database.runAsync(
      `INSERT INTO fixed_cost_schedules
        (id, name, category_id, estimated_minor, wallet_id, frequency, interval_months, due_day, first_due_at, payee, note, reminders_enabled, created_at, archived_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NULL)`,
      id,
      input.name.trim(),
      input.categoryId,
      input.estimatedMinor,
      input.walletId,
      input.frequency,
      input.frequency === 'every-n-months' ? input.intervalMonths : 1,
      input.dueDay,
      input.firstDueAt,
      input.payee?.trim() || null,
      input.note?.trim() || null,
      input.remindersEnabled ? 1 : 0,
      new Date().toISOString(),
    );
    const schedule = await findSchedule(id);
    if (!schedule) throw new Error('Fixed cost schedule was not found after insert');
    return schedule;
  },

  async listSchedules(options) {
    const database = await getDatabase();
    const rows = await database.getAllAsync<ScheduleRow>(
      `${scheduleSelect} ${options?.includeArchived ? '' : 'WHERE fixed_cost_schedules.archived_at IS NULL'} ORDER BY fixed_cost_schedules.created_at`,
    );
    return rows.map(toSchedule);
  },

  async listOccurrences(startAt, endAt) {
    await ensureOccurrences(startAt, endAt);
    const database = await getDatabase();
    const rows = await database.getAllAsync<OccurrenceRow>(
      `${occurrenceSelect}
      WHERE fixed_cost_occurrences.due_at >= ? AND fixed_cost_occurrences.due_at < ?
      ORDER BY fixed_cost_occurrences.due_at`,
      startAt,
      endAt,
    );
    return rows.map(toOccurrence);
  },

  getOccurrence: findOccurrence,

  async payOccurrence(input: PayFixedCostOccurrenceInput) {
    if (!Number.isSafeInteger(input.actualMinor) || input.actualMinor <= 0) throw new Error('Actual amount must be positive minor units');
    const database = await getDatabase();
    const expenseId = randomUUID();
    const createdAt = new Date().toISOString();
    await database.withExclusiveTransactionAsync(async (transaction) => {
      const occurrence = await transaction.getFirstAsync<{
        schedule_id: string;
        schedule_name: string;
        category_id: string;
        status: FixedCostOccurrenceStatus;
        expense_id: string | null;
      }>(
        `SELECT fixed_cost_occurrences.schedule_id, fixed_cost_schedules.name AS schedule_name,
          fixed_cost_occurrences.category_id, fixed_cost_occurrences.status, fixed_cost_occurrences.expense_id
         FROM fixed_cost_occurrences
         JOIN fixed_cost_schedules ON fixed_cost_schedules.id = fixed_cost_occurrences.schedule_id
         WHERE fixed_cost_occurrences.id = ?`,
        input.occurrenceId,
      );
      if (!occurrence || occurrence.expense_id || !canResolveFixedCostOccurrence(occurrence.status)) throw new Error('Fixed cost occurrence is already resolved');
      const wallet = await transaction.getFirstAsync<{ id: string }>('SELECT id FROM wallets WHERE id = ?', input.walletId);
      if (!wallet) throw new Error('Wallet not found');
      await transaction.runAsync(
        `INSERT INTO transactions
          (id, wallet_id, kind, amount_minor, currency, occurred_at, created_at, category_id, note, source)
         VALUES (?, ?, 'EXPENSE', ?, 'THB', ?, ?, ?, ?, 'manual')`,
        expenseId,
        input.walletId,
        input.actualMinor,
        input.occurredAt,
        createdAt,
        occurrence.category_id,
        occurrence.schedule_name,
      );
      const result = await transaction.runAsync(
        "UPDATE fixed_cost_occurrences SET wallet_id = ?, status = 'paid', expense_id = ? WHERE id = ? AND expense_id IS NULL AND status IN ('upcoming', 'due', 'overdue')",
        input.walletId,
        expenseId,
        input.occurrenceId,
      );
      if (result.changes !== 1) throw new Error('Fixed cost occurrence changed while paying');
      if (input.updateScheduleWallet) {
        await transaction.runAsync('UPDATE fixed_cost_schedules SET wallet_id = ? WHERE id = ?', input.walletId, occurrence.schedule_id);
      }
    });
    const paid = await findOccurrence(input.occurrenceId);
    if (!paid) throw new Error('Fixed cost occurrence was not found after payment');
    return paid;
  },

  async skipOccurrence(id) {
    const database = await getDatabase();
    const result = await database.runAsync(
      "UPDATE fixed_cost_occurrences SET status = 'skipped' WHERE id = ? AND expense_id IS NULL AND status IN ('upcoming', 'due', 'overdue')",
      id,
    );
    if (result.changes !== 1) throw new Error('Fixed cost occurrence is already resolved');
    const skipped = await findOccurrence(id);
    if (!skipped) throw new Error('Fixed cost occurrence was not found after skip');
    return skipped;
  },

  async archiveSchedule(id) {
    const database = await getDatabase();
    const now = new Date().toISOString();
    await database.withExclusiveTransactionAsync(async (transaction) => {
      await transaction.runAsync(
        'UPDATE fixed_cost_schedules SET archived_at = ? WHERE id = ? AND archived_at IS NULL',
        now,
        id,
      );
      await transaction.runAsync(
        "DELETE FROM fixed_cost_occurrences WHERE schedule_id = ? AND status = 'upcoming' AND due_at >= ?",
        id,
        now,
      );
    });
  },
};
