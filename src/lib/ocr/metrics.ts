import { logger } from '@/lib/logger';

interface OCRMetrics {
  totalRequests: number;
  successfulRequests: number;
  failedRequests: number;
  cacheHits: number;
  cacheMisses: number;
  rateLimitHits: number;
  circuitBreakerTrips: number;
  avgProcessingTime: number;
  totalProcessingTime: number;
  lastRequestTime: number;
}

class OCRMetricsCollector {
  private metrics: OCRMetrics = {
    totalRequests: 0,
    successfulRequests: 0,
    failedRequests: 0,
    cacheHits: 0,
    cacheMisses: 0,
    rateLimitHits: 0,
    circuitBreakerTrips: 0,
    avgProcessingTime: 0,
    totalProcessingTime: 0,
    lastRequestTime: 0
  };

  private processingTimes: number[] = [];
  private readonly maxProcessingTimesHistory = 100;

  recordRequest(): void {
    this.metrics.totalRequests++;
    this.metrics.lastRequestTime = Date.now();
  }

  recordSuccess(processingTime: number): void {
    this.metrics.successfulRequests++;
    this.recordProcessingTime(processingTime);
  }

  recordFailure(): void {
    this.metrics.failedRequests++;
  }

  recordCacheHit(): void {
    this.metrics.cacheHits++;
  }

  recordCacheMiss(): void {
    this.metrics.cacheMisses++;
  }

  recordRateLimit(): void {
    this.metrics.rateLimitHits++;
  }

  recordCircuitBreakerTrip(): void {
    this.metrics.circuitBreakerTrips++;
  }

  private recordProcessingTime(time: number): void {
    this.processingTimes.push(time);
    
    // Keep only recent processing times
    if (this.processingTimes.length > this.maxProcessingTimesHistory) {
      this.processingTimes.shift();
    }

    // Recalculate averages
    this.metrics.totalProcessingTime += time;
    this.metrics.avgProcessingTime = this.processingTimes.reduce((sum, t) => sum + t, 0) / this.processingTimes.length;
  }

  getMetrics(): OCRMetrics & {
    successRate: number;
    cacheHitRate: number;
    recentProcessingTimes: number[];
  } {
    const successRate = this.metrics.totalRequests > 0 
      ? (this.metrics.successfulRequests / this.metrics.totalRequests) * 100 
      : 0;

    const totalCacheRequests = this.metrics.cacheHits + this.metrics.cacheMisses;
    const cacheHitRate = totalCacheRequests > 0 
      ? (this.metrics.cacheHits / totalCacheRequests) * 100 
      : 0;

    return {
      ...this.metrics,
      successRate: Math.round(successRate * 100) / 100,
      cacheHitRate: Math.round(cacheHitRate * 100) / 100,
      recentProcessingTimes: [...this.processingTimes]
    };
  }

  reset(): void {
    this.metrics = {
      totalRequests: 0,
      successfulRequests: 0,
      failedRequests: 0,
      cacheHits: 0,
      cacheMisses: 0,
      rateLimitHits: 0,
      circuitBreakerTrips: 0,
      avgProcessingTime: 0,
      totalProcessingTime: 0,
      lastRequestTime: 0
    };
    this.processingTimes = [];
    logger.info('OCR metrics reset');
  }

  logSummary(): void {
    const metrics = this.getMetrics();
    logger.info('OCR Metrics Summary', {
      requests: {
        total: metrics.totalRequests,
        successful: metrics.successfulRequests,
        failed: metrics.failedRequests,
        successRate: `${metrics.successRate}%`
      },
      cache: {
        hits: metrics.cacheHits,
        misses: metrics.cacheMisses,
        hitRate: `${metrics.cacheHitRate}%`
      },
      performance: {
        avgProcessingTime: `${Math.round(metrics.avgProcessingTime)}ms`,
        totalProcessingTime: `${Math.round(metrics.totalProcessingTime)}ms`
      },
      rateLimiting: {
        hits: metrics.rateLimitHits
      },
      circuitBreaker: {
        trips: metrics.circuitBreakerTrips
      }
    });
  }
}

export const ocrMetrics = new OCRMetricsCollector();

// Log metrics summary every 10 minutes
if (typeof globalThis !== 'undefined') {
  setInterval(() => {
    if (ocrMetrics.getMetrics().totalRequests > 0) {
      ocrMetrics.logSummary();
    }
  }, 10 * 60 * 1000);
}