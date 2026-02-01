-- ============================================================
-- Run this in Supabase Dashboard → SQL Editor → New query
-- You can run all at once, or each section separately (in order).
-- ============================================================

-- ---------- 011: room_count on properties ----------
ALTER TABLE properties
ADD COLUMN IF NOT EXISTS room_count INTEGER;

COMMENT ON COLUMN properties.room_count IS 'Nombre de pièces: 1=studio, 2=2 pièces (1 chambre + séjour), etc.';

UPDATE properties SET room_count = 1 WHERE room_count IS NULL;


-- ---------- 013: national ID URLs on users ----------
ALTER TABLE users
ADD COLUMN IF NOT EXISTS national_id_front_url TEXT,
ADD COLUMN IF NOT EXISTS national_id_back_url TEXT;

COMMENT ON COLUMN users.national_id_front_url IS 'URL of the owner national ID card (front)';
COMMENT ON COLUMN users.national_id_back_url IS 'URL of the owner national ID card (back)';


-- ---------- 014: id-documents storage bucket ----------
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'id-documents',
  'id-documents',
  true,
  10485760,
  ARRAY['image/png', 'image/jpeg', 'image/webp', 'image/jpg']
)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Public read id-documents"
ON storage.objects FOR SELECT
USING (bucket_id = 'id-documents');

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
