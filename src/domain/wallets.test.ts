import { describe, expect, it } from 'vitest';

import { parseOpeningBalance, validateWalletName } from './wallets';

describe('parseOpeningBalance', () => {
  it.each([
    ['0', 0],
    ['1,234.50', 123450],
    ['99.9', 9990],
    ['๑๒๓.๔๕', 12345],
  ])('converts %s to minor units', (value, expected) => {
    expect(parseOpeningBalance(value)).toBe(expected);
  });

  it.each(['', '-1', '12.345', 'abc'])('rejects invalid amount %s', (value) => {
    expect(parseOpeningBalance(value)).toBeNull();
  });
});

describe('validateWalletName', () => {
  it('rejects a blank name', () => {
    expect(validateWalletName('   ')).toBe('กรุณาตั้งชื่อกระเป๋า');
  });

  it('accepts a trimmed name with at most 60 characters', () => {
    expect(validateWalletName(' K PLUS ')).toBeNull();
  });
});

