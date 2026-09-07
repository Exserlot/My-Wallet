import type { FixedCostOccurrence, FixedCostSchedule } from '@/domain/fixed-costs';
import type { NotificationPreferences } from '@/domain/preferences';
import type { BudgetThresholdTarget } from '@/domain/budget-thresholds';

export type NotificationPermissionState = 'granted' | 'denied' | 'undetermined' | 'unsupported';

export declare const localNotificationService: {
  getPermissionState(): Promise<NotificationPermissionState>;
  requestPermission(): Promise<NotificationPermissionState>;
  syncFixedCostReminders(schedules: readonly FixedCostSchedule[], occurrences: readonly FixedCostOccurrence[], preferences?: NotificationPreferences): Promise<void>;
  showBudgetExceeded(targets: readonly BudgetThresholdTarget[], preferences?: NotificationPreferences): Promise<void>;
};
