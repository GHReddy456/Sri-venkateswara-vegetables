export interface Vendor {
  id: string;
  name: string;
  active: boolean;
  created_at: string;
  updated_at: string;
}

export interface PurchaseRecord {
  id: string;
  purchase_date: string; // YYYY-MM-DD
  vendor_id: string;
  item: string;
  bags_count: number;
  kgs: number;
  unit_price: number;
  total_price: number;
  created_at: string;
  updated_at: string;
  created_by?: string;
}

export interface PurchaseRecordInput {
  item: string;
  bags_count: number;
  kgs: number;
  unit_price: number;
}

export interface VendorDailyCoolie {
  id?: string;
  vendor_id: string;
  purchase_date: string;
  coolie_amount: number;
  created_at?: string;
  updated_at?: string;
}

export interface DailySummary {
  purchase_date: string;
  daily_total: number;
  items_total?: number;
  coolie_amount?: number;
}
