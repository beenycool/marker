import { MarkingRequest, MarkingResponse } from '@/types';
import { EnhancedMarkingValidator } from '@/lib/marking-validator-enhanced';
import { logger } from '@/lib/logger';
import { KimiProvider } from './kimi';
import { DeepSeekFreeProvider } from './deepseek-free';
import { OpenRouterProvider } from './openrouter';

export interface ProviderConfig {
  name: string;
  provider: any;
  tier: 'primary' | 'secondary' | 'fallback';
  maxRetries: number;
  timeout: number;
}

export class FallbackProvider {
  private providers: ProviderConfig[] = [
    {
      name: 'deepseek-r1-0528',
      provider: new OpenRouterProvider(),
      tier: 'primary',
      maxRetries: 2,
      timeout: 30000,
    },
    {
      name: 'kimi-k2',
      provider: new KimiProvider(),
      tier: 'secondary',
      maxRetries: 1,
      timeout: 25000,
    },
    {
      name: 'deepseek-r1t2-chimera',
      provider: new DeepSeekFreeProvider(),
      tier: 'fallback',
      maxRetries: 1,
      timeout: 20000,
    },
  ];

  private currentProviderIndex = 0;
  private retryCount = 0;

  async mark(request: MarkingRequest): Promise<MarkingResponse> {
    const startTime = Date.now();
    let lastError: Error | null = null;

    for (let attempt = 0; attempt < this.providers.length; attempt++) {
      const providerConfig = this.providers[this.currentProviderIndex];
      
      try {
        logger.info('Attempting marking with provider', {
          provider: providerConfig.name,
          attempt: attempt + 1,
          subject: request.subject,
          totalMarks: request.marksTotal,
        });

        const response = await this.executeWithTimeout(
          providerConfig.provider.mark(request),
          providerConfig.timeout
        ) as MarkingResponse;

        // Validate response quality
        const validation = EnhancedMarkingValidator.validate(
          response,
          request.subject,
          request.marksTotal
        );

        if (validation.isValid) {
          logger.info('Marking successful', {
            provider: providerConfig.name,
            score: response.score,
            validationScore: validation.qualityScore,
            duration: Date.now() - startTime,
          });

          this.currentProviderIndex = 0; // Reset to primary provider
          this.retryCount = 0;
          return response;
        }

        // Log validation failure
        await EnhancedMarkingValidator.logValidationFailure(response, validation, {
          prompt: JSON.stringify(request),
          subject: request.subject,
          modelUsed: providerConfig.name,
        });

        if (validation.shouldFallback) {
          logger.warn('Quality validation failed, falling back to next provider', {
            provider: providerConfig.name,
            qualityScore: validation.qualityScore,
            errors: validation.errors,
          });
          
          this.currentProviderIndex = (this.currentProviderIndex + 1) % this.providers.length;
          continue;
        }

        if (validation.shouldRetry && this.retryCount < providerConfig.maxRetries) {
          this.retryCount++;
          logger.info('Retrying with same provider', {
            provider: providerConfig.name,
            retryCount: this.retryCount,
          });
          attempt--; // Stay on same provider for retry
          continue;
        }

        // Force fallback if retries exhausted
        this.currentProviderIndex = (this.currentProviderIndex + 1) % this.providers.length;
        
      } catch (error) {
        lastError = error as Error;
        logger.error('Provider failed', {
          provider: providerConfig.name,
          error: error.message,
          attempt: attempt + 1,
        });

        // On error, immediately move to next provider
        this.currentProviderIndex = (this.currentProviderIndex + 1) % this.providers.length;
        this.retryCount = 0;
      }
    }

    // All providers failed
    logger.error('All providers failed', {
      totalAttempts: this.providers.length,
      lastError: lastError?.message,
    });

    throw new Error(
      `All AI providers failed to process this marking request. Last error: ${lastError?.message || 'Unknown error'}`
    );
  }

  private async executeWithTimeout<T>(
    promise: Promise<T>,
    timeoutMs: number
  ): Promise<T> {
    const timeoutPromise = new Promise<never>((_, reject) => {
      setTimeout(() => reject(new Error(`Request timed out after ${timeoutMs}ms`)), timeoutMs);
    });

    return Promise.race([promise, timeoutPromise]);
  }

  public getProviderStats() {
    return this.providers.map(config => ({
      name: config.name,
      tier: config.tier,
      currentIndex: this.currentProviderIndex,
    }));
  }

  public resetToPrimary() {
    this.currentProviderIndex = 0;
    this.retryCount = 0;
  }
}

// Export singleton instance
export const fallbackProvider = new FallbackProvider();