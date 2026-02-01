-- Add national ID image URLs for owners (recto and verso)
ALTER TABLE users
ADD COLUMN IF NOT EXISTS national_id_front_url TEXT,
ADD COLUMN IF NOT EXISTS national_id_back_url TEXT;

COMMENT ON COLUMN users.national_id_front_url IS 'URL of the owner national ID card (front)';
COMMENT ON COLUMN users.national_id_back_url IS 'URL of the owner national ID card (back)';
