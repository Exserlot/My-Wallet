import type { CashFlowKind, Transaction } from './transactions';

export type ReportPeriod = 'current-month' | 'previous-month' | 'three-months';

export type ReportRange = Readonly<{
  start: string;
  end: string;
  grouping: 'day' | 'month';
}>;

export type ExpenseCategoryReportItem = Readonly<{
  id: string;
  name: string;
  amountMinor: number;
  percent: number;
  categoryIds: readonly (string | null)[];
}>;

export type CashFlowBucket = Readonly<{
  key: string;
  startAt: string;
  incomeMinor: number;
  expenseMinor: number;
}>;

function startOfMonth(date: Date, monthOffset: number): Date {
  return new Date(date.getFullYear(), date.getMonth() + monthOffset, 1);
}

export function reportRange(period: ReportPeriod, now = new Date()): ReportRange {
  if (period === 'previous-month') {
    return { start: startOfMonth(now, -1).toISOString(), end: startOfMonth(now, 0).toISOString(), grouping: 'day' };
  }
  if (period === 'three-months') {
    return { start: startOfMonth(now, -2).toISOString(), end: startOfMonth(now, 1).toISOString(), grouping: 'month' };
  }
  return { start: startOfMonth(now, 0).toISOString(), end: startOfMonth(now, 1).toISOString(), grouping: 'day' };
}

export function buildExpenseCategoryReport(transactions: readonly Transaction[], visibleCount = 5): ExpenseCategoryReportItem[] {
  const totals = new Map<string | null, { name: string; amountMinor: number }>();
  for (const transaction of transactions) {
    if (transaction.kind !== 'expense') continue;
    const current = totals.get(transaction.categoryId) ?? { name: transaction.categoryName ?? 'ยังไม่ระบุ', amountMinor: 0 };
    totals.set(transaction.categoryId, { ...current, amountMinor: current.amountMinor + transaction.amount.amountMinor });
  }
  const sorted = [...totals.entries()].sort((left, right) => right[1].amountMinor - left[1].amountMinor || left[1].name.localeCompare(right[1].name));
  const totalMinor = sorted.reduce((sum, [, value]) => sum + value.amountMinor, 0);
  const visible = sorted.slice(0, visibleCount);
  const remaining = sorted.slice(visibleCount);
  const rows = visible.map(([categoryId, value]) => ({
    id: categoryId ?? 'uncategorized',
    name: value.name,
    amountMinor: value.amountMinor,
    percent: totalMinor > 0 ? Math.round(value.amountMinor / totalMinor * 100) : 0,
    categoryIds: [categoryId],
  }));
  if (remaining.length > 0) {
    const amountMinor = remaining.reduce((sum, [, value]) => sum + value.amountMinor, 0);
    rows.push({
      id: 'other',
      name: 'หมวดอื่น',
      amountMinor,
      percent: totalMinor > 0 ? Math.round(amountMinor / totalMinor * 100) : 0,
      categoryIds: remaining.map(([categoryId]) => categoryId),
    });
  }
  return rows;
}

function localBucketKey(date: Date, grouping: ReportRange['grouping']): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  if (grouping === 'month') return `${year}-${month}`;
  return `${year}-${month}-${String(date.getDate()).padStart(2, '0')}`;
}

function addBucket(date: Date, grouping: ReportRange['grouping']): Date {
  return grouping === 'month'
    ? new Date(date.getFullYear(), date.getMonth() + 1, 1)
    : new Date(date.getFullYear(), date.getMonth(), date.getDate() + 1);
}

export function buildCashFlowSeries(transactions: readonly Transaction[], range: ReportRange): CashFlowBucket[] {
  const buckets = new Map<string, { incomeMinor: number; expenseMinor: number }>();
  for (let cursor = new Date(range.start); cursor < new Date(range.end); cursor = addBucket(cursor, range.grouping)) {
    buckets.set(localBucketKey(cursor, range.grouping), { incomeMinor: 0, expenseMinor: 0 });
  }
  for (const transaction of transactions) {
    if (transaction.kind !== 'income' && transaction.kind !== 'expense') continue;
    const key = localBucketKey(new Date(transaction.occurredAt), range.grouping);
    const bucket = buckets.get(key);
    if (!bucket) continue;
    const field: `${CashFlowKind}Minor` = `${transaction.kind}Minor`;
    bucket[field] += transaction.amount.amountMinor;
  }
  return [...buckets.entries()].map(([key, totals]) => {
    const parts = key.split('-').map(Number);
    const startAt = new Date(parts[0]!, parts[1]! - 1, parts[2] ?? 1).toISOString();
    return { key, startAt, ...totals };
  });
}
