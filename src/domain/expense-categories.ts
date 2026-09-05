export type ExpenseCategory = Readonly<{
  id: string;
  name: string;
  createdAt: string;
  archivedAt: string | null;
}>;

export function normalizeExpenseCategoryName(name: string): string {
  return name.trim().replace(/\s+/g, ' ');
}

export function isValidExpenseCategoryName(name: string): boolean {
  const normalized = normalizeExpenseCategoryName(name);
  return normalized.length >= 1 && normalized.length <= 40;
}
