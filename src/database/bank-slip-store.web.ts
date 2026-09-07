import { randomUUID } from 'expo-crypto';

import { isValidCashFlowAmount } from '@/domain/transactions';

import type { BankSlipRepository } from './bank-slip-repository';
import { readWebDatabase, writeWebDatabase } from './web-database';

export const bankSlipRepository: BankSlipRepository = {
  async hasFingerprint(fingerprint) {
    return readWebDatabase().bankSlipImports.some((item) => item.fingerprint === fingerprint);
  },

  async createExpense(input) {
    if (!input.fingerprint) throw new Error('Slip fingerprint is required');
    if (!isValidCashFlowAmount(input.amountMinor)) throw new Error('Amount must be positive minor units');
    const database = readWebDatabase();
    if (!database.wallets.some((wallet) => wallet.id === input.walletId)) throw new Error('Wallet not found');
    if (database.bankSlipImports.some((item) => item.fingerprint === input.fingerprint)) throw new Error('Duplicate bank slip');
    const expenseId = randomUUID();
    const importedAt = new Date().toISOString();
    writeWebDatabase({
      ...database,
      transactions: [...database.transactions, {
        id: expenseId,
        walletId: input.walletId,
        kind: 'expense',
        amountMinor: input.amountMinor,
        occurredAt: input.occurredAt,
        createdAt: importedAt,
        categoryId: null,
        note: input.note?.trim() || null,
        source: 'bank-slip',
      }],
      bankSlipImports: [...database.bankSlipImports, { fingerprint: input.fingerprint, expenseId, importedAt }],
    });
    return expenseId;
  },
};
