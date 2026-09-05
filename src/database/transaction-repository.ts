import type { CashFlowKind, CashFlowTotals, Transaction } from '@/domain/transactions';

export type CreateTransactionInput = Readonly<{
  walletId: string;
  kind: CashFlowKind;
  amountMinor: number;
  categoryId: string | null;
  note: string | null;
  occurredAt: string;
}>;

export interface TransactionRepository {
  createTransaction(input: CreateTransactionInput): Promise<Transaction>;
  getTransaction(id: string): Promise<Transaction | null>;
  listRecent(limit?: number, options?: { uncategorizedOnly?: boolean }): Promise<Transaction[]>;
  updateExpenseCategory(id: string, categoryId: string | null): Promise<Transaction>;
  getTotals(start: string, end: string): Promise<CashFlowTotals>;
}
