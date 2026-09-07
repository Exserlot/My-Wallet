import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

import type { FixedCostOccurrence, FixedCostSchedule } from '@/domain/fixed-costs';
import { buildFixedCostReminderGroups, type FixedCostReminderPhase } from '@/domain/notification-reminders';

const channelId = 'fixed-cost-reminders';
const owner = 'my-wallet-fixed-cost';

const phaseTitle: Record<FixedCostReminderPhase, string> = {
  'three-days-before': 'Fixed Cost ใกล้ครบกำหนด',
  due: 'Fixed Cost ครบกำหนดวันนี้',
  overdue: 'Fixed Cost เกินกำหนด',
};

Notifications.setNotificationHandler({
  handleNotification: async () => ({ shouldPlaySound: false, shouldSetBadge: false, shouldShowBanner: true, shouldShowList: true }),
});

async function prepareAndroidChannel() {
  if (Platform.OS !== 'android') return;
  await Notifications.setNotificationChannelAsync(channelId, {
    name: 'เตือน Fixed Cost',
    importance: Notifications.AndroidImportance.DEFAULT,
  });
}

function permissionState(status: Notifications.PermissionStatus) {
  if (status === Notifications.PermissionStatus.GRANTED) return 'granted' as const;
  if (status === Notifications.PermissionStatus.DENIED) return 'denied' as const;
  return 'undetermined' as const;
}

export const localNotificationService = {
  async getPermissionState() {
    await prepareAndroidChannel();
    return permissionState((await Notifications.getPermissionsAsync()).status);
  },

  async requestPermission() {
    await prepareAndroidChannel();
    return permissionState((await Notifications.requestPermissionsAsync()).status);
  },

  async syncFixedCostReminders(schedules: readonly FixedCostSchedule[], occurrences: readonly FixedCostOccurrence[]) {
    if (await this.getPermissionState() !== 'granted') return;
    const existing = await Notifications.getAllScheduledNotificationsAsync();
    await Promise.all(existing
      .filter((notification) => notification.content.data?.owner === owner)
      .map((notification) => Notifications.cancelScheduledNotificationAsync(notification.identifier)));

    for (const group of buildFixedCostReminderGroups({ schedules, occurrences })) {
      const itemCount = group.occurrenceIds.length;
      await Notifications.scheduleNotificationAsync({
        identifier: `${owner}:${group.id}`,
        content: {
          title: phaseTitle[group.phase],
          body: `มี ${itemCount} รายการที่ต้องตรวจสอบ เปิดแอปเพื่อดูรายละเอียด`,
          data: { owner, href: itemCount === 1 ? `/planning/fixed-costs/${group.occurrenceIds[0]}` : '/planning/fixed-costs' },
        },
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.DATE,
          date: new Date(group.triggerAt),
          ...(Platform.OS === 'android' ? { channelId } : {}),
        },
      });
    }
  },
};
