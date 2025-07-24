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
  costUsd?: number;
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
   * Process a marking request with advanced retry logic, smart fallbacks, and comprehensive logging
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
    const internalSessionId = sessionId || Math.random().toString(36).substring(2, 15);
    const attempts: ProviderAttempt[] = [];
    
    logger.info('Starting AI marking request', {
      sessionId: internalSessionId,
      userId,
      userTier,
      preferredProvider,
      questionLength: request.question.length,
      answerLength: request.answer.length,
      subject: request.subject
    });

    try {
      // Check cache first
      const cachedResult = await cacheService.get(request);
      if (cachedResult) {
        logger.info('Cache hit for marking request', { sessionId: internalSessionId, userId });
        return cachedResult;
      }

      const availableProviders = this.getAvailableProviders(userTier);

      if (availableProviders.length === 0) {
        logger.error('No AI providers available for user tier', { 
          sessionId: internalSessionId, 
          userId,
          userTier 
        });
        throw new Error('No AI providers available');
      }

      // Select primary provider
      let selectedProvider = availableProviders[0];

      if (preferredProvider) {
        const preferred = availableProviders.find(
          p => p.name === preferredProvider
        );
        if (preferred) {
          selectedProvider = preferred;
          logger.info('Using preferred provider', { 
            sessionId, 
            preferredProvider 
          });
        } else {
          logger.warn('Preferred provider not available, using default', {
            sessionId,
            preferredProvider,
            defaultProvider: selectedProvider.name
          });
        }
      }

      // Try primary provider with enhanced retries
      const maxRetries = 3;
      let lastError: Error | null = null;

      for (let attempt = 0; attempt < maxRetries; attempt++) {
        const startTime = Date.now();
        const attemptInfo: ProviderAttempt = {
          provider: selectedProvider,
          attemptNumber: attempt + 1,
          startTime,
          success: false
        };

        try {
          logger.info('Attempting marking with provider', {
            sessionId,
            provider: selectedProvider.name,
            model: selectedProvider.model,
            attempt: attempt + 1,
            maxRetries
          });

          const result = await this.attemptMarkWithTimeout(
            selectedProvider,
            request
          );

          // Validate response with Zod and implement smart recovery
          const validatedResult = await this.validateAndRecoverResponse(
            result,
            selectedProvider,
            request,
            sessionId
          );

          attemptInfo.endTime = Date.now();
          attemptInfo.success = true;
          attemptInfo.costUsd = this.estimateCost(selectedProvider, request);
          attempts.push(attemptInfo);

          // Log successful AI provider event
          logger.logAIProviderEvent({
            sessionId: internalSessionId,
            userId,
            provider: this.getProviderType(selectedProvider.name),
            model: selectedProvider.model,
            promptVersion: '1.0', // TODO: Implement versioning
            latencyMs: attemptInfo.endTime - attemptInfo.startTime,
            costUsd: attemptInfo.costUsd,
            success: true
          });

          // Cache the successful result
          await cacheService.set(request, validatedResult);

          logger.info('Successfully completed marking with provider', {
            sessionId,
            provider: selectedProvider.name,
            latencyMs: attemptInfo.endTime - attemptInfo.startTime,
            totalAttempts: attempts.length
          });
          
          return validatedResult;
        } catch (error) {
          const endTime = Date.now();
          lastError = error instanceof Error ? error : new Error(String(error));
          
          attemptInfo.endTime = endTime;
          attemptInfo.error = lastError.message;
          attemptInfo.costUsd = this.estimateCost(selectedProvider, request, true); // Failed request cost
          attempts.push(attemptInfo);

          // Log failed AI provider event
          logger.logAIProviderEvent({
            sessionId,
            provider: this.getProviderType(selectedProvider.name),
            model: selectedProvider.model,
            promptVersion: '1.0',
            latencyMs: endTime - startTime,
            costUsd: attemptInfo.costUsd,
            success: false,
            errorCode: this.getErrorCode(lastError)
          });

          logger.error('Provider attempt failed', {
            sessionId,
            provider: selectedProvider.name,
            attempt: attempt + 1,
            maxRetries,
            error: lastError.message,
            latencyMs: endTime - startTime
          });

          if (attempt < maxRetries - 1) {
            const delayMs = 1000 * Math.pow(2, attempt);
            logger.info('Retrying after delay', { sessionId, delayMs });
            await this.delay(delayMs);
          }
        }
      }

      // If primary provider fails, try fallback providers with smart selection
      const fallbackProviders = this.selectOptimalFallbacks(
        availableProviders.filter(p => p !== selectedProvider),
        lastError
      );

      for (const fallback of fallbackProviders) {
        const startTime = Date.now();
        const attemptInfo: ProviderAttempt = {
          provider: fallback,
          attemptNumber: 1, // Reset for fallback
          startTime,
          success: false
        };

        try {
          logger.info('Trying fallback provider', {
            sessionId,
            fallbackProvider: fallback.name,
            fallbackModel: fallback.model
          });

          const result = await this.attemptMarkWithTimeout(fallback, request);
          const validatedResult = await this.validateAndRecoverResponse(
            result,
            fallback,
            request,
            sessionId
          );

          attemptInfo.endTime = Date.now();
          attemptInfo.success = true;
          attemptInfo.costUsd = this.estimateCost(fallback, request);
          attempts.push(attemptInfo);

          // Log successful fallback
          logger.logAIProviderEvent({
            sessionId,
            provider: this.getProviderType(fallback.name),
            model: fallback.model,
            promptVersion: '1.0',
            latencyMs: attemptInfo.endTime - attemptInfo.startTime,
            costUsd: attemptInfo.costUsd,
            success: true
          });

          // Cache the successful result
          await cacheService.set(request, validatedResult);

          logger.info('Successfully marked with fallback provider', {
            sessionId,
            fallbackProvider: fallback.name,
            totalAttempts: attempts.length,
            totalLatencyMs: attempts.reduce((sum, a) => sum + ((a.endTime || Date.now()) - a.startTime), 0)
          });
          
          return validatedResult;
        } catch (error) {
          const endTime = Date.now();
          const fallbackError = error instanceof Error ? error : new Error(String(error));
          
          attemptInfo.endTime = endTime;
          attemptInfo.error = fallbackError.message;
          attemptInfo.costUsd = this.estimateCost(fallback, request, true);
          attempts.push(attemptInfo);

          // Log failed fallback
          logger.logAIProviderEvent({
            sessionId,
            provider: this.getProviderType(fallback.name),
            model: fallback.model,
            promptVersion: '1.0',
            latencyMs: endTime - startTime,
            costUsd: attemptInfo.costUsd,
            success: false,
            errorCode: this.getErrorCode(fallbackError)
          });

          logger.error('Fallback provider failed', {
            sessionId,
            fallbackProvider: fallback.name,
            error: fallbackError.message
          });
        }
      }

      // All providers failed - log comprehensive failure analysis
      const totalCost = attempts.reduce((sum, a) => sum + (a.costUsd || 0), 0);
      const totalLatency = attempts.reduce((sum, a) => sum + ((a.endTime || Date.now()) - a.startTime), 0);

      logger.error('All AI providers failed to process marking request', {
        sessionId,
        totalAttempts: attempts.length,
        totalCostUsd: totalCost,
        totalLatencyMs: totalLatency,
        providers: attempts.map(a => ({
          name: a.provider.name,
          attempts: attempts.filter(at => at.provider === a.provider).length,
          lastError: a.error
        }))
      });

      throw lastError || new Error('All AI providers failed');
    } catch (error) {
      logger.error('Critical error in AIRouter.mark', {
        sessionId,
        error: error instanceof Error ? error.message : 'Unknown error',
        totalAttempts: attempts.length
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
   * Validate AI response with Zod and implement smart recovery for parsing failures
   * @param response The raw response from AI provider
   * @param provider The provider that generated the response
   * @param request The original request
   * @param sessionId Session ID for logging
   * @returns Validated and potentially recovered response
   */
  private async validateAndRecoverResponse(
    response: MarkingResponse,
    provider: BaseAIProvider,
    request: MarkingRequest,
    sessionId: string
  ): Promise<MarkingResponse> {
    try {
      // First attempt: validate the response directly
      const validated = markingResponseSchema.parse(response);
      logger.debug('Response validation successful', { sessionId, provider: provider.name });
      return response;
    } catch (zodError) {
      logger.warn('Response validation failed, attempting recovery', {
        sessionId,
        provider: provider.name,
        error: zodError instanceof Error ? zodError.message : 'Unknown validation error'
      });

      // Attempt 1: Try to fix common issues automatically
      const fixedResponse = this.attemptAutomaticFix(response);
      try {
        const validated = markingResponseSchema.parse(fixedResponse);
        logger.info('Response recovered through automatic fix', { sessionId, provider: provider.name });
        return fixedResponse;
      } catch {
        // Automatic fix failed, continue to more aggressive recovery
      }

      // Attempt 2: If response has raw text, try to parse it with provider's text parsing
      if (typeof response.aiResponse === 'string' && response.aiResponse.length > 0) {
        try {
          const parsedFromText = provider.parseTextResponse(response.aiResponse);
          const recoveredResponse: MarkingResponse = {
            score: parsedFromText.score || 0,
            grade: parsedFromText.grade || 'U',
            aosMet: Array.isArray(parsedFromText.aosMet) ? parsedFromText.aosMet : [],
            improvementSuggestions: Array.isArray(parsedFromText.improvementSuggestions) 
              ? parsedFromText.improvementSuggestions 
              : ['Please try submitting again'],
            aiResponse: response.aiResponse,
            modelUsed: response.modelUsed || provider.name
          };

          const validated = markingResponseSchema.parse(recoveredResponse);
          logger.info('Response recovered through text parsing', { sessionId, provider: provider.name });
          return recoveredResponse;
        } catch {
          // Text parsing failed, continue to fallback
        }
      }

      // Attempt 3: Create a minimal valid response as last resort
      logger.warn('Creating fallback response due to validation failure', {
        sessionId,
        provider: provider.name
      });

      const fallbackResponse: MarkingResponse = {
        score: 0,
        grade: 'U',
        aosMet: [],
        improvementSuggestions: [
          'We encountered an issue processing your submission. Please try again.',
          'If the problem persists, consider rewording your answer for clarity.'
        ],
        aiResponse: typeof response.aiResponse === 'string' ? response.aiResponse : 'Unable to process response',
        modelUsed: response.modelUsed || provider.name
      };

      return fallbackResponse;
    }
  }

  /**
   * Attempt to automatically fix common response validation issues
   * @param response The response to fix
   * @returns Fixed response
   */
  private attemptAutomaticFix(response: any): MarkingResponse {
    return {
      score: typeof response.score === 'number' ? Math.max(0, Math.floor(response.score)) : 0,
      grade: typeof response.grade === 'string' && response.grade.length > 0 ? response.grade : 'U',
      aosMet: Array.isArray(response.aosMet) ? response.aosMet.filter((item: any) => typeof item === 'string') : [],
      improvementSuggestions: Array.isArray(response.improvementSuggestions) 
        ? response.improvementSuggestions.filter((item: any) => typeof item === 'string').slice(0, 5)
        : [],
      aiResponse: typeof response.aiResponse === 'string' && response.aiResponse.length > 0 
        ? response.aiResponse 
        : 'Unable to generate detailed feedback',
      modelUsed: typeof response.modelUsed === 'string' ? response.modelUsed : 'Unknown'
    };
  }

  /**
   * Select optimal fallback providers based on the type of error encountered
   * @param availableFallbacks Available fallback providers
   * @param lastError The last error encountered
   * @returns Optimally ordered fallback providers
   */
  private selectOptimalFallbacks(
    availableFallbacks: BaseAIProvider[],
    lastError: Error | null
  ): BaseAIProvider[] {
    if (!lastError || availableFallbacks.length <= 1) {
      return availableFallbacks;
    }

    // If the error suggests a parsing issue, prioritize simpler/more reliable models
    const errorMessage = lastError.message.toLowerCase();
    if (errorMessage.includes('json') || errorMessage.includes('parse') || errorMessage.includes('format')) {
      // Prioritize providers known for consistent output formatting
      return availableFallbacks.sort((a, b) => {
        const priorityOrder = ['DeepSeek Free', 'Qwen Pro', 'Kimi', 'OpenRouter'];
        const aPriority = priorityOrder.indexOf(a.name);
        const bPriority = priorityOrder.indexOf(b.name);
        return (aPriority === -1 ? 999 : aPriority) - (bPriority === -1 ? 999 : bPriority);
      });
    }

    // If the error suggests rate limiting, try providers in original order
    if (errorMessage.includes('rate') || errorMessage.includes('limit') || errorMessage.includes('quota')) {
      return availableFallbacks;
    }

    // For other errors, reverse the order to try different approaches
    return [...availableFallbacks].reverse();
  }

  /**
   * Estimate the cost of an AI provider request
   * @param provider The AI provider
   * @param request The marking request
   * @param failed Whether this was a failed request
   * @returns Estimated cost in USD
   */
  private estimateCost(provider: BaseAIProvider, request: MarkingRequest, failed: boolean = false): number {
    // Estimate token count (very rough approximation)
    const inputTokens = Math.ceil((request.question.length + request.answer.length + (request.markScheme?.length || 0)) / 4);
    const outputTokens = failed ? 0 : 500; // Assume average response length

    // Cost per 1K tokens (rough estimates based on typical pricing)
    const costPerProvider: Record<string, { input: number; output: number }> = {
      'OpenRouter': { input: 0.002, output: 0.006 }, // Average across models
      'DeepSeek Free': { input: 0.0001, output: 0.0002 },
      'Qwen Pro': { input: 0.0005, output: 0.001 },
      'Kimi': { input: 0.001, output: 0.002 }
    };

    const pricing = costPerProvider[provider.name] || { input: 0.001, output: 0.002 };
    return (inputTokens / 1000 * pricing.input) + (outputTokens / 1000 * pricing.output);
  }

  /**
   * Get standardized provider type for logging
   * @param providerName The provider name
   * @returns Standardized provider type
   */
  private getProviderType(providerName: string): 'openai' | 'google' | 'anthropic' {
    if (providerName.includes('OpenRouter')) return 'openai'; // OpenRouter uses multiple models
    if (providerName.includes('DeepSeek') || providerName.includes('Qwen') || providerName.includes('Kimi')) return 'openai'; // API compatible
    return 'openai'; // Default
  }

  /**
   * Extract standardized error code from error message
   * @param error The error object
   * @returns Standardized error code
   */
  private getErrorCode(error: Error): string {
    const message = error.message.toLowerCase();
    if (message.includes('timeout')) return 'TIMEOUT';
    if (message.includes('rate limit') || message.includes('quota')) return 'RATE_LIMIT';
    if (message.includes('auth') || message.includes('unauthorized')) return 'AUTH_ERROR';
    if (message.includes('parse') || message.includes('json')) return 'PARSE_ERROR';
    if (message.includes('network') || message.includes('connection')) return 'NETWORK_ERROR';
    return 'UNKNOWN_ERROR';
  }
}

export const aiRouter = new AIRouter();
