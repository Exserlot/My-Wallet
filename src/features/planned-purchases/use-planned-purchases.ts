import { useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';

import { plannedPurchaseRepository } from '@/database/planned-purchase-store';
import type { PlannedPurchase } from '@/domain/planned-purchases';

export function usePlannedPurchases(includeCompleted = false) {
  const [items, setItems] = useState<PlannedPurchase[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    try {
      setError(null);
      setItems(await plannedPurchaseRepository.list({ includeCompleted }));
    } catch {
      setError('ไม่สามารถโหลดของที่ต้องซื้อได้');
    } finally {
      setLoading(false);
    }
  }, [includeCompleted]);

  useFocusEffect(useCallback(() => { void refresh(); }, [refresh]));

  return { items, loading, error, refresh };
}
