export type NotificationPreferences = Readonly<{
  enabled: boolean;
  budgetEnabled: boolean;
  fixedCostEnabled: boolean;
  reminderHour: number;
  reminderMinute: number;
  showLockScreenDetails: boolean;
}>;

export const defaultNotificationPreferences: NotificationPreferences = {
  enabled: true,
  budgetEnabled: true,
  fixedCostEnabled: true,
  reminderHour: 9,
  reminderMinute: 0,
  showLockScreenDetails: false,
};

export function isValidNotificationPreferences(value: NotificationPreferences): boolean {
  return Number.isInteger(value.reminderHour)
    && value.reminderHour >= 0
    && value.reminderHour <= 23
    && Number.isInteger(value.reminderMinute)
    && value.reminderMinute >= 0
    && value.reminderMinute <= 59;
}
