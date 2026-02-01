-- Seed data for development/testing
-- Note: Passwords are hashed with bcrypt (10 rounds)
-- Default password for all seed users: "password123"

-- Insert sample users
-- Password for all users: "password123"
INSERT INTO users (id, full_name, email, phone, password_hash, role, is_verified) VALUES
('00000000-0000-0000-0000-000000000001', 'John Doe', 'john@example.com', '+1234567890', '$2b$10$0oBGNf/on5kOZucCP9HzB.9T75g8y/96M1PyO38CAsrQdbwBSc7Jm', 'client', true),
('00000000-0000-0000-0000-000000000002', 'Jane Owner', 'jane@example.com', '+1234567891', '$2b$10$0oBGNf/on5kOZucCP9HzB.9T75g8y/96M1PyO38CAsrQdbwBSc7Jm', 'owner', true),
('00000000-0000-0000-0000-000000000003', 'Admin User', 'admin@example.com', '+1234567892', '$2b$10$0oBGNf/on5kOZucCP9HzB.9T75g8y/96M1PyO38CAsrQdbwBSc7Jm', 'admin', true)
ON CONFLICT (email) DO NOTHING;

-- Insert sample properties
INSERT INTO properties (id, owner_id, title, description, type, furnished, price_per_night, address, city, latitude, longitude, image_urls, amenities) VALUES
('10000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000002', 'Beautiful Apartment in Paris', 'Spacious 2-bedroom apartment in the heart of Paris', 'apartment', true, 120, '123 Rue de la Paix', 'Paris', 48.8566, 2.3522, ARRAY[]::TEXT[], ARRAY['WiFi', 'Kitchen', 'TV']::TEXT[]),
('10000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000002', 'Luxury Villa in Nice', 'Stunning villa with sea view and private pool', 'villa', true, 350, '456 Promenade des Anglais', 'Nice', 43.7102, 7.2620, ARRAY[]::TEXT[], ARRAY['Pool', 'WiFi', 'Parking', 'Garden']::TEXT[])
ON CONFLICT DO NOTHING;

