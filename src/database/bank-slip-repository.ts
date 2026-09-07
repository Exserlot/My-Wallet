export type CreateBankSlipExpenseInput = Readonly<{
  fingerprint: string;
  walletId: string;
  amountMinor: number;
  occurredAt: string;
  note: string | null;
}>;

export interface BankSlipRepository {
  hasFingerprint(fingerprint: string): Promise<boolean>;
  createExpense(input: CreateBankSlipExpenseInput): Promise<string>;
}
