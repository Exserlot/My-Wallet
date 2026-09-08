import { describe, expect, it } from 'vitest';

import type { Transaction } from '@/domain/transactions';
import { csvExportFilename, transactionsToCsv } from './transaction-csv';

describe('transaction CSV export', () => {
  it('exports stable columns, Thai text, decimal money, and escaped commas', () => {
    const transaction: Transaction = {
      id: '1', walletId: 'wallet', walletName: 'บัญชี, หลัก', kind: 'expense', categoryId: 'food', categoryName: 'อาหาร',
      amount: { amountMinor: 12550, currency: 'THB' }, occurredAt: '2026-09-09T10:00:00.000Z', note: 'ข้าว "พิเศษ"', source: 'manual',
    };
    const csv = transactionsToCsv([transaction]);
    expect(csv.split('\r\n')[0]).toBe('occurred_at,kind,amount,currency,wallet,category,note,source');
    expect(csv).toContain('125.50,THB,"บัญชี, หลัก",อาหาร,"ข้าว ""พิเศษ""",manual');
  });

  it('neutralizes spreadsheet formulas in user-authored text', () => {
    const transaction: Transaction = {
      id: '1', walletId: 'wallet', walletName: '=IMPORTDATA("x")', kind: 'income', categoryId: null, categoryName: null,
      amount: { amountMinor: 100, currency: 'THB' }, occurredAt: '2026-09-09', note: '+SUM(1,1)', source: 'manual',
    };
    expect(transactionsToCsv([transaction])).toContain("'=IMPORTDATA");
    expect(transactionsToCsv([transaction])).toContain("\"'+SUM(1,1)\"");
  });

  it('uses an understandable filename for the selected range', () => {
    expect(csvExportFilename('2026-09-01T00:00:00.000Z', '2026-10-01T00:00:00.000Z')).toBe('my-wallet-2026-09-01-to-2026-10-01.csv');
  });
});
