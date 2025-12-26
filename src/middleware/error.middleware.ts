import { Request, Response, NextFunction } from 'express';
import { AppError } from '../utils/errors';
import { sendError } from '../utils/responses';
import { logger, logError } from '../utils/logger';

/**
 * Error handling middleware
 */
export const errorHandler = (
  error: Error,
  req: Request,
  res: Response,
  _next: NextFunction
): void => {
  // Log error
  logError(error, {
    method: req.method,
    url: req.originalUrl,
    requestId: req.requestId,
  });

  // Handle known application errors
  if (error instanceof AppError) {
    sendError(res, error.message, error.code, error.statusCode);
    return;
  }

  // Handle unknown errors
  sendError(
    res,
    'Une erreur inattendue s\'est produite',
    'INTERNAL_ERROR',
    500
  );
};

/**
 * 404 Not Found handler
 */
export const notFoundHandler = (
  req: Request,
  res: Response,
  _next: NextFunction
): void => {
  sendError(res, `Route non trouvée: ${req.originalUrl}`, 'NOT_FOUND', 404);
};

/**
 * Request ID middleware
 */
export const requestIdMiddleware = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  req.requestId = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  res.setHeader('X-Request-ID', req.requestId);
  next();
};

/**
 * Request timing middleware
 */
export const timingMiddleware = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const start = Date.now();

  res.on('finish', () => {
    const duration = Date.now() - start;
    // Note: Cannot set headers in 'finish' event as response is already sent
    // X-Response-Time header would need to be set before response is sent
    logger.info('Request completed', {
      method: req.method,
      url: req.originalUrl,
      statusCode: res.statusCode,
      duration: `${duration}ms`,
      requestId: req.requestId,
    });
  });

  next();
};

