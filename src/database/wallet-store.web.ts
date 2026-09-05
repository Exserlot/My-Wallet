import { randomUUID } from 'expo-crypto';

import type { Wallet, WalletSummary } from '@/domain/wallets';

import type { CreateWalletInput, WalletRepository } from './wallet-repository';

type WebOpeningBalance = Readonly<{
  id: string;
  walletId: string;
  amountMinor: number;
  occurredAt: string;
}>;

type WebState = Readonly<{
  wallets: Wallet[];
  openingBalances: WebOpeningBalance[];
}>;

const storageKey = 'my-wallet.database.v1';
const emptyState = (): WebState => ({ wallets: [], openingBalances: [] });

function readState(): WebState {
  if (typeof localStorage === 'undefined') return emptyState();
  const value = localStorage.getItem(storageKey);
  if (!value) return emptyState();

  try {
    return JSON.parse(value) as WebState;
  } catch {
    return emptyState();
  }
}

function writeState(state: WebState) {
  if (typeof localStorage === 'undefined') return;
  localStorage.setItem(storageKey, JSON.stringify(state));
}

export const walletRepository: WalletRepository = {
  async createWallet(input: CreateWalletInput) {
    const state = readState();
    const wallet: Wallet = {
      id: randomUUID(),
      name: input.name.trim(),
      type: input.type,
      currency: 'THB',
      createdAt: new Date().toISOString(),
    };
    const openingBalance: WebOpeningBalance | null = input.openingBalanceMinor > 0
      ? {
          id: randomUUID(),
          walletId: wallet.id,
          amountMinor: input.openingBalanceMinor,
          occurredAt: input.occurredAt,
        }
      : null;

    writeState({
      wallets: [...state.wallets, wallet],
      openingBalances: openingBalance
        ? [...state.openingBalances, openingBalance]
        : state.openingBalances,
    });
    return { ...wallet, balanceMinor: input.openingBalanceMinor };
  },

  async listWallets() {
    const state = readState();
    return state.wallets.map<WalletSummary>((wallet) => ({
      ...wallet,
      balanceMinor: state.openingBalances
        .filter((balance) => balance.walletId === wallet.id)
        .reduce((sum, balance) => sum + balance.amountMinor, 0),
    }));
  },
};
