# Testing API Locally - Quick Guide

## 🚀 API Server Status

**Base URL:** `http://localhost:3000`

**Health Check:**
```bash
curl http://localhost:3000/health
```

Expected response:
```json
{"status":"ok","timestamp":"...","uptime":123.456}
```

---

## 📋 Testing Steps

### Step 1: Test Health Endpoint (No Auth Required)

```bash
curl http://localhost:3000/health
```

---

### Step 2: Register a New User (Get Token)

**Postman:**
- Method: `POST`
- URL: `http://localhost:3000/api/auth/register`
- Headers:
  ```
  Content-Type: application/json
  ```
- Body (raw JSON):
  ```json
  {
    "full_name": "Test User",
    "email": "testuser@example.com",
    "password": "password123",
    "role": "client"
  }
  ```

**cURL:**
```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "full_name": "Test User",
    "email": "testuser@example.com",
    "password": "password123",
    "role": "client"
  }'
```

**Expected Response:**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "...",
      "full_name": "Test User",
      "email": "testuser@example.com",
      "role": "client",
      ...
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  },
  "message": "Utilisateur enregistré avec succès"
}
```

**⚠️ IMPORTANT:** Copy the `token` from the response!

---

### Step 3: Login (Alternative - Get Token)

**Postman:**
- Method: `POST`
- URL: `http://localhost:3000/api/auth/login`
- Headers:
  ```
  Content-Type: application/json
  ```
- Body (raw JSON):
  ```json
  {
    "email": "testuser@example.com",
    "password": "password123"
  }
  ```

**cURL:**
```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "testuser@example.com",
    "password": "password123"
  }'
```

**Copy the token from response!**

---

### Step 4: Test Protected Endpoints (With Token)

Replace `YOUR_TOKEN_HERE` with the actual token from Step 2 or 3.

#### A. Get Current User

**Postman:**
- Method: `GET`
- URL: `http://localhost:3000/api/auth/me`
- Headers:
  ```
  Authorization: Bearer YOUR_TOKEN_HERE
  Content-Type: application/json
  ```

**cURL:**
```bash
curl -X GET http://localhost:3000/api/auth/me \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

#### B. Get Properties (Public - No Token Needed)

**Postman:**
- Method: `GET`
- URL: `http://localhost:3000/api/properties?page=1&limit=10`
- Headers:
  ```
  Content-Type: application/json
  ```

**cURL:**
```bash
curl -X GET "http://localhost:3000/api/properties?page=1&limit=10" \
  -H "Content-Type: application/json"
```

**With Filters:**
```bash
curl -X GET "http://localhost:3000/api/properties?city=Paris&type=apartment&priceMin=50&priceMax=200&page=1&limit=10" \
  -H "Content-Type: application/json"
```

#### C. Get Property by ID (Public)

**Postman:**
- Method: `GET`
- URL: `http://localhost:3000/api/properties/{property-id}`
- Headers:
  ```
  Content-Type: application/json
  ```

**cURL:**
```bash
curl -X GET "http://localhost:3000/api/properties/PROPERTY_ID_HERE" \
  -H "Content-Type: application/json"
```

#### D. Create Property (Protected - Owner/Admin Only)

**Postman:**
- Method: `POST`
- URL: `http://localhost:3000/api/properties`
- Headers:
  ```
  Authorization: Bearer YOUR_TOKEN_HERE
  Content-Type: multipart/form-data
  ```
- Body (form-data):
  - `title`: "Beautiful Apartment"
  - `description`: "Amazing place"
  - `type`: "apartment"
  - `furnished`: true
  - `price_per_night`: 150
  - `address`: "123 Main St"
  - `city`: "Paris"
  - `latitude`: 48.8566
  - `longitude`: 2.3522
  - `amenities`: ["wifi", "parking"] (as JSON string)

**cURL:**
```bash
curl -X POST http://localhost:3000/api/properties \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -F "title=Beautiful Apartment" \
  -F "description=Amazing place in the city center" \
  -F "type=apartment" \
  -F "furnished=true" \
  -F "price_per_night=150" \
  -F "address=123 Main Street" \
  -F "city=Paris" \
  -F "latitude=48.8566" \
  -F "longitude=2.3522" \
  -F "amenities=[\"wifi\",\"parking\",\"pool\"]"
```

#### E. Create Booking (Protected - Client Only)

**Postman:**
- Method: `POST`
- URL: `http://localhost:3000/api/bookings`
- Headers:
  ```
  Authorization: Bearer YOUR_TOKEN_HERE
  Content-Type: application/json
  ```
- Body (raw JSON):
  ```json
  {
    "property_id": "PROPERTY_ID_HERE",
    "start_date": "2024-06-01",
    "end_date": "2024-06-07",
    "guests": 2,
    "message": "Looking forward to staying here!"
  }
  ```

**cURL:**
```bash
curl -X POST http://localhost:3000/api/bookings \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -H "Content-Type: application/json" \
  -d '{
    "property_id": "PROPERTY_ID_HERE",
    "start_date": "2024-06-01",
    "end_date": "2024-06-07",
    "guests": 2,
    "message": "Looking forward to staying here!"
  }'
```

#### F. Get Bookings (Protected)

**Postman:**
- Method: `GET`
- URL: `http://localhost:3000/api/bookings?role=client`
- Headers:
  ```
  Authorization: Bearer YOUR_TOKEN_HERE
  Content-Type: application/json
  ```

**cURL:**
```bash
curl -X GET "http://localhost:3000/api/bookings?role=client" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -H "Content-Type: application/json"
```

---

## 🔄 Complete Test Flow Example

```bash
# 1. Check health
curl http://localhost:3000/health

# 2. Register user (save token from response)
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "full_name": "John Doe",
    "email": "john@test.com",
    "password": "password123",
    "role": "client"
  }' | jq '.data.token'

# 3. Set token variable (replace with actual token)
TOKEN="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."

# 4. Get current user
curl -X GET http://localhost:3000/api/auth/me \
  -H "Authorization: Bearer $TOKEN"

# 5. Get properties
curl -X GET "http://localhost:3000/api/properties?page=1&limit=5"

# 6. Get bookings
curl -X GET "http://localhost:3000/api/bookings?role=client" \
  -H "Authorization: Bearer $TOKEN"
```

---

## 🐛 Troubleshooting

### Rate Limit Error
If you see: `"Trop de tentatives de connexion"`
- Wait 15 minutes, OR
- Restart the API server (resets rate limit in development)

### 401 Unauthorized
- Make sure you copied the FULL token (it's very long)
- Token should start with `eyJ...`
- Include `Bearer ` prefix in Authorization header

### 404 Not Found
- Check the endpoint URL is correct
- Make sure API server is running: `curl http://localhost:3000/health`

### Database Errors
- If using cloud Supabase, make sure migrations are run
- Check Supabase Dashboard: https://supabase.com/dashboard/project/lhpimoqhebpuwzyqlsfg

---

## 📝 Postman Collection Setup

1. **Create a new Collection** in Postman
2. **Set Collection Variables:**
   - `baseUrl`: `http://localhost:3000`
   - `token`: (leave empty, will be set after login)

3. **Create requests:**
   - Health: `GET {{baseUrl}}/health`
   - Register: `POST {{baseUrl}}/api/auth/register`
   - Login: `POST {{baseUrl}}/api/auth/login`
   - Get Me: `GET {{baseUrl}}/api/auth/me` (with `Authorization: Bearer {{token}}`)
   - Get Properties: `GET {{baseUrl}}/api/properties`
   - Create Booking: `POST {{baseUrl}}/api/bookings` (with token)

4. **Auto-save token:**
   - After login/register, use Postman's "Tests" tab:
   ```javascript
   if (pm.response.code === 200) {
       const jsonData = pm.response.json();
       if (jsonData.data && jsonData.data.token) {
           pm.collectionVariables.set("token", jsonData.data.token);
       }
   }
   ```

---

## 🎯 Quick Test Checklist

- [ ] Health endpoint works
- [ ] Can register new user
- [ ] Can login with credentials
- [ ] Can get current user (with token)
- [ ] Can get properties list
- [ ] Can get property by ID
- [ ] Can create property (with owner token)
- [ ] Can create booking (with client token)
- [ ] Can get bookings (with token)

---

## 📱 Testing from Mobile Device

If testing from your physical device (IP: 192.168.100.32):

**Replace `localhost:3000` with `192.168.100.32:3000` in all URLs**

Example:
```bash
curl http://192.168.100.32:3000/health
curl -X POST http://192.168.100.32:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123"}'
```

---

## 🔗 Useful Links

- **API Health:** http://localhost:3000/health
- **API Docs (Swagger):** http://localhost:3000/api-docs
- **Supabase Dashboard:** https://supabase.com/dashboard/project/lhpimoqhebpuwzyqlsfg
- **Supabase Studio (Local):** http://127.0.0.1:54323

