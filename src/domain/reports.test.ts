import { describe, expect, it } from 'vitest';

import type { Transaction } from './transactions';
import { buildCashFlowSeries, buildExpenseCategoryReport, customReportRange, reportRange } from './reports';

function transaction(kind: 'income' | 'expense', amountMinor: number, categoryId: string | null, categoryName: string | null, occurredAt = '2026-09-08T12:00:00+07:00'): Transaction {
  return { id: `${kind}-${amountMinor}-${categoryId}`, walletId: 'wallet', walletName: 'หลัก', kind, categoryId, categoryName, amount: { amountMinor, currency: 'THB' }, occurredAt, note: null, source: 'manual' };
}

describe('expense category report', () => {
  it('sorts the five largest categories and combines the rest', () => {
    const expenses = [6, 5, 4, 3, 2, 1].map((amount) => transaction('expense', amount * 100, `c${amount}`, `หมวด ${amount}`));
    const report = buildExpenseCategoryReport(expenses);
    expect(report.map((item) => item.name)).toEqual(['หมวด 6', 'หมวด 5', 'หมวด 4', 'หมวด 3', 'หมวด 2', 'หมวดอื่น']);
    expect(report.at(-1)?.amountMinor).toBe(100);
  });

  it('keeps uncategorized expenses visible and ignores income', () => {
    const report = buildExpenseCategoryReport([
      transaction('expense', 5000, null, null),
      transaction('income', 9000, null, null),
    ]);
    expect(report).toMatchObject([{ id: 'uncategorized', name: 'ยังไม่ระบุ', amountMinor: 5000, percent: 100 }]);
  });
});

describe('cash flow report', () => {
  it('creates zero-filled monthly buckets for the latest three months', () => {
    const range = reportRange('three-months', new Date('2026-09-08T12:00:00+07:00'));
    const series = buildCashFlowSeries([transaction('expense', 1200, 'food', 'อาหาร')], range);
    expect(series.map((bucket) => bucket.key)).toEqual(['2026-07', '2026-08', '2026-09']);
    expect(series[2]?.expenseMinor).toBe(1200);
    expect(series[0]?.incomeMinor).toBe(0);
  });

  it('builds an inclusive custom date range and rejects invalid dates', () => {
    const range = customReportRange('2026-08-15', '2026-09-08');
    expect(range).toMatchObject({ grouping: 'day' });
    expect(new Date(range!.end).getDate()).toBe(9);
    expect(customReportRange('2026-09-10', '2026-09-08')).toBeNull();
    expect(customReportRange('2026-02-30', '2026-03-01')).toBeNull();
  });
});
