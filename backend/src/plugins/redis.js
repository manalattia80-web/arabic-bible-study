/**
 * src/plugins/redis.js
 * Optional Redis caching via Upstash REST API.
 * If UPSTASH_REDIS_REST_URL is not set, a no-op cache is used
 * so the API works correctly without Redis.
 *
 * Accessible as: fastify.cache.get(key) / .set(key, val, ttl) / .del(key)
 *
 * TTL constants:
 *   NAV_TTL    = 86400s (24 hours) — testaments, books, chapters
 *   VERSE_TTL  = 300s   (5 minutes) — chapter verses (admin can edit)
 *   STRONGS_TTL = 3600s (1 hour)   — Strong's entries
 */

import fp            from 'fastify-plugin';
import { Redis }     from '@upstash/redis';

// Cache TTL constants (seconds)
export const TTL = {
  NAV:     86400,
  VERSES:  300,
  STRONGS: 3600,
};

// ── No-op cache (when Redis is not configured) ───────────────────────────────
const noopCache = {
  async get()        { return null; },
  async set()        { return 'OK'; },
  async del()        { return 1; },
  async invalidate() { return 0; },
};

async function redisPlugin(fastify) {
  const redisUrl   = process.env.UPSTASH_REDIS_REST_URL;
  const redisToken = process.env.UPSTASH_REDIS_REST_TOKEN;

  if (!redisUrl || !redisToken) {
    fastify.log.warn('⚠️  Redis not configured — caching disabled');
    fastify.decorate('cache', noopCache);
    return;
  }

  const redis = new Redis({
    url:   redisUrl,
    token: redisToken,
  });

  // Wrapper with JSON serialization and prefix namespacing
  const cache = {
    /**
     * @param {string} key
     * @returns {Promise<any|null>}
     */
    async get(key) {
      const val = await redis.get(`bible:${key}`);
      return val ?? null;
    },

    /**
     * @param {string} key
     * @param {any}    value
     * @param {number} [ttl] - seconds; defaults to 300
     */
    async set(key, value, ttl = TTL.VERSES) {
      await redis.set(`bible:${key}`, value, { ex: ttl });
    },

    /**
     * @param {string} key
     */
    async del(key) {
      await redis.del(`bible:${key}`);
    },

    /**
     * Invalidate all keys matching a pattern.
     * @param {string} pattern - e.g. 'verses:book:1:ch:*'
     */
    async invalidate(pattern) {
      const keys = await redis.keys(`bible:${pattern}`);
      if (keys.length > 0) {
        await redis.del(...keys);
      }
      return keys.length;
    },
  };

  fastify.decorate('cache', cache);
  fastify.log.info('✅ Redis (Upstash) connected');
}

export default fp(redisPlugin, { name: 'redis' });
