# Flutter App – Troubleshooting Guide

## Issues from Your Logs

### 1. **404 on blocked-dates API**

**Log:**
```
[log] [API] GET Request to: https://travelci-backend.vercel.app/api/properties/blocked-dates/a5e210d9-4c68-4813-bc48-9d14bf8a56b4
[log] [API] GET Response: 404
```

**Likely cause:** The property `a5e210d9-4c68-4813-bc48-9d14bf8a56b4` is not found in the Supabase Cloud database. The backend returns 404 when `getPropertyById` fails.

**Checks:**
1. Run migration `012_property_blocked_dates.sql` on Supabase Cloud if not done (SQL Editor).
2. Verify property IDs: call `GET /api/properties` and confirm the IDs match what the Flutter app uses.
3. If using seeded data, re-run the seed script on Supabase Cloud so property IDs match your local setup.

**Test with cURL:**
```bash
# 1. Login as owner (e.g. jane@example.com)
TOKEN=$(curl -s -X POST https://travelci-backend.vercel.app/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"jane@example.com","password":"password123"}' \
  | jq -r '.data.token')

# 2. List properties to get a valid ID
curl -s -H "Authorization: Bearer $TOKEN" \
  https://travelci-backend.vercel.app/api/properties | jq '.data.properties[].id'

# 3. Use one of those IDs for blocked-dates
curl -s -H "Authorization: Bearer $TOKEN" \
  "https://travelci-backend.vercel.app/api/properties/blocked-dates/<VALID_PROPERTY_ID>"
```

---

### 2. **429 Too Many Requests**

**Log:**
```
[log] [API] 429 Too Many Requests – retrying in 865s (attempt 1/1)
```

**Cause:** `/api/auth/me` is being called very frequently (e.g. on every rebuild or navigation), which can trigger rate limits if a global limiter applies.

**Flutter-side fix (recommended):**
- Debounce or throttle auth checks.
- Avoid calling `/api/auth/me` in listeners that fire on every rebuild.
- Cache the auth state and only refresh when needed (e.g. after login, on app resume).

---

### 3. **Invalid UTF-8 sequence**

**Log:**
```
E/Dart (17177): Invalid UTF8 sequence encountered
(Error Code: D2 + idx: 154429 )
...
```

**Cause:** Some API response contains invalid UTF-8 around byte index 154429. Possible sources:
- Property description or title
- User full name
- Image URL or other text field with bad encoding

**Backend:** Ensure all text columns in the database are valid UTF-8. Clean or re-save any records with odd characters.

**Flutter:** Add defensive decoding (e.g. `utf8.decode(..., allowMalformed: true)` or validate strings before use) to avoid crashes when malformed data is returned.

---

### 4. **Excessive `/api/auth/me` calls**

**Log:** Multiple `[log] [API] GET Request to: .../api/auth/me` in quick succession.

**Impact:** Increases load and risk of rate limiting.

**Fix:** In Flutter, centralize auth state so it is not refreshed on every route change or rebuild. Use a single auth provider/stream and only refetch when necessary.
