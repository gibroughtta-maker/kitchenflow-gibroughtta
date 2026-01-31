-- ============================================================================
-- Add top_ingredient_emojis column to cravings table
-- Purpose: Store AI-generated top 3 ingredient emojis for visual display
-- Date: 2026-01-26
-- ============================================================================

-- Add column for emoji array
ALTER TABLE cravings 
  ADD COLUMN IF NOT EXISTS top_ingredient_emojis TEXT[];

-- Add comment
COMMENT ON COLUMN cravings.top_ingredient_emojis IS 'Array of 3 emoji representing top ingredients for visual display (方案 D)';

-- Verify
SELECT 
  column_name, 
  data_type,
  is_nullable
FROM information_schema.columns 
WHERE table_name = 'cravings' 
  AND column_name = 'top_ingredient_emojis';

-- Expected: 1 row with data_type = 'ARRAY'
