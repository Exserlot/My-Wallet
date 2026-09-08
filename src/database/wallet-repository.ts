import type { WalletAdjustment, WalletSummary, WalletType } from '@/domain/wallets';

export type CreateWalletInput = Readonly<{
  name: string;
  type: WalletType;
  openingBalanceMinor: number;
  occurredAt: string;
}>;

export type SetWalletBalanceInput = Readonly<{
  walletId: string;
  targetBalanceMinor: number;
  occurredAt: string;
  note: string | null;
}>;

export interface WalletRepository {
  createWallet(input: CreateWalletInput): Promise<WalletSummary>;
  listWallets(): Promise<WalletSummary[]>;
  setWalletBalance(input: SetWalletBalanceInput): Promise<WalletAdjustment>;
}
