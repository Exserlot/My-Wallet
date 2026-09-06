export type PlannedPurchasePriority = 'low' | 'normal' | 'high';
export type PlannedPurchaseStatus = 'active' | 'purchased' | 'archived';

export type PlannedPurchase = Readonly<{
  id: string;
  name: string;
  quantity: number;
  estimatedUnitMinor: number | null;
  categoryId: string | null;
  categoryName: string | null;
  merchant: string | null;
  note: string | null;
  priority: PlannedPurchasePriority;
  status: PlannedPurchaseStatus;
  expenseId: string | null;
  createdAt: string;
  purchasedAt: string | null;
  archivedAt: string | null;
}>;

export function validatePlannedPurchase(input: Readonly<{
  name: string;
  quantity: number;
  estimatedUnitMinor: number | null;
}>): string | null {
  if (!input.name.trim()) return 'กรุณากรอกชื่อสินค้า';
  if (!Number.isSafeInteger(input.quantity) || input.quantity < 1) return 'จำนวนสินค้าต้องเป็นเลขจำนวนเต็มตั้งแต่ 1 ขึ้นไป';
  if (input.estimatedUnitMinor !== null && (!Number.isSafeInteger(input.estimatedUnitMinor) || input.estimatedUnitMinor < 0)) {
    return 'ราคาประมาณไม่ถูกต้อง';
  }
  if (input.estimatedUnitMinor !== null && !Number.isSafeInteger(input.quantity * input.estimatedUnitMinor)) return 'ราคารวมสูงเกินไป';
  return null;
}

export function estimatedPurchaseTotalMinor(item: Pick<PlannedPurchase, 'quantity' | 'estimatedUnitMinor'>): number | null {
  return item.estimatedUnitMinor === null ? null : item.quantity * item.estimatedUnitMinor;
}

export function priorityLabel(priority: PlannedPurchasePriority): string {
  if (priority === 'high') return 'สำคัญมาก';
  if (priority === 'low') return 'ไว้ก่อน';
  return 'ปกติ';
}
