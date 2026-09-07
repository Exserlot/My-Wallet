import type { PreferenceRepository } from './preference-repository';
import { defaultNotificationPreferences, isValidNotificationPreferences, type NotificationPreferences } from '@/domain/preferences';
import type { BudgetThresholdState } from '@/domain/budget-thresholds';

const hideFinancialValuesKey = 'my-wallet.preference.hide-financial-values';
const notificationPreferencesKey = 'my-wallet.preference.notifications';
const budgetThresholdStateKey = 'my-wallet.preference.budget-thresholds';

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

  async getBudgetThresholdState() {
    if (typeof localStorage === 'undefined') return {};
    try {
      return JSON.parse(localStorage.getItem(budgetThresholdStateKey) ?? '{}') as BudgetThresholdState;
    } catch {
      return {};
    }
  },

  async setBudgetThresholdState(state) {
    if (typeof localStorage === 'undefined') return;
    localStorage.setItem(budgetThresholdStateKey, JSON.stringify(state));
  },
};
