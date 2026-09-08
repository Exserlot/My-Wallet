import { describe, expect, it } from 'vitest';

import { categoryIdForCashFlow, currentMonthRange, filterTransactions, isValidCashFlowAmount, localDateInput, occurredAtFromLocalDateInput, relativeLocalDateInput, signedAmountMinor, type Transaction } from './transactions';

describe('signedAmountMinor', () => {
  it('adds income and opening balance', () => {
    expect(signedAmountMinor('income', 50000)).toBe(50000);
    expect(signedAmountMinor('opening-balance', 50000)).toBe(50000);
  });

  it('subtracts expense', () => {
    expect(signedAmountMinor('expense', 12500)).toBe(-12500);
  });
});

describe('currentMonthRange', () => {
  it('returns an exclusive end boundary for the following month', () => {
    const result = currentMonthRange(new Date(2026, 8, 5, 12));
    expect(new Date(result.start).getMonth()).toBe(8);
    expect(new Date(result.start).getDate()).toBe(1);
    expect(new Date(result.end).getMonth()).toBe(9);
    expect(new Date(result.end).getDate()).toBe(1);
  });
});

describe('isValidCashFlowAmount', () => {
  it('accepts positive integer minor units only', () => {
    expect(isValidCashFlowAmount(1)).toBe(true);
    expect(isValidCashFlowAmount(0)).toBe(false);
    expect(isValidCashFlowAmount(-1)).toBe(false);
    expect(isValidCashFlowAmount(1.5)).toBe(false);
  });
});

describe('categoryIdForCashFlow', () => {
  it('keeps categories for expenses and clears them for income', () => {
    expect(categoryIdForCashFlow('expense', 'food')).toBe('food');
    expect(categoryIdForCashFlow('income', 'food')).toBeNull();
  });
});

describe('transaction dates', () => {
  it('formats today and yesterday for date inputs', () => {
    const now = new Date(2026, 8, 8, 15, 30);
    expect(localDateInput(now)).toBe('2026-09-08');
    expect(relativeLocalDateInput(-1, now)).toBe('2026-09-07');
  });

  it('keeps the original time and rejects impossible dates', () => {
    const occurredAt = occurredAtFromLocalDateInput('2026-02-28', new Date(2026, 8, 8, 15, 30));
    expect(occurredAt).not.toBeNull();
    const date = new Date(occurredAt!);
    expect([date.getFullYear(), date.getMonth(), date.getDate(), date.getHours(), date.getMinutes()]).toEqual([2026, 1, 28, 15, 30]);
    expect(occurredAtFromLocalDateInput('2026-02-30')).toBeNull();
    expect(occurredAtFromLocalDateInput('08/09/2026')).toBeNull();
  });
});

describe('filterTransactions', () => {
  const transaction = (id: string, kind: 'income' | 'expense', note: string | null, walletName: string, categoryName: string | null): Transaction => ({
    id, walletId: 'wallet', walletName, kind, categoryId: null, categoryName,
    amount: { amountMinor: 100, currency: 'THB' }, occurredAt: '2026-09-08', note, source: 'manual',
  });
  const values = [transaction('1', 'expense', 'ข้าวกลางวัน', 'เงินสด', 'อาหาร'), transaction('2', 'income', 'เงินเดือน', 'ธนาคาร', null)];

  it('searches notes, wallets, and categories without case sensitivity', () => {
    expect(filterTransactions(values, { query: 'อาหาร' }).map((item) => item.id)).toEqual(['1']);
    expect(filterTransactions(values, { query: 'ธนาคาร' }).map((item) => item.id)).toEqual(['2']);
  });

  it('combines text and cash flow kind filters', () => {
    expect(filterTransactions(values, { kind: 'expense', query: 'เงิน' }).map((item) => item.id)).toEqual(['1']);
    expect(filterTransactions(values, { kind: 'income', query: 'เงิน' }).map((item) => item.id)).toEqual(['2']);
  });
});
