import { useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';

import { transferRepository } from '@/database/transfer-store';
import type { WalletTransfer } from '@/domain/transfers';

export function useTransfers(limit = 10) {
  const [transfers, setTransfers] = useState<WalletTransfer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const refresh = useCallback(async () => {
    try { setError(null); setTransfers(await transferRepository.listRecent(limit)); }
    catch { setError('ไม่สามารถโหลดประวัติการโอนได้'); }
    finally { setLoading(false); }
  }, [limit]);
  useFocusEffect(useCallback(() => { void refresh(); }, [refresh]));
  return { transfers, loading, error, refresh };
}
