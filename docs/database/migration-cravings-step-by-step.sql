-- ============================================================================
-- Step-by-Step Migration: Enhanced Cravings Table
-- Execute each section separately to identify any issues
-- ============================================================================

-- ============================================================================
-- STEP 1: Add columns one by one
-- ============================================================================

-- Add cuisine column
ALTER TABLE cravings ADD COLUMN IF NOT EXISTS cuisine TEXT;

-- Add difficulty column with constraint
ALTER TABLE cravings ADD COLUMN IF NOT EXISTS difficulty TEXT;
ALTER TABLE cravings DROP CONSTRAINT IF EXISTS cravings_difficulty_check;
ALTER TABLE cravings ADD CONSTRAINT cravings_difficulty_check 
  CHECK (difficulty IN ('easy', 'medium', 'hard'));

-- Add required_ingredients column
ALTER TABLE cravings ADD COLUMN IF NOT EXISTS required_ingredients JSONB;

-- Add estimated_time column
ALTER TABLE cravings ADD COLUMN IF NOT EXISTS estimated_time TEXT;

-- Add instructions column
ALTER TABLE cravings ADD COLUMN IF NOT EXISTS instructions TEXT;

-- Add source_url column
ALTER TABLE cravings ADD COLUMN IF NOT EXISTS source_url TEXT;

-- Verify columns were added
SELECT 
  column_name, 
  data_type,
  is_nullable
FROM information_schema.columns 
WHERE table_name = 'cravings' 
  AND column_name IN (
    'cuisine', 
    'difficulty', 
    'required_ingredients', 
    'estimated_time', 
    'instructions', 
    'source_url'
  )
ORDER BY ordinal_position;

-- Expected: 6 rows

-- ============================================================================
-- STEP 2: Add comments
-- ============================================================================

COMMENT ON COLUMN cravings.cuisine IS 'Type of cuisine (e.g., Chinese, Italian, Japanese)';
COMMENT ON COLUMN cravings.difficulty IS 'Cooking difficulty: easy, medium, or hard';
COMMENT ON COLUMN cravings.required_ingredients IS 'JSON array of ingredients with name, quantity, unit, essential fields';
COMMENT ON COLUMN cravings.estimated_time IS 'Human-readable cooking time estimate (e.g., "30 minutes", "1 hour")';
COMMENT ON COLUMN cravings.instructions IS 'Cooking instructions or recipe steps';
COMMENT ON COLUMN cravings.source_url IS 'Original recipe URL if added from link';

-- ============================================================================
-- STEP 3: Create indexes
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_cravings_difficulty 
  ON cravings(difficulty) 
  WHERE difficulty IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_cravings_cuisine 
  ON cravings(cuisine) 
  WHERE cuisine IS NOT NULL;

-- Verify indexes
SELECT 
  indexname,
  indexdef
FROM pg_indexes
WHERE tablename = 'cravings'
  AND indexname IN ('idx_cravings_difficulty', 'idx_cravings_cuisine');

-- Expected: 2 rows

-- ============================================================================
-- STEP 4: Update RPC function
-- ============================================================================

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

-- Grant permissions
GRANT EXECUTE ON FUNCTION insert_craving TO anon, authenticated;

-- ============================================================================
-- FINAL VERIFICATION
-- ============================================================================

-- Check all columns
SELECT 
  column_name, 
  data_type, 
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_name = 'cravings' 
ORDER BY ordinal_position;

-- Check function exists
SELECT 
  routine_name,
  routine_type
FROM information_schema.routines
WHERE routine_name = 'insert_craving'
  AND routine_schema = 'public';

-- Success message
SELECT '✅ Migration completed successfully!' as status;
