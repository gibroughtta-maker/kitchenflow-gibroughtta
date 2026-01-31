-- ============================================
-- Update insert_fridge_snapshot Function
-- Created: 2026-01-26
-- Purpose: Add image URL parameters to support Supabase Storage
-- ============================================

-- Drop existing function
DROP FUNCTION IF EXISTS insert_fridge_snapshot(TEXT, JSONB, TEXT);

-- Create updated function with image URL parameters
CREATE OR REPLACE FUNCTION insert_fridge_snapshot(
  p_device_id TEXT,
  p_items JSONB,
  p_scan_quality TEXT,
  p_image_urls TEXT[] DEFAULT '{}',
  p_thumbnail_urls TEXT[] DEFAULT '{}'
)
RETURNS fridge_snapshots
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_snapshot fridge_snapshots;
BEGIN
  -- Insert new snapshot
  INSERT INTO fridge_snapshots (
    device_id,
    items,
    scan_quality,
    image_urls,
    thumbnail_urls,
    scanned_at
  )
  VALUES (
    p_device_id,
    p_items,
    p_scan_quality::scan_quality_type,
    p_image_urls,
    p_thumbnail_urls,
    NOW()
  )
  RETURNING * INTO v_snapshot;

  RETURN v_snapshot;
END;
$$;

-- Add comment
COMMENT ON FUNCTION insert_fridge_snapshot IS 'Insert fridge snapshot with image URLs, bypassing RLS';

-- Grant execute permission
GRANT EXECUTE ON FUNCTION insert_fridge_snapshot TO anon, authenticated;

-- Verify function
SELECT 
  routine_name,
  routine_type,
  data_type
FROM information_schema.routines
WHERE routine_name = 'insert_fridge_snapshot';
