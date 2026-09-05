export type CurrencyCode = 'THB';

export type Money = Readonly<{
  amountMinor: number;
  currency: CurrencyCode;
}>;

export type Expense = Readonly<{
  id: string;
  walletId: string;
  categoryId: string | null;
  amount: Money;
  occurredAt: string;
  source: 'manual' | 'bank-slip';
}>;

