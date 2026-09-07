import type { PreferenceRepository } from './preference-repository';
import { defaultNotificationPreferences, isValidNotificationPreferences, type NotificationPreferences } from '@/domain/preferences';

const hideFinancialValuesKey = 'my-wallet.preference.hide-financial-values';
const notificationPreferencesKey = 'my-wallet.preference.notifications';

export const preferenceRepository: PreferenceRepository = {
  async getHideFinancialValues() {
    if (typeof localStorage === 'undefined') return false;
    return localStorage.getItem(hideFinancialValuesKey) === 'true';
  },

  async setHideFinancialValues(hidden) {
    if (typeof localStorage === 'undefined') return;
    localStorage.setItem(hideFinancialValuesKey, String(hidden));
  },

  async getNotificationPreferences() {
    if (typeof localStorage === 'undefined') return defaultNotificationPreferences;
    const value = localStorage.getItem(notificationPreferencesKey);
    if (!value) return defaultNotificationPreferences;
    try {
      const preferences = { ...defaultNotificationPreferences, ...JSON.parse(value) } as NotificationPreferences;
      return isValidNotificationPreferences(preferences) ? preferences : defaultNotificationPreferences;
    } catch {
      return defaultNotificationPreferences;
    }
  },

  async setNotificationPreferences(preferences) {
    if (!isValidNotificationPreferences(preferences)) throw new Error('Invalid notification preferences');
    if (typeof localStorage === 'undefined') return;
    localStorage.setItem(notificationPreferencesKey, JSON.stringify(preferences));
  },
};
