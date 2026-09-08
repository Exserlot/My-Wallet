export type WalletTransfer = Readonly<{
  id: string;
  fromWalletId: string;
  fromWalletName: string;
  toWalletId: string;
  toWalletName: string;
  amountMinor: number;
  occurredAt: string;
  note: string | null;
}>;

export function validateWalletTransfer(input: Readonly<{ fromWalletId: string; toWalletId: string; amountMinor: number }>): string | null {
  if (!input.fromWalletId || !input.toWalletId) return 'กรุณาเลือกกระเป๋าต้นทางและปลายทาง';
  if (input.fromWalletId === input.toWalletId) return 'กระเป๋าต้นทางและปลายทางต้องไม่ใช่ใบเดียวกัน';
  if (!Number.isSafeInteger(input.amountMinor) || input.amountMinor <= 0) return 'ยอดโอนต้องมากกว่า 0';
  return null;
}
