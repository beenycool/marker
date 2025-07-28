// GDPR REMOVAL: All IP-based rate limiting commented out - collects personal data
/*
import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';
import { NextRequest, NextResponse } from 'next/server';
import { logger } from '@/lib/logger';
import { getEnvVar } from '@/lib/cloudflare-env';
import { WorkersRateLimit } from '@/lib/workers-optimizations';

// Lazy-loaded Redis instance for rate limiting
let redis: Redis | null = null;
let workersRateLimit: WorkersRateLimit | null = null;
let rateLimitInitialized = false;

async function initializeRateLimit() {
  if (rateLimitInitialized) return;

  try {
    const redisUrl = await getEnvVar('UPSTASH_REDIS_REST_URL');
    const redisToken = await getEnvVar('UPSTASH_REDIS_REST_TOKEN');

    if (redisUrl && redisToken) {
      redis = new Redis({
        url: redisUrl,
        token: redisToken,
      });
    } else {
      // Try to use Workers KV for rate limiting
      try {
        // @ts-ignore - Access Workers global bindings
        const kvNamespace = globalThis.RATE_LIMIT || globalThis.ENV?.RATE_LIMIT;
        if (kvNamespace) {
          workersRateLimit = new WorkersRateLimit(kvNamespace);
        }
      } catch {
        // Silently handle missing Redis/KV for rate limiting
      }
    }
  } catch (error) {
    // Silently handle rate limit initialization errors
  }

  rateLimitInitialized = true;
}

function getRedisInstance() {
  if (!redis) {
    throw new Error('Redis not initialized for rate limiting');
  }
  return redis;
}

// Different rate limits for different endpoints - lazy initialized
export const rateLimiters = {
  async api() {
    await initializeRateLimit();
    return new Ratelimit({
      redis: getRedisInstance(),
      limiter: Ratelimit.slidingWindow(60, '1 m'), // 60 requests per minute
      analytics: true,
      prefix: 'ratelimit:api',
    });
  },

  async marking() {
    await initializeRateLimit();
    return new Ratelimit({
      redis: getRedisInstance(),
      limiter: Ratelimit.slidingWindow(10, '1 m'), // 10 marking requests per minute
      analytics: true,
      prefix: 'ratelimit:marking',
    });
  },

  async auth() {
    await initializeRateLimit();
    return new Ratelimit({
      redis: getRedisInstance(),
      limiter: Ratelimit.slidingWindow(5, '1 m'), // 5 auth requests per minute
      analytics: true,
      prefix: 'ratelimit:auth',
    });
  },

  async upload() {
    await initializeRateLimit();
    return new Ratelimit({
      redis: getRedisInstance(),
      limiter: Ratelimit.slidingWindow(5, '1 m'), // 5 uploads per minute
      analytics: true,
      prefix: 'ratelimit:upload',
    });
  },

  async markingPro() {
    await initializeRateLimit();
    return new Ratelimit({
      redis: getRedisInstance(),
      limiter: Ratelimit.slidingWindow(30, '1 m'), // 30 marking requests per minute for pro users
      analytics: true,
      prefix: 'ratelimit:marking:pro',
    });
  },

  async waitlist() {
    await initializeRateLimit();
    return new Ratelimit({
      redis: getRedisInstance(),
      limiter: Ratelimit.slidingWindow(5, '1 h'), // 5 waitlist submissions per hour
      analytics: true,
      prefix: 'ratelimit:waitlist',
    });
  },
};

export async function rateLimit(
  req: NextRequest,
  limiter: Ratelimit | (() => Promise<Ratelimit>),
  identifier?: string
): Promise<NextResponse | null> {
  // COLLECTS IP ADDRESSES - PERSONAL DATA
  const ip =
    identifier ||
    (req as any).ip ||
    req.headers.get('x-forwarded-for') ||
    '127.0.0.1';

  try {
    await initializeRateLimit();

    // Handle both direct limiter and factory function
    const rateLimiter =
      typeof limiter === 'function' ? await limiter() : limiter;

    // If Redis is not available, try Workers rate limiting
    if (!redis && workersRateLimit) {
      const result = await workersRateLimit.checkLimit(ip, 60000, 60); // Default: 60 requests per minute

      if (!result.allowed) {
        return new NextResponse(
          JSON.stringify({
            error: 'Too many requests',
            message: 'Rate limit exceeded. Please try again later.',
            retryAfter: Math.round((result.resetTime - Date.now()) / 1000),
          }),
          {
            status: 429,
            headers: {
              'Content-Type': 'application/json',
              'X-RateLimit-Remaining': result.remaining.toString(),
              'X-RateLimit-Reset': new Date(result.resetTime).toISOString(),
              'Retry-After': Math.round(
                (result.resetTime - Date.now()) / 1000
              ).toString(),
            },
          }
        );
      }

      return null;
    }

    const { success, limit, reset, remaining } = await rateLimiter.limit(ip);

    if (!success) {
      return new NextResponse(
        JSON.stringify({
          error: 'Too many requests',
          message: 'Rate limit exceeded. Please try again later.',
          retryAfter: Math.round((reset - Date.now()) / 1000),
        }),
        {
          status: 429,
          headers: {
            'Content-Type': 'application/json',
            'X-RateLimit-Limit': limit.toString(),
            'X-RateLimit-Remaining': remaining.toString(),
            'X-RateLimit-Reset': new Date(reset).toISOString(),
            'Retry-After': Math.round((reset - Date.now()) / 1000).toString(),
          },
        }
      );
    }

    return null; // No rate limit exceeded
  } catch (error) {
    logger.error('Rate limiting error', error);
    // If rate limiting fails, allow the request to proceed
    return null;
  }
}

// Middleware helper for rate limiting
export function withRateLimit(
  limiter: Ratelimit | (() => Promise<Ratelimit>),
  handler: (req: NextRequest) => Promise<NextResponse>
) {
  return async (req: NextRequest): Promise<NextResponse> => {
    const rateLimitResult = await rateLimit(req, limiter);

    if (rateLimitResult) {
      return rateLimitResult;
    }

    return handler(req);
  };
}

// User-specific rate limiting - COLLECTS USER DATA
export async function rateLimitByUser(
  userId: string,
  limiter: Ratelimit | (() => Promise<Ratelimit>)
): Promise<{
  success: boolean;
  limit: number;
  remaining: number;
  reset: Date;
}> {
  try {
    await initializeRateLimit();

    // Handle both direct limiter and factory function
    const rateLimiter =
      typeof limiter === 'function' ? await limiter() : limiter;

    // If Redis is not available, try Workers rate limiting
    if (!redis && workersRateLimit) {
      const result = await workersRateLimit.checkLimit(userId, 60000, 60); // Default: 60 requests per minute

      return {
        success: result.allowed,
        limit: 60,
        remaining: result.remaining,
        reset: new Date(result.resetTime),
      };
    }

    const { success, limit, reset, remaining } =
      await rateLimiter.limit(userId);

    return {
      success,
      limit,
      remaining,
      reset: new Date(reset),
    };
  } catch (error) {
    logger.error('User rate limiting error', error);
    // Default to allowing the request if rate limiting fails
    return {
      success: true,
      limit: 0,
      remaining: 0,
      reset: new Date(),
    };
  }
}

// Check if user has hit rate limit without consuming a request
export async function checkRateLimit(
  identifier: string,
  limiter: Ratelimit | (() => Promise<Ratelimit>)
): Promise<{
  success: boolean;
  limit: number;
  remaining: number;
  reset: Date;
}> {
  try {
    await initializeRateLimit();

    // Handle both direct limiter and factory function
    const rateLimiter =
      typeof limiter === 'function' ? await limiter() : limiter;

    // If Redis is not available, try Workers rate limiting
    if (!redis && workersRateLimit) {
      const result = await workersRateLimit.checkLimit(identifier, 60000, 60); // Default: 60 requests per minute

      return {
        success: result.allowed,
        limit: 60,
        remaining: result.remaining,
        reset: new Date(result.resetTime),
      };
    }

    const result = await rateLimiter.limit(identifier);
    return {
      success: result.success,
      limit: result.limit,
      remaining: result.remaining,
      reset: new Date(result.reset),
    };
  } catch (error) {
    logger.error('Rate limit check error', error);
    return {
      success: true,
      limit: 0,
      remaining: 0,
      reset: new Date(),
    };
  }
}

// Clean up expired rate limit entries (optional, Redis handles this automatically)
export async function cleanupRateLimits(): Promise<void> {
  try {
    await initializeRateLimit();

    if (redis) {
      const keys = await redis.keys('ratelimit:*');
      if (keys.length > 0) {
        logger.debug(`Found ${keys.length} rate limit keys`);
      }
    } else {
      logger.debug(
        'Rate limit cleanup not needed for Workers KV (auto-expires)'
      );
    }
  } catch (error) {
    logger.error('Rate limit cleanup error', error);
  }
}
*/

// GDPR-SAFE: No rate limiting, no personal data collection
export const rateLimiters = {
  api: null,
  marking: null,
  auth: null,
  upload: null,
  markingPro: null,
  waitlist: null,
};

export async function rateLimit(): Promise<null> {
  // No rate limiting - allows all requests
  return null;
}

export function withRateLimit(
  _limiter: any,
  handler: (req: any) => Promise<any>
) {
  return handler; // Just return the handler without rate limiting
}

export async function rateLimitByUser(): Promise<{
  success: boolean;
  limit: number;
  remaining: number;
  reset: Date;
}> {
  // Always allow - no user tracking
  return {
    success: true,
    limit: 0,
    remaining: 0,
    reset: new Date(),
  };
}

export async function checkRateLimit(): Promise<{
  success: boolean;
  limit: number;
  remaining: number;
  reset: Date;
}> {
  // Always allow - no tracking
  return {
    success: true,
    limit: 0,
    remaining: 0,
    reset: new Date(),
  };
}

export async function cleanupRateLimits(): Promise<void> {
  // No cleanup needed - no rate limiting
}
