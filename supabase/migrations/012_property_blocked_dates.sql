-- Owner-defined blocked dates (unavailability) per property
-- When a date is blocked, the property cannot be booked for that date
CREATE TABLE IF NOT EXISTS property_blocked_dates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id UUID NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
  blocked_date DATE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(property_id, blocked_date)
);

CREATE INDEX IF NOT EXISTS idx_property_blocked_dates_property_id ON property_blocked_dates(property_id);
CREATE INDEX IF NOT EXISTS idx_property_blocked_dates_blocked_date ON property_blocked_dates(blocked_date);

COMMENT ON TABLE property_blocked_dates IS 'Dates marquées indisponibles par le propriétaire (maintenance, usage personnel, etc.)';
