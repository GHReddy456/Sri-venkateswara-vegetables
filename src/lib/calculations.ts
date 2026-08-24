import type { PurchaseRecord, PurchaseRecordInput } from '../types';

export function calculateLineTotal(kgs: number, unitPrice: number): number {
  if (isNaN(kgs) || isNaN(unitPrice)) return 0;
  return Math.floor(kgs * unitPrice);
}

export function calculateDailyTotal(records: (PurchaseRecord | PurchaseRecordInput)[]): number {
  return records.reduce((total, record) => {
    return total + calculateLineTotal(record.kgs, record.unit_price);
  }, 0);
}

export function calculateTotalBags(records: (PurchaseRecord | PurchaseRecordInput)[]): number {
  return records.reduce((total, record) => total + (Number(record.bags_count) || 0), 0);
}

export function calculateTotalKgs(records: (PurchaseRecord | PurchaseRecordInput)[]): number {
  return records.reduce((total, record) => total + (Number(record.kgs) || 0), 0);
}
