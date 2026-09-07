import { getDatabase } from './database';
import type { PreferenceRepository } from './preference-repository';
import { defaultNotificationPreferences, isValidNotificationPreferences, type NotificationPreferences } from '@/domain/preferences';

const hideFinancialValuesKey = 'hide-financial-values';
const notificationPreferencesKey = 'notification-preferences';

export const preferenceRepository: PreferenceRepository = {
  async getHideFinancialValues() {
    const database = await getDatabase();
    const row = await database.getFirstAsync<{ value: string }>('SELECT value FROM app_preferences WHERE key = ?', hideFinancialValuesKey);
    return row?.value === 'true';
  },

  async setHideFinancialValues(hidden) {
    const database = await getDatabase();
    await database.runAsync(
      'INSERT INTO app_preferences (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value',
      hideFinancialValuesKey,
      String(hidden),
    );
  },

  async getNotificationPreferences() {
    const database = await getDatabase();
    const row = await database.getFirstAsync<{ value: string }>('SELECT value FROM app_preferences WHERE key = ?', notificationPreferencesKey);
    if (!row) return defaultNotificationPreferences;
    try {
      const preferences = { ...defaultNotificationPreferences, ...JSON.parse(row.value) } as NotificationPreferences;
      return isValidNotificationPreferences(preferences) ? preferences : defaultNotificationPreferences;
    } catch {
      return defaultNotificationPreferences;
    }
  },

  async setNotificationPreferences(preferences) {
    if (!isValidNotificationPreferences(preferences)) throw new Error('Invalid notification preferences');
    const database = await getDatabase();
    await database.runAsync(
      'INSERT INTO app_preferences (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value',
      notificationPreferencesKey,
      JSON.stringify(preferences),
    );
  },
};
