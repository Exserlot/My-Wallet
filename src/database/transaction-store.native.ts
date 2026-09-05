import { randomUUID } from 'expo-crypto';

import { categoryIdForCashFlow, isValidCashFlowAmount, type CashFlowKind, type Transaction, type TransactionKind } from '@/domain/transactions';

import { getDatabase } from './database';
import type { CreateTransactionInput, TransactionRepository } from './transaction-repository';

type TransactionRow = {
  id: string;
  wallet_id: string;
  wallet_name: string;
  kind: 'OPENING_BALANCE' | 'INCOME' | 'EXPENSE';
  amount_minor: number;
  currency: 'THB';
  occurred_at: string;
  category_id: string | null;
  category_name: string | null;
  note: string | null;
  source: 'manual' | 'bank-slip';
};

const databaseKind: Record<CashFlowKind, 'INCOME' | 'EXPENSE'> = {
  income: 'INCOME',
  expense: 'EXPENSE',
};

const domainKind: Record<TransactionRow['kind'], TransactionKind> = {
  OPENING_BALANCE: 'opening-balance',
  INCOME: 'income',
  EXPENSE: 'expense',
};

function toTransaction(row: TransactionRow): Transaction {
  return {
    id: row.id,
    walletId: row.wallet_id,
    walletName: row.wallet_name,
    kind: domainKind[row.kind],
    categoryId: row.category_id,
    categoryName: row.category_name,
    amount: { amountMinor: row.amount_minor, currency: row.currency },
    occurredAt: row.occurred_at,
    note: row.note,
    source: row.source,
  };
}

async function findTransaction(id: string) {
  const database = await getDatabase();
  const row = await database.getFirstAsync<TransactionRow>(
    `SELECT
      transactions.id,
      transactions.wallet_id,
      wallets.name AS wallet_name,
      transactions.kind,
      transactions.amount_minor,
      transactions.currency,
      transactions.occurred_at,
      transactions.category_id,
      expense_categories.name AS category_name,
      transactions.note,
      transactions.source
    FROM transactions
    JOIN wallets ON wallets.id = transactions.wallet_id
    LEFT JOIN expense_categories ON expense_categories.id = transactions.category_id
    WHERE transactions.id = ?`,
    id,
  );
  return row ? toTransaction(row) : null;
}

export const transactionRepository: TransactionRepository = {
  async createTransaction(input: CreateTransactionInput) {
    if (!isValidCashFlowAmount(input.amountMinor)) throw new Error('Amount must be positive minor units');
    const database = await getDatabase();
    const categoryId = categoryIdForCashFlow(input.kind, input.categoryId);
    if (categoryId) {
      const category = await database.getFirstAsync<{ id: string }>(
        'SELECT id FROM expense_categories WHERE id = ? AND archived_at IS NULL',
        categoryId,
      );
      if (!category) throw new Error('Expense category not found');
    }
    const id = randomUUID();
    await database.runAsync(
      `INSERT INTO transactions
        (id, wallet_id, kind, amount_minor, currency, occurred_at, created_at, category_id, note, source)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      id,
      input.walletId,
      databaseKind[input.kind],
      input.amountMinor,
      'THB',
      input.occurredAt,
      new Date().toISOString(),
      categoryId,
      input.note?.trim() || null,
      'manual',
    );
    const created = await findTransaction(id);
    if (!created) throw new Error('Transaction was not found after insert');
    return created;
  },

  getTransaction: findTransaction,

  async listRecent(limit = 20, options) {
    const database = await getDatabase();
    const rows = await database.getAllAsync<TransactionRow>(
      `SELECT
        transactions.id,
        transactions.wallet_id,
        wallets.name AS wallet_name,
        transactions.kind,
        transactions.amount_minor,
        transactions.currency,
        transactions.occurred_at,
        transactions.category_id,
        expense_categories.name AS category_name,
        transactions.note,
        transactions.source
      FROM transactions
      JOIN wallets ON wallets.id = transactions.wallet_id
      LEFT JOIN expense_categories ON expense_categories.id = transactions.category_id
      WHERE transactions.kind IN ('INCOME', 'EXPENSE')
        ${options?.uncategorizedOnly ? "AND transactions.kind = 'EXPENSE' AND transactions.category_id IS NULL" : ''}
      ORDER BY transactions.occurred_at DESC, transactions.created_at DESC
      LIMIT ?`,
      Math.max(1, Math.min(limit, 100)),
    );
    return rows.map(toTransaction);
  },

  async updateExpenseCategory(id, categoryId) {
    const database = await getDatabase();
    if (categoryId) {
      const category = await database.getFirstAsync<{ id: string }>(
        'SELECT id FROM expense_categories WHERE id = ? AND archived_at IS NULL',
        categoryId,
      );
      if (!category) throw new Error('Expense category not found');
    }
    const result = await database.runAsync(
      "UPDATE transactions SET category_id = ? WHERE id = ? AND kind = 'EXPENSE'",
      categoryId,
      id,
    );
    if (result.changes !== 1) throw new Error('Expense transaction not found');
    const updated = await findTransaction(id);
    if (!updated) throw new Error('Transaction was not found after update');
    return updated;
  },

  async getTotals(start: string, end: string) {
    const database = await getDatabase();
    const row = await database.getFirstAsync<{ income_minor: number; expense_minor: number }>(
      `SELECT
        COALESCE(SUM(CASE WHEN kind = 'INCOME' THEN amount_minor ELSE 0 END), 0) AS income_minor,
        COALESCE(SUM(CASE WHEN kind = 'EXPENSE' THEN amount_minor ELSE 0 END), 0) AS expense_minor
      FROM transactions
      WHERE occurred_at >= ? AND occurred_at < ?`,
      start,
      end,
    );
    return { incomeMinor: row?.income_minor ?? 0, expenseMinor: row?.expense_minor ?? 0 };
  },
};
