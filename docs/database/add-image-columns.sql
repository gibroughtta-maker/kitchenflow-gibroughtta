-- ============================================
-- Add Image Storage Columns
-- Created: 2026-01-26
-- Purpose: Add image URL columns to support Supabase Storage
-- ============================================

-- 1. Update fridge_snapshots table
-- Add columns for multiple images and thumbnails
ALTER TABLE fridge_snapshots 
ADD COLUMN IF NOT EXISTS image_urls TEXT[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS thumbnail_urls TEXT[] DEFAULT '{}';

-- Add comment
COMMENT ON COLUMN fridge_snapshots.image_urls IS 'Array of full-size image URLs from Supabase Storage';
COMMENT ON COLUMN fridge_snapshots.thumbnail_urls IS 'Array of thumbnail image URLs from Supabase Storage';

-- 2. Create or update receipt_scans table
CREATE TABLE IF NOT EXISTS receipt_scans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  device_id TEXT NOT NULL,
  shop_name TEXT NOT NULL,
  scan_date DATE NOT NULL,
  total_amount DECIMAL(10,2),
  image_url TEXT,
  thumbnail_url TEXT,
  ocr_confidence DECIMAL(3,2) DEFAULT 0.0,
  items JSONB NOT NULL DEFAULT '[]',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add columns if table already exists
ALTER TABLE receipt_scans
ADD COLUMN IF NOT EXISTS image_url TEXT,
ADD COLUMN IF NOT EXISTS thumbnail_url TEXT,
ADD COLUMN IF NOT EXISTS ocr_confidence DECIMAL(3,2) DEFAULT 0.0;

-- Add comments
COMMENT ON TABLE receipt_scans IS 'Stores scanned receipt data with OCR results';
COMMENT ON COLUMN receipt_scans.image_url IS 'Full-size receipt image URL from Supabase Storage';
COMMENT ON COLUMN receipt_scans.thumbnail_url IS 'Thumbnail receipt image URL from Supabase Storage';
COMMENT ON COLUMN receipt_scans.ocr_confidence IS 'OCR confidence score (0.0-1.0)';

-- 3. Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_receipt_scans_device_id ON receipt_scans(device_id);
CREATE INDEX IF NOT EXISTS idx_receipt_scans_scan_date ON receipt_scans(scan_date DESC);
CREATE INDEX IF NOT EXISTS idx_fridge_snapshots_device_id ON fridge_snapshots(device_id);

-- 4. Enable RLS (Row Level Security)
ALTER TABLE receipt_scans ENABLE ROW LEVEL SECURITY;

-- 5. Create RLS policies for receipt_scans
CREATE POLICY "Users can view their own receipts"
ON receipt_scans FOR SELECT
USING (device_id = current_setting('app.device_id', true));

CREATE POLICY "Users can insert their own receipts"
ON receipt_scans FOR INSERT
WITH CHECK (device_id = current_setting('app.device_id', true));

CREATE POLICY "Users can update their own receipts"
ON receipt_scans FOR UPDATE
USING (device_id = current_setting('app.device_id', true));

CREATE POLICY "Users can delete their own receipts"
ON receipt_scans FOR DELETE
USING (device_id = current_setting('app.device_id', true));

-- 6. Create updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_receipt_scans_updated_at
  BEFORE UPDATE ON receipt_scans
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- 7. Create view for receipt analytics
CREATE OR REPLACE VIEW receipt_price_history AS
SELECT 
  device_id,
  shop_name,
  jsonb_array_elements(items) ->> 'name' AS item_name,
  (jsonb_array_elements(items) ->> 'price')::DECIMAL AS price,
  (jsonb_array_elements(items) ->> 'quantity')::DECIMAL AS quantity,
  scan_date,
  created_at
FROM receipt_scans
ORDER BY scan_date DESC;

-- Add comment
COMMENT ON VIEW receipt_price_history IS 'Flattened view of receipt items for price tracking';

-- 8. Verify changes
SELECT 
  column_name, 
  data_type, 
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_name = 'fridge_snapshots' 
  AND column_name IN ('image_urls', 'thumbnail_urls');

SELECT 
  column_name, 
  data_type, 
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_name = 'receipt_scans'
  AND column_name IN ('image_url', 'thumbnail_url', 'ocr_confidence');
