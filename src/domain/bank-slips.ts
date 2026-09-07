export type SlipScanStatus = 'scanning' | 'ready' | 'duplicate' | 'error' | 'saved';

export type SlipDraft = Readonly<{
  id: string;
  fileName: string;
  uri: string;
  fingerprint: string | null;
  qrFound: boolean;
  status: SlipScanStatus;
  amountInput: string;
  dateInput: string;
  walletId: string | null;
  errorMessage: string | null;
}>;

export function canCreateSlipExpense(input: Readonly<{
  status: SlipScanStatus;
  fingerprint: string | null;
  amountMinor: number | null;
  walletId: string | null;
  occurredAt: string | null;
}>): boolean {
  return input.status === 'ready'
    && Boolean(input.fingerprint)
    && input.amountMinor !== null
    && Number.isSafeInteger(input.amountMinor)
    && input.amountMinor > 0
    && Boolean(input.walletId)
    && Boolean(input.occurredAt);
}

export function localDateInput(now = new Date()): string {
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function parseLocalDateInput(value: string): string | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value.trim());
  if (!match) return null;
  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const date = new Date(year, month - 1, day, 12);
  if (date.getFullYear() !== year || date.getMonth() !== month - 1 || date.getDate() !== day) return null;
  return date.toISOString();
}
