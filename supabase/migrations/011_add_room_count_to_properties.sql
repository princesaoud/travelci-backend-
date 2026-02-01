-- Add nombre de pièces (room count) to properties
-- 1 = studio, 2 = 2 pièces (1 chambre + 1 séjour), etc.
ALTER TABLE properties
ADD COLUMN IF NOT EXISTS room_count INTEGER;

COMMENT ON COLUMN properties.room_count IS 'Nombre de pièces: 1=studio, 2=2 pièces (1 chambre + séjour), etc.';

-- Default existing rows to 1 (studio) if null for consistency
UPDATE properties SET room_count = 1 WHERE room_count IS NULL;
