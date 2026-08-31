-- Create vendor_daily_coolie table for vendor-wise daily coolie charges
CREATE TABLE IF NOT EXISTS vendor_daily_coolie (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  vendor_id UUID NOT NULL REFERENCES vendors(id) ON DELETE CASCADE,
  purchase_date DATE NOT NULL,
  coolie_amount NUMERIC(14,2) NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT vendor_date_unique UNIQUE(vendor_id, purchase_date)
);

-- Index for fast lookup by vendor and date
CREATE INDEX IF NOT EXISTS idx_vendor_daily_coolie_vendor_date ON vendor_daily_coolie(vendor_id, purchase_date);

-- Row Level Security (RLS)
ALTER TABLE vendor_daily_coolie ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow authenticated users to read vendor_daily_coolie"
  ON vendor_daily_coolie FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Allow authenticated users to insert vendor_daily_coolie"
  ON vendor_daily_coolie FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Allow authenticated users to update vendor_daily_coolie"
  ON vendor_daily_coolie FOR UPDATE
  TO authenticated
  USING (true);

CREATE POLICY "Allow authenticated users to delete vendor_daily_coolie"
  ON vendor_daily_coolie FOR DELETE
  TO authenticated
  USING (true);
