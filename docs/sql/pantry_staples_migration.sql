-- ============================================
-- Pantry Staples Table Migration
-- ============================================
-- Creates the pantry_staples table for managing pantry inventory
-- Score: 0-100 (0 = out of stock, 100 = fully stocked)
-- Low stock threshold: < 20 (auto-add to shopping list)

CREATE TABLE IF NOT EXISTS pantry_staples (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  device_id UUID NOT NULL REFERENCES devices(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  category TEXT DEFAULT 'condiment',  -- condiment/grain/oil/other
  score INTEGER DEFAULT 100 CHECK (score >= 0 AND score <= 100),  -- 0-100, below 20 triggers restock
  last_used TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(device_id, name)  -- Prevent duplicate staples per device
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_pantry_staples_device ON pantry_staples(device_id);
CREATE INDEX IF NOT EXISTS idx_pantry_staples_score ON pantry_staples(device_id, score);

-- Updated_at trigger
CREATE OR REPLACE FUNCTION update_pantry_staples_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER pantry_staples_updated_at
  BEFORE UPDATE ON pantry_staples
  FOR EACH ROW
  EXECUTE FUNCTION update_pantry_staples_updated_at();

-- RLS Policies
ALTER TABLE pantry_staples ENABLE ROW LEVEL SECURITY;

-- Users can only see their own pantry staples
CREATE POLICY "Users can view own pantry staples"
  ON pantry_staples FOR SELECT
  USING (device_id = current_setting('app.device_id', true)::uuid);

-- Users can insert their own pantry staples
CREATE POLICY "Users can insert own pantry staples"
  ON pantry_staples FOR INSERT
  WITH CHECK (device_id = current_setting('app.device_id', true)::uuid);

-- Users can update their own pantry staples
CREATE POLICY "Users can update own pantry staples"
  ON pantry_staples FOR UPDATE
  USING (device_id = current_setting('app.device_id', true)::uuid)
  WITH CHECK (device_id = current_setting('app.device_id', true)::uuid);

-- Users can delete their own pantry staples
CREATE POLICY "Users can delete own pantry staples"
  ON pantry_staples FOR DELETE
  USING (device_id = current_setting('app.device_id', true)::uuid);

-- Comments
COMMENT ON TABLE pantry_staples IS 'Pantry staples inventory - items users always keep in stock';
COMMENT ON COLUMN pantry_staples.score IS 'Stock level: 0-100 (0 = out, 100 = full). Below 20 triggers auto-add to shopping list';
COMMENT ON COLUMN pantry_staples.category IS 'Item category: condiment, grain, oil, other';
COMMENT ON COLUMN pantry_staples.last_used IS 'Last time this item was used (for tracking consumption patterns)';
