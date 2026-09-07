import { describe, expect, it } from 'vitest';

import { canCreateSlipExpense, localDateInput, parseLocalDateInput } from './bank-slips';

describe('bank slip import', () => {
  it('requires a ready unique draft with amount and wallet', () => {
    const valid = { status: 'ready' as const, fingerprint: 'abc', amountMinor: 11_500, walletId: 'wallet-1', occurredAt: '2026-09-07T05:00:00.000Z' };
    expect(canCreateSlipExpense(valid)).toBe(true);
    expect(canCreateSlipExpense({ ...valid, status: 'duplicate' })).toBe(false);
    expect(canCreateSlipExpense({ ...valid, fingerprint: null })).toBe(false);
    expect(canCreateSlipExpense({ ...valid, amountMinor: 0 })).toBe(false);
    expect(canCreateSlipExpense({ ...valid, walletId: null })).toBe(false);
    expect(canCreateSlipExpense({ ...valid, occurredAt: null })).toBe(false);
  });

  it('validates local calendar dates without rolling invalid days forward', () => {
    expect(localDateInput(new Date(2026, 8, 7))).toBe('2026-09-07');
    expect(parseLocalDateInput('2026-09-07')).toContain('2026-09-07');
    expect(parseLocalDateInput('2026-02-30')).toBeNull();
    expect(parseLocalDateInput('07/09/2026')).toBeNull();
  });
});
