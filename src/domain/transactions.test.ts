import { describe, expect, it } from 'vitest';

import { currentMonthRange, isValidCashFlowAmount, signedAmountMinor } from './transactions';

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
