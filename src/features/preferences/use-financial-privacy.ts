import { useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';

import { preferenceRepository } from '@/database/preference-store';

export function useFinancialPrivacy() {
  const [hideFinancialValues, setHiddenState] = useState(false);
  const [loading, setLoading] = useState(true);

  useFocusEffect(useCallback(() => {
    let active = true;
    void preferenceRepository.getHideFinancialValues().then((hidden) => {
      if (active) setHiddenState(hidden);
    }).finally(() => {
      if (active) setLoading(false);
    });
    return () => { active = false; };
  }, []));

  const setHideFinancialValues = useCallback(async (hidden: boolean) => {
    setHiddenState(hidden);
    await preferenceRepository.setHideFinancialValues(hidden);
  }, []);

  return { hideFinancialValues, setHideFinancialValues, loading };
}
