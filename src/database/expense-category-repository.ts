import type { ExpenseCategory } from '@/domain/expense-categories';

export interface ExpenseCategoryRepository {
  createCategory(name: string): Promise<ExpenseCategory>;
  listCategories(options?: { includeArchived?: boolean }): Promise<ExpenseCategory[]>;
  updateCategory(id: string, name: string): Promise<ExpenseCategory>;
  archiveCategory(id: string): Promise<void>;
  restoreCategory(id: string): Promise<void>;
}
