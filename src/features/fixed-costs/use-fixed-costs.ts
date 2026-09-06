import { useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';

import { fixedCostRepository } from '@/database/fixed-cost-store';
import type { FixedCostOccurrence, FixedCostSchedule } from '@/domain/fixed-costs';

function occurrenceRange() {
  const now = new Date();
  return {
    start: new Date(now.getFullYear(), now.getMonth(), 1).toISOString(),
    end: new Date(now.getFullYear(), now.getMonth() + 4, 1).toISOString(),
  };
}

export function useFixedCosts(includeArchived = false) {
  const [schedules, setSchedules] = useState<FixedCostSchedule[]>([]);
  const [occurrences, setOccurrences] = useState<FixedCostOccurrence[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    try {
      setError(null);
      const range = occurrenceRange();
      const [nextSchedules, nextOccurrences] = await Promise.all([
        fixedCostRepository.listSchedules({ includeArchived }),
        fixedCostRepository.listOccurrences(range.start, range.end),
      ]);
      setSchedules(nextSchedules);
      setOccurrences(nextOccurrences);
    } catch {
      setError('ไม่สามารถโหลด Fixed Cost ได้');
    } finally {
      setLoading(false);
    }
  }, [includeArchived]);

  useFocusEffect(useCallback(() => { void refresh(); }, [refresh]));

  return { schedules, occurrences, loading, error, refresh };
}
