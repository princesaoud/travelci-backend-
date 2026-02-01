-- Create storage bucket for owner ID documents
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'id-documents',
  'id-documents',
  true,
  10485760, -- 10MB
  ARRAY['image/png', 'image/jpeg', 'image/webp', 'image/jpg']
)
ON CONFLICT (id) DO NOTHING;

-- Allow public read (for profile display)
CREATE POLICY "Public read id-documents"
ON storage.objects FOR SELECT
USING (bucket_id = 'id-documents');

-- Allow authenticated users to upload to their folder
CREATE POLICY "Authenticated upload id-documents"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'id-documents'
  AND auth.role() = 'authenticated'
);

CREATE POLICY "Authenticated update id-documents"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'id-documents'
  AND auth.role() = 'authenticated'
);

CREATE POLICY "Authenticated delete id-documents"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'id-documents'
  AND auth.role() = 'authenticated'
);
