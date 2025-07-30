import { logger } from '@/lib/logger';
import { createHash } from 'crypto';

interface CacheEntry {
  data: any;
  timestamp: number;
  ttl: number;
}

class OCRCache {
  private cache = new Map<string, CacheEntry>();
  private readonly defaultTTL: number;

  constructor(defaultTTL = 24 * 60 * 60 * 1000) { // 24 hours default TTL
    this.defaultTTL = defaultTTL;
  }

  generateKey(fileBuffer: ArrayBuffer, languages: string[] = ['en']): string {
    const hash = createHash('sha256');
    hash.update(new Uint8Array(fileBuffer));
    hash.update(languages.join(','));
    return `ocr:${hash.digest('hex')}`;
  }

  get(key: string): any | null {
    const entry = this.cache.get(key);
    
    if (!entry) {
      return null;
    }

    if (Date.now() > entry.timestamp + entry.ttl) {
      this.cache.delete(key);
      return null;
    }

    logger.debug('OCR cache hit', { key: key.substring(0, 16) + '...' });
    return entry.data;
  }

  set(key: string, data: any, ttl?: number): void {
    const entry: CacheEntry = {
      data,
      timestamp: Date.now(),
      ttl: ttl || this.defaultTTL
    };

    this.cache.set(key, entry);
    logger.debug('OCR cache set', { 
      key: key.substring(0, 16) + '...',
      size: this.cache.size 
    });
  }

  delete(key: string): boolean {
    return this.cache.delete(key);
  }

  clear(): void {
    this.cache.clear();
    logger.info('OCR cache cleared');
  }

  cleanup(): void {
    const now = Date.now();
    let cleaned = 0;

    for (const [key, entry] of this.cache.entries()) {
      if (now > entry.timestamp + entry.ttl) {
        this.cache.delete(key);
        cleaned++;
      }
    }

    if (cleaned > 0) {
      logger.debug('OCR cache cleanup', { 
        cleaned, 
        remaining: this.cache.size 
      });
    }
  }

  getStats(): { size: number; hitRate?: number } {
    return { size: this.cache.size };
  }
}

export const ocrCache = new OCRCache();

// Cleanup expired entries every 30 minutes
if (typeof globalThis !== 'undefined') {
  setInterval(() => {
    ocrCache.cleanup();
  }, 30 * 60 * 1000);
}