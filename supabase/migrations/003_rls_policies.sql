-- Enable Row Level Security (optional, can be managed through Supabase dashboard)
-- These policies are examples and should be configured based on your security requirements

-- Users can read their own data
-- ALTER TABLE users ENABLE ROW LEVEL SECURITY;
-- CREATE POLICY "Users can view own profile" ON users FOR SELECT USING (auth.uid() = id);

-- Properties are publicly readable
-- ALTER TABLE properties ENABLE ROW LEVEL SECURITY;
-- CREATE POLICY "Properties are publicly readable" ON properties FOR SELECT USING (true);
-- CREATE POLICY "Owners can manage their properties" ON properties FOR ALL USING (auth.uid() = owner_id);

-- Bookings: clients see their bookings, owners see bookings for their properties
-- ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;
-- CREATE POLICY "Clients can view own bookings" ON bookings FOR SELECT USING (auth.uid() = client_id);
-- CREATE POLICY "Owners can view bookings for their properties" ON bookings FOR SELECT 
--   USING (EXISTS (SELECT 1 FROM properties WHERE properties.id = bookings.property_id AND properties.owner_id = auth.uid()));

