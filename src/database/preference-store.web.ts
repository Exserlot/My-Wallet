import type { PreferenceRepository } from './preference-repository';

const hideFinancialValuesKey = 'my-wallet.preference.hide-financial-values';

export const preferenceRepository: PreferenceRepository = {
  async getHideFinancialValues() {
    if (typeof localStorage === 'undefined') return false;
    return localStorage.getItem(hideFinancialValuesKey) === 'true';
  },

  async setHideFinancialValues(hidden) {
    if (typeof localStorage === 'undefined') return;
    localStorage.setItem(hideFinancialValuesKey, String(hidden));
  },
};
