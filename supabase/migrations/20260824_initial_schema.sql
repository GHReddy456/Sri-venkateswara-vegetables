-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create vendors table
CREATE TABLE vendors (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create purchase_records table
CREATE TABLE purchase_records (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  purchase_date DATE NOT NULL,
  vendor_id UUID NOT NULL REFERENCES vendors(id),
  item TEXT NOT NULL,
  bags_count INTEGER NOT NULL,
  kgs NUMERIC(12,3) NOT NULL,
  unit_price NUMERIC(12,2) NOT NULL,
  total_price NUMERIC(14,2) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id)
);

-- Create indexes
CREATE INDEX idx_purchase_records_date ON purchase_records(purchase_date);
CREATE INDEX idx_purchase_records_vendor ON purchase_records(vendor_id);
CREATE INDEX idx_purchase_records_vendor_date ON purchase_records(vendor_id, purchase_date);
CREATE INDEX idx_vendors_name ON vendors(name);

-- Row Level Security (RLS)

-- Vendors RLS
ALTER TABLE vendors ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow authenticated users to read vendors" 
  ON vendors FOR SELECT 
  TO authenticated 
  USING (true);

CREATE POLICY "Allow authenticated users to insert vendors" 
  ON vendors FOR INSERT 
  TO authenticated 
  WITH CHECK (true);

CREATE POLICY "Allow authenticated users to update vendors" 
  ON vendors FOR UPDATE 
  TO authenticated 
  USING (true);

CREATE POLICY "Allow authenticated users to delete vendors" 
  ON vendors FOR DELETE 
  TO authenticated 
  USING (true);

-- Purchase Records RLS
ALTER TABLE purchase_records ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow authenticated users to read purchase records" 
  ON purchase_records FOR SELECT 
  TO authenticated 
  USING (true);

CREATE POLICY "Allow authenticated users to insert purchase records" 
  ON purchase_records FOR INSERT 
  TO authenticated 
  WITH CHECK (true);

CREATE POLICY "Allow authenticated users to update purchase records" 
  ON purchase_records FOR UPDATE 
  TO authenticated 
  USING (true);

CREATE POLICY "Allow authenticated users to delete purchase records" 
  ON purchase_records FOR DELETE 
  TO authenticated 
  USING (true);
