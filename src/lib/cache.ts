import { logger } from './logger';
import { createHash } from 'crypto';
import { MarkingRequest, MarkingResponse } from '@/types';
import { WorkersCache } from '@/lib/workers-optimizations';

class CacheService {
  private workersCache: WorkersCache | null = null;
  private memoryCache = new Map<string, { data: any; expires: number }>();
  private readonly CACHE_TTL = 3600; // 1 hour in seconds
  private initialized = false;

  private async initialize() {
    if (this.initialized) return;

    try {
      // Try to use Workers KV cache if available
      try {
        // @ts-ignore - Access Workers global bindings
        const kvNamespace = globalThis.CACHE || globalThis.ENV?.CACHE;
        if (kvNamespace) {
          this.workersCache = new WorkersCache(kvNamespace);
        }
      } catch {
        // Fall back to in-memory cache
      }

      if (!this.workersCache) {
        logger.warn(
          'Workers KV not available, using in-memory cache'
        );
      }
    } catch (error) {
      logger.error('Cache initialization error:', error);
    }

    this.initialized = true;
  }

  private generateCacheKey(request: MarkingRequest): string {
    const cacheData = {
      answer: request.answer,
      question: request.question,
      subject: request.subject,
      examBoard: request.examBoard,
      markScheme: request.markScheme,
    };

    const hash = createHash('sha256')
      .update(JSON.stringify(cacheData))
      .digest('hex');
    return `marking:${hash}`;
  }

  async get(request: MarkingRequest): Promise<MarkingResponse | null> {
    await this.initialize();
    const key = this.generateCacheKey(request);

    try {
      if (this.workersCache) {
        const cached = await this.workersCache.get<MarkingResponse>(key);
        if (cached) {
          return cached;
        }
      } else {
        const memCached = this.memoryCache.get(key);
        if (memCached && Date.now() < memCached.expires) {
          return memCached.data as MarkingResponse;
        } else if (memCached) {
          this.memoryCache.delete(key);
        }
      }
    } catch (error) {
      logger.error('Cache get error:', error);
    }

    return null;
  }

  async set(request: MarkingRequest, response: MarkingResponse): Promise<void> {
    await this.initialize();
    const key = this.generateCacheKey(request);

    try {
      if (this.workersCache) {
        await this.workersCache.set(key, response, this.CACHE_TTL);
      } else {
        this.memoryCache.set(key, {
          data: response,
          expires: Date.now() + this.CACHE_TTL * 1000,
        });

        // Clean up expired entries periodically
        if (this.memoryCache.size > 100) {
          this.cleanupMemoryCache();
        }
      }
    } catch (error) {
      logger.error('Cache set error:', error);
    }
  }

  private cleanupMemoryCache(): void {
    const now = Date.now();
    for (const [key, value] of this.memoryCache.entries()) {
      if (now >= value.expires) {
        this.memoryCache.delete(key);
      }
    }
  }

  async invalidatePattern(pattern: string): Promise<void> {
    await this.initialize();

    if (this.workersCache) {
      // Workers KV doesn't support pattern matching, so we can't efficiently invalidate patterns
      logger.warn('Pattern invalidation not supported with Workers KV cache');
    } else {
      // For memory cache, remove all keys matching pattern
      const regex = new RegExp(pattern.replace('*', '.*'));
      for (const key of this.memoryCache.keys()) {
        if (regex.test(key)) {
          this.memoryCache.delete(key);
        }
      }
    }
  }

  async getCacheStats(): Promise<{
    hits: number;
    misses: number;
    size: number;
  }> {
    await this.initialize();

    if (this.workersCache) {
      try {
        // External caches don't provide easy hit/miss stats
        return {
          hits: 0,
          misses: 0,
          size: 0, // Size not easily available for external caches
        };
      } catch (error) {
        logger.error('Cache stats error:', error);
      }
    }

    return {
      hits: 0,
      misses: 0,
      size: this.memoryCache.size,
    };
  }
}

export const cacheService = new CacheService();
