import { File, Paths } from 'expo-file-system';
import * as Sharing from 'expo-sharing';

import type { Transaction } from '@/domain/transactions';

import { csvExportFilename, transactionsToCsv } from './transaction-csv';

export async function exportTransactionsCsv(transactions: readonly Transaction[], rangeStart: string, rangeEnd: string) {
  if (!await Sharing.isAvailableAsync()) throw new Error('File sharing is unavailable');
  const file = new File(Paths.cache, `${Date.now()}-${csvExportFilename(rangeStart, rangeEnd)}`);
  file.create();
  file.write(`\uFEFF${transactionsToCsv(transactions)}`);
  await Sharing.shareAsync(file.uri, {
    dialogTitle: 'บันทึกหรือแชร์ไฟล์ CSV',
    mimeType: 'text/csv',
    UTI: 'public.comma-separated-values-text',
  });
}
