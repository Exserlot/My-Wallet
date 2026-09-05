import { useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';

import { walletRepository } from '@/database/wallet-store';
import type { WalletSummary } from '@/domain/wallets';

export function useWallets() {
  const [wallets, setWallets] = useState<WalletSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    try {
      setError(null);
      setWallets(await walletRepository.listWallets());
    } catch {
      setError('ไม่สามารถโหลดข้อมูลกระเป๋าได้');
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      void refresh();
    }, [refresh]),
  );

  return { wallets, loading, error, refresh };
}

