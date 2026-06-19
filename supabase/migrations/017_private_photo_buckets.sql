-- 017: Private Photo Buckets
-- Make photo storage buckets private (authenticated access only)

-- Drop existing public SELECT policies
DROP POLICY IF EXISTS "Public can view event photos" ON storage.objects;
DROP POLICY IF EXISTS "Public can view observation photos" ON storage.objects;
DROP POLICY IF EXISTS "Public can view inspection photos" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can view event-photos" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can view observation-photos" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can view inspection-photos" ON storage.objects;
DROP POLICY IF EXISTS "Public read event-photos" ON storage.objects;
DROP POLICY IF EXISTS "Public read observation-photos" ON storage.objects;
DROP POLICY IF EXISTS "Public read inspection-photos" ON storage.objects;

-- Set buckets to private
UPDATE storage.buckets SET public = false WHERE id IN ('event-photos', 'observation-photos', 'inspection-photos');

-- Create authenticated-only SELECT policies
CREATE POLICY "Authenticated users can view event-photos"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'event-photos' AND auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can view observation-photos"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'observation-photos' AND auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can view inspection-photos"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'inspection-photos' AND auth.uid() IS NOT NULL);
