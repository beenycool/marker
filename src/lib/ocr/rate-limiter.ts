import { logger } from '@/lib/logger';

interface RateLimitEntry {
  count: number;
  resetTime: number;
}

class OCRRateLimiter {
  private limits = new Map<string, RateLimitEntry>();
  private readonly maxRequests: number;
  private readonly windowMs: number;

  constructor(maxRequests = 10, windowMs = 60000) { // 10 requests per minute
    this.maxRequests = maxRequests;
    this.windowMs = windowMs;
  }

  isAllowed(apiKey: string): { allowed: boolean; resetTime?: number; remaining?: number } {
    const now = Date.now();
    const key = `ocr:${apiKey}`;
    const entry = this.limits.get(key);

    if (!entry || now > entry.resetTime) {
      // Reset or create new entry
      this.limits.set(key, {
        count: 1,
        resetTime: now + this.windowMs
      });
      return { allowed: true, remaining: this.maxRequests - 1 };
    }

    if (entry.count >= this.maxRequests) {
      return { 
        allowed: false, 
        resetTime: entry.resetTime,
        remaining: 0
      };
    }

    entry.count++;
    return { 
      allowed: true, 
      remaining: this.maxRequests - entry.count 
    };
  }

  cleanup() {
    const now = Date.now();
    for (const [key, entry] of this.limits.entries()) {
      if (now > entry.resetTime) {
        this.limits.delete(key);
      }
    }
  }
}

export const ocrRateLimiter = new OCRRateLimiter();

// Cleanup expired entries every 5 minutes
if (typeof globalThis !== 'undefined') {
  setInterval(() => {
    ocrRateLimiter.cleanup();
  }, 5 * 60 * 1000);
}