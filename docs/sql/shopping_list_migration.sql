-- Shopping List Feature - Database Migration
-- Adds store categorization and enhanced tracking to shopping_items table
-- Date: 2026-01-27

-- Add new columns to shopping_items
ALTER TABLE shopping_items 
ADD COLUMN IF NOT EXISTS store_id TEXT,
ADD COLUMN IF NOT EXISTS unit TEXT,
ADD COLUMN IF NOT EXISTS source TEXT DEFAULT 'manual',
ADD COLUMN IF NOT EXISTS source_craving_id UUID REFERENCES cravings(id),
ADD COLUMN IF NOT EXISTS notes TEXT;

-- Create index for store filtering
CREATE INDEX IF NOT EXISTS idx_shopping_items_store ON shopping_items(store_id);

-- Create index for source tracking
CREATE INDEX IF NOT EXISTS idx_shopping_items_source ON shopping_items(source, source_craving_id);

-- Add comment for documentation
COMMENT ON COLUMN shopping_items.store_id IS 'UK supermarket ID: sainsburys, asda, morrisons, lidl, waitrose, aldi, coop, iceland, marks';
COMMENT ON COLUMN shopping_items.unit IS 'Unit of measurement: g, L, pcs, etc.';
COMMENT ON COLUMN shopping_items.source IS 'How item was added: manual, craving, or ai';
COMMENT ON COLUMN shopping_items.source_craving_id IS 'Reference to craving if item came from craving';
COMMENT ON COLUMN shopping_items.notes IS 'User notes for the item';
