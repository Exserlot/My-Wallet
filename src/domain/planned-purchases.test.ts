import { describe, expect, it } from 'vitest';

import { estimatedPurchaseTotalMinor, priorityLabel, validatePlannedPurchase } from './planned-purchases';

describe('planned purchases', () => {
  it('requires a name and positive whole-number quantity', () => {
    expect(validatePlannedPurchase({ name: ' ', quantity: 1, estimatedUnitMinor: null })).toBe('กรุณากรอกชื่อสินค้า');
    expect(validatePlannedPurchase({ name: 'หูฟัง', quantity: 0, estimatedUnitMinor: null })).toContain('จำนวนสินค้า');
    expect(validatePlannedPurchase({ name: 'หูฟัง', quantity: 2, estimatedUnitMinor: 150_000 })).toBeNull();
    expect(validatePlannedPurchase({ name: 'หูฟัง', quantity: Number.MAX_SAFE_INTEGER, estimatedUnitMinor: 2 })).toBe('ราคารวมสูงเกินไป');
  });

  it('uses price as an estimate only and supports quantity', () => {
    expect(estimatedPurchaseTotalMinor({ quantity: 3, estimatedUnitMinor: 12_500 })).toBe(37_500);
    expect(estimatedPurchaseTotalMinor({ quantity: 3, estimatedUnitMinor: null })).toBeNull();
  });

  it('provides Thai priority labels', () => {
    expect(priorityLabel('high')).toBe('สำคัญมาก');
    expect(priorityLabel('normal')).toBe('ปกติ');
    expect(priorityLabel('low')).toBe('ไว้ก่อน');
  });
});
