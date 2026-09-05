import { randomUUID } from 'expo-crypto';

import type { Wallet, WalletSummary } from '@/domain/wallets';

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
        }, 0),
    }));
  },
};
