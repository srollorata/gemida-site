// Rate limiting for authentication endpoints

interface RateLimitEntry {
  count: number;
  resetTime: number;
}

// In-memory store for rate limiting
// In production, consider using Redis for distributed systems
const rateLimitStore = new Map<string, RateLimitEntry>();

const RATE_LIMIT_WINDOW_MS = 15 * 60 * 1000; // 15 minutes
const MAX_ATTEMPTS = 5;

/**
 * Check if a request should be rate limited
 * @param identifier - Email or IP address to track
 * @returns Object with allowed status and reset time if blocked
 */
export function checkRateLimit(identifier: string): {
  allowed: boolean;
  resetTime?: number;
  remainingAttempts?: number;
} {
  const now = Date.now();
  const entry = rateLimitStore.get(identifier);

  // Clean up expired entries periodically (every 1000 checks)
  if (Math.random() < 0.001) {
    cleanupExpiredEntries(now);
  }

  if (!entry) {
    // First attempt, create new entry
    rateLimitStore.set(identifier, {
      count: 1,
      resetTime: now + RATE_LIMIT_WINDOW_MS,
    });
    return {
      allowed: true,
      remainingAttempts: MAX_ATTEMPTS - 1,
    };
  }

  // Check if window has expired
  if (now > entry.resetTime) {
    // Reset the entry
    rateLimitStore.set(identifier, {
      count: 1,
      resetTime: now + RATE_LIMIT_WINDOW_MS,
    });
    return {
      allowed: true,
      remainingAttempts: MAX_ATTEMPTS - 1,
    };
  }

  // Check if limit exceeded
  if (entry.count >= MAX_ATTEMPTS) {
    return {
      allowed: false,
      resetTime: entry.resetTime,
      remainingAttempts: 0,
    };
  }

  // Increment count
  entry.count++;
  rateLimitStore.set(identifier, entry);

  return {
    allowed: true,
    remainingAttempts: MAX_ATTEMPTS - entry.count,
  };
}

/**
 * Record a failed login attempt
 * @param identifier - Email or IP address
 */
export function recordFailedAttempt(identifier: string): void {
  const now = Date.now();
  const entry = rateLimitStore.get(identifier);

  if (!entry) {
    rateLimitStore.set(identifier, {
      count: 1,
      resetTime: now + RATE_LIMIT_WINDOW_MS,
    });
  } else if (now > entry.resetTime) {
    // Reset expired entry
    rateLimitStore.set(identifier, {
      count: 1,
      resetTime: now + RATE_LIMIT_WINDOW_MS,
    });
  } else {
    entry.count++;
    rateLimitStore.set(identifier, entry);
  }
}

/**
 * Reset rate limit for an identifier (useful after successful login)
 * @param identifier - Email or IP address
 */
export function resetRateLimit(identifier: string): void {
  rateLimitStore.delete(identifier);
}

/**
 * Clean up expired entries from the store
 */
function cleanupExpiredEntries(now: number): void {
  for (const [key, entry] of rateLimitStore.entries()) {
    if (now > entry.resetTime) {
      rateLimitStore.delete(key);
    }
  }
}

