import { Request, Response, NextFunction } from 'express';
import { cacheService } from '../utils/cache';

/**
 * Cache middleware
 */
export const cacheMiddleware = (durationSeconds: number = 300) => {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    // Only cache GET requests
    if (req.method !== 'GET') {
      next();
      return;
    }

    try {
      const key = `cache:${req.originalUrl}:${JSON.stringify(req.query)}`;
      const cached = await cacheService.get(key);

      if (cached) {
        res.setHeader('X-Cache-Status', 'HIT');
        res.json(cached);
        return;
      }

      // Store original json method
      const originalJson = res.json.bind(res);

      // Override json to cache response
      res.json = function (data: any) {
        cacheService.set(key, data, durationSeconds).catch(() => {
          // Ignore cache errors
        });
        return originalJson(data);
      };

      res.setHeader('X-Cache-Status', 'MISS');
      next();
    } catch (error) {
      // If cache fails, continue without cache
      next();
    }
  };
};

