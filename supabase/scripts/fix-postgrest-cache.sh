#!/bin/bash

# Script to fix PostgREST schema cache issue
# This grants necessary permissions and restarts PostgREST to reload the schema cache

set -e

echo "🔧 Fixing PostgREST schema cache..."

# Check if Supabase is running
if ! docker ps --filter "name=supabase_db" --format "{{.Names}}" | grep -q "supabase_db"; then
  echo "❌ Supabase database container is not running. Please start Supabase first:"
  echo "   npm run supabase:start"
  exit 1
fi

DB_CONTAINER=$(docker ps --filter "name=supabase_db" --format "{{.Names}}" | head -1)

if [ -z "$DB_CONTAINER" ]; then
  echo "❌ Could not find Supabase database container"
  exit 1
fi

echo "📋 Granting permissions to roles..."

# Grant permissions
docker exec "$DB_CONTAINER" psql -U postgres -d postgres -c "
  GRANT USAGE ON SCHEMA public TO anon, authenticated, service_role;
  GRANT ALL ON ALL TABLES IN SCHEMA public TO anon, authenticated, service_role;
  GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated, service_role;
  ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO anon, authenticated, service_role;
  ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO anon, authenticated, service_role;
" > /dev/null 2>&1

if [ $? -eq 0 ]; then
  echo "✓ Permissions granted successfully"
else
  echo "❌ Failed to grant permissions"
  exit 1
fi

echo "🔄 Restarting PostgREST to reload schema cache..."

# Find and restart PostgREST container
REST_CONTAINER=$(docker ps --filter "name=supabase_rest" --format "{{.Names}}" | head -1)

if [ -z "$REST_CONTAINER" ]; then
  echo "⚠️  PostgREST container not found. It might start automatically."
  echo "   Waiting 5 seconds for Supabase to fully start..."
  sleep 5
  REST_CONTAINER=$(docker ps --filter "name=supabase_rest" --format "{{.Names}}" | head -1)
fi

if [ -n "$REST_CONTAINER" ]; then
  docker restart "$REST_CONTAINER" > /dev/null 2>&1
  echo "✓ PostgREST restarted: $REST_CONTAINER"
  echo "   Waiting 10 seconds for PostgREST to reload schema..."
  sleep 10
else
  echo "⚠️  PostgREST container still not found. You may need to restart Supabase:"
  echo "   npm run supabase:stop && npm run supabase:start"
  exit 1
fi

echo ""
echo "✅ PostgREST schema cache fixed!"
echo "   You can now test your API endpoints."
