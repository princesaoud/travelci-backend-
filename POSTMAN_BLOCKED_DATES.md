# Postman – Blocked Dates API

Base URL: `https://travelci-backend.vercel.app`

---

## Step 1: Login (get JWT token)

**Method:** `POST`  
**URL:** `{{baseUrl}}/api/auth/login`

**Headers:**
| Key | Value |
|-----|-------|
| Content-Type | application/json |

**Body (raw JSON):**
```json
{
  "email": "jane@example.com",
  "password": "password123"
}
```

**Response:**  
Copy `data.token` and use it as `Bearer <token>` in the next requests.

---

## Step 2: Get a property ID

**Method:** `GET`  
**URL:** `{{baseUrl}}/api/properties`

**Headers:**
| Key | Value |
|-----|-------|
| Authorization | Bearer {{token}} |

Copy one `id` from `data.properties` for the blocked-dates calls.

---

## Step 3: GET blocked dates

**Method:** `GET`  
**URL:** `{{baseUrl}}/api/properties/blocked-dates/{{propertyId}}`

**Headers:**
| Key | Value |
|-----|-------|
| Authorization | Bearer {{token}} |

**Example URL:**  
`https://travelci-backend.vercel.app/api/properties/blocked-dates/a5e210d9-4c68-4813-bc48-9d14bf8a56b4`

**Response (200):**
```json
{
  "success": true,
  "data": {
    "dates": ["2025-03-15", "2025-03-16"]
  },
  "message": "Dates bloquées récupérées avec succès"
}
```

---

## Step 4: POST blocked dates (add)

**Method:** `POST`  
**URL:** `{{baseUrl}}/api/properties/blocked-dates/{{propertyId}}`

**Headers:**
| Key | Value |
|-----|-------|
| Authorization | Bearer {{token}} |
| Content-Type | application/json |

**Body (raw JSON):**
```json
{
  "dates": ["2025-03-15", "2025-03-16", "2025-03-17"]
}
```

Dates must be `YYYY-MM-DD`. Owner or admin only.

**Response (200):**
```json
{
  "success": true,
  "data": {
    "dates": ["2025-03-15", "2025-03-16", "2025-03-17"]
  },
  "message": "Dates bloquées ajoutées avec succès"
}
```

---

## Step 5: DELETE blocked dates

**Method:** `DELETE`  
**URL:** `{{baseUrl}}/api/properties/blocked-dates/{{propertyId}}`

**Headers:**
| Key | Value |
|-----|-------|
| Authorization | Bearer {{token}} |
| Content-Type | application/json |

**Body (raw JSON):**
```json
{
  "dates": ["2025-03-15", "2025-03-16"]
}
```

**Response (200):**
```json
{
  "success": true,
  "data": null,
  "message": "Dates bloquées supprimées avec succès"
}
```

---

## Postman variables

| Variable | Value | Description |
|----------|-------|-------------|
| baseUrl | `https://travelci-backend.vercel.app` | API base URL |
| token | (from login) | JWT Bearer token |
| propertyId | (from GET properties) | Property UUID |

---

## Local testing

Base URL: `http://localhost:3000`

Use the same paths:
- `http://localhost:3000/api/auth/login`
- `http://localhost:3000/api/properties`
- `http://localhost:3000/api/properties/blocked-dates/{{propertyId}}`
