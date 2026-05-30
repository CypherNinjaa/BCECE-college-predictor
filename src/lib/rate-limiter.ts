import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";
import { LRUCache } from "lru-cache";

let redisRatelimit: Ratelimit | null = null;

if (process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN) {
  try {
    redisRatelimit = new Ratelimit({
      redis: Redis.fromEnv(),
      limiter: Ratelimit.slidingWindow(30, "60 s"),
      analytics: true,
      prefix: "bcece-predictor",
    });
  } catch (err) {
    console.error("Failed to initialize Upstash Redis rate limiter:", err);
  }
}

// Fallback In-Memory Rate Limiting
const inMemoryCache = new LRUCache<string, { count: number; resetTime: number }>({
  max: 5000,
  ttl: 60 * 1000, // 1 minute
});

export async function rateLimit(identifier: string, limit = 30): Promise<{
  success: boolean;
  remaining: number;
  reset: number;
}> {
  // If Upstash Redis is configured, use it
  if (redisRatelimit) {
    try {
      const result = await redisRatelimit.limit(identifier);
      return {
        success: result.success,
        remaining: result.remaining,
        reset: result.reset,
      };
    } catch (err) {
      console.warn("Upstash Redis rate limit failed, falling back to in-memory rate limiting:", err);
    }
  }

  // In-Memory Fallback
  const now = Date.now();
  const windowMs = 60 * 1000; // 1 minute
  const cached = inMemoryCache.get(identifier);

  if (!cached || now > cached.resetTime) {
    // Start a new window
    const resetTime = now + windowMs;
    inMemoryCache.set(identifier, { count: 1, resetTime });
    return {
      success: true,
      remaining: limit - 1,
      reset: resetTime,
    };
  }

  if (cached.count >= limit) {
    return {
      success: false,
      remaining: 0,
      reset: cached.resetTime,
    };
  }

  cached.count += 1;
  inMemoryCache.set(identifier, cached);

  return {
    success: true,
    remaining: limit - cached.count,
    reset: cached.resetTime,
  };
}
