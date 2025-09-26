import Redis from 'ioredis';

const redis = new Redis(process.env.REDIS_URL!);

export class CacheService {
  static async get(key: string) {
    try {
      const data = await redis.get(key);
      return data ? JSON.parse(data) : null;
    } catch (error) {
      console.error('Redis get error:', error);
      return null;
    }
  }

  static async set(key: string, value: any, ttl: number = 3600) {
    try {
      await redis.setex(key, ttl, JSON.stringify(value));
      return true;
    } catch (error) {
      console.error('Redis set error:', error);
      return false;
    }
  }

  static async del(key: string) {
    try {
      await redis.del(key);
      return true;
    } catch (error) {
      console.error('Redis del error:', error);
      return false;
    }
  }

  static async exists(key: string) {
    try {
      return await redis.exists(key);
    } catch (error) {
      console.error('Redis exists error:', error);
      return false;
    }
  }
}

export default redis;