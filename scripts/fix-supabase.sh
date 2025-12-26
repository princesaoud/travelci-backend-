#!/bin/bash

# Complete script to fix Supabase PostgREST schema cache issue

set -e

echo "🔧 Fixing Supabase PostgREST schema cache issue..."
echo ""

# Check if Supabase is running
if ! docker ps --filter "name=supabase_db" --format "{{.Names}}" | grep -q "supabase_db"; then
  echo "❌ Supabase is not running. Starting it now..."
  npm run supabase:start
  echo "⏳ Waiting 60 seconds for Supabase to fully start..."
  sleep 60
fi

DB_CONTAINER=$(docker ps --filter "name=supabase_db" --format "{{.Names}}" | head -1)

if [ -z "$DB_CONTAINER" ]; then
  echo "❌ Could not find Supabase database container"
  exit 1
fi

echo "📋 Step 1: Granting permissions to roles..."

docker exec "$DB_CONTAINER" psql -U postgres -d postgres -c "
  GRANT USAGE ON SCHEMA public TO anon, authenticated, service_role;
  GRANT ALL ON ALL TABLES IN SCHEMA public TO anon, authenticated, service_role;
  GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated, service_role;
  ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO anon, authenticated, service_role;
  ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO anon, authenticated, service_role;
" > /dev/null 2>&1

echo "✅ Permissions granted"
echo ""

echo "🔄 Step 2: Restarting PostgREST to reload schema cache..."

REST_CONTAINER=$(docker ps --filter "name=supabase_rest" --format "{{.Names}}" | head -1)

if [ -n "$REST_CONTAINER" ]; then
  docker restart "$REST_CONTAINER" > /dev/null 2>&1
  echo "✅ PostgREST restarted: $REST_CONTAINER"
  echo "⏳ Waiting 15 seconds for schema cache to reload..."
  sleep 15
else
  echo "⚠️  PostgREST container not found"
fi

echo ""
echo "🧪 Step 3: Testing PostgREST directly..."

TEST_RESULT=$(curl -s "http://127.0.0.1:54321/rest/v1/properties?select=id&limit=1" \
  -H "apikey: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU" 2>&1)

if echo "$TEST_RESULT" | grep -q "id"; then
  echo "✅ PostgREST is working correctly!"
else
  echo "❌ PostgREST test failed"
  echo "Response: $TEST_RESULT"
fi

echo ""
echo "✅ Fix script completed!"
echo ""
echo "⚠️  IMPORTANT: You need to restart your backend server manually:"
echo "   1. Stop the server (Ctrl+C if running)"
echo "   2. Run: npm run dev"
echo "   3. Test: curl http://localhost:3000/api/properties"
