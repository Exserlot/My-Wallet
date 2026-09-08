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
  categoryName: string | null;
  amount: Money;
  occurredAt: string;
  note: string | null;
  source: 'manual' | 'bank-slip';
  kindLocked?: boolean;
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

export function categoryIdForCashFlow(kind: CashFlowKind, categoryId: string | null): string | null {
  return kind === 'expense' ? categoryId : null;
}

export function currentMonthRange(now = new Date()): { start: string; end: string } {
  const start = new Date(now.getFullYear(), now.getMonth(), 1);
  const end = new Date(now.getFullYear(), now.getMonth() + 1, 1);
  return { start: start.toISOString(), end: end.toISOString() };
}

export function localDateInput(value: Date | string = new Date()): string {
  const date = typeof value === 'string' ? new Date(value) : value;
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function relativeLocalDateInput(days: number, now = new Date()): string {
  return localDateInput(new Date(now.getFullYear(), now.getMonth(), now.getDate() + days));
}

export function occurredAtFromLocalDateInput(value: string, timeSource: Date | string = new Date()): string | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value.trim());
  if (!match) return null;
  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const source = typeof timeSource === 'string' ? new Date(timeSource) : timeSource;
  const date = new Date(year, month - 1, day, source.getHours(), source.getMinutes(), source.getSeconds(), source.getMilliseconds());
  if (date.getFullYear() !== year || date.getMonth() !== month - 1 || date.getDate() !== day) return null;
  return date.toISOString();
}
