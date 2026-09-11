import { randomUUID } from 'expo-crypto';

import { validateWalletTransfer, type WalletTransfer } from '@/domain/transfers';

import { readWebDatabase, writeWebDatabase, type WebTransfer } from './web-database';
import type { TransferRepository } from './transfer-repository';

function toTransfer(transfer: WebTransfer): WalletTransfer {
  const database = readWebDatabase();
  const from = database.wallets.find((wallet) => wallet.id === transfer.fromWalletId);
  const to = database.wallets.find((wallet) => wallet.id === transfer.toWalletId);
  if (!from || !to) throw new Error('Transfer wallet not found');
  return { ...transfer, fromWalletName: from.name, toWalletName: to.name };
}

export const transferRepository: TransferRepository = {
  async createTransfer(input) {
    const error = validateWalletTransfer(input);
    if (error) throw new Error(error);
    const database = readWebDatabase();
    if (!database.wallets.some((wallet) => wallet.id === input.fromWalletId) || !database.wallets.some((wallet) => wallet.id === input.toWalletId)) throw new Error('Wallet not found');
    const transfer: WebTransfer = { id: randomUUID(), ...input, note: input.note?.trim() || null, createdAt: new Date().toISOString() };
    writeWebDatabase({ ...database, transfers: [...database.transfers, transfer] });
    return toTransfer(transfer);
  },

  async getTransfer(id) {
    const transfer = readWebDatabase().transfers.find((item) => item.id === id);
    return transfer ? toTransfer(transfer) : null;
  },

  async updateTransfer(id, input) {
    const error = validateWalletTransfer(input); if (error) throw new Error(error);
    const database = readWebDatabase();
    if (!database.wallets.some((wallet) => wallet.id === input.fromWalletId) || !database.wallets.some((wallet) => wallet.id === input.toWalletId)) throw new Error('Wallet not found');
    const target = database.transfers.find((item) => item.id === id); if (!target) throw new Error('Transfer not found');
    const updated = { ...target, ...input, note: input.note?.trim() || null };
    writeWebDatabase({ ...database, transfers: database.transfers.map((item) => item.id === id ? updated : item) });
    return toTransfer(updated);
  },

  async deleteTransfer(id) {
    const database = readWebDatabase();
    if (!database.transfers.some((item) => item.id === id)) throw new Error('Transfer not found');
    writeWebDatabase({ ...database, transfers: database.transfers.filter((item) => item.id !== id) });
  },

  async listRecent(limit = 10) {
    return readWebDatabase().transfers
      .sort((left, right) => right.occurredAt.localeCompare(left.occurredAt) || right.createdAt.localeCompare(left.createdAt))
      .slice(0, Math.max(1, Math.min(limit, 100)))
      .map(toTransfer);
  },
};
