-- ============================================================================
-- Verification: Enhanced Cravings Migration
-- Purpose: Verify that all new columns and functions exist
-- ============================================================================

-- 1. Check if new columns exist
SELECT 
  column_name, 
  data_type,
  is_nullable,
  column_default
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

-- Expected: 6 rows returned

-- 2. Check indexes
SELECT 
  indexname,
  indexdef
FROM pg_indexes
WHERE tablename = 'cravings'
  AND indexname IN ('idx_cravings_difficulty', 'idx_cravings_cuisine');

-- Expected: 2 rows returned

-- 3. Check RPC function exists
SELECT 
  routine_name,
  routine_type,
  data_type
FROM information_schema.routines
WHERE routine_name = 'insert_craving'
  AND routine_schema = 'public';

-- Expected: 1 row returned

-- 4. Check function parameters
SELECT 
  parameter_name,
  data_type
FROM information_schema.parameters
WHERE specific_name = (
  SELECT specific_name 
  FROM information_schema.routines 
  WHERE routine_name = 'insert_craving' 
    AND routine_schema = 'public'
)
ORDER BY ordinal_position;

-- Expected: Should include p_cuisine, p_difficulty, p_required_ingredients, etc.

-- 5. Test data check (if any cravings exist)
SELECT 
  COUNT(*) as total_cravings,
  COUNT(cuisine) as with_cuisine,
  COUNT(difficulty) as with_difficulty,
  COUNT(required_ingredients) as with_ingredients,
  COUNT(estimated_time) as with_time,
  COUNT(image_url) as with_image
FROM cravings
WHERE is_archived = false;

-- 6. Sample data (latest 5 cravings)
SELECT 
  name,
  cuisine,
  difficulty,
  estimated_time,
  CASE 
    WHEN required_ingredients IS NOT NULL 
    THEN jsonb_array_length(required_ingredients) 
    ELSE 0 
  END as ingredient_count,
  image_url IS NOT NULL as has_image,
  created_at
FROM cravings
WHERE is_archived = false
ORDER BY created_at DESC
LIMIT 5;
