import * as Notifications from 'expo-notifications';
import { router, type Href } from 'expo-router';
import { useEffect, useRef } from 'react';

export function useNotificationNavigation() {
  const lastHandledId = useRef<string | null>(null);

  useEffect(() => {
    function openNotification(response: Notifications.NotificationResponse | null) {
      if (!response) return;
      const notification = response.notification;
      if (lastHandledId.current === notification.request.identifier) return;
      const href = notification.request.content.data?.href;
      if (typeof href !== 'string' || !href.startsWith('/')) return;
      lastHandledId.current = notification.request.identifier;
      router.push(href as Href);
    }

    const subscription = Notifications.addNotificationResponseReceivedListener(openNotification);
    void Notifications.getLastNotificationResponseAsync().then(async (response) => {
      openNotification(response);
      if (response) await Notifications.clearLastNotificationResponseAsync();
    });
    return () => subscription.remove();
  }, []);
}
