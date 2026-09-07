import { describe, expect, it } from 'vitest';

import { defaultNotificationPreferences, isValidNotificationPreferences } from './preferences';

describe('notification preferences', () => {
  it('defaults to private local reminders at 09:00', () => {
    expect(defaultNotificationPreferences).toMatchObject({ enabled: true, reminderHour: 9, reminderMinute: 0, showLockScreenDetails: false });
    expect(isValidNotificationPreferences(defaultNotificationPreferences)).toBe(true);
  });

  it('rejects time values outside a real clock', () => {
    expect(isValidNotificationPreferences({ ...defaultNotificationPreferences, reminderHour: 24 })).toBe(false);
    expect(isValidNotificationPreferences({ ...defaultNotificationPreferences, reminderMinute: -1 })).toBe(false);
  });
});
