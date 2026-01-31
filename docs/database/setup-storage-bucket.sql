-- ============================================
-- Supabase Storage Configuration
-- Created: 2026-01-26
-- Purpose: Setup image storage for KitchenFlow
-- ============================================

-- 1. Create storage bucket for images
INSERT INTO storage.buckets (id, name, public)
VALUES ('kitchenflow-images', 'kitchenflow-images', true)
ON CONFLICT (id) DO NOTHING;

-- 2. Set up RLS policies for image uploads
-- Policy: Users can upload their own images
CREATE POLICY "Users can upload their own images"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'kitchenflow-images' 
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Policy: Users can view their own images
CREATE POLICY "Users can view their own images"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'kitchenflow-images' 
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Policy: Users can update their own images
CREATE POLICY "Users can update their own images"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'kitchenflow-images' 
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Policy: Users can delete their own images
CREATE POLICY "Users can delete their own images"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'kitchenflow-images' 
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- 3. Folder structure
-- Images will be organized as:
-- {userId}/fridge-scans/{timestamp}-{uuid}.jpg
-- {userId}/receipts/{timestamp}-{uuid}.jpg
-- {userId}/items/{timestamp}-{uuid}.jpg

-- 4. Verify bucket creation
SELECT * FROM storage.buckets WHERE id = 'kitchenflow-images';

-- 5. Verify policies
SELECT * FROM pg_policies WHERE tablename = 'objects' AND policyname LIKE '%kitchenflow%';
