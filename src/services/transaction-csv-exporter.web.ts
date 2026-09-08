import type { Transaction } from '@/domain/transactions';

import { csvExportFilename, transactionsToCsv } from './transaction-csv';

export async function exportTransactionsCsv(transactions: readonly Transaction[], rangeStart: string, rangeEnd: string) {
  const blob = new Blob(['\uFEFF', transactionsToCsv(transactions)], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = csvExportFilename(rangeStart, rangeEnd);
  link.click();
  URL.revokeObjectURL(url);
}
