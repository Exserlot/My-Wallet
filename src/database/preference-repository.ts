import type { NotificationPreferences } from '@/domain/preferences';

export interface PreferenceRepository {
  getHideFinancialValues(): Promise<boolean>;
  setHideFinancialValues(hidden: boolean): Promise<void>;
  getNotificationPreferences(): Promise<NotificationPreferences>;
  setNotificationPreferences(preferences: NotificationPreferences): Promise<void>;
}
