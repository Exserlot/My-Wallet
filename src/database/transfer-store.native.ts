import { randomUUID } from 'expo-crypto';

import { validateWalletTransfer, type WalletTransfer } from '@/domain/transfers';

import { getDatabase } from './database';
import type { TransferRepository } from './transfer-repository';

type TransferRow = { id: string; from_wallet_id: string; from_wallet_name: string; to_wallet_id: string; to_wallet_name: string; amount_minor: number; occurred_at: string; note: string | null };

function toTransfer(row: TransferRow): WalletTransfer {
  return { id: row.id, fromWalletId: row.from_wallet_id, fromWalletName: row.from_wallet_name, toWalletId: row.to_wallet_id, toWalletName: row.to_wallet_name, amountMinor: row.amount_minor, occurredAt: row.occurred_at, note: row.note };
}

export const transferRepository: TransferRepository = {
  async createTransfer(input) {
    const error = validateWalletTransfer(input);
    if (error) throw new Error(error);
    const database = await getDatabase();
    const id = randomUUID();
    await database.runAsync(
      'INSERT INTO wallet_transfers (id, from_wallet_id, to_wallet_id, amount_minor, occurred_at, note, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)',
      id, input.fromWalletId, input.toWalletId, input.amountMinor, input.occurredAt, input.note?.trim() || null, new Date().toISOString(),
    );
    const created = (await this.listRecent(100)).find((transfer) => transfer.id === id);
    if (!created) throw new Error('Transfer not found after insert');
    return created;
  },

  async listRecent(limit = 10) {
    const database = await getDatabase();
    const rows = await database.getAllAsync<TransferRow>(
      `SELECT wallet_transfers.id, wallet_transfers.from_wallet_id, source.name AS from_wallet_name,
        wallet_transfers.to_wallet_id, destination.name AS to_wallet_name, wallet_transfers.amount_minor,
        wallet_transfers.occurred_at, wallet_transfers.note
       FROM wallet_transfers
       JOIN wallets source ON source.id = wallet_transfers.from_wallet_id
       JOIN wallets destination ON destination.id = wallet_transfers.to_wallet_id
       ORDER BY wallet_transfers.occurred_at DESC, wallet_transfers.created_at DESC LIMIT ?`,
      Math.max(1, Math.min(limit, 100)),
    );
    return rows.map(toTransfer);
  },
};
