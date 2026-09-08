import type { WalletTransfer } from '@/domain/transfers';

export type CreateTransferInput = Readonly<{ fromWalletId: string; toWalletId: string; amountMinor: number; occurredAt: string; note: string | null }>;

export interface TransferRepository {
  createTransfer(input: CreateTransferInput): Promise<WalletTransfer>;
  listRecent(limit?: number): Promise<WalletTransfer[]>;
}
