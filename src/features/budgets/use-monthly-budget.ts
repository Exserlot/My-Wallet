import { useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';

import { budgetRepository } from '@/database/budget-store';
import { preferenceRepository } from '@/database/preference-store';
import { updateBudgetThresholdState } from '@/domain/budget-thresholds';
import type { MonthlyBudget } from '@/domain/budgets';
import { currentMonthRange } from '@/domain/transactions';
import { localNotificationService } from '@/services/local-notification-service';

export function useMonthlyBudget() {
  const [budget, setBudget] = useState<MonthlyBudget | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    try {
      setError(null);
      const range = currentMonthRange();
      const nextBudget = await budgetRepository.getBudget(range.start, range.end);
      setBudget(nextBudget);
      if (nextBudget) {
        void Promise.all([
          preferenceRepository.getBudgetThresholdState(),
          preferenceRepository.getNotificationPreferences(),
        ]).then(async ([previous, preferences]) => {
          const transition = updateBudgetThresholdState(previous, nextBudget);
          await preferenceRepository.setBudgetThresholdState(transition.next);
          await localNotificationService.showBudgetExceeded(transition.newlyUrgent, preferences);
        }).catch(() => undefined);
      }
    } catch {
      setError('ไม่สามารถโหลดงบเดือนนี้ได้');
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(useCallback(() => { void refresh(); }, [refresh]));

  return { budget, loading, error, refresh };
}
