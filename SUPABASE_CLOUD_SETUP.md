# Supabase Cloud Setup Guide

## Your Cloud Supabase Configuration

✅ **Your Cloud Project:**
- **Project URL:** https://lhpimoqhebpuwzyqlsfg.supabase.co
- **Dashboard:** https://supabase.com/dashboard/project/lhpimoqhebpuwzyqlsfg

✅ **API Keys (already in your .env):**
- **Anon Key:** `sb_publishable_RlCYbI54pT5cmxuIPu8KaA_13O8GI3h`
- **Service Role Key:** `sb_secret_ksCbIyZelsCqwWErvXZHGA_HqyaMeLn`

---

## Step 1: Run Database Migrations

Your cloud database needs the tables created. Run the migrations:

### Option A: Via Supabase Dashboard (Easiest)

1. Go to: https://supabase.com/dashboard/project/lhpimoqhebpuwzyqlsfg
2. Click on **SQL Editor** in the left sidebar
3. Create a new query
4. Copy and paste each migration file in order:

**Migration 1: Initial Schema**
```sql
-- Copy contents from: supabase/migrations/001_initial_schema.sql
```

**Migration 2: Add Indexes**
```sql
-- Copy contents from: supabase/migrations/002_add_indexes.sql
```

**Migration 3: RLS Policies**
```sql
-- Copy contents from: supabase/migrations/003_rls_policies.sql
```

**Migration 4: Storage Bucket**
```sql
-- Copy contents from: supabase/migrations/004_create_storage_bucket.sql
```

**Migration 5: Grant Permissions**
```sql
-- Copy contents from: supabase/migrations/005_grant_permissions.sql
```

5. Run each query (press Run or Ctrl+Enter)
6. Verify tables exist: Go to **Table Editor** → You should see: `users`, `properties`, `bookings`

### Option B: Via Supabase CLI (Advanced)

```bash
# Link your project (if not already linked)
supabase link --project-ref lhpimoqhebpuwzyqlsfg

# Push migrations
supabase db push
```

---

## Step 2: Verify Configuration

Your `.env` file should have:
```env
SUPABASE_URL=https://lhpimoqhebpuwzyqlsfg.supabase.co
SUPABASE_ANON_KEY=sb_publishable_RlCYbI54pT5cmxuIPu8KaA_13O8GI3h
SUPABASE_SERVICE_ROLE_KEY=sb_secret_ksCbIyZelsCqwWErvXZHGA_HqyaMeLn
JWT_SECRET=ER4vqjDbernXYwbHufiOU/q7004CI4WdVTPkz3fzQDc=
```

✅ These are already configured!

---

## Step 3: Restart API Server

After running migrations, restart your API server:

```bash
# Stop current server
pkill -f "ts-node src/app.ts"

# Start server (will use cloud Supabase automatically)
npm run dev
```

---

## Step 4: Test the API

### Register a new user:
```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "full_name": "Test User",
    "email": "test@example.com",
    "password": "password123",
    "role": "client"
  }'
```

### Login:
```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "password123"
  }'
```

---

## Step 5: Access Supabase Cloud Dashboard

**Dashboard URL:** https://supabase.com/dashboard/project/lhpimoqhebpuwzyqlsfg

**Useful sections:**
- **Table Editor** - View and edit your data
- **SQL Editor** - Run SQL queries
- **API Docs** - View auto-generated API documentation
- **Storage** - Manage file uploads
- **Database** - View database structure

---

## Important Notes

1. **Migrations must be run in order** (001, 002, 003, 004, 005)
2. **After migrations**, the API should work immediately
3. **No schema cache issues** with cloud Supabase (unlike local)
4. **Your API will automatically use cloud** since SUPABASE_URL is set in .env

---

## Quick Migration Script

If you want to run all migrations at once, you can combine them in the SQL Editor:

1. Open SQL Editor in Supabase Dashboard
2. Copy contents of all migration files in order
3. Paste and run

Make sure to run them in this order:
1. `001_initial_schema.sql`
2. `002_add_indexes.sql`
3. `003_rls_policies.sql`
4. `004_create_storage_bucket.sql`
5. `005_grant_permissions.sql`

