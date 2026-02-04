-- Migration: Add user_store_preferences table for personalized classification
-- Purpose: Learn user shopping habits to improve AI classification

CREATE TABLE IF NOT EXISTS user_store_preferences (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    device_id TEXT NOT NULL,
    item_name TEXT NOT NULL,
    preferred_store TEXT NOT NULL, -- uk_supermarket enum value or 'any'
    frequency INT DEFAULT 1, -- Number of times user chose this store for this item
    last_used_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(device_id, item_name, preferred_store)
);

-- Index for fast lookup by device and item
CREATE INDEX IF NOT EXISTS idx_user_store_preferences_lookup 
ON user_store_preferences(device_id, item_name);

-- RLS Policies (Row Level Security)
ALTER TABLE user_store_preferences ENABLE ROW LEVEL SECURITY;

-- Allow users to read their own preferences
CREATE POLICY "Users can read their own store preferences"
ON user_store_preferences
FOR SELECT
USING (true); -- Public for now since we use device_id

-- Allow users to insert their preferences
CREATE POLICY "Users can insert their own store preferences"
ON user_store_preferences
FOR INSERT
WITH CHECK (true);

-- Allow users to update their preferences
CREATE POLICY "Users can update their own store preferences"
ON user_store_preferences
FOR UPDATE
USING (true);

-- Function to record or update store preference
CREATE OR REPLACE FUNCTION record_store_preference(
    p_device_id TEXT,
    p_item_name TEXT,
    p_preferred_store TEXT
)
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
    -- Normalize item name (lowercase, trim)
    p_item_name := LOWER(TRIM(p_item_name));
    
    -- Insert or update preference
    INSERT INTO user_store_preferences (device_id, item_name, preferred_store, frequency, last_used_at)
    VALUES (p_device_id, p_item_name, p_preferred_store, 1, NOW())
    ON CONFLICT (device_id, item_name, preferred_store)
    DO UPDATE SET
        frequency = user_store_preferences.frequency + 1,
        last_used_at = NOW();
END;
$$;

-- Function to get user's preferred store for an item
CREATE OR REPLACE FUNCTION get_preferred_store(
    p_device_id TEXT,
    p_item_name TEXT
)
RETURNS TABLE(preferred_store TEXT, frequency INT)
LANGUAGE plpgsql
AS $$
BEGIN
    p_item_name := LOWER(TRIM(p_item_name));
    
    RETURN QUERY
    SELECT usp.preferred_store, usp.frequency
    FROM user_store_preferences usp
    WHERE usp.device_id = p_device_id
      AND usp.item_name = p_item_name
    ORDER BY usp.frequency DESC, usp.last_used_at DESC
    LIMIT 1;
END;
$$;
