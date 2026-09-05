import { useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';

import { transactionRepository } from '@/database/transaction-store';
import { currentMonthRange, type CashFlowTotals, type Transaction } from '@/domain/transactions';

export function useTransactions(limit = 20, uncategorizedOnly = false) {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [totals, setTotals] = useState<CashFlowTotals>({ incomeMinor: 0, expenseMinor: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    try {
      setError(null);
      const range = currentMonthRange();
      const [recent, currentTotals] = await Promise.all([
        transactionRepository.listRecent(limit, { uncategorizedOnly }),
        transactionRepository.getTotals(range.start, range.end),
      ]);
      setTransactions(recent);
      setTotals(currentTotals);
    } catch {
      setError('ไม่สามารถโหลดรายการได้');
    } finally {
      setLoading(false);
    }
  }, [limit, uncategorizedOnly]);

  useFocusEffect(
    useCallback(() => {
      void refresh();
    }, [refresh]),
  );

  return { transactions, totals, loading, error, refresh };
}
