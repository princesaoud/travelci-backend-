# Troubleshooting Guide - Login Issues

## Current Error
```
"Erreur lors de la connexion" - Could not find the table 'public.users' in the schema cache (PGRST205)
```

## Problem Summary

1. **Schema Cache Issue**: The Node.js Supabase client can't see the database tables even though PostgREST can
2. **Seed Password Hashes**: The seed.sql file has placeholder password hashes that don't match "password123"

## Solutions

### Solution 1: Fix Schema Cache + Create Real User

**Step 1:** Access Supabase Studio
- Open: http://127.0.0.1:54323
- Go to SQL Editor

**Step 2:** Generate a real password hash and create user
```sql
-- Generate bcrypt hash for "password123" (use Node.js to generate this)
-- Or use this pre-generated hash:
INSERT INTO users (id, full_name, email, password_hash, role, is_verified) 
VALUES (
  gen_random_uuid(),
  'Test User',
  'test@example.com',
  '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', -- This is a real bcrypt hash for "password123"
  'client',
  true
)
ON CONFLICT (email) DO UPDATE 
SET password_hash = EXCLUDED.password_hash;
```

**Step 3:** Test login with the new user
```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123"}'
```

### Solution 2: Use Existing Users (Once Schema Cache is Fixed)

If schema cache gets fixed, you can update existing users' passwords:

```sql
-- Update password hash for john@example.com
UPDATE users 
SET password_hash = '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi'
WHERE email = 'john@example.com';
```

### Solution 3: Generate New Password Hash (Node.js)

Run this in Node.js to generate a real hash:
```javascript
const bcrypt = require('bcrypt');
bcrypt.hash('password123', 10).then(hash => console.log(hash));
```

## Testing After Fix

Once schema cache is resolved:

**Login Test:**
```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123"}'
```

**Expected Success Response:**
```json
{
  "success": true,
  "data": {
    "user": { ... },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

## Rate Limit Reset

If you hit rate limits, restart the API server:
```bash
# Stop server (Ctrl+C or kill process)
# Then restart
npm run dev
```

Rate limit: **5 requests per 15 minutes** for auth endpoints.

