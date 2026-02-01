# Scripts to run on Supabase (remote server)

Run these **in order** in the Supabase SQL Editor (Dashboard → SQL Editor → New query).  
If your project is **new**, run **001** through **014**.  
If you already applied some migrations before, run **only the ones you haven’t run yet** (e.g. only 010–014).

---

## Execution order

| # | File | What it does |
|---|------|----------------|
| 1 | `supabase/migrations/001_initial_schema.sql` | Creates `users`, `properties`, `bookings`, `notifications` tables and indexes |
| 2 | `supabase/migrations/002_add_indexes.sql` | Adds extra indexes for performance |
| 3 | `supabase/migrations/003_rls_policies.sql` | Row Level Security policies (if any) |
| 4 | `supabase/migrations/004_create_storage_bucket.sql` | Creates `property-images` storage bucket |
| 5 | `supabase/migrations/005_grant_permissions.sql` | Grants permissions to roles |
| 6 | `supabase/migrations/006_create_chat_tables.sql` | Creates chat/conversations tables |
| 7 | `supabase/migrations/007_add_message_type.sql` | Adds message type field |
| 8 | `supabase/migrations/008_add_file_fields_to_messages.sql` | Adds file URL/name to messages |
| 9 | `supabase/migrations/009_create_message_files_bucket.sql` | Creates `message-files` storage bucket |
| 10 | `supabase/migrations/010_fix_test_user_passwords.sql` | Fixes test users (john/jane/admin) password to `password123` |
| 11 | `supabase/migrations/011_add_room_count_to_properties.sql` | Adds `room_count` to `properties` |
| 12 | `supabase/migrations/012_property_blocked_dates.sql` | Creates `property_blocked_dates` table (owner availability) |
| 13 | `supabase/migrations/013_add_national_id_to_users.sql` | Adds `national_id_front_url`, `national_id_back_url` to `users` |
| 14 | `supabase/migrations/014_create_id_documents_bucket.sql` | Creates `id-documents` storage bucket and policies for owner ID uploads |

---

## How to run

1. Go to **Supabase Dashboard** → your project → **SQL Editor** → **New query**.
2. Copy the **full contents** of each migration file (from `supabase/migrations/`) in order.
3. Paste and click **Run** for each script.
4. Repeat for the next file until you’ve run all needed migrations.

**Note:** For the test-user password fix, you can also follow **APPLY_PASSWORD_FIX_MIGRATION.md**; it describes the same fix (010) in more detail.
