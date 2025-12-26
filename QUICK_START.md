# 🚀 Quick Start - Run Migrations on Cloud Supabase

## Problem
Your API is configured to use **cloud Supabase**, but the database tables don't exist yet. That's why registration/login is failing.

## Solution: Run Migrations

### Step 1: Open Supabase Dashboard
Go to: **https://supabase.com/dashboard/project/lhpimoqhebpuwzyqlsfg/sql/new**

### Step 2: Run All Migrations
1. Open the file: `ALL_MIGRATIONS_COMBINED.sql` (in your project root)
2. Copy **ALL** the SQL code
3. Paste it into the SQL Editor
4. Click **Run** (or press Ctrl+Enter)

### Step 3: Verify Tables Created
1. Go to **Table Editor** in Supabase Dashboard
2. You should see: `users`, `properties`, `bookings` tables

### Step 4: Test API
```bash
# Register a new user
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "full_name": "Test User",
    "email": "test@example.com",
    "password": "password123",
    "role": "client"
  }'
```

---

## Alternative: Use Local Supabase (If Cloud Doesn't Work)

If you want to test with local Supabase instead:

1. Stop cloud Supabase usage by commenting out SUPABASE_URL in .env:
   ```env
   # SUPABASE_URL=https://lhpimoqhebpuwzyqlsfg.supabase.co
   ```

2. Make sure local Supabase is running:
   ```bash
   npm run supabase:start
   ```

3. Restart API server:
   ```bash
   npm run dev
   ```

---

## After Migrations Are Run

Your API will work! You'll be able to:
- ✅ Register users
- ✅ Login and get tokens
- ✅ Access all endpoints
- ✅ Test in Postman

