import express, { Express } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import rateLimit from 'express-rate-limit';
import { validateEnv, env } from './config/env';
import { initRedisConnection } from './config/redis';
import { setupSwagger } from './config/swagger';
import { errorHandler, notFoundHandler, requestIdMiddleware, timingMiddleware } from './middleware/error.middleware';
import { logger } from './utils/logger';

// Routes
import authRoutes from './routes/auth.routes';
import propertyRoutes from './routes/property.routes';
import bookingRoutes from './routes/booking.routes';
import imageRoutes from './routes/image.routes';

/**
 * Create Express app
 */
const app: Express = express();

// Validate environment variables
try {
  validateEnv();
} catch (error: any) {
  logger.error('Environment validation failed', { error: error.message });
  process.exit(1);
}

// Initialize services
initRedisConnection();

// Security middleware
app.use(helmet());

// CORS configuration
// Note: Mobile apps (iOS/Android) don't use CORS, but Flutter web does
const corsOptions = {
  origin: (origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) => {
    // Allow requests with no origin (like mobile apps, Postman, curl)
    if (!origin) {
      return callback(null, true);
    }

    const allowedOrigins = process.env.CORS_ORIGIN
      ? process.env.CORS_ORIGIN.split(',').map((o) => o.trim())
      : [];

    // In development, allow common Flutter web dev server origins
    if (process.env.NODE_ENV === 'development') {
      const devOrigins = [
        'http://localhost',
        'http://127.0.0.1',
        ...allowedOrigins,
      ];
      const isAllowed = devOrigins.some((allowedOrigin) =>
        origin.startsWith(allowedOrigin)
      );
      if (isAllowed) {
        return callback(null, true);
      }
    }

    // In production, check against allowed origins
    if (allowedOrigins.length > 0 && allowedOrigins.includes(origin)) {
      return callback(null, true);
    }

    callback(new Error('Not allowed by CORS'));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
};

app.use(cors(corsOptions));

// Compression middleware
app.use(compression());

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Request ID and timing middleware
app.use(requestIdMiddleware);
app.use(timingMiddleware);

// Swagger documentation
setupSwagger(app);

// Rate limiting - Configurable via environment variables
// Development: More lenient limits (20 requests per 15 min)
// Production: Stricter limits (can be configured via env vars)
const authLimiter = rateLimit({
  windowMs: env.RATE_LIMIT_AUTH_WINDOW_MS,
  max: env.RATE_LIMIT_AUTH_MAX,
  message: 'Trop de tentatives de connexion, veuillez réessayer plus tard',
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => {
    // Skip rate limiting for health checks and in test mode
    return req.path === '/health' || req.path === '/' || process.env.NODE_ENV === 'test';
  },
});

const searchLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 30, // 30 requests per minute
  message: 'Trop de requêtes de recherche, veuillez réessayer plus tard',
  standardHeaders: true,
  legacyHeaders: false,
});

const imageUploadLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 10, // 10 requests per hour
  message: 'Trop de téléchargements d\'images, veuillez réessayer plus tard',
  standardHeaders: true,
  legacyHeaders: false,
});

const generalLimiter = rateLimit({
  windowMs: env.RATE_LIMIT_GENERAL_WINDOW_MS,
  max: env.RATE_LIMIT_GENERAL_MAX,
  message: 'Trop de requêtes, veuillez réessayer plus tard',
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => {
    // Skip rate limiting for health checks and in test mode
    return req.path === '/health' || req.path === '/' || process.env.NODE_ENV === 'test';
  },
});

/**
 * @swagger
 * /health:
 *   get:
 *     summary: Health check endpoint
 *     description: Vérifie l'état de santé du serveur
 *     tags: [Health]
 *     responses:
 *       200:
 *         description: Serveur opérationnel
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: ok
 *                 timestamp:
 *                   type: string
 *                   format: date-time
 *                 uptime:
 *                   type: number
 *                   description: Temps de fonctionnement en secondes
 */
// Root endpoint
app.get('/', (_req, res) => {
  res.json({
    message: 'TravelCI Backend API',
    version: '1.0.0',
    documentation: '/api-docs',
    health: '/health',
    endpoints: {
      auth: '/api/auth',
      properties: '/api/properties',
      bookings: '/api/bookings',
      images: '/api/images',
    },
  });
});

app.get('/health', (_req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
});

// API routes
app.use('/api/auth', authLimiter, authRoutes);
app.use('/api/properties', searchLimiter, propertyRoutes);
app.use('/api/bookings', generalLimiter, bookingRoutes);
app.use('/api/images', imageUploadLimiter, imageRoutes);

// 404 handler
app.use(notFoundHandler);

// Error handler (must be last)
app.use(errorHandler);

/**
 * Start server
 * Listens on all network interfaces (0.0.0.0) to allow connections from physical devices
 * Skip server startup if running on Vercel (serverless environment)
 */
if (!process.env.VERCEL) {
  const PORT = parseInt(process.env.PORT || '3000', 10);
  const HOST = process.env.HOST || '0.0.0.0'; // Listen on all interfaces for physical device testing

  const server = app.listen(PORT, HOST, () => {
    logger.info(`Server running on http://${HOST}:${PORT}`, {
      env: process.env.NODE_ENV,
      port: PORT,
      host: HOST,
    });
  });

  // Graceful shutdown
  process.on('SIGTERM', () => {
    logger.info('SIGTERM signal received: closing HTTP server');
    server.close(() => {
      logger.info('HTTP server closed');
      process.exit(0);
    });
  });

  process.on('SIGINT', () => {
    logger.info('SIGINT signal received: closing HTTP server');
    server.close(() => {
      logger.info('HTTP server closed');
      process.exit(0);
    });
  });
} else {
  logger.info('Running on Vercel serverless environment');
}

export default app;

