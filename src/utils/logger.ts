import winston from 'winston';
import fs from 'fs';
import path from 'path';
import { env } from '../config/env';

// Ensure logs directory exists (skip on Vercel/serverless where filesystem is read-only)
const logsDir = path.join(process.cwd(), 'logs');
if (!process.env.VERCEL && !fs.existsSync(logsDir)) {
  try {
    fs.mkdirSync(logsDir, { recursive: true });
  } catch (error) {
    // If we can't create logs directory, continue without file logging
    console.warn('Could not create logs directory, file logging disabled');
  }
}

/**
 * Winston logger configuration
 */
const logFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.errors({ stack: true }),
  winston.format.splat(),
  winston.format.json()
);

const consoleFormat = winston.format.combine(
  winston.format.colorize(),
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.printf(({ timestamp, level, message, ...meta }) => {
    let msg = `${timestamp} [${level}]: ${message}`;
    if (Object.keys(meta).length > 0) {
      msg += ` ${JSON.stringify(meta)}`;
    }
    return msg;
  })
);

// Build transports array
const transports: winston.transport[] = [];

// Add file transports only if not on Vercel (filesystem may be read-only)
if (!process.env.VERCEL) {
  try {
    if (fs.existsSync(logsDir)) {
      transports.push(
        new winston.transports.File({
          filename: 'logs/error.log',
          level: 'error',
          maxsize: 5242880, // 5MB
          maxFiles: 5,
        }),
        new winston.transports.File({
          filename: 'logs/combined.log',
          maxsize: 5242880, // 5MB
          maxFiles: 5,
        })
      );
    }
  } catch (error) {
    // If file transports fail, continue without them
    console.warn('File logging unavailable, using console only');
  }
}

// Always add console transport (works on Vercel)
transports.push(
  new winston.transports.Console({
    format: process.env.VERCEL ? logFormat : consoleFormat,
  })
);

export const logger = winston.createLogger({
  level: env.NODE_ENV === 'production' ? 'info' : 'debug',
  format: logFormat,
  defaultMeta: { service: 'travelci-backend' },
  transports,
});

/**
 * Log request with timing
 */
export function logRequest(req: any, res: any, duration: number): void {
  const logData = {
    method: req.method,
    url: req.originalUrl,
    statusCode: res.statusCode,
    duration: `${duration}ms`,
    ip: req.ip,
    userAgent: req.get('user-agent'),
    requestId: req.requestId,
  };

  if (res.statusCode >= 400) {
    logger.warn('HTTP Request', logData);
  } else {
    logger.info('HTTP Request', logData);
  }
}

/**
 * Log error with context
 */
export function logError(error: Error, context?: any): void {
  logger.error('Error occurred', {
    message: error.message,
    stack: error.stack,
    ...context,
  });
}

