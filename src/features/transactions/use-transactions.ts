import { useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';

import { transactionRepository } from '@/database/transaction-store';
import { currentMonthRange, type CashFlowTotals, type Transaction } from '@/domain/transactions';

export type TransactionListFilter = Readonly<{
  start: string;
  end: string;
  categoryIds?: readonly (string | null)[];
}>;

export function useTransactions(limit = 20, uncategorizedOnly = false, filter?: TransactionListFilter) {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [totals, setTotals] = useState<CashFlowTotals>({ incomeMinor: 0, expenseMinor: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    try {
      setError(null);
      const range = filter ?? currentMonthRange();
      const loaded = filter
        ? await transactionRepository.listInRange(filter.start, filter.end)
        : await transactionRepository.listRecent(limit, { uncategorizedOnly });
      const filtered = loaded.filter((transaction) => {
        if (uncategorizedOnly) return transaction.kind === 'expense' && transaction.categoryId === null;
        if (!filter?.categoryIds) return true;
        return transaction.kind === 'expense' && filter.categoryIds.includes(transaction.categoryId);
      });
      const currentTotals = filter || uncategorizedOnly
        ? filtered.reduce<CashFlowTotals>((totals, transaction) => ({
            incomeMinor: totals.incomeMinor + (transaction.kind === 'income' ? transaction.amount.amountMinor : 0),
            expenseMinor: totals.expenseMinor + (transaction.kind === 'expense' ? transaction.amount.amountMinor : 0),
          }), { incomeMinor: 0, expenseMinor: 0 })
        : await transactionRepository.getTotals(range.start, range.end);
      setTransactions(filtered);
      setTotals(currentTotals);
    } catch {
      setError('ไม่สามารถโหลดรายการได้');
    } finally {
      setLoading(false);
    }
  }, [filter, limit, uncategorizedOnly]);

  useFocusEffect(
    useCallback(() => {
      void refresh();
    }, [refresh]),
  );

  return { transactions, totals, loading, error, refresh };
}
