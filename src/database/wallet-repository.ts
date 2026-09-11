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

export type UpdateWalletInput = Readonly<{
  id: string;
  name: string;
  type: WalletType;
}>;

export interface WalletRepository {
  createWallet(input: CreateWalletInput): Promise<WalletSummary>;
  listWallets(options?: { includeArchived?: boolean }): Promise<WalletSummary[]>;
  updateWallet(input: UpdateWalletInput): Promise<WalletSummary>;
  archiveWallet(id: string): Promise<void>;
  restoreWallet(id: string): Promise<void>;
  setWalletBalance(input: SetWalletBalanceInput): Promise<WalletAdjustment>;
}
