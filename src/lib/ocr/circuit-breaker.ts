import { logger } from '@/lib/logger';

type CircuitState = 'CLOSED' | 'OPEN' | 'HALF_OPEN';

interface CircuitBreakerConfig {
  failureThreshold: number;
  resetTimeout: number;
  monitoringWindow: number;
}

class CircuitBreaker {
  private state: CircuitState = 'CLOSED';
  private failures: number = 0;
  private lastFailureTime: number = 0;
  private nextAttempt: number = 0;
  private readonly config: CircuitBreakerConfig;

  constructor(config: Partial<CircuitBreakerConfig> = {}) {
    this.config = {
      failureThreshold: 5,
      resetTimeout: 60000, // 1 minute
      monitoringWindow: 300000, // 5 minutes
      ...config
    };
  }

  async execute<T>(operation: () => Promise<T>): Promise<T> {
    if (this.state === 'OPEN') {
      if (Date.now() < this.nextAttempt) {
        throw new Error('Circuit breaker is OPEN - OCR service temporarily unavailable');
      } else {
        this.state = 'HALF_OPEN';
        logger.info('Circuit breaker moved to HALF_OPEN state');
      }
    }

    try {
      const result = await operation();
      this.onSuccess();
      return result;
    } catch (error) {
      this.onFailure();
      throw error;
    }
  }

  private onSuccess(): void {
    if (this.state === 'HALF_OPEN') {
      this.state = 'CLOSED';
      this.failures = 0;
      logger.info('Circuit breaker CLOSED - OCR service recovered');
    }
  }

  private onFailure(): void {
    this.failures++;
    this.lastFailureTime = Date.now();

    if (this.failures >= this.config.failureThreshold) {
      this.state = 'OPEN';
      this.nextAttempt = Date.now() + this.config.resetTimeout;
      logger.warn('Circuit breaker OPENED - OCR service failing', {
        failures: this.failures,
        nextAttempt: new Date(this.nextAttempt).toISOString()
      });
    }
  }

  getState(): { state: CircuitState; failures: number; nextAttempt?: number } {
    return {
      state: this.state,
      failures: this.failures,
      nextAttempt: this.state === 'OPEN' ? this.nextAttempt : undefined
    };
  }

  reset(): void {
    this.state = 'CLOSED';
    this.failures = 0;
    this.lastFailureTime = 0;
    this.nextAttempt = 0;
    logger.info('Circuit breaker manually reset');
  }
}

export const ocrCircuitBreaker = new CircuitBreaker({
  failureThreshold: 3,
  resetTimeout: 30000, // 30 seconds
  monitoringWindow: 180000 // 3 minutes
});