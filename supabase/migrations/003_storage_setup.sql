-- ============================================
-- PWM Expense Vouchers - Storage Setup
-- Migration 003: Receipt upload bucket + policies
-- ============================================

-- Create public storage bucket for voucher receipts
INSERT INTO storage.buckets (id, name, public, file_size_limit)
VALUES (
  'vouchers',
  'vouchers',
  true,
  5242880
)
ON CONFLICT (id) DO UPDATE SET
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit;

-- Drop existing storage policies if re-running
DROP POLICY IF EXISTS "Authenticated users can upload receipts" ON storage.objects;
DROP POLICY IF EXISTS "Public can view receipt files" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can update own receipts" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can delete own receipts" ON storage.objects;

-- Allow logged-in users to upload receipt files
CREATE POLICY "Authenticated users can upload receipts"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'vouchers'
  AND (storage.foldername(name))[1] = 'receipts'
);

-- Allow anyone to view/download receipt files (public bucket)
CREATE POLICY "Public can view receipt files"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'vouchers');

-- Allow users to replace receipt files they uploaded
CREATE POLICY "Authenticated users can update own receipts"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'vouchers'
  AND auth.uid() = owner
)
WITH CHECK (
  bucket_id = 'vouchers'
  AND (storage.foldername(name))[1] = 'receipts'
);

-- Allow users to delete receipt files they uploaded
CREATE POLICY "Authenticated users can delete own receipts"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'vouchers'
  AND auth.uid() = owner
);
