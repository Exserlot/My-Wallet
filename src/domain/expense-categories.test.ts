import { describe, expect, it } from 'vitest';

import { isValidExpenseCategoryName, normalizeExpenseCategoryName } from './expense-categories';

describe('normalizeExpenseCategoryName', () => {
  it('trims the name and collapses repeated spaces', () => {
    expect(normalizeExpenseCategoryName('  อาหาร   และ เครื่องดื่ม ')).toBe('อาหาร และ เครื่องดื่ม');
  });
});

describe('isValidExpenseCategoryName', () => {
  it('accepts names from 1 to 40 characters after normalization', () => {
    expect(isValidExpenseCategoryName('อาหาร')).toBe(true);
    expect(isValidExpenseCategoryName('   ')).toBe(false);
    expect(isValidExpenseCategoryName('ก'.repeat(41))).toBe(false);
  });
});
