import { logger } from '@/lib/logger';

interface RetryConfig {
  maxAttempts: number;
  baseDelay: number;
  maxDelay: number;
  backoffMultiplier: number;
  retryableErrors: string[];
}

class RetryableError extends Error {
  constructor(message: string, public shouldRetry: boolean = true) {
    super(message);
    this.name = 'RetryableError';
  }
}

export class RetryHandler {
  private readonly config: RetryConfig;

  constructor(config: Partial<RetryConfig> = {}) {
    this.config = {
      maxAttempts: 3,
      baseDelay: 1000, // 1 second
      maxDelay: 10000, // 10 seconds
      backoffMultiplier: 2,
      retryableErrors: [
        'ECONNRESET',
        'ENOTFOUND',
        'ECONNREFUSED',
        'ETIMEDOUT',
        'NETWORK_ERROR'
      ],
      ...config
    };
  }

  async execute<T>(
    operation: () => Promise<T>,
    context: string = 'operation'
  ): Promise<T> {
    let lastError: Error;
    
    for (let attempt = 1; attempt <= this.config.maxAttempts; attempt++) {
      try {
        const result = await operation();
        
        if (attempt > 1) {
          logger.info(`${context} succeeded on attempt ${attempt}`);
        }
        
        return result;
      } catch (error) {
        lastError = error as Error;
        
        if (!this.isRetryableError(error)) {
          logger.warn(`${context} failed with non-retryable error`, {
            error: lastError.message,
            attempt
          });
          throw error;
        }

        if (attempt === this.config.maxAttempts) {
          logger.error(`${context} failed after ${attempt} attempts`, {
            error: lastError.message
          });
          break;
        }

        const delay = this.calculateDelay(attempt);
        logger.warn(`${context} failed, retrying in ${delay}ms`, {
          error: lastError.message,
          attempt,
          nextAttempt: attempt + 1
        });

        await this.sleep(delay);
      }
    }

    throw new RetryableError(
      `${context} failed after ${this.config.maxAttempts} attempts: ${lastError!.message}`,
      false
    );
  }

  private isRetryableError(error: any): boolean {
    if (error instanceof RetryableError) {
      return error.shouldRetry;
    }

    const errorMessage = error?.message || '';
    const errorCode = error?.code || '';

    // Check for HTTP status codes that are retryable
    if (error?.status >= 500 && error?.status < 600) {
      return true;
    }

    // Check for specific error codes/messages
    return this.config.retryableErrors.some(retryableError => 
      errorCode.includes(retryableError) || 
      errorMessage.includes(retryableError)
    );
  }

  private calculateDelay(attempt: number): number {
    const delay = this.config.baseDelay * Math.pow(this.config.backoffMultiplier, attempt - 1);
    const jitter = Math.random() * 0.1 * delay; // Add 10% jitter
    return Math.min(delay + jitter, this.config.maxDelay);
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

export const ocrRetryHandler = new RetryHandler({
  maxAttempts: 2,
  baseDelay: 1500,
  maxDelay: 5000,
  backoffMultiplier: 1.5
});