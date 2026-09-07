import { useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';

import { preferenceRepository } from '@/database/preference-store';
import { defaultNotificationPreferences, type NotificationPreferences } from '@/domain/preferences';

export function useNotificationPreferences() {
  const [preferences, setPreferencesState] = useState<NotificationPreferences>(defaultNotificationPreferences);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    try {
      setError(null);
      setPreferencesState(await preferenceRepository.getNotificationPreferences());
    } catch {
      setError('ไม่สามารถโหลดการตั้งค่าแจ้งเตือนได้');
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(useCallback(() => { void refresh(); }, [refresh]));

  const save = useCallback(async (next: NotificationPreferences) => {
    setPreferencesState(next);
    try {
      setError(null);
      await preferenceRepository.setNotificationPreferences(next);
    } catch {
      setError('บันทึกการตั้งค่าไม่สำเร็จ');
    }
  }, []);

  return { preferences, loading, error, save, refresh };
}
