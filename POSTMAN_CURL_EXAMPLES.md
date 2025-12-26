# Postman & cURL Examples for TravelCI API

## 1. Login (Get Token)

### Postman:
- **Method:** `POST`
- **URL:** `http://localhost:3000/api/auth/login`
- **Headers:**
  ```
  Content-Type: application/json
  ```
- **Body (raw JSON):**
  ```json
  {
    "email": "john@example.com",
    "password": "password123"
  }
  ```

### cURL:
```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "john@example.com",
    "password": "password123"
  }'
```

**Response:**
```json
{
  "success": true,
  "data": {
    "user": { ... },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

**Copy the `token` value from the response!**

---

## 2. Get Current User (Protected - Requires Token)

### Postman:
- **Method:** `GET`
- **URL:** `http://localhost:3000/api/auth/me`
- **Headers:**
  ```
  Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
  Content-Type: application/json
  ```

### cURL:
```bash
curl -X GET http://localhost:3000/api/auth/me \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

---

## 3. Get Properties (Public - No Token Required)

### Postman:
- **Method:** `GET`
- **URL:** `http://localhost:3000/api/properties?page=1&limit=10`
- **Headers:**
  ```
  Content-Type: application/json
  ```

### cURL:
```bash
curl -X GET "http://localhost:3000/api/properties?page=1&limit=10" \
  -H "Content-Type: application/json"
```

### With Filters:
```bash
curl -X GET "http://localhost:3000/api/properties?city=Paris&type=apartment&priceMin=50&priceMax=200&page=1&limit=10" \
  -H "Content-Type: application/json"
```

---

## 4. Get Property by ID (Public)

### Postman:
- **Method:** `GET`
- **URL:** `http://localhost:3000/api/properties/{id}`
- **Headers:**
  ```
  Content-Type: application/json
  ```

### cURL:
```bash
curl -X GET "http://localhost:3000/api/properties/10000000-0000-0000-0000-000000000001" \
  -H "Content-Type: application/json"
```

---

## 5. Create Property (Protected - Owner/Admin Only)

### Postman:
- **Method:** `POST`
- **URL:** `http://localhost:3000/api/properties`
- **Headers:**
  ```
  Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
  Content-Type: multipart/form-data
  ```
- **Body (form-data):**
  - `title`: "Beautiful Apartment"
  - `description`: "Amazing place"
  - `type`: "apartment"
  - `furnished`: true
  - `price_per_night`: 150
  - `address`: "123 Main St"
  - `city`: "Paris"
  - `latitude`: 48.8566
  - `longitude`: 2.3522
  - `amenities`: ["wifi", "parking"]
  - `images`: [file1.jpg, file2.jpg] (optional)

### cURL (without images):
```bash
curl -X POST http://localhost:3000/api/properties \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." \
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

### cURL (with images):
```bash
curl -X POST http://localhost:3000/api/properties \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." \
  -F "title=Beautiful Apartment" \
  -F "type=apartment" \
  -F "price_per_night=150" \
  -F "address=123 Main Street" \
  -F "city=Paris" \
  -F "images=@/path/to/image1.jpg" \
  -F "images=@/path/to/image2.jpg"
```

---

## 6. Update Property (Protected - Owner/Admin Only)

### Postman:
- **Method:** `PUT`
- **URL:** `http://localhost:3000/api/properties/{id}`
- **Headers:**
  ```
  Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
  Content-Type: application/json
  ```
- **Body (raw JSON):**
  ```json
  {
    "title": "Updated Title",
    "price_per_night": 200,
    "description": "Updated description"
  }
  ```

### cURL:
```bash
curl -X PUT http://localhost:3000/api/properties/10000000-0000-0000-0000-000000000001 \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Updated Title",
    "price_per_night": 200,
    "description": "Updated description"
  }'
```

---

## 7. Delete Property (Protected - Owner/Admin Only)

### Postman:
- **Method:** `DELETE`
- **URL:** `http://localhost:3000/api/properties/{id}`
- **Headers:**
  ```
  Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
  ```

### cURL:
```bash
curl -X DELETE http://localhost:3000/api/properties/10000000-0000-0000-0000-000000000001 \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

---

## 8. Get Bookings (Protected)

### Postman:
- **Method:** `GET`
- **URL:** `http://localhost:3000/api/bookings?role=client`
- **Headers:**
  ```
  Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
  Content-Type: application/json
  ```

### cURL:
```bash
curl -X GET "http://localhost:3000/api/bookings?role=client" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." \
  -H "Content-Type: application/json"
```

---

## 9. Create Booking (Protected - Client Only)

### Postman:
- **Method:** `POST`
- **URL:** `http://localhost:3000/api/bookings`
- **Headers:**
  ```
  Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
  Content-Type: application/json
  ```
- **Body (raw JSON):**
  ```json
  {
    "property_id": "10000000-0000-0000-0000-000000000001",
    "start_date": "2024-06-01",
    "end_date": "2024-06-07",
    "guests": 2,
    "message": "Looking forward to staying here!"
  }
  ```

### cURL:
```bash
curl -X POST http://localhost:3000/api/bookings \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." \
  -H "Content-Type: application/json" \
  -d '{
    "property_id": "10000000-0000-0000-0000-000000000001",
    "start_date": "2024-06-01",
    "end_date": "2024-06-07",
    "guests": 2,
    "message": "Looking forward to staying here!"
  }'
```

---

## 10. Update Booking Status (Protected - Owner/Admin Only)

### Postman:
- **Method:** `PUT`
- **URL:** `http://localhost:3000/api/bookings/{id}/status`
- **Headers:**
  ```
  Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
  Content-Type: application/json
  ```
- **Body (raw JSON):**
  ```json
  {
    "status": "accepted"
  }
  ```

### cURL:
```bash
curl -X PUT http://localhost:3000/api/bookings/{booking-id}/status \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." \
  -H "Content-Type: application/json" \
  -d '{
    "status": "accepted"
  }'
```

---

## 11. Cancel Booking (Protected)

### Postman:
- **Method:** `PUT`
- **URL:** `http://localhost:3000/api/bookings/{id}/cancel`
- **Headers:**
  ```
  Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
  ```

### cURL:
```bash
curl -X PUT http://localhost:3000/api/bookings/{booking-id}/cancel \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

---

## 12. Logout (Protected)

### Postman:
- **Method:** `POST`
- **URL:** `http://localhost:3000/api/auth/logout`
- **Headers:**
  ```
  Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
  Content-Type: application/json
  ```

### cURL:
```bash
curl -X POST http://localhost:3000/api/auth/logout \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." \
  -H "Content-Type: application/json"
```

---

## Quick Reference

### Replace Token
Replace `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...` with your actual token from the login response.

### Base URL
- Local: `http://localhost:3000`
- Network: `http://192.168.100.32:3000` (for mobile device)

### Common Headers
```
Content-Type: application/json
Authorization: Bearer YOUR_TOKEN_HERE
```

### Date Format
Use ISO 8601 format: `YYYY-MM-DD` (e.g., `2024-06-01`)

