-- ============================================================================
-- Migration: Enhanced Cravings Table
-- Purpose: Add AI analysis fields and recipe details to cravings table
-- Date: 2026-01-25
-- ============================================================================

-- Add new columns to cravings table
ALTER TABLE cravings 
  ADD COLUMN IF NOT EXISTS cuisine TEXT,
  ADD COLUMN IF NOT EXISTS difficulty TEXT CHECK (difficulty IN ('easy', 'medium', 'hard')),
  ADD COLUMN IF NOT EXISTS required_ingredients JSONB,
  ADD COLUMN IF NOT EXISTS estimated_time TEXT,
  ADD COLUMN IF NOT EXISTS instructions TEXT,
  ADD COLUMN IF NOT EXISTS source_url TEXT;

-- Add comments for documentation
COMMENT ON COLUMN cravings.cuisine IS 'Type of cuisine (e.g., Chinese, Italian, Japanese)';
COMMENT ON COLUMN cravings.difficulty IS 'Cooking difficulty: easy, medium, or hard';
COMMENT ON COLUMN cravings.required_ingredients IS 'JSON array of ingredients with name, quantity, unit, essential fields';
COMMENT ON COLUMN cravings.estimated_time IS 'Human-readable cooking time estimate (e.g., "30 minutes", "1 hour")';
COMMENT ON COLUMN cravings.instructions IS 'Cooking instructions or recipe steps';
COMMENT ON COLUMN cravings.source_url IS 'Original recipe URL if added from link';

-- Create index for better query performance
CREATE INDEX IF NOT EXISTS idx_cravings_difficulty ON cravings(difficulty) WHERE difficulty IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_cravings_cuisine ON cravings(cuisine) WHERE cuisine IS NOT NULL;

-- Update RPC function to support new fields
CREATE OR REPLACE FUNCTION insert_craving(
  p_device_id TEXT,
  p_name TEXT,
  p_image_url TEXT DEFAULT NULL,
  p_source TEXT DEFAULT 'manual',
  p_note TEXT DEFAULT NULL,
  p_cuisine TEXT DEFAULT NULL,
  p_difficulty TEXT DEFAULT NULL,
  p_required_ingredients JSONB DEFAULT NULL,
  p_estimated_time TEXT DEFAULT NULL,
  p_instructions TEXT DEFAULT NULL,
  p_source_url TEXT DEFAULT NULL
)
RETURNS TABLE (
  id UUID,
  device_id TEXT,
  name TEXT,
  image_url TEXT,
  source TEXT,
  note TEXT,
  is_archived BOOLEAN,
  created_at TIMESTAMPTZ,
  cuisine TEXT,
  difficulty TEXT,
  required_ingredients JSONB,
  estimated_time TEXT,
  instructions TEXT,
  source_url TEXT
) 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  INSERT INTO cravings (
    device_id,
    name,
    image_url,
    source,
    note,
    cuisine,
    difficulty,
    required_ingredients,
    estimated_time,
    instructions,
    source_url
  )
  VALUES (
    p_device_id,
    p_name,
    p_image_url,
    p_source,
    p_note,
    p_cuisine,
    p_difficulty,
    p_required_ingredients,
    p_estimated_time,
    p_instructions,
    p_source_url
  )
  RETURNING 
    cravings.id,
    cravings.device_id,
    cravings.name,
    cravings.image_url,
    cravings.source,
    cravings.note,
    cravings.is_archived,
    cravings.created_at,
    cravings.cuisine,
    cravings.difficulty,
    cravings.required_ingredients,
    cravings.estimated_time,
    cravings.instructions,
    cravings.source_url;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION insert_craving TO anon, authenticated;

-- Verification query
SELECT 
  column_name, 
  data_type, 
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_name = 'cravings' 
ORDER BY ordinal_position;
