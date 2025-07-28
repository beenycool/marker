import { logger } from '../logger';
import { Tier } from '@/types/index';
import { DeepSeekFreeProvider } from './deepseek-free';
import { KimiProvider } from './kimi';
import { QwenProProvider } from './qwen-pro';
import { OpenRouterProvider } from './openrouter';
import { BaseAIProvider } from './providers';
import { MarkingRequest, MarkingResponse } from '@/types';
import { cacheService } from '@/lib/cache';
import { getSupabase } from '@/lib/supabase';
import { z } from 'zod';

// Enhanced response validation schema
const MarkingResponseSchema = z.object({
  score: z.number().min(0).max(100),
  grade: z.string().min(1),
  aosMet: z.array(z.string()).min(1),
  improvementSuggestions: z.array(z.string()).min(1),
  aiResponse: z.string().min(10),
  modelUsed: z.string().min(1),
  confidenceScore: z.number().min(0).max(1).optional(),
});

interface EnhancedProviderConfig {
  provider: BaseAIProvider;
  maxRetries: number;
  timeout: number;
  reliability: number; // 0-1 based on historical performance
  costPerToken: number;
  averageResponseTime: number;
}

interface FallbackStrategy {
  type: 'simple' | 'structured' | 'constrained';
  prompt: string;
  validation: 'strict' | 'lenient';
}

export class EnhancedAIRouter {
  private providers: EnhancedProviderConfig[] = [];
  private fallbackStrategies: FallbackStrategy[] = [];
  private supabase: any;

  constructor() {
    this.initializeProviders();
    this.initializeFallbackStrategies();
    this.initSupabase();
  }

  private async initSupabase() {
    this.supabase = await getSupabase();
  }

  private initializeProviders() {
    this.providers = [
      {
        provider: new OpenRouterProvider(),
        maxRetries: 3,
        timeout: 30000,
        reliability: 0.95,
        costPerToken: 0.00002,
        averageResponseTime: 2500,
      },
      {
        provider: new QwenProProvider(),
        maxRetries: 2,
        timeout: 25000,
        reliability: 0.88,
        costPerToken: 0.00001,
        averageResponseTime: 3200,
      },
      {
        provider: new KimiProvider(),
        maxRetries: 2,
        timeout: 20000,
        reliability: 0.82,
        costPerToken: 0.000015,
        averageResponseTime: 2800,
      },
      {
        provider: new DeepSeekFreeProvider(),
        maxRetries: 3,
        timeout: 15000,
        reliability: 0.9,
        costPerToken: 0.000005,
        averageResponseTime: 1800,
      },
    ];
  }

  private initializeFallbackStrategies() {
    this.fallbackStrategies = [
      {
        type: 'simple',
        prompt: `Please mark this GCSE answer and respond ONLY with valid JSON in this exact format:
{
  "score": [number between 0-100],
  "grade": "[GCSE grade 1-9 or U]",
  "feedback": "[detailed feedback for student]"
}`,
        validation: 'strict',
      },
      {
        type: 'structured',
        prompt: `Mark this answer and return structured feedback. Format as JSON with score, grade, and feedback fields.`,
        validation: 'lenient',
      },
      {
        type: 'constrained',
        prompt: `Score: [0-100]\nGrade: [1-9 or U]\nFeedback: [student feedback]`,
        validation: 'lenient',
      },
    ];
  }

  /**
   * Enhanced marking with smart fallbacks and validation
   */
  async mark(
    request: MarkingRequest,
    userTier: Tier,
    preferredProvider?: string
  ): Promise<MarkingResponse & { metadata: any }> {
    const requestId = this.generateRequestId();
    const startTime = Date.now();

    try {
      // Check cache first
      const cachedResult = await cacheService.get(request);
      if (cachedResult) {
        logger.info(`Cache hit for request ${requestId}`);
        return { ...cachedResult, metadata: { cached: true, requestId } };
      }

      const availableProviders = this.getAvailableProviders(userTier);
      if (availableProviders.length === 0) {
        throw new Error('No AI providers available');
      }

      // Select optimal provider based on reliability and cost
      const selectedProvider = this.selectOptimalProvider(
        availableProviders,
        preferredProvider
      );

      logger.info(
        `Processing request ${requestId} with ${selectedProvider.provider.name}`
      );

      // Try primary approach with full validation
      let result = await this.attemptMarkingWithProvider(
        selectedProvider,
        request,
        requestId,
        'standard'
      );

      if (result) {
        // Log success and cache result
        await this.logSuccess(
          requestId,
          selectedProvider,
          result,
          Date.now() - startTime
        );
        await cacheService.set(request, result);
        return {
          ...result,
          metadata: { requestId, provider: selectedProvider.provider.name },
        };
      }

      // Primary approach failed, try fallback strategies
      logger.warn(
        `Primary approach failed for request ${requestId}, trying fallbacks`
      );

      for (const strategy of this.fallbackStrategies) {
        result = await this.attemptMarkingWithProvider(
          selectedProvider,
          request,
          requestId,
          'fallback',
          strategy
        );

        if (result) {
          await this.logFallbackSuccess(
            requestId,
            selectedProvider,
            strategy,
            result,
            Date.now() - startTime
          );
          await cacheService.set(request, result);
          return {
            ...result,
            metadata: {
              requestId,
              provider: selectedProvider.provider.name,
              fallback: strategy.type,
            },
          };
        }
      }

      // Try other providers with fallback strategies
      const otherProviders = availableProviders.filter(
        p => p !== selectedProvider
      );

      for (const provider of otherProviders) {
        logger.info(
          `Trying backup provider ${provider.provider.name} for request ${requestId}`
        );

        result = await this.attemptMarkingWithProvider(
          provider,
          request,
          requestId,
          'backup'
        );

        if (result) {
          await this.logBackupSuccess(
            requestId,
            provider,
            result,
            Date.now() - startTime
          );
          await cacheService.set(request, result);
          return {
            ...result,
            metadata: {
              requestId,
              provider: provider.provider.name,
              backup: true,
            },
          };
        }
      }

      // All strategies failed
      throw new Error('All providers and fallback strategies failed');
    } catch (error) {
      await this.logFailure(requestId, error, Date.now() - startTime);
      throw error;
    }
  }

  private async attemptMarkingWithProvider(
    providerConfig: EnhancedProviderConfig,
    request: MarkingRequest,
    requestId: string,
    attemptType: 'standard' | 'fallback' | 'backup',
    fallbackStrategy?: FallbackStrategy
  ): Promise<MarkingResponse | null> {
    const { provider, maxRetries, timeout } = providerConfig;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        logger.info(
          `${attemptType} attempt ${attempt}/${maxRetries} for ${provider.name} (${requestId})`
        );

        // Modify request for fallback strategies
        let modifiedRequest = request;
        if (fallbackStrategy) {
          modifiedRequest = {
            ...request,
            question: `${request.question}\n\n${fallbackStrategy.prompt}`,
          };
        }

        // Execute with timeout
        const result = await Promise.race([
          provider.mark(modifiedRequest),
          new Promise<never>((_, reject) =>
            setTimeout(
              () => reject(new Error(`Timeout after ${timeout}ms`)),
              timeout
            )
          ),
        ]);

        // Validate response
        const validatedResult = await this.validateAndSanitizeResponse(
          result,
          fallbackStrategy?.validation || 'strict'
        );

        if (validatedResult) {
          logger.info(
            `Successful ${attemptType} with ${provider.name} (${requestId})`
          );
          return validatedResult;
        }
      } catch (error) {
        logger.warn(
          `${attemptType} attempt ${attempt} failed for ${provider.name} (${requestId}):`,
          { error: error instanceof Error ? error.message : String(error) }
        );

        if (attempt < maxRetries) {
          const delay = Math.min(1000 * Math.pow(2, attempt - 1), 5000);
          await this.delay(delay);
        }
      }
    }

    return null;
  }

  private async validateAndSanitizeResponse(
    response: MarkingResponse,
    validation: 'strict' | 'lenient'
  ): Promise<MarkingResponse | null> {
    try {
      // Try strict Zod validation first
      const validated = MarkingResponseSchema.parse(response);
      return validated;
    } catch (error) {
      if (validation === 'strict') {
        logger.warn('Strict validation failed:', {
          error: error instanceof Error ? error.message : String(error),
        });
        return null;
      }

      // Lenient validation - try to extract/fix data
      try {
        const sanitized = this.sanitizeResponse(response);
        return MarkingResponseSchema.parse(sanitized);
      } catch (sanitizeError) {
        logger.warn('Response sanitization failed:', {
          error:
            sanitizeError instanceof Error
              ? sanitizeError.message
              : String(sanitizeError),
        });
        return null;
      }
    }
  }

  private sanitizeResponse(response: any): MarkingResponse {
    // Try to extract data from malformed responses
    let score = response.score;
    let grade = response.grade;
    let aosMet = response.aosMet || [];
    let improvementSuggestions = response.improvementSuggestions || [];
    let aiResponse = response.aiResponse || response.feedback;
    let modelUsed = response.modelUsed || 'unknown';

    // Extract score from text if necessary
    if (typeof score !== 'number') {
      const scoreMatch = String(response).match(/score[:\s]*(\d+(?:\.\d+)?)/i);
      if (scoreMatch) {
        score = parseFloat(scoreMatch[1]);
      } else {
        score = 0; // Default fallback
      }
    }

    // Extract grade from text if necessary
    if (typeof grade !== 'string' || grade.length === 0) {
      const gradeMatch = String(response).match(/grade[:\s]*([1-9]|U)/i);
      if (gradeMatch) {
        grade = gradeMatch[1];
      } else {
        // Generate grade from score
        grade = this.generateGradeFromScore(score);
      }
    }

    // Ensure aosMet exists
    if (!Array.isArray(aosMet) || aosMet.length === 0) {
      aosMet = ['Assessment objectives not specified'];
    }

    // Ensure improvementSuggestions exists
    if (
      !Array.isArray(improvementSuggestions) ||
      improvementSuggestions.length === 0
    ) {
      improvementSuggestions = [
        'Review your work and consider areas for improvement',
      ];
    }

    // Ensure aiResponse exists
    if (typeof aiResponse !== 'string' || aiResponse.length < 10) {
      aiResponse =
        response.improvements ||
        response.comments ||
        `Score: ${score}/100. Grade: ${grade}. Please review your work and consider areas for improvement.`;
    }

    return {
      score: Math.max(0, Math.min(100, score)),
      grade: grade.toString(),
      aosMet,
      improvementSuggestions,
      aiResponse: aiResponse.slice(0, 2000), // Truncate if too long
      modelUsed,
      confidenceScore: response.confidenceScore
        ? Number(response.confidenceScore)
        : undefined,
    };
  }

  private generateGradeFromScore(score: number): string {
    if (score >= 97) return '9';
    if (score >= 90) return '8';
    if (score >= 80) return '7';
    if (score >= 70) return '6';
    if (score >= 60) return '5';
    if (score >= 50) return '4';
    if (score >= 40) return '3';
    if (score >= 30) return '2';
    if (score >= 20) return '1';
    return 'U';
  }

  private selectOptimalProvider(
    availableProviders: EnhancedProviderConfig[],
    preferredProvider?: string
  ): EnhancedProviderConfig {
    // Use preferred provider if specified and available
    if (preferredProvider) {
      const preferred = availableProviders.find(
        p => p.provider.name === preferredProvider
      );
      if (preferred) return preferred;
    }

    // Sort by reliability score (weighted by cost and speed)
    return availableProviders.sort((a, b) => {
      const scoreA =
        a.reliability * 0.7 +
        (1 - a.costPerToken / 0.00002) * 0.2 +
        (1 - a.averageResponseTime / 5000) * 0.1;
      const scoreB =
        b.reliability * 0.7 +
        (1 - b.costPerToken / 0.00002) * 0.2 +
        (1 - b.averageResponseTime / 5000) * 0.1;
      return scoreB - scoreA;
    })[0];
  }

  private getAvailableProviders(userTier: Tier): EnhancedProviderConfig[] {
    return this.providers.filter(config => {
      if (!config.provider.available) return false;
      if (userTier === 'FREE') return config.provider.tier === 'free';
      return true;
    });
  }

  private generateRequestId(): string {
    return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private async delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // Logging methods for analytics
  private async logSuccess(
    requestId: string,
    provider: EnhancedProviderConfig,
    result: MarkingResponse,
    duration: number
  ) {
    try {
      await this.supabase?.from('ai_request_logs').insert({
        request_id: requestId,
        provider_name: provider.provider.name,
        status: 'success',
        response_time_ms: duration,
        score: result.score,
        grade: result.grade,
        attempt_type: 'standard',
        created_at: new Date().toISOString(),
      });
    } catch (error) {
      logger.error('Failed to log success:', error);
    }
  }

  private async logFallbackSuccess(
    requestId: string,
    provider: EnhancedProviderConfig,
    strategy: FallbackStrategy,
    result: MarkingResponse,
    duration: number
  ) {
    try {
      await this.supabase?.from('ai_request_logs').insert({
        request_id: requestId,
        provider_name: provider.provider.name,
        status: 'fallback_success',
        response_time_ms: duration,
        score: result.score,
        grade: result.grade,
        attempt_type: 'fallback',
        fallback_strategy: strategy.type,
        created_at: new Date().toISOString(),
      });
    } catch (error) {
      logger.error('Failed to log fallback success:', error);
    }
  }

  private async logBackupSuccess(
    requestId: string,
    provider: EnhancedProviderConfig,
    result: MarkingResponse,
    duration: number
  ) {
    try {
      await this.supabase?.from('ai_request_logs').insert({
        request_id: requestId,
        provider_name: provider.provider.name,
        status: 'backup_success',
        response_time_ms: duration,
        score: result.score,
        grade: result.grade,
        attempt_type: 'backup',
        created_at: new Date().toISOString(),
      });
    } catch (error) {
      logger.error('Failed to log backup success:', error);
    }
  }

  private async logFailure(requestId: string, error: any, duration: number) {
    try {
      await this.supabase?.from('ai_request_logs').insert({
        request_id: requestId,
        status: 'failed',
        response_time_ms: duration,
        error_message: error instanceof Error ? error.message : String(error),
        created_at: new Date().toISOString(),
      });
    } catch (logError) {
      logger.error('Failed to log failure:', logError);
    }
  }
}

export const enhancedAIRouter = new EnhancedAIRouter();
