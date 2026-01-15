import { FastifyPluginAsync } from 'fastify';
import fp from 'fastify-plugin';

interface CacheEntry<T> {
  value: T;
  expiresAt: number;
}

// In-memory cache
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const memoryCache = new Map<string, CacheEntry<any>>();

// Cleanup expired entries every 5 minutes
setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of memoryCache.entries()) {
    if (entry.expiresAt < now) {
      memoryCache.delete(key);
    }
  }
}, 5 * 60 * 1000);

interface CachePluginOptions {
  redisUrl?: string;
}

const cachePlugin: FastifyPluginAsync<CachePluginOptions> = async (
  fastify,
  options
) => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let redisClient: any = null;

  // Try to connect to Redis if URL provided
  if (options.redisUrl) {
    try {
      // Dynamic import for optional Redis dependency
      const { createClient } = await import('redis');
      redisClient = createClient({ url: options.redisUrl });
      
      redisClient.on('error', (err: Error) => {
        fastify.log.warn({ err }, 'Redis client error');
      });

      await redisClient.connect();
      fastify.log.info('Redis cache connected');
    } catch (error) {
      fastify.log.warn({ err: error }, 'Redis not available, using in-memory cache');
      redisClient = null;
    }
  }

  // Cache interface
  const cache = {
    async get<T>(key: string): Promise<T | null> {
      // Try Redis first
      if (redisClient) {
        try {
          const value = await redisClient.get(key);
          if (value) {
            return JSON.parse(value) as T;
          }
        } catch (error) {
          fastify.log.warn({ err: error }, 'Redis get error');
        }
      }

      // Fallback to memory
      const entry = memoryCache.get(key);
      if (!entry) {
        return null;
      }

      if (entry.expiresAt < Date.now()) {
        memoryCache.delete(key);
        return null;
      }

      return entry.value as T;
    },

    async set<T>(key: string, value: T, ttlSeconds: number): Promise<void> {
      const expiresAt = Date.now() + ttlSeconds * 1000;

      // Set in Redis
      if (redisClient) {
        try {
          await redisClient.setEx(key, ttlSeconds, JSON.stringify(value));
        } catch (error) {
          fastify.log.warn({ err: error }, 'Redis set error');
          // Fall through to memory cache
        }
      }

      // Set in memory
      memoryCache.set(key, { value, expiresAt });
    },

    async invalidate(key: string): Promise<void> {
      // Delete from Redis
      if (redisClient) {
        try {
          await redisClient.del(key);
        } catch (error) {
          fastify.log.warn({ err: error }, 'Redis delete error');
        }
      }

      // Delete from memory
      memoryCache.delete(key);
    },

    async invalidatePattern(pattern: string): Promise<void> {
      // Redis pattern matching
      if (redisClient) {
        try {
          const keys = await redisClient.keys(pattern);
          if (keys.length > 0) {
            await redisClient.del(keys);
          }
        } catch (error) {
          fastify.log.warn({ err: error }, 'Redis pattern delete error');
        }
      }

      // Memory pattern matching
      const regex = new RegExp(pattern.replace('*', '.*'));
      for (const key of memoryCache.keys()) {
        if (regex.test(key)) {
          memoryCache.delete(key);
        }
      }
    },

    async clear(): Promise<void> {
      // Clear Redis
      if (redisClient) {
        try {
          await redisClient.flushDb();
        } catch (error) {
          fastify.log.warn({ err: error }, 'Redis clear error');
        }
      }

      // Clear memory
      memoryCache.clear();
    },
  };

  // Decorate Fastify with cache
  fastify.decorate('cache', cache);

  // Cleanup on close
  fastify.addHook('onClose', async () => {
    if (redisClient) {
      await redisClient.quit();
    }
  });
};

declare module 'fastify' {
  interface FastifyInstance {
    cache: {
      get<T>(key: string): Promise<T | null>;
      set<T>(key: string, value: T, ttlSeconds: number): Promise<void>;
      invalidate(key: string): Promise<void>;
      invalidatePattern(pattern: string): Promise<void>;
      clear(): Promise<void>;
    };
  }
}

export default fp(cachePlugin, {
  name: 'cache',
});
