-- ============================================================================
-- Fix: Drop all versions of insert_craving and recreate with new column
-- Purpose: Resolve function name conflict
-- Date: 2026-01-26
-- ============================================================================

-- Step 1: Find all existing versions
SELECT 
  p.proname as function_name,
  pg_get_function_identity_arguments(p.oid) as arguments
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE p.proname = 'insert_craving'
  AND n.nspname = 'public';

-- Step 2: Drop ALL versions (using CASCADE to be safe)
DROP FUNCTION IF EXISTS public.insert_craving CASCADE;

-- Step 3: Recreate with new parameter
CREATE OR REPLACE FUNCTION insert_craving(
  p_device_id UUID,
  p_name TEXT,
  p_image_url TEXT DEFAULT NULL,
  p_source TEXT DEFAULT 'manual',
  p_note TEXT DEFAULT NULL,
  p_cuisine TEXT DEFAULT NULL,
  p_difficulty TEXT DEFAULT NULL,
  p_top_ingredient_emojis TEXT[] DEFAULT NULL,
  p_required_ingredients JSONB DEFAULT NULL,
  p_estimated_time TEXT DEFAULT NULL,
  p_instructions TEXT DEFAULT NULL,
  p_source_url TEXT DEFAULT NULL
)
RETURNS TABLE (
  id UUID,
  device_id UUID,
  name TEXT,
  image_url TEXT,
  source TEXT,
  note TEXT,
  is_archived BOOLEAN,
  created_at TIMESTAMPTZ,
  cuisine TEXT,
  difficulty TEXT,
  top_ingredient_emojis TEXT[],
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
    top_ingredient_emojis,
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
    p_top_ingredient_emojis,
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
    cravings.top_ingredient_emojis,
    cravings.required_ingredients,
    cravings.estimated_time,
    cravings.instructions,
    cravings.source_url;
END;
$$;

-- Step 4: Grant permissions
GRANT EXECUTE ON FUNCTION insert_craving TO anon, authenticated;

-- Step 5: Verify
SELECT 
  p.proname as function_name,
  pg_get_function_identity_arguments(p.oid) as arguments,
  'Success' as status
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE p.proname = 'insert_craving'
  AND n.nspname = 'public';

SELECT '✅ Function recreated successfully!' as final_status;
