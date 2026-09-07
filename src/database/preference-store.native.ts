import { getDatabase } from './database';
import type { PreferenceRepository } from './preference-repository';

const hideFinancialValuesKey = 'hide-financial-values';

export const preferenceRepository: PreferenceRepository = {
  async getHideFinancialValues() {
    const database = await getDatabase();
    const row = await database.getFirstAsync<{ value: string }>('SELECT value FROM app_preferences WHERE key = ?', hideFinancialValuesKey);
    return row?.value === 'true';
  },

  async setHideFinancialValues(hidden) {
    const database = await getDatabase();
    await database.runAsync(
      'INSERT INTO app_preferences (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value',
      hideFinancialValuesKey,
      String(hidden),
    );
  },
};
