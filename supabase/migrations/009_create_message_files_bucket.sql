-- Create storage bucket for message files
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'message-files',
  'message-files',
  true,
  20971520, -- 20MB in bytes
  NULL -- Allow all file types
)
ON CONFLICT (id) DO NOTHING;

-- Set up storage policies for message-files bucket
-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Public Access Message Files" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload message files" ON storage.objects;
DROP POLICY IF EXISTS "Users can update own message files" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete own message files" ON storage.objects;

-- Allow public read access
CREATE POLICY "Public Access Message Files"
ON storage.objects FOR SELECT
USING (bucket_id = 'message-files');

-- Allow authenticated users to upload
CREATE POLICY "Authenticated users can upload message files"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'message-files' 
  AND auth.role() = 'authenticated'
);

-- Allow users to update their own uploads
CREATE POLICY "Users can update own message files"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'message-files'
  AND auth.role() = 'authenticated'
);

-- Allow users to delete their own uploads
CREATE POLICY "Users can delete own message files"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'message-files'
  AND auth.role() = 'authenticated'
);

