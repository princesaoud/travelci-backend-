-- Fix password hashes for test users
-- This migration updates the password hashes for the test users (john@example.com, jane@example.com, admin@example.com)
-- to use the correct bcrypt hash for password "password123"
-- 
-- Password: "password123"
-- Hash: $2b$10$0oBGNf/on5kOZucCP9HzB.9T75g8y/96M1PyO38CAsrQdbwBSc7Jm

UPDATE users 
SET password_hash = '$2b$10$0oBGNf/on5kOZucCP9HzB.9T75g8y/96M1PyO38CAsrQdbwBSc7Jm'
WHERE email IN ('john@example.com', 'jane@example.com', 'admin@example.com')
  AND (password_hash IS NULL OR password_hash = '$2b$10$rOzJ8K8qK8qK8qK8qK8qKu8qK8qK8qK8qK8qK8qK8qK8qK8qK8qK');

-- Also ensure the users exist with correct data (in case seed.sql wasn't run)
INSERT INTO users (id, full_name, email, phone, password_hash, role, is_verified) VALUES
('00000000-0000-0000-0000-000000000001', 'John Doe', 'john@example.com', '+1234567890', '$2b$10$0oBGNf/on5kOZucCP9HzB.9T75g8y/96M1PyO38CAsrQdbwBSc7Jm', 'client', true),
('00000000-0000-0000-0000-000000000002', 'Jane Owner', 'jane@example.com', '+1234567891', '$2b$10$0oBGNf/on5kOZucCP9HzB.9T75g8y/96M1PyO38CAsrQdbwBSc7Jm', 'owner', true),
('00000000-0000-0000-0000-000000000003', 'Admin User', 'admin@example.com', '+1234567892', '$2b$10$0oBGNf/on5kOZucCP9HzB.9T75g8y/96M1PyO38CAsrQdbwBSc7Jm', 'admin', true)
ON CONFLICT (email) DO UPDATE SET
  password_hash = EXCLUDED.password_hash,
  full_name = EXCLUDED.full_name,
  phone = EXCLUDED.phone,
  role = EXCLUDED.role,
  is_verified = EXCLUDED.is_verified;
