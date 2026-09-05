import type { WalletSummary, WalletType } from '@/domain/wallets';

export type CreateWalletInput = Readonly<{
  name: string;
  type: WalletType;
  openingBalanceMinor: number;
  occurredAt: string;
}>;

export interface WalletRepository {
  createWallet(input: CreateWalletInput): Promise<WalletSummary>;
  listWallets(): Promise<WalletSummary[]>;
}

