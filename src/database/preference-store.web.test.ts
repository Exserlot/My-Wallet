import { beforeEach, describe, expect, it, vi } from 'vitest';

import { preferenceRepository } from './preference-store.web';

class MemoryStorage implements Storage {
  private values = new Map<string, string>();

  get length() { return this.values.size; }
  clear() { this.values.clear(); }
  getItem(key: string) { return this.values.get(key) ?? null; }
  key(index: number) { return [...this.values.keys()][index] ?? null; }
  removeItem(key: string) { this.values.delete(key); }
  setItem(key: string, value: string) { this.values.set(key, value); }
}

describe('web privacy preference', () => {
  beforeEach(() => vi.stubGlobal('localStorage', new MemoryStorage()));

  it('defaults to visible and remembers when financial values are hidden', async () => {
    await expect(preferenceRepository.getHideFinancialValues()).resolves.toBe(false);
    await preferenceRepository.setHideFinancialValues(true);
    await expect(preferenceRepository.getHideFinancialValues()).resolves.toBe(true);
    await preferenceRepository.setHideFinancialValues(false);
    await expect(preferenceRepository.getHideFinancialValues()).resolves.toBe(false);
  });

  it('remembers notification switches, time, and lock-screen privacy', async () => {
    const defaults = await preferenceRepository.getNotificationPreferences();
    expect(defaults).toMatchObject({ reminderHour: 9, reminderMinute: 0, showLockScreenDetails: false });
    const changed = { ...defaults, budgetEnabled: false, reminderHour: 18, reminderMinute: 30, showLockScreenDetails: true };
    await preferenceRepository.setNotificationPreferences(changed);
    await expect(preferenceRepository.getNotificationPreferences()).resolves.toEqual(changed);
  });

  it('remembers budget threshold levels to prevent repeated notifications', async () => {
    await preferenceRepository.setBudgetThresholdState({ budget: 'urgent' });
    await expect(preferenceRepository.getBudgetThresholdState()).resolves.toEqual({ budget: 'urgent' });
  });
});
