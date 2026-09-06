import { useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';

import { budgetRepository } from '@/database/budget-store';
import type { MonthlyBudget } from '@/domain/budgets';
import { currentMonthRange } from '@/domain/transactions';

export function useMonthlyBudget() {
  const [budget, setBudget] = useState<MonthlyBudget | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    try {
      setError(null);
      const range = currentMonthRange();
      setBudget(await budgetRepository.getBudget(range.start, range.end));
    } catch {
      setError('ไม่สามารถโหลดงบเดือนนี้ได้');
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(useCallback(() => { void refresh(); }, [refresh]));

  return { budget, loading, error, refresh };
}
