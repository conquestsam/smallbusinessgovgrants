import { Redis } from '@upstash/redis';

// Pure Edge/Serverless compatible Redis client
const redis = Redis.fromEnv();

export class CacheService {
  /**
   * Specialized retrieval with JSON parsing for unified Edge consistency.
   * Gracefully handles missing connections or parsing errors.
   */
  static async get(key: string) {
    if (!process.env.UPSTASH_REDIS_REST_URL) {
      console.warn('Edge Redis: UPSTASH_REDIS_REST_URL is missing.');
      return null;
    }
    try {
      const data = await redis.get(key);
      if (!data) return null;
      return typeof data === 'string' ? JSON.parse(data) : data;
    } catch (error) {
      console.error(`Edge Redis get error [${key}]:`, error);
      return null;
    }
  }

  /**
   * Persistence with TTL enforcement for transient platform data.
   */
  static async set(key: string, value: any, ttl: number = 3600) {
    if (!process.env.UPSTASH_REDIS_REST_URL) return false;
    try {
      await redis.set(key, JSON.stringify(value), { ex: ttl });
      return true;
    } catch (error) {
      console.error(`Edge Redis set error [${key}]:`, error);
      return false;
    }
  }

  /**
   * Immediate key eviction for cache invalidation or session termination.
   */
  static async del(key: string) {
    if (!process.env.UPSTASH_REDIS_REST_URL) return false;
    try {
      await redis.del(key);
      return true;
    } catch (error) {
      console.error(`Edge Redis del error [${key}]:`, error);
      return false;
    }
  }

  /**
   * Atomic presence check for low-latency security filtering.
   */
  static async exists(key: string) {
    if (!process.env.UPSTASH_REDIS_REST_URL) return 0;
    try {
      return await redis.exists(key);
    } catch (error) {
      console.error(`Edge Redis exists error [${key}]:`, error);
      return 0;
    }
  }
}

export default redis;