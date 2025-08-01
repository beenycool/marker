import { MarkingResponse } from '@/types';
import { logger } from './logger';

export interface EnhancedValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  shouldRetry: boolean;
  shouldFallback: boolean;
  humanReviewRequired: boolean;
  qualityScore: number;
}

export interface ValidationConfig {
  minSuggestionLength: number;
  maxGenericPhrases: number;
  requiredQuotes: number;
  minFeedbackLength: number;
  coherenceThreshold: number;
}

export class EnhancedMarkingValidator {
  private static readonly CONFIG: ValidationConfig = {
    minSuggestionLength: 15,
    maxGenericPhrases: 2,
    requiredQuotes: 2,
    minFeedbackLength: 100,
    coherenceThreshold: 0.7,
  };

  private static readonly GENERIC_PHRASES = [
    'do better',
    'try harder',
    'add more detail',
    'be clearer',
    'improve your analysis',
    'expand on this',
    'more evidence needed',
    'needs development',
    'could be improved',
    'not detailed enough',
  ];

  public static validate(
    response: any,
    subject?: string,
    totalMarks?: number
  ): EnhancedValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];
    let qualityScore = 100;

    // 1. JSON Structure Validation
    const structureValidation = this.validateStructure(response);
    if (!structureValidation.isValid) {
      errors.push(...structureValidation.errors);
      qualityScore -= 30;
    }

    // 2. Score Validation
    const scoreValidation = this.validateScore(response, totalMarks);
    if (!scoreValidation.isValid) {
      errors.push(...scoreValidation.errors);
      qualityScore -= 20;
    }

    // 3. Content Quality Validation
    const contentValidation = this.validateContent(response);
    if (!contentValidation.isValid) {
      errors.push(...contentValidation.errors);
      warnings.push(...contentValidation.warnings);
      qualityScore -= contentValidation.qualityDeduction;
    }

    // 4. Coherence Check
    const coherenceValidation = this.validateCoherence(response);
    if (!coherenceValidation.isValid) {
      warnings.push(...coherenceValidation.warnings);
      qualityScore -= 10;
    }

    // 5. Determine actions based on validation
    const shouldRetry = errors.length <= 2 && qualityScore >= 50;
    const shouldFallback = qualityScore < 70 || errors.length > 2;
    const humanReviewRequired = qualityScore < 40 || Math.random() < 0.05;

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
      shouldRetry,
      shouldFallback,
      humanReviewRequired,
      qualityScore: Math.max(0, qualityScore),
    };
  }

  private static validateStructure(response: any): {
    isValid: boolean;
    errors: string[];
  } {
    const errors: string[] = [];
    const requiredFields = ['score', 'grade', 'aosMet', 'improvementSuggestions', 'detailedFeedback'];

    requiredFields.forEach(field => {
      if (!response || response[field] === undefined) {
        errors.push(`Missing required field: ${field}`);
      }
    });

    // Validate array fields
    if (response?.aosMet && !Array.isArray(response.aosMet)) {
      errors.push('aosMet must be an array');
    }

    if (response?.improvementSuggestions && !Array.isArray(response.improvementSuggestions)) {
      errors.push('improvementSuggestions must be an array');
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  private static validateScore(
    response: any,
    totalMarks?: number
  ): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (typeof response?.score !== 'number') {
      errors.push('Score must be a number');
    } else if (response.score < 0 || response.score > (totalMarks || 100)) {
      errors.push(`Score ${response.score} is outside valid range (0-${totalMarks || 100})`);
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  private static validateContent(response: any): {
    isValid: boolean;
    errors: string[];
    warnings: string[];
    qualityDeduction: number;
  } {
    const errors: string[] = [];
    const warnings: string[] = [];
    let qualityDeduction = 0;

    // Check improvement suggestions
    if (response?.improvementSuggestions) {
      const suggestions = response.improvementSuggestions;
      
      if (suggestions.length < 2) {
        errors.push('Must provide at least 2 improvement suggestions');
        qualityDeduction += 15;
      }

      suggestions.forEach((suggestion: string, index: number) => {
        if (typeof suggestion !== 'string' || suggestion.length < this.CONFIG.minSuggestionLength) {
          errors.push(`Improvement suggestion ${index + 1} is too short (minimum ${this.CONFIG.minSuggestionLength} characters)`);
          qualityDeduction += 10;
        }

        const hasGenericPhrase = this.GENERIC_PHRASES.some(phrase => 
          suggestion.toLowerCase().includes(phrase)
        );
        
        if (hasGenericPhrase) {
          warnings.push(`Improvement suggestion ${index + 1} contains generic advice`);
          qualityDeduction += 5;
        }
      });
    }

    // Check detailed feedback
    if (response?.detailedFeedback) {
      const feedback = response.detailedFeedback;
      
      if (typeof feedback !== 'string' || feedback.length < this.CONFIG.minFeedbackLength) {
        warnings.push(`Detailed feedback is too short (minimum ${this.CONFIG.minFeedbackLength} characters)`);
        qualityDeduction += 10;
      }

      // Check for direct quotes from student work
      const quoteCount = (feedback.match(/"/g) || []).length / 2;
      if (quoteCount < this.CONFIG.requiredQuotes) {
        warnings.push(`Feedback should include at least ${this.CONFIG.requiredQuotes} direct quotes from student work`);
        qualityDeduction += 5;
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
      qualityDeduction,
    };
  }

  private static validateCoherence(response: any): {
    isValid: boolean;
    warnings: string[];
  } {
    const warnings: string[] = [];
    
    if (typeof response?.score === 'number' && response?.detailedFeedback) {
      const score = response.score;
      const feedback = response.detailedFeedback.toLowerCase();
      
      // Check for score-feedback coherence
      const isHighlyNegative = feedback.includes('fail') || 
                              feedback.includes('poor') || 
                              feedback.includes('weak') ||
                              feedback.includes('inadequate');
      
      const isHighlyPositive = feedback.includes('excellent') || 
                              feedback.includes('outstanding') || 
                              feedback.includes('brilliant');
      
      if (score >= 80 && isHighlyNegative) {
        warnings.push('High score with predominantly negative feedback - check coherence');
      }
      
      if (score <= 30 && isHighlyPositive) {
        warnings.push('Low score with predominantly positive feedback - check coherence');
      }
    }

    return {
      isValid: warnings.length === 0,
      warnings,
    };
  }

  public static async logValidationFailure(
    response: any,
    validation: EnhancedValidationResult,
    context: {
      prompt: string;
      subject?: string;
      modelUsed: string;
    }
  ): Promise<void> {
    logger.error('Marking validation failed', {
      validationErrors: validation.errors,
      validationWarnings: validation.warnings,
      qualityScore: validation.qualityScore,
      shouldRetry: validation.shouldRetry,
      shouldFallback: validation.shouldFallback,
      context: {
        subject: context.subject,
        modelUsed: context.modelUsed,
        responseLength: JSON.stringify(response).length,
      },
    });
  }
}