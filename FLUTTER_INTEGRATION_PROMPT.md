# Flutter API Integration Prompt

Use this prompt to integrate your Flutter **mobile app** with the TravelCI Backend API.

**Your Testing Setup:**
- Device IP: `192.168.100.32`
- API Base URL: `http://192.168.100.32:3000`
- Make sure your computer and mobile device are on the same Wi-Fi network!

---

## 🚀 Quick Reference - All URLs

### For Flutter App (Use These)
- **Base URL (Android Emulator)**: `http://10.0.2.2:3000`
- **Base URL (iOS Simulator)**: `http://localhost:3000`
- **Base URL (Physical Device)**: `http://192.168.100.32:3000` ✅ Your Testing IP
- **API Path**: `/api`

### Complete Endpoint URLs

**For Physical Device (Your Testing Setup):**
- Health: `http://192.168.100.32:3000/health`
- Register: `http://192.168.100.32:3000/api/auth/register`
- Login: `http://192.168.100.32:3000/api/auth/login`
- Get User: `http://192.168.100.32:3000/api/auth/me`
- Properties: `http://192.168.100.32:3000/api/properties`
- Bookings: `http://192.168.100.32:3000/api/bookings`

**For Android Emulator:**
- Base: `http://10.0.2.2:3000/api/...`

**For iOS Simulator:**
- Base: `http://localhost:3000/api/...`

### Development Tools (Browser Only)
- Supabase Studio: `http://127.0.0.1:54323` (Database management)
- Supabase REST: `http://127.0.0.1:54321` (Direct API - don't use in Flutter)

---

## Backend API Information

### API Server URLs

**Your TravelCI Backend API Base URL:**
- **Local Development (Desktop/Simulator)**: `http://localhost:3000`
- **Android Emulator**: `http://10.0.2.2:3000`
- **iOS Simulator**: `http://localhost:3000`
- **Physical Device**: `http://192.168.100.32:3000` ✅ (Your testing setup)

**API Base Path**: `/api`

**Full API Endpoints:**
- Authentication: `http://localhost:3000/api/auth`
- Properties: `http://localhost:3000/api/properties`
- Bookings: `http://localhost:3000/api/bookings`
- Images: `http://localhost:3000/api/images`
- Health Check: `http://localhost:3000/health`

### Supabase Services (Development Tools)

**Supabase Studio (Database Management):**
- URL: `http://127.0.0.1:54323`
- Use this to view/manage your database tables directly

**Supabase REST API (Direct Access):**
- Project URL: `http://127.0.0.1:54321`
- REST API: `http://127.0.0.1:54321/rest/v1`
- Note: Your Flutter app should use the Node.js API at port 3000, not this direct Supabase API

### Connection Examples

**For Android Emulator:**
```dart
const String baseUrl = 'http://10.0.2.2:3000';
```

**For iOS Simulator:**
```dart
const String baseUrl = 'http://localhost:3000';
```

**For Physical Device (Your Setup):**
```dart
// Your actual testing IP
const String baseUrl = 'http://192.168.100.32:3000';
```

**Note:** Make sure your computer (running the API) and mobile device are on the same Wi-Fi network!

### Important Notes

1. **Always use port 3000** for your Flutter app (not 54321 or 54323)
2. **API path is `/api`** - so full endpoint is: `baseUrl/api/auth/login`
3. **Health check is at root**: `baseUrl/health` (no `/api` prefix)
4. Make sure your backend server is running before testing
5. For physical devices, ensure your computer and phone are on the same Wi-Fi network

---

## Project Requirements

Create a complete Flutter integration for a TravelCI booking app with the following:

### 1. Dependencies
Add these packages to `pubspec.yaml`:
```yaml
dependencies:
  http: ^1.1.0
  dio: ^5.3.2
  shared_preferences: ^2.2.2
  image_picker: ^1.0.4
  intl: ^0.18.1
  provider: ^6.1.1  # or your preferred state management
```

### 2. API Response Format
All API responses follow this structure:
```dart
{
  "success": true/false,
  "data": { ... },
  "message": "Optional message",
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 100,
    "pages": 5
  },
  "error": {
    "message": "Error message",
    "code": "ERROR_CODE",
    "statusCode": 400
  }
}
```

### 3. Models to Create

#### User Model
```dart
class User {
  final String id;
  final String fullName;
  final String email;
  final String? phone;
  final String role; // 'client', 'owner', 'admin'
  final bool isVerified;
  final DateTime createdAt;
  final DateTime updatedAt;
  
  // Constructor, fromJson, toJson methods
}
```

#### Property Model
```dart
class Property {
  final String id;
  final String ownerId;
  final String title;
  final String? description;
  final String type; // 'apartment' or 'villa'
  final bool furnished;
  final double pricePerNight;
  final String address;
  final String city;
  final double? latitude;
  final double? longitude;
  final List<String> imageUrls;
  final List<String> amenities;
  final DateTime createdAt;
  final DateTime updatedAt;
  
  // Constructor, fromJson, toJson methods
}
```

#### Booking Model
```dart
class Booking {
  final String id;
  final String propertyId;
  final String clientId;
  final DateTime startDate;
  final DateTime endDate;
  final int nights;
  final int guests;
  final String? message;
  final double totalPrice;
  final String status; // 'pending', 'accepted', 'declined', 'cancelled'
  final DateTime createdAt;
  final DateTime updatedAt;
  
  // Constructor, fromJson, toJson methods
}
```

### 4. API Service Implementation

Create an API service class that handles:

#### Authentication Endpoints

**POST `/api/auth/register`**
- Request Body:
  ```json
  {
    "full_name": "John Doe",
    "email": "john@example.com",
    "password": "password123",
    "phone": "+33123456789",  // optional
    "role": "client"  // optional, defaults to "client"
  }
  ```
- Response:
  ```json
  {
    "success": true,
    "data": {
      "user": { ... },
      "token": "jwt_token_here"
    },
    "message": "Utilisateur enregistré avec succès"
  }
  ```

**POST `/api/auth/login`**
- Request Body:
  ```json
  {
    "email": "john@example.com",
    "password": "password123"
  }
  ```
- Response:
  ```json
  {
    "success": true,
    "data": {
      "user": { ... },
      "token": "jwt_token_here"
    },
    "message": "Connexion réussie"
  }
  ```

**GET `/api/auth/me`** (Protected - requires Bearer token)
- Headers: `Authorization: Bearer <token>`
- Response:
  ```json
  {
    "success": true,
    "data": {
      "user": { ... }
    }
  }
  ```

**POST `/api/auth/logout`** (Protected)
- Headers: `Authorization: Bearer <token>`
- Response:
  ```json
  {
    "success": true,
    "data": null,
    "message": "Déconnexion réussie"
  }
  ```

#### Property Endpoints

**GET `/api/properties`**
- Query Parameters:
  - `city` (string, optional)
  - `type` (string: "apartment" or "villa", optional)
  - `furnished` (boolean, optional)
  - `priceMin` (number, optional)
  - `priceMax` (number, optional)
  - `page` (number, default: 1)
  - `limit` (number, default: 20, max: 100)
- Response:
  ```json
  {
    "success": true,
    "data": [
      { "properties": [...] }
    ],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 50,
      "pages": 3
    }
  }
  ```

**GET `/api/properties/:id`**
- Response:
  ```json
  {
    "success": true,
    "data": {
      "property": { ... }
    }
  }
  ```

**POST `/api/properties`** (Protected - Owner/Admin only)
- Headers: `Authorization: Bearer <token>`
- Content-Type: `multipart/form-data`
- Body fields:
  - `title` (string, required)
  - `description` (string, optional)
  - `type` (string: "apartment" or "villa", required)
  - `furnished` (boolean, optional)
  - `price_per_night` (number, required)
  - `address` (string, required)
  - `city` (string, required)
  - `latitude` (number, optional)
  - `longitude` (number, optional)
  - `amenities` (JSON string array, optional)
  - `images` (file array, max 10, optional)

**PUT `/api/properties/:id`** (Protected - Owner/Admin only)
- Headers: `Authorization: Bearer <token>`
- Content-Type: `application/json`
- Body: Same fields as POST (all optional)

**DELETE `/api/properties/:id`** (Protected - Owner/Admin only)
- Headers: `Authorization: Bearer <token>`

#### Booking Endpoints

**GET `/api/bookings`** (Protected)
- Headers: `Authorization: Bearer <token>`
- Query Parameters:
  - `role` (string: "client" or "owner", optional)
- Response:
  ```json
  {
    "success": true,
    "data": {
      "bookings": [ ... ]
    }
  }
  ```

**GET `/api/bookings/:id`** (Protected)
- Headers: `Authorization: Bearer <token>`

**POST `/api/bookings`** (Protected - Client only)
- Headers: `Authorization: Bearer <token>`
- Request Body:
  ```json
  {
    "property_id": "uuid",
    "start_date": "2024-06-01",  // ISO 8601 date format
    "end_date": "2024-06-07",
    "guests": 2,
    "message": "Optional message"  // optional
  }
  ```

**PUT `/api/bookings/:id/status`** (Protected - Owner/Admin only)
- Headers: `Authorization: Bearer <token>`
- Request Body:
  ```json
  {
    "status": "accepted"  // or "declined"
  }
  ```

**PUT `/api/bookings/:id/cancel`** (Protected)
- Headers: `Authorization: Bearer <token>`

### 5. Token Management

- Store JWT token securely using `shared_preferences`
- Include token in Authorization header: `Authorization: Bearer <token>`
- Handle token expiration and refresh
- Clear token on logout

### 6. Error Handling

Handle these error codes:
- `400` - Validation errors (Bad Request)
- `401` - Unauthorized (invalid/missing token)
- `403` - Forbidden (insufficient permissions)
- `404` - Not Found
- `500` - Server errors

All error messages are in **French**.

### 7. Features to Implement

1. **Authentication Service**
   - Register user
   - Login
   - Get current user profile
   - Logout
   - Token storage and retrieval

2. **Property Service**
   - List properties with filters and pagination
   - Get property details
   - Create property (with image upload)
   - Update property
   - Delete property
   - Search by city, type, price range

3. **Booking Service**
   - List bookings (as client or owner)
   - Get booking details
   - Create booking
   - Update booking status (owner)
   - Cancel booking

4. **State Management**
   - User authentication state
   - Property list state
   - Booking state
   - Loading and error states

### 8. Code Structure

Create this folder structure:
```
lib/
├── models/
│   ├── user.dart
│   ├── property.dart
│   ├── booking.dart
│   └── api_response.dart
├── services/
│   ├── api_service.dart
│   ├── auth_service.dart
│   ├── property_service.dart
│   └── booking_service.dart
├── utils/
│   ├── api_config.dart
│   ├── token_manager.dart
│   └── error_handler.dart
└── providers/  # or your state management
    ├── auth_provider.dart
    ├── property_provider.dart
    └── booking_provider.dart
```

### 9. Additional Requirements

- Handle network connectivity errors
- Show loading indicators during API calls
- Display user-friendly error messages
- Implement proper null safety
- Use constants for API endpoints
- Support pagination for property lists
- Handle image uploads for property creation
- Format dates properly (ISO 8601 format)
- Parse and display French error messages

### 10. Example Usage

Provide example code showing:
- How to register/login a user
- How to fetch and display properties
- How to create a booking
- How to handle authentication in protected routes

---

## Notes

- All dates should be in ISO 8601 format: `YYYY-MM-DD` or `YYYY-MM-DDTHH:mm:ssZ`
- Error messages from the API are in French
- The API uses JWT tokens for authentication
- Property image uploads use multipart/form-data
- Pagination is available for property listings
- Rate limiting is applied (Auth: 5 req/15min, General: 100 req/15min)

---

**Please create a complete, production-ready Flutter implementation with proper error handling, state management, and following Flutter best practices.**

