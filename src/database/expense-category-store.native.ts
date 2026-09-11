import { randomUUID } from 'expo-crypto';

import { isValidExpenseCategoryName, normalizeExpenseCategoryName, type ExpenseCategory } from '@/domain/expense-categories';

import { getDatabase } from './database';
import type { ExpenseCategoryRepository } from './expense-category-repository';

type ExpenseCategoryRow = {
  id: string;
  name: string;
  created_at: string;
  archived_at: string | null;
};

function toExpenseCategory(row: ExpenseCategoryRow): ExpenseCategory {
  return { id: row.id, name: row.name, createdAt: row.created_at, archivedAt: row.archived_at };
}

export const expenseCategoryRepository: ExpenseCategoryRepository = {
  async createCategory(name) {
    if (!isValidExpenseCategoryName(name)) throw new Error('Category name must contain 1 to 40 characters');
    const database = await getDatabase();
    const category: ExpenseCategory = {
      id: randomUUID(),
      name: normalizeExpenseCategoryName(name),
      createdAt: new Date().toISOString(),
      archivedAt: null,
    };
    try {
      await database.runAsync(
        'INSERT INTO expense_categories (id, name, created_at, archived_at) VALUES (?, ?, ?, NULL)',
        category.id,
        category.name,
        category.createdAt,
      );
    } catch (error) {
      if (error instanceof Error && error.message.toLowerCase().includes('unique')) {
        throw new Error('Category name already exists');
      }
      throw error;
    }
    return category;
  },

  async listCategories(options) {
    const database = await getDatabase();
    const rows = await database.getAllAsync<ExpenseCategoryRow>(
      `SELECT id, name, created_at, archived_at
       FROM expense_categories
       ${options?.includeArchived ? '' : 'WHERE archived_at IS NULL'}
       ORDER BY archived_at IS NOT NULL, name COLLATE NOCASE`,
    );
    return rows.map(toExpenseCategory);
  },

  async updateCategory(id, name) {
    if (!isValidExpenseCategoryName(name)) throw new Error('Category name must contain 1 to 40 characters');
    const database = await getDatabase();
    try {
      const result = await database.runAsync('UPDATE expense_categories SET name = ? WHERE id = ?', normalizeExpenseCategoryName(name), id);
      if (result.changes !== 1) throw new Error('Category not found');
    } catch (error) {
      if (error instanceof Error && error.message.toLowerCase().includes('unique')) throw new Error('Category name already exists');
      throw error;
    }
    const row = await database.getFirstAsync<ExpenseCategoryRow>('SELECT id, name, created_at, archived_at FROM expense_categories WHERE id = ?', id);
    if (!row) throw new Error('Category not found after update');
    return toExpenseCategory(row);
  },

  async archiveCategory(id) {
    const database = await getDatabase();
    await database.runAsync(
      'UPDATE expense_categories SET archived_at = ? WHERE id = ? AND archived_at IS NULL',
      new Date().toISOString(),
      id,
    );
  },

  async restoreCategory(id) {
    const database = await getDatabase();
    await database.runAsync('UPDATE expense_categories SET archived_at = NULL WHERE id = ?', id);
  },
};
