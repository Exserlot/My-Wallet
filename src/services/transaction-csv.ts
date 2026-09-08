import type { Transaction } from '@/domain/transactions';

const headers = ['occurred_at', 'kind', 'amount', 'currency', 'wallet', 'category', 'note', 'source'] as const;

function safeSpreadsheetText(value: string): string {
  return /^[=+\-@]/.test(value) ? `'${value}` : value;
}

function csvCell(value: string): string {
  const safe = safeSpreadsheetText(value);
  return /[",\r\n]/.test(safe) ? `"${safe.replace(/"/g, '""')}"` : safe;
}

export function transactionsToCsv(transactions: readonly Transaction[]): string {
  const rows = transactions.map((transaction) => [
    transaction.occurredAt,
    transaction.kind,
    (transaction.amount.amountMinor / 100).toFixed(2),
    transaction.amount.currency,
    transaction.walletName,
    transaction.categoryName ?? '',
    transaction.note ?? '',
    transaction.source,
  ].map(csvCell).join(','));
  return [headers.join(','), ...rows].join('\r\n');
}

export function csvExportFilename(rangeStart: string, rangeEnd: string): string {
  return `my-wallet-${rangeStart.slice(0, 10)}-to-${rangeEnd.slice(0, 10)}.csv`;
}
