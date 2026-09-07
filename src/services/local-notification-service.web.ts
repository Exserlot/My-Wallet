import type { FixedCostOccurrence, FixedCostSchedule } from '@/domain/fixed-costs';

export const localNotificationService = {
  async getPermissionState() { return 'unsupported' as const; },
  async requestPermission() { return 'unsupported' as const; },
  async syncFixedCostReminders(_schedules: readonly FixedCostSchedule[], _occurrences: readonly FixedCostOccurrence[]) {},
};
