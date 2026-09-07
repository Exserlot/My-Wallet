import type { NotificationPreferences } from '@/domain/preferences';
import type { BudgetThresholdState } from '@/domain/budget-thresholds';

export interface PreferenceRepository {
  getHideFinancialValues(): Promise<boolean>;
  setHideFinancialValues(hidden: boolean): Promise<void>;
  getNotificationPreferences(): Promise<NotificationPreferences>;
  setNotificationPreferences(preferences: NotificationPreferences): Promise<void>;
  getBudgetThresholdState(): Promise<BudgetThresholdState>;
  setBudgetThresholdState(state: BudgetThresholdState): Promise<void>;
}
