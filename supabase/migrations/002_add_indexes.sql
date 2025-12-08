-- Full-text search index for properties
CREATE INDEX IF NOT EXISTS idx_properties_fulltext ON properties 
USING gin(to_tsvector('french', title || ' ' || COALESCE(description, '')));

-- Composite index for common property queries
CREATE INDEX IF NOT EXISTS idx_properties_city_type_price ON properties(city, type, price_per_night);

-- Index for booking availability checks
CREATE INDEX IF NOT EXISTS idx_bookings_property_status_dates ON bookings(property_id, status, start_date, end_date) 
WHERE status IN ('pending', 'accepted');

