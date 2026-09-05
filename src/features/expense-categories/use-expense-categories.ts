import { useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';

import { expenseCategoryRepository } from '@/database/expense-category-store';
import type { ExpenseCategory } from '@/domain/expense-categories';

export function useExpenseCategories(includeArchived = false) {
  const [categories, setCategories] = useState<ExpenseCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    try {
      setError(null);
      setCategories(await expenseCategoryRepository.listCategories({ includeArchived }));
    } catch {
      setError('ไม่สามารถโหลดหมวดรายจ่ายได้');
    } finally {
      setLoading(false);
    }
  }, [includeArchived]);

  useFocusEffect(useCallback(() => { void refresh(); }, [refresh]));

  return { categories, loading, error, refresh };
}
