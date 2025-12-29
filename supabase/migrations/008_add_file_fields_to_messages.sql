-- Add file fields to messages table
ALTER TABLE messages 
ADD COLUMN IF NOT EXISTS file_url TEXT,
ADD COLUMN IF NOT EXISTS file_name VARCHAR(255),
ADD COLUMN IF NOT EXISTS file_size INTEGER;

-- Add index for file_url queries
CREATE INDEX IF NOT EXISTS idx_messages_file_url ON messages(file_url) WHERE file_url IS NOT NULL;

-- Comments
COMMENT ON COLUMN messages.file_url IS 'URL of the uploaded file (for file/image messages)';
COMMENT ON COLUMN messages.file_name IS 'Original filename of the uploaded file';
COMMENT ON COLUMN messages.file_size IS 'Size of the file in bytes';

