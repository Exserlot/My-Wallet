import { randomUUID } from 'expo-crypto';

import type { Wallet, WalletAdjustment, WalletSummary } from '@/domain/wallets';

import { readWebDatabase, writeWebDatabase, type WebTransaction } from './web-database';
import type { CreateWalletInput, WalletRepository } from './wallet-repository';

export const walletRepository: WalletRepository = {
  async createWallet(input: CreateWalletInput) {
    const database = readWebDatabase();
    const createdAt = new Date().toISOString();
    const wallet: Wallet = {
      id: randomUUID(),
      name: input.name.trim(),
      type: input.type,
      currency: 'THB',
      createdAt,
    };
    const openingBalance: WebTransaction | null = input.openingBalanceMinor > 0
      ? {
          id: randomUUID(),
          walletId: wallet.id,
          kind: 'opening-balance',
          amountMinor: input.openingBalanceMinor,
          occurredAt: input.occurredAt,
          createdAt,
          categoryId: null,
          note: null,
          source: 'manual',
        }
      : null;

    writeWebDatabase({
      ...database,
      wallets: [...database.wallets, wallet],
      transactions: openingBalance
        ? [...database.transactions, openingBalance]
        : database.transactions,
    });
    return { ...wallet, balanceMinor: input.openingBalanceMinor };
  },

  async listWallets() {
    const database = readWebDatabase();
    return database.wallets.map<WalletSummary>((wallet) => ({
      ...wallet,
      balanceMinor: database.transactions
        .filter((transaction) => transaction.walletId === wallet.id)
        .reduce((sum, transaction) => {
          return transaction.kind === 'expense'
            ? sum - transaction.amountMinor
            : sum + transaction.amountMinor;
        }, 0)
        + database.transfers.filter((transfer) => transfer.toWalletId === wallet.id).reduce((sum, transfer) => sum + transfer.amountMinor, 0)
        - database.transfers.filter((transfer) => transfer.fromWalletId === wallet.id).reduce((sum, transfer) => sum + transfer.amountMinor, 0)
        + database.walletAdjustments.filter((adjustment) => adjustment.walletId === wallet.id).reduce((sum, adjustment) => sum + adjustment.deltaMinor, 0),
    }));
  },

  async setWalletBalance(input) {
    if (!Number.isSafeInteger(input.targetBalanceMinor)) throw new Error('Target balance must be safe minor units');
    const database = readWebDatabase();
    const wallet = (await walletRepository.listWallets()).find((item) => item.id === input.walletId);
    if (!wallet) throw new Error('Wallet not found');
    const deltaMinor = input.targetBalanceMinor - wallet.balanceMinor;
    if (!Number.isSafeInteger(deltaMinor) || deltaMinor === 0) throw new Error('Balance adjustment must be non-zero');
    const adjustment = {
      id: randomUUID(), walletId: wallet.id, deltaMinor, occurredAt: input.occurredAt,
      note: input.note?.trim() || null, createdAt: new Date().toISOString(),
    };
    writeWebDatabase({ ...database, walletAdjustments: [...database.walletAdjustments, adjustment] });
    const result: WalletAdjustment = { ...adjustment, walletName: wallet.name };
    return result;
  },
};
