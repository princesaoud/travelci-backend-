import { initRedis } from '../utils/cache';
import { logger } from '../utils/logger';

/**
 * Initialize Redis connection
 */
export function initRedisConnection(): void {
  try {
    initRedis();
    logger.info('Redis connection initialized');
  } catch (error: any) {
    logger.warn('Redis connection failed, continuing without cache', {
      error: error.message,
    });
    // Continue without Redis - cache will be disabled
  }
}

