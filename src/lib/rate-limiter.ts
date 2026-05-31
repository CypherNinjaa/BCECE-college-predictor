import { Ratelimit, type Duration } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";
import { LRUCache } from "lru-cache";

const DEFAULT_WINDOW: Duration = "60 s";
const DEFAULT_WINDOW_MS = 60 * 1000;
const REDIS_RATE_LIMIT_PREFIX = "bcece-predictor";

export interface RateLimitResult {
  success: boolean;
  remaining: number;
  reset: number;
  limit: number;
}

let redisClient: Redis | null = null;
const redisRatelimits = new Map<string, Ratelimit>();

if (process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN) {
  try {
    redisClient = Redis.fromEnv();
  } catch (err) {
    console.error("Failed to initialize Upstash Redis rate limiter:", err);
  }
}

// Fallback In-Memory Rate Limiting
const inMemoryCache = new LRUCache<string, { count: number; resetTime: number }>({
  max: 5000,
  ttl: DEFAULT_WINDOW_MS,
});

function durationToMs(window: Duration): number {
  const match = String(window).match(/^(\d+)\s?(ms|s|m|h|d)$/);
  if (!match) return DEFAULT_WINDOW_MS;

  const amount = Number(match[1]);
  const unit = match[2];

  if (unit === "ms") return amount;
  if (unit === "s") return amount * 1000;
  if (unit === "m") return amount * 60 * 1000;
  if (unit === "h") return amount * 60 * 60 * 1000;
  return amount * 24 * 60 * 60 * 1000;
}

function getRedisRatelimit(limit: number, window: Duration): Ratelimit | null {
  if (!redisClient) return null;

  const key = `${limit}:${window}`;
  const existing = redisRatelimits.get(key);
  if (existing) return existing;

  const limiter = new Ratelimit({
    redis: redisClient,
    limiter: Ratelimit.slidingWindow(limit, window),
    analytics: true,
    prefix: `${REDIS_RATE_LIMIT_PREFIX}:${limit}:${String(window).replace(/\s+/g, "")}`,
  });

  redisRatelimits.set(key, limiter);
  return limiter;
}

function getInMemoryKey(identifier: string, limit: number, windowMs: number): string {
  return `${limit}:${windowMs}:${identifier}`;
}

function inMemoryRateLimit(
  identifier: string,
  limit: number,
  windowMs: number,
  increment: boolean
): RateLimitResult {
  const now = Date.now();
  const cacheKey = getInMemoryKey(identifier, limit, windowMs);
  const cached = inMemoryCache.get(cacheKey);

  if (!cached || now >= cached.resetTime) {
    const resetTime = now + windowMs;

    if (increment) {
      inMemoryCache.set(cacheKey, { count: 1, resetTime }, { ttl: windowMs });
    }

    return {
      success: true,
      remaining: increment ? Math.max(0, limit - 1) : limit,
      reset: resetTime,
      limit,
    };
  }

  if (!increment) {
    const remaining = Math.max(0, limit - cached.count);

    return {
      success: remaining > 0,
      remaining,
      reset: cached.resetTime,
      limit,
    };
  }

  if (cached.count >= limit) {
    return {
      success: false,
      remaining: 0,
      reset: cached.resetTime,
      limit,
    };
  }

  const count = cached.count + 1;
  inMemoryCache.set(cacheKey, { count, resetTime: cached.resetTime }, { ttl: cached.resetTime - now });

  return {
    success: true,
    remaining: Math.max(0, limit - count),
    reset: cached.resetTime,
    limit,
  };
}

export async function rateLimit(
  identifier: string,
  limit = 30,
  window: Duration = DEFAULT_WINDOW
): Promise<RateLimitResult> {
  const redisRatelimit = getRedisRatelimit(limit, window);

  if (redisRatelimit) {
    try {
      const result = await redisRatelimit.limit(identifier);
      return {
        success: result.success,
        remaining: Math.max(0, result.remaining),
        reset: result.reset,
        limit: result.limit,
      };
    } catch (err) {
      console.warn("Upstash Redis rate limit failed, falling back to in-memory rate limiting:", err);
    }
  }

  return inMemoryRateLimit(identifier, limit, durationToMs(window), true);
}

export async function rateLimitStatus(
  identifier: string,
  limit = 30,
  window: Duration = DEFAULT_WINDOW
): Promise<RateLimitResult> {
  const redisRatelimit = getRedisRatelimit(limit, window);

  if (redisRatelimit) {
    try {
      const result = await redisRatelimit.getRemaining(identifier);
      const remaining = Math.max(0, result.remaining);

      return {
        success: remaining > 0,
        remaining,
        reset: result.reset,
        limit: result.limit,
      };
    } catch (err) {
      console.warn("Upstash Redis rate limit status failed, falling back to in-memory rate limiting:", err);
    }
  }

  return inMemoryRateLimit(identifier, limit, durationToMs(window), false);
}
