import { describe, expect, it } from 'vitest';

import { validateWalletTransfer } from './transfers';

describe('wallet transfer', () => {
  it('accepts a positive transfer between different wallets', () => {
    expect(validateWalletTransfer({ fromWalletId: 'cash', toWalletId: 'bank', amountMinor: 50000 })).toBeNull();
  });

  it('rejects the same wallet and invalid money', () => {
    expect(validateWalletTransfer({ fromWalletId: 'cash', toWalletId: 'cash', amountMinor: 50000 })).toContain('ใบเดียวกัน');
    expect(validateWalletTransfer({ fromWalletId: 'cash', toWalletId: 'bank', amountMinor: 0 })).toContain('มากกว่า 0');
  });
});
