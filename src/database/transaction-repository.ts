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
  listRecent(limit?: number): Promise<Transaction[]>;
  getTotals(start: string, end: string): Promise<CashFlowTotals>;
}

