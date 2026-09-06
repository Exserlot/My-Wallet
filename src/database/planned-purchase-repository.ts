import type { PlannedPurchase, PlannedPurchasePriority } from '@/domain/planned-purchases';

export type CreatePlannedPurchaseInput = Readonly<{
  name: string;
  quantity: number;
  estimatedUnitMinor: number | null;
  categoryId: string | null;
  merchant: string | null;
  note: string | null;
  priority: PlannedPurchasePriority;
}>;

export type PurchasePlannedItemsInput = Readonly<{
  itemIds: string[];
  walletId: string;
  actualMinor: number;
  categoryId: string | null;
  note: string | null;
  occurredAt: string;
}>;

export interface PlannedPurchaseRepository {
  create(input: CreatePlannedPurchaseInput): Promise<PlannedPurchase>;
  list(options?: { includeCompleted?: boolean }): Promise<PlannedPurchase[]>;
  getMany(ids: string[]): Promise<PlannedPurchase[]>;
  archive(id: string): Promise<void>;
  purchase(input: PurchasePlannedItemsInput): Promise<string>;
}
