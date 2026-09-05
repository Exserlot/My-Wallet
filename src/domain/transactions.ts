export type CurrencyCode = 'THB';

export const cashFlowKinds = ['income', 'expense'] as const;

export type CashFlowKind = (typeof cashFlowKinds)[number];

export type TransactionKind = 'opening-balance' | CashFlowKind;

export type Money = Readonly<{
  amountMinor: number;
  currency: CurrencyCode;
}>;

export type Transaction = Readonly<{
  id: string;
  walletId: string;
  walletName: string;
  kind: TransactionKind;
  categoryId: string | null;
  amount: Money;
  occurredAt: string;
  note: string | null;
  source: 'manual' | 'bank-slip';
}>;

export type CashFlowTotals = Readonly<{
  incomeMinor: number;
  expenseMinor: number;
}>;

export function signedAmountMinor(kind: TransactionKind, amountMinor: number): number {
  return kind === 'expense' ? -amountMinor : amountMinor;
}

export function isValidCashFlowAmount(amountMinor: number): boolean {
  return Number.isSafeInteger(amountMinor) && amountMinor > 0;
}

export function currentMonthRange(now = new Date()): { start: string; end: string } {
  const start = new Date(now.getFullYear(), now.getMonth(), 1);
  const end = new Date(now.getFullYear(), now.getMonth() + 1, 1);
  return { start: start.toISOString(), end: end.toISOString() };
}
