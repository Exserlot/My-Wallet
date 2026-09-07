import { useFocusEffect } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';

import { transactionRepository } from '@/database/transaction-store';
import { reportRange, type ReportPeriod, type ReportRange } from '@/domain/reports';
import type { Transaction } from '@/domain/transactions';

export function useReportData(period: ReportPeriod, rangeOverride?: ReportRange | null) {
  const range = useMemo(() => rangeOverride ?? reportRange(period), [period, rangeOverride]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      setTransactions(await transactionRepository.listInRange(range.start, range.end));
    } catch {
      setError('ไม่สามารถโหลดข้อมูลรายงานได้');
    } finally {
      setLoading(false);
    }
  }, [range.end, range.start]);

  useFocusEffect(useCallback(() => { void refresh(); }, [refresh]));

  return { transactions, range, loading, error, refresh };
}
