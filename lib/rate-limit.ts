// Rate limiting for authentication endpoints

import { getRedisClient } from './redis';

interface RateLimitResult {
  allowed: boolean;
  resetTime?: number;
  remainingAttempts?: number;
}

// In-memory fallback store for development when Redis is not configured
interface RateLimitEntry {
  count: number;
  resetTime: number;
}

const inMemoryStore = new Map<string, RateLimitEntry>();

const RATE_LIMIT_WINDOW_SEC = 15 * 60; // 15 minutes in seconds
const MAX_ATTEMPTS = 5;

/**
 * Check if a request should be rate limited.
 * Uses Redis when REDIS_URL is configured, otherwise falls back to in-memory Map.
 */
export async function checkRateLimit(identifier: string): Promise<RateLimitResult> {
  const redis = getRedisClient();
  if (redis) {
    const key = `rl:${identifier}`;
    try {
      const count = await redis.incr(key);
      if (count === 1) {
        // First increment, set TTL
        await redis.expire(key, RATE_LIMIT_WINDOW_SEC);
      }

      if (count > MAX_ATTEMPTS) {
        const ttl = await redis.ttl(key);
        const resetTime = ttl > 0 ? Date.now() + ttl * 1000 : undefined;
        return { allowed: false, resetTime, remainingAttempts: 0 };
      }

      const remaining = MAX_ATTEMPTS - count;
      return { allowed: true, remainingAttempts: remaining };
    } catch (err) {
      console.error('Redis rate-limit error, falling back to in-memory:', err);
      // fall through to in-memory fallback
    }
  }

  // In-memory fallback (single-instance)
  const now = Date.now();
  const entry = inMemoryStore.get(identifier);
  if (!entry) {
    inMemoryStore.set(identifier, { count: 1, resetTime: now + RATE_LIMIT_WINDOW_SEC * 1000 });
    return { allowed: true, remainingAttempts: MAX_ATTEMPTS - 1 };
  }

  if (now > entry.resetTime) {
    inMemoryStore.set(identifier, { count: 1, resetTime: now + RATE_LIMIT_WINDOW_SEC * 1000 });
    return { allowed: true, remainingAttempts: MAX_ATTEMPTS - 1 };
  }

  if (entry.count >= MAX_ATTEMPTS) {
    return { allowed: false, resetTime: entry.resetTime, remainingAttempts: 0 };
  }

  entry.count++;
  inMemoryStore.set(identifier, entry);
  return { allowed: true, remainingAttempts: MAX_ATTEMPTS - entry.count };
}

export async function recordFailedAttempt(identifier: string): Promise<void> {
  const redis = getRedisClient();
  if (redis) {
    const key = `rl:${identifier}`;
    try {
      const count = await redis.incr(key);
      if (count === 1) {
        await redis.expire(key, RATE_LIMIT_WINDOW_SEC);
      }
      return;
    } catch (err) {
      console.error('Redis recordFailedAttempt error, falling back to in-memory:', err);
    }
  }

  const now = Date.now();
  const entry = inMemoryStore.get(identifier);
  if (!entry) {
    inMemoryStore.set(identifier, { count: 1, resetTime: now + RATE_LIMIT_WINDOW_SEC * 1000 });
  } else if (now > entry.resetTime) {
    inMemoryStore.set(identifier, { count: 1, resetTime: now + RATE_LIMIT_WINDOW_SEC * 1000 });
  } else {
    entry.count++;
    inMemoryStore.set(identifier, entry);
  }
}

export async function resetRateLimit(identifier: string): Promise<void> {
  const redis = getRedisClient();
  if (redis) {
    try {
      await redis.del(`rl:${identifier}`);
      return;
    } catch (err) {
      console.error('Redis resetRateLimit error, falling back to in-memory:', err);
    }
  }

  inMemoryStore.delete(identifier);
}

