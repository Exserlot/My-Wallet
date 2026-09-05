import { randomUUID } from 'expo-crypto';

import { categoryIdForCashFlow, isValidCashFlowAmount, type Transaction } from '@/domain/transactions';

import type { CreateTransactionInput, TransactionRepository } from './transaction-repository';
import { readWebDatabase, writeWebDatabase, type WebTransaction } from './web-database';

function toTransaction(transaction: WebTransaction): Transaction {
  const database = readWebDatabase();
  const wallet = database.wallets.find((item) => item.id === transaction.walletId);
  if (!wallet) throw new Error('Wallet not found');
  return {
    id: transaction.id,
    walletId: transaction.walletId,
    walletName: wallet.name,
    kind: transaction.kind,
    categoryId: transaction.categoryId,
    categoryName: database.expenseCategories.find((category) => category.id === transaction.categoryId)?.name ?? null,
    amount: { amountMinor: transaction.amountMinor, currency: 'THB' },
    occurredAt: transaction.occurredAt,
    note: transaction.note,
    source: transaction.source,
  };
}

export const transactionRepository: TransactionRepository = {
  async createTransaction(input: CreateTransactionInput) {
    if (!isValidCashFlowAmount(input.amountMinor)) throw new Error('Amount must be positive minor units');
    const database = readWebDatabase();
    if (!database.wallets.some((wallet) => wallet.id === input.walletId)) {
      throw new Error('Wallet not found');
    }
    const categoryId = categoryIdForCashFlow(input.kind, input.categoryId);
    if (categoryId && !database.expenseCategories.some((category) => category.id === categoryId && category.archivedAt === null)) {
      throw new Error('Expense category not found');
    }
    const transaction: WebTransaction = {
      id: randomUUID(),
      walletId: input.walletId,
      kind: input.kind,
      amountMinor: input.amountMinor,
      occurredAt: input.occurredAt,
      createdAt: new Date().toISOString(),
      categoryId,
      note: input.note?.trim() || null,
      source: 'manual',
    };
    writeWebDatabase({ ...database, transactions: [...database.transactions, transaction] });
    return toTransaction(transaction);
  },

  async getTransaction(id) {
    const transaction = readWebDatabase().transactions.find((item) => item.id === id);
    return transaction ? toTransaction(transaction) : null;
  },

  async listRecent(limit = 20, options) {
    const database = readWebDatabase();
    return database.transactions
      .filter((transaction) => transaction.kind === 'income' || transaction.kind === 'expense')
      .filter((transaction) => !options?.uncategorizedOnly || (transaction.kind === 'expense' && transaction.categoryId === null))
      .sort((left, right) => right.occurredAt.localeCompare(left.occurredAt) || right.createdAt.localeCompare(left.createdAt))
      .slice(0, Math.max(1, Math.min(limit, 100)))
      .map(toTransaction);
  },

  async updateExpenseCategory(id, categoryId) {
    const database = readWebDatabase();
    if (categoryId && !database.expenseCategories.some((category) => category.id === categoryId && category.archivedAt === null)) {
      throw new Error('Expense category not found');
    }
    const target = database.transactions.find((transaction) => transaction.id === id);
    if (!target || target.kind !== 'expense') throw new Error('Expense transaction not found');
    const updated = { ...target, categoryId };
    writeWebDatabase({
      ...database,
      transactions: database.transactions.map((transaction) => transaction.id === id ? updated : transaction),
    });
    return toTransaction(updated);
  },

  async getTotals(start: string, end: string) {
    const totals = { incomeMinor: 0, expenseMinor: 0 };
    readWebDatabase().transactions.forEach((transaction) => {
      if (transaction.occurredAt < start || transaction.occurredAt >= end) return;
      if (transaction.kind === 'income') totals.incomeMinor += transaction.amountMinor;
      if (transaction.kind === 'expense') totals.expenseMinor += transaction.amountMinor;
    });
    return totals;
  },
};
