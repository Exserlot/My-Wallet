export const walletTypes = ['cash', 'bank-account', 'e-wallet'] as const;

export type WalletType = (typeof walletTypes)[number];

export type Wallet = Readonly<{
  id: string;
  name: string;
  type: WalletType;
  currency: 'THB';
  createdAt: string;
}>;

export type WalletSummary = Wallet &
  Readonly<{
    balanceMinor: number;
  }>;

export function validateWalletName(value: string): string | null {
  const name = value.trim();
  if (!name) return 'กรุณาตั้งชื่อกระเป๋า';
  if (name.length > 60) return 'ชื่อกระเป๋าต้องไม่เกิน 60 ตัวอักษร';
  return null;
}

const thaiDigits: Record<string, string> = {
  '๐': '0',
  '๑': '1',
  '๒': '2',
  '๓': '3',
  '๔': '4',
  '๕': '5',
  '๖': '6',
  '๗': '7',
  '๘': '8',
  '๙': '9',
};

export function parseMoneyInput(value: string): number | null {
  const normalized = value
    .trim()
    .replace(/[๐-๙]/g, (digit) => thaiDigits[digit])
    .replace(/,/g, '');

  if (!/^\d+(\.\d{0,2})?$/.test(normalized)) return null;

  const [whole, decimal = ''] = normalized.split('.');
  const amountMinor = Number(whole) * 100 + Number(decimal.padEnd(2, '0'));
  if (!Number.isSafeInteger(amountMinor)) return null;
  return amountMinor;
}

export const parseOpeningBalance = parseMoneyInput;

export function formatMoney(amountMinor: number): string {
  return new Intl.NumberFormat('th-TH', {
    style: 'currency',
    currency: 'THB',
    minimumFractionDigits: 2,
  }).format(amountMinor / 100);
}
