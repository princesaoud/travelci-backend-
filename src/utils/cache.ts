import Redis from 'ioredis';
import { env } from '../config/env';
import { logger } from './logger';

/**
 * Redis client instance
 */
let redisClient: Redis | null = null;

/**
 * Initialize Redis connection
 */
export function initRedis(): Redis {
  if (redisClient) {
    return redisClient;
  }

  try {
    redisClient = new Redis(env.REDIS_URL, {
      retryStrategy: (times) => {
        const delay = Math.min(times * 50, 2000);
        return delay;
      },
      maxRetriesPerRequest: 3,
    });

    redisClient.on('connect', () => {
      logger.info('Redis connected successfully');
    });

    redisClient.on('error', (error) => {
      logger.error('Redis connection error', { error: error.message });
    });

    return redisClient;
  } catch (error: any) {
    logger.error('Failed to initialize Redis', { error: error.message });
    throw error;
  }
}

/**
 * Get Redis client
 */
export function getRedis(): Redis | null {
  return redisClient;
}

/**
 * Cache helper functions
 */
export class CacheService {
  private redis: Redis | null;

  constructor() {
    this.redis = getRedis();
  }

  /**
   * Get value from cache
   */
  async get<T>(key: string): Promise<T | null> {
    if (!this.redis) {
      return null;
    }

    try {
      const value = await this.redis.get(key);
      return value ? (JSON.parse(value) as T) : null;
    } catch (error: any) {
      logger.error('Cache get error', { key, error: error.message });
      return null;
    }
  }

  /**
   * Set value in cache with TTL
   */
  async set(key: string, value: any, ttlSeconds: number = 300): Promise<void> {
    if (!this.redis) {
      return;
    }

    try {
      await this.redis.setex(key, ttlSeconds, JSON.stringify(value));
    } catch (error: any) {
      logger.error('Cache set error', { key, error: error.message });
    }
  }

  /**
   * Delete key from cache
   */
  async delete(key: string): Promise<void> {
    if (!this.redis) {
      return;
    }

    try {
      await this.redis.del(key);
    } catch (error: any) {
      logger.error('Cache delete error', { key, error: error.message });
    }
  }

  /**
   * Delete keys matching pattern
   */
  async deletePattern(pattern: string): Promise<void> {
    if (!this.redis) {
      return;
    }

    try {
      const keys = await this.redis.keys(pattern);
      if (keys.length > 0) {
        await this.redis.del(...keys);
      }
    } catch (error: any) {
      logger.error('Cache delete pattern error', { pattern, error: error.message });
    }
  }

  /**
   * Invalidate property-related cache
   */
  async invalidatePropertyCache(propertyId?: string): Promise<void> {
    await this.deletePattern('cache:api/properties*');
    if (propertyId) {
      await this.delete(`cache:api/properties/${propertyId}`);
    }
  }
}

export const cacheService = new CacheService();

