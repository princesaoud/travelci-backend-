# TravelCI Backend API

Production-ready, high-performance Node.js/Express + TypeScript backend API for the TravelCI travel booking Flutter app.

## Features

- 🚀 **High Performance**: Redis caching, optimized database queries, response compression
- 🔒 **Secure**: JWT authentication, input validation, rate limiting, Helmet security
- 📸 **Image Optimization**: Cloudinary integration with automatic format optimization (WebP, AVIF)
- 🗄️ **Database**: Supabase (PostgreSQL) with proper indexing and constraints
- 📝 **TypeScript**: Strict mode with full type safety
- 🏗️ **Clean Architecture**: Separation of concerns with services, controllers, and middleware
- 📊 **Logging**: Winston structured logging with request/response tracking
- ⚡ **Performance Targets**: < 100ms cached responses, < 300ms DB queries

## Technology Stack

- **Runtime**: Node.js 18+
- **Framework**: Express.js
- **Language**: TypeScript (strict mode)
- **Database**: Supabase (PostgreSQL)
- **Cache**: Redis (ioredis)
- **Image Processing**: Cloudinary + Sharp
- **Authentication**: JWT (jsonwebtoken)
- **Validation**: express-validator
- **Security**: Helmet, CORS, rate limiting
- **Logging**: Winston

## Project Structure

```
travelci-backend/
├── src/
│   ├── controllers/       # Request handlers
│   ├── services/         # Business logic
│   ├── models/           # TypeScript interfaces
│   ├── routes/           # API route definitions
│   ├── middleware/       # Express middleware
│   ├── utils/            # Utilities (errors, responses, cache, logger)
│   ├── config/           # Configuration files
│   └── app.ts            # Express app setup
├── supabase/
│   ├── migrations/       # Database migrations
│   └── seed.sql          # Seed data
├── .env.example          # Environment variables template
├── package.json
├── tsconfig.json
└── README.md
```

## Prerequisites

- Node.js 18+ installed
- Supabase CLI installed (`npm install -g supabase` or see [installation guide](https://supabase.com/docs/guides/cli/getting-started))
- Docker (required for local Supabase development)
- Redis server (optional, but recommended for caching)

## Installation

1. **Clone the repository** (if applicable) or navigate to the project directory

2. **Install dependencies**:
```bash
npm install
```

3. **Set up Supabase locally** (recommended for development):
   ```bash
   # Start Supabase locally (requires Docker)
   npm run supabase:start
   
   # Check status and get connection details
   npm run supabase:status
   ```
   
   This will automatically:
   - Create a local PostgreSQL database
   - Run all migrations (including the storage bucket creation)
   - Start Supabase Studio at http://localhost:54323
   - Provide local API URL at http://127.0.0.1:54321

4. **Set up environment variables**:
   
   **For local development** (with Supabase local):
   - The app will use local Supabase defaults if `SUPABASE_URL` is not set
   - Only `JWT_SECRET` is required:
   
   ```env
   # JWT Configuration
   JWT_SECRET=your-jwt-secret-key-change-in-production
   JWT_EXPIRES_IN=7d
   
   # Server Configuration
   PORT=3000
   NODE_ENV=development
   
   # CORS Configuration
   CORS_ORIGIN=http://localhost:3000
   
   # Redis (Optional)
   REDIS_URL=redis://localhost:6379
   ```
   
   **For production** (with Supabase cloud):
   ```env
   # Supabase Production
   SUPABASE_URL=https://your-project.supabase.co
   SUPABASE_ANON_KEY=your-anon-key
   SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
   
   # JWT Configuration
   JWT_SECRET=your-strong-jwt-secret-key
   JWT_EXPIRES_IN=7d
   
   # Server Configuration
   PORT=3000
   NODE_ENV=production
   
   # CORS Configuration
   CORS_ORIGIN=https://your-domain.com
   ```

5. **Start Redis** (optional, for caching):
```bash
redis-server
```

## Supabase Local Development

The project includes Supabase CLI configuration for local development:

```bash
# Start Supabase locally
npm run supabase:start

# Stop Supabase
npm run supabase:stop

# Reset database (run migrations and seed)
npm run supabase:reset

# Check status
npm run supabase:status

# View logs
npm run supabase:logs
```

**Storage Bucket**: After starting Supabase locally, create the storage bucket:
```bash
npm run supabase:setup-bucket
```

For production, run the migration `004_create_storage_bucket.sql` in your Supabase SQL editor, or ensure the bucket exists manually.

**Note**: The bucket migration is included in migrations but may be skipped during startup. Use the setup script above to create it manually after first startup.

## Running the Application

### Development Mode
```bash
npm run dev
```
This uses `nodemon` to automatically restart the server on file changes.

### Production Mode
```bash
npm run build
npm start
```

### Type Checking
```bash
npm run type-check
```

## API Endpoints

### Authentication (`/api/auth`)

- `POST /api/auth/register` - Register a new user
  - Body: `{ fullName, email, phone?, password, role? }`
  - Response: `{ user, token }`

- `POST /api/auth/login` - Login user
  - Body: `{ email, password }`
  - Response: `{ user, token }`

- `GET /api/auth/me` - Get current user (Protected)
  - Headers: `Authorization: Bearer <token>`
  - Response: `{ user }`

- `POST /api/auth/logout` - Logout user (Protected)
  - Response: `{ message }`

### Properties (`/api/properties`)

- `GET /api/properties` - Get properties with filters
  - Query params: `?city=string&type=apartment|villa&furnished=true|false&priceMin=number&priceMax=number&page=number&limit=number`
  - Response: `{ properties[], pagination }`

- `GET /api/properties/:id` - Get property by ID
  - Response: `{ property }`

- `GET /api/properties/owner/:ownerId` - Get properties by owner (Protected)
  - Response: `{ properties[] }`

- `POST /api/properties` - Create property (Protected - Owner only)
  - Headers: `Authorization: Bearer <token>`
  - Body: Multipart form data with property fields and images
  - Response: `{ property }`

- `PUT /api/properties/:id` - Update property (Protected - Owner only)
  - Response: `{ property }`

- `DELETE /api/properties/:id` - Delete property (Protected - Owner only)
  - Response: `{ message }`

### Bookings (`/api/bookings`)

- `GET /api/bookings` - Get bookings (Protected)
  - Query params: `?role=client|owner`
  - Response: `{ bookings[] }`

- `GET /api/bookings/:id` - Get booking by ID (Protected)
  - Response: `{ booking }`

- `POST /api/bookings` - Create booking (Protected - Client only)
  - Body: `{ propertyId, startDate, endDate, guests, message? }`
  - Response: `{ booking }`

- `PUT /api/bookings/:id/status` - Update booking status (Protected - Owner only)
  - Body: `{ status: "accepted" | "declined" }`
  - Response: `{ booking }`

- `PUT /api/bookings/:id/cancel` - Cancel booking (Protected)
  - Response: `{ message }`

### Images (`/api/images`)

- `POST /api/images/upload` - Upload and optimize image (Protected)
  - Body: Multipart form data with `image` file
  - Response: `{ thumbnail, medium, large }`

- `GET /api/images/optimize` - Get optimized image URL (Public)
  - Query params: `?url=imageUrl&width=800&height=600&format=webp`
  - Response: `{ url }`

### Health Check

- `GET /health` - Health check endpoint
  - Response: `{ status: "ok", timestamp, uptime }`

## Response Format

All API responses follow this format:

```json
{
  "success": true,
  "data": { ... },
  "message": "Optional message",
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 100,
    "pages": 5
  }
}
```

Error responses:

```json
{
  "success": false,
  "error": {
    "message": "Error message",
    "code": "ERROR_CODE",
    "statusCode": 400
  }
}
```

## Authentication

Most endpoints require authentication. Include the JWT token in the Authorization header:

```
Authorization: Bearer <your-jwt-token>
```

## Caching

The API uses Redis for caching:
- Property listings: 5 minutes TTL
- Individual properties: 10 minutes TTL
- Search results: 3 minutes TTL

Cache status is indicated in the `X-Cache-Status` header:
- `HIT`: Response served from cache
- `MISS`: Response from database

## Image Optimization

All images are automatically:
- Resized to multiple sizes (thumbnail: 300x300, medium: 800x600, large: 1920x1080)
- Converted to WebP format
- Optimized for quality and file size
- Served through Cloudinary CDN

## Rate Limiting

- Auth endpoints: 5 requests per 15 minutes
- Search endpoints: 30 requests per minute
- Image upload: 10 requests per hour
- General API: 100 requests per 15 minutes

## Error Handling

The API uses custom error classes:
- `NotFoundException` (404) - Resource not found
- `ValidationException` (400) - Validation error
- `UnauthorizedException` (401) - Authentication required
- `ForbiddenException` (403) - Insufficient permissions
- `BusinessRuleException` (400) - Business rule violation
- `InfrastructureException` (500) - Technical error

All error messages are in French.

## Logging

Logs are written to:
- `logs/error.log` - Error logs only
- `logs/combined.log` - All logs

Logs include:
- Request method and URL
- Response status code
- Response time
- Request ID for tracing
- Error stack traces

## Performance Optimizations

- **Database**: Indexed queries, pagination, selective column fetching
- **Caching**: Redis for frequently accessed data
- **Compression**: Gzip compression for responses > 1KB
- **Image CDN**: Cloudinary for optimized image delivery
- **Connection Pooling**: Handled by Supabase client

## Security Features

- Helmet.js for security headers
- CORS configuration
- Rate limiting
- Input validation with express-validator
- JWT token authentication
- Password hashing with bcrypt (10 rounds)
- SQL injection protection (parameterized queries via Supabase)

## Development

### Code Structure

The codebase follows Clean Architecture principles:

- **Controllers**: Handle HTTP requests/responses, no business logic
- **Services**: Contain all business logic, catch infrastructure errors
- **Models**: TypeScript interfaces for type safety
- **Middleware**: Reusable Express middleware
- **Utils**: Shared utilities and helpers

### Error Handling Pattern

- **Services**: Catch infrastructure errors, throw domain exceptions
- **Controllers**: Catch domain exceptions, return HTTP responses
- **Middleware**: Global error handler converts exceptions to HTTP responses

## Testing

To test the API, you can use tools like:
- Postman
- cURL
- Thunder Client (VS Code extension)

Example cURL request:

```bash
# Register user
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "full_name": "John Doe",
    "email": "john@example.com",
    "password": "password123",
    "role": "client"
  }'

# Login
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "john@example.com",
    "password": "password123"
  }'

# Get properties
curl http://localhost:3000/api/properties?city=Paris&page=1&limit=20
```

## Troubleshooting

### Redis Connection Issues
If Redis is not available, the application will continue without caching. Check Redis connection:
```bash
redis-cli ping
```

### Supabase Connection Issues
Verify your Supabase credentials in `.env` and ensure your project is active.

### Image Upload Issues
Check Cloudinary credentials and ensure file size limits are appropriate (default: 10MB).

## Production Deployment

1. Set `NODE_ENV=production` in `.env`
2. Use a strong `JWT_SECRET`
3. Configure proper CORS origins
4. Set up Redis for caching
5. Use a process manager like PM2:
```bash
npm install -g pm2
pm2 start dist/app.js --name travelci-backend
```

## License

ISC

## Support

For issues or questions, please refer to the project documentation or contact the development team.

