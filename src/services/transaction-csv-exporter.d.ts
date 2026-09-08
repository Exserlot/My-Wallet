import type { Transaction } from '@/domain/transactions';

export declare function exportTransactionsCsv(transactions: readonly Transaction[], rangeStart: string, rangeEnd: string): Promise<void>;
