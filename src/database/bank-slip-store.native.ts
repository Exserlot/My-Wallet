import { randomUUID } from 'expo-crypto';

import { isValidCashFlowAmount } from '@/domain/transactions';

import type { BankSlipRepository, CreateBankSlipExpenseInput } from './bank-slip-repository';
import { getDatabase } from './database';

export const bankSlipRepository: BankSlipRepository = {
  async hasFingerprint(fingerprint) {
    const database = await getDatabase();
    const found = await database.getFirstAsync<{ fingerprint: string }>('SELECT fingerprint FROM bank_slip_imports WHERE fingerprint = ?', fingerprint);
    return Boolean(found);
  },

  async createExpense(input: CreateBankSlipExpenseInput) {
    if (!input.fingerprint) throw new Error('Slip fingerprint is required');
    if (!isValidCashFlowAmount(input.amountMinor)) throw new Error('Amount must be positive minor units');
    const database = await getDatabase();
    const expenseId = randomUUID();
    const importedAt = new Date().toISOString();
    await database.withExclusiveTransactionAsync(async (transaction) => {
      const wallet = await transaction.getFirstAsync<{ id: string }>('SELECT id FROM wallets WHERE id = ?', input.walletId);
      if (!wallet) throw new Error('Wallet not found');
      await transaction.runAsync(
        `INSERT INTO transactions
          (id, wallet_id, kind, amount_minor, currency, occurred_at, created_at, category_id, note, source)
         VALUES (?, ?, 'EXPENSE', ?, 'THB', ?, ?, NULL, ?, 'bank-slip')`,
        expenseId,
        input.walletId,
        input.amountMinor,
        input.occurredAt,
        importedAt,
        input.note?.trim() || null,
      );
      await transaction.runAsync(
        'INSERT INTO bank_slip_imports (fingerprint, expense_id, imported_at) VALUES (?, ?, ?)',
        input.fingerprint,
        expenseId,
        importedAt,
      );
    });
    return expenseId;
  },
};
