import type { FixedCostOccurrence, FixedCostSchedule } from '@/domain/fixed-costs';

export type NotificationPermissionState = 'granted' | 'denied' | 'undetermined' | 'unsupported';

export declare const localNotificationService: {
  getPermissionState(): Promise<NotificationPermissionState>;
  requestPermission(): Promise<NotificationPermissionState>;
  syncFixedCostReminders(schedules: readonly FixedCostSchedule[], occurrences: readonly FixedCostOccurrence[]): Promise<void>;
};
