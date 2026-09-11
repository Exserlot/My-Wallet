import type { WalletTransfer } from '@/domain/transfers';

export type CreateTransferInput = Readonly<{ fromWalletId: string; toWalletId: string; amountMinor: number; occurredAt: string; note: string | null }>;

export interface TransferRepository {
  createTransfer(input: CreateTransferInput): Promise<WalletTransfer>;
  getTransfer(id: string): Promise<WalletTransfer | null>;
  updateTransfer(id: string, input: CreateTransferInput): Promise<WalletTransfer>;
  deleteTransfer(id: string): Promise<void>;
  listRecent(limit?: number): Promise<WalletTransfer[]>;
}
