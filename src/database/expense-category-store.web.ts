import { randomUUID } from 'expo-crypto';

import { isValidExpenseCategoryName, normalizeExpenseCategoryName, type ExpenseCategory } from '@/domain/expense-categories';

import type { ExpenseCategoryRepository } from './expense-category-repository';
import { readWebDatabase, writeWebDatabase } from './web-database';

export const expenseCategoryRepository: ExpenseCategoryRepository = {
  async createCategory(name) {
    if (!isValidExpenseCategoryName(name)) throw new Error('Category name must contain 1 to 40 characters');
    const database = readWebDatabase();
    const normalizedName = normalizeExpenseCategoryName(name);
    if (database.expenseCategories.some((category) => category.name.toLocaleLowerCase() === normalizedName.toLocaleLowerCase())) {
      throw new Error('Category name already exists');
    }
    const category: ExpenseCategory = {
      id: randomUUID(),
      name: normalizedName,
      createdAt: new Date().toISOString(),
      archivedAt: null,
    };
    writeWebDatabase({ ...database, expenseCategories: [...database.expenseCategories, category] });
    return category;
  },

  async listCategories(options) {
    return readWebDatabase().expenseCategories
      .filter((category) => options?.includeArchived || category.archivedAt === null)
      .sort((left, right) => left.name.localeCompare(right.name, 'th'));
  },

  async archiveCategory(id) {
    const database = readWebDatabase();
    const archivedAt = new Date().toISOString();
    writeWebDatabase({
      ...database,
      expenseCategories: database.expenseCategories.map((category) => (
        category.id === id && category.archivedAt === null ? { ...category, archivedAt } : category
      )),
    });
  },
};
