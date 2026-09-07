import type { FixedCostOccurrence, FixedCostSchedule } from '@/domain/fixed-costs';
import type { NotificationPreferences } from '@/domain/preferences';
import type { BudgetThresholdTarget } from '@/domain/budget-thresholds';

export const localNotificationService = {
  async getPermissionState() { return 'unsupported' as const; },
  async requestPermission() { return 'unsupported' as const; },
  async syncFixedCostReminders(_schedules: readonly FixedCostSchedule[], _occurrences: readonly FixedCostOccurrence[], _preferences?: NotificationPreferences) {},
  async showBudgetExceeded(_targets: readonly BudgetThresholdTarget[], _preferences?: NotificationPreferences) {},
};
