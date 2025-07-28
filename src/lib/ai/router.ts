import { logger } from '../logger';
import { Tier } from '@/types/index';
import { DeepSeekFreeProvider } from './deepseek-free';
import { KimiProvider } from './kimi';
import { QwenProProvider } from './qwen-pro';
import { OpenRouterProvider } from './openrouter';
import { BaseAIProvider } from './providers';
import { MarkingRequest, MarkingResponse } from '@/types';
import { cacheService } from '@/lib/cache';
import { z } from 'zod';

// Zod schema for validating AI responses
const markingResponseSchema = z.object({
  score: z.number().int().min(0),
  grade: z.string().min(1),
  aosMet: z.array(z.string()),
  improvementSuggestions: z.array(z.string()),
  aiResponse: z.string().min(1),
  modelUsed: z.string(),
});

interface ProviderAttempt {
  provider: BaseAIProvider;
  attemptNumber: number;
  startTime: number;
  endTime?: number;
  success: boolean;
  error?: string;
}

export class AIRouter {
  private providers: BaseAIProvider[] = [];

  constructor() {
    this.providers = [
      new OpenRouterProvider(), // Primary provider with best models
      new QwenProProvider(),
      new KimiProvider(),
      new DeepSeekFreeProvider(),
    ];
  }

  /**
   * Process a marking request with retry logic and fallbacks
   * @param request The marking request containing the question and answer
   * @param userTier The user's subscription tier (FREE or PRO)
   * @param preferredProvider Optional preferred AI provider
   * @param userId Optional user ID for logging
   * @param sessionId Optional session ID for logging
   * @returns The marking response with feedback and score
   * @throws Error if all providers fail to process the request
   */
  async mark(
    request: MarkingRequest,
    userTier: Tier,
    preferredProvider?: string,
    userId?: string,
    sessionId?: string
  ): Promise<MarkingResponse> {
    const internalSessionId =
      sessionId || Math.random().toString(36).substring(2, 15);
    const attempts: ProviderAttempt[] = [];

    logger.info('Starting AI marking request', {
      sessionId: internalSessionId,
      userId,
      userTier,
      preferredProvider,
      questionLength: request.question.length,
      answerLength: request.answer.length,
      subject: request.subject,
    });

    try {
      // Check cache first
      const cachedResult = await cacheService.get(request);
      if (cachedResult) {
        logger.info('Cache hit for marking request', {
          sessionId: internalSessionId,
          userId,
        });
        return cachedResult;
      }

      const availableProviders = this.getAvailableProviders(userTier);

      if (availableProviders.length === 0) {
        logger.error('No AI providers available for user tier', {
          sessionId: internalSessionId,
          userId,
          userTier,
        });
        throw new Error('No AI providers available');
      }

      // Select primary provider
      let selectedProvider = availableProviders[0];

      if (preferredProvider) {
        const preferred = availableProviders.find(
          (p: BaseAIProvider) => p.name === preferredProvider
        );
        if (preferred) {
          selectedProvider = preferred;
          logger.info('Using preferred provider', {
            sessionId: internalSessionId,
            preferredProvider,
          });
        } else {
          logger.warn('Preferred provider not available, using default', {
            sessionId: internalSessionId,
            preferredProvider,
            defaultProvider: selectedProvider.name,
          });
        }
      }

      // Try primary provider with retries
      const maxRetries = 3;
      let lastError: Error | null = null;

      for (let attempt = 0; attempt < maxRetries; attempt++) {
        const startTime = Date.now();
        const attemptInfo: ProviderAttempt = {
          provider: selectedProvider,
          attemptNumber: attempt + 1,
          startTime,
          success: false,
        };

        try {
          logger.info('Attempting marking with provider', {
            sessionId: internalSessionId,
            provider: selectedProvider.name,
            model: selectedProvider.model,
            attempt: attempt + 1,
            maxRetries,
          });

          const result = await this.attemptMarkWithTimeout(
            selectedProvider,
            request
          );

          // Validate response
          const validatedResult = await this.validateResponse(
            result,
            selectedProvider,
            internalSessionId
          );

          attemptInfo.endTime = Date.now();
          attemptInfo.success = true;
          attempts.push(attemptInfo);

          logger.info('Successfully completed marking with provider', {
            sessionId: internalSessionId,
            provider: selectedProvider.name,
            latencyMs: attemptInfo.endTime - attemptInfo.startTime,
            totalAttempts: attempts.length,
          });

          // Cache the successful result
          await cacheService.set(request, validatedResult);

          return validatedResult;
        } catch (error) {
          const endTime = Date.now();
          lastError = error instanceof Error ? error : new Error(String(error));

          attemptInfo.endTime = endTime;
          attemptInfo.error = lastError.message;
          attempts.push(attemptInfo);

          logger.error('Provider attempt failed', {
            sessionId: internalSessionId,
            provider: selectedProvider.name,
            attempt: attempt + 1,
            maxRetries,
            error: lastError.message,
            latencyMs: endTime - startTime,
          });

          if (attempt < maxRetries - 1) {
            const delayMs = 1000 * Math.pow(2, attempt);
            logger.info('Retrying after delay', {
              sessionId: internalSessionId,
              delayMs,
            });
            await this.delay(delayMs);
          }
        }
      }

      // If primary provider fails, try fallback providers
      const fallbackProviders = availableProviders.filter(
        (p: BaseAIProvider) => p !== selectedProvider
      );

      for (const fallback of fallbackProviders) {
        const startTime = Date.now();
        const attemptInfo: ProviderAttempt = {
          provider: fallback,
          attemptNumber: 1,
          startTime,
          success: false,
        };

        try {
          logger.info('Trying fallback provider', {
            sessionId: internalSessionId,
            fallbackProvider: fallback.name,
            fallbackModel: fallback.model,
          });

          const result = await this.attemptMarkWithTimeout(fallback, request);
          const validatedResult = await this.validateResponse(
            result,
            fallback,
            internalSessionId
          );

          attemptInfo.endTime = Date.now();
          attemptInfo.success = true;
          attempts.push(attemptInfo);

          // Cache the successful result
          await cacheService.set(request, validatedResult);

          logger.info('Successfully marked with fallback provider', {
            sessionId: internalSessionId,
            fallbackProvider: fallback.name,
            totalAttempts: attempts.length,
          });

          return validatedResult;
        } catch (error) {
          const endTime = Date.now();
          const fallbackError =
            error instanceof Error ? error : new Error(String(error));

          attemptInfo.endTime = endTime;
          attemptInfo.error = fallbackError.message;
          attempts.push(attemptInfo);

          logger.error('Fallback provider failed', {
            sessionId: internalSessionId,
            fallbackProvider: fallback.name,
            error: fallbackError.message,
          });
        }
      }

      // All providers failed
      logger.error('All AI providers failed to process marking request', {
        sessionId: internalSessionId,
        totalAttempts: attempts.length,
        providers: attempts.map(a => ({
          name: a.provider.name,
          lastError: a.error,
        })),
      });

      throw lastError || new Error('All AI providers failed');
    } catch (error) {
      logger.error('Critical error in AIRouter.mark', {
        sessionId: internalSessionId,
        error: error instanceof Error ? error.message : 'Unknown error',
        totalAttempts: attempts.length,
      });
      throw error;
    }
  }

  /**
   * Attempt to mark with a provider with timeout
   * @param provider The AI provider to use
   * @param request The marking request
   * @param timeout The timeout in milliseconds (default: 30000)
   * @returns The marking response
   * @throws Error if the request times out or fails
   */
  private async attemptMarkWithTimeout(
    provider: BaseAIProvider,
    request: MarkingRequest,
    timeout: number = 30000
  ): Promise<MarkingResponse> {
    try {
      return await Promise.race([
        provider.mark(request),
        new Promise<never>((_, reject) =>
          setTimeout(
            () =>
              reject(
                new Error(
                  `Request to ${provider.name} timed out after ${timeout}ms`
                )
              ),
            timeout
          )
        ),
      ]);
    } catch (error) {
      if (error instanceof Error && error.message.includes('timed out')) {
        logger.warn(`Request to ${provider.name} timed out after ${timeout}ms`);
      }
      throw error;
    }
  }

  /**
   * Delay execution for a specified number of milliseconds
   * @param ms The number of milliseconds to delay
   * @returns A promise that resolves after the delay
   */
  private async delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Get available providers for a user tier
   * @param userTier The user's subscription tier
   * @returns Array of available AI providers
   */
  getAvailableProviders(userTier: Tier): BaseAIProvider[] {
    return this.providers.filter(provider => {
      if (!provider.available) return false;

      if (userTier === 'FREE') {
        return provider.tier === 'free';
      } else if (userTier === 'PRO') {
        return true;
      }

      return false;
    });
  }

  /**
   * Get provider information for API responses
   * @param userTier The user's subscription tier
   * @returns Array of provider info objects
   */
  getProviderInfo(userTier: Tier) {
    const available = this.getAvailableProviders(userTier);

    return available.map(provider => ({
      name: provider.name,
      model: provider.model,
      tier: provider.tier,
      available: provider.available,
    }));
  }

  /**
   * Validate AI response with Zod
   * @param response The raw response from AI provider
   * @param provider The provider that generated the response
   * @param sessionId Session ID for logging
   * @returns Validated response
   */
  private async validateResponse(
    response: MarkingResponse,
    provider: BaseAIProvider,
    sessionId: string
  ): Promise<MarkingResponse> {
    try {
      // Validate the response directly
      markingResponseSchema.parse(response);
      logger.debug('Response validation successful', {
        sessionId,
        provider: provider.name,
      });
      return response;
    } catch (zodError) {
      logger.warn('Response validation failed, creating fallback', {
        sessionId,
        provider: provider.name,
        error:
          zodError instanceof Error
            ? zodError.message
            : 'Unknown validation error',
      });

      // Create a minimal valid response as fallback
      const fallbackResponse: MarkingResponse = {
        score: 0,
        grade: 'U',
        aosMet: [],
        improvementSuggestions: [
          'We encountered an issue processing your submission. Please try again.',
        ],
        aiResponse: 'Unable to process response',
        modelUsed: response.modelUsed || provider.name,
      };

      return fallbackResponse;
    }
  }
}

// Export singleton instance
export const aiRouter = new AIRouter();
