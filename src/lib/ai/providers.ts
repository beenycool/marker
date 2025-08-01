import { MarkingRequest, MarkingResponse } from '@/types';
import { buildMarkingPrompt, MarkingContext } from '@/lib/prompt-templates';
import { validateMarkingQuality, logForHumanReview } from '@/lib/marking-validator';

export interface AIProvider {
  name: string;
  model: string;
  tier: 'free' | 'pro';
  available: boolean;
  mark: (request: MarkingRequest) => Promise<MarkingResponse>;
}

export abstract class BaseAIProvider implements AIProvider {
  abstract name: string;
  abstract model: string;
  abstract tier: 'free' | 'pro';
  abstract available: boolean;

  abstract mark(request: MarkingRequest): Promise<MarkingResponse>;

  protected generateGradeFromScore(
    score: number,
    totalMarks: number = 100,
    subjectCode?: string
  ): string {
    // Try to use real grade boundaries if subject code is provided
    if (subjectCode) {
      try {
        const {
          GradeBoundariesService,
        } = require('@/lib/grade-boundaries-service');
        if (GradeBoundariesService.validateMark(subjectCode, score)) {
          const result = GradeBoundariesService.calculateGrade(
            subjectCode,
            score
          );
          return result.grade === 0 ? 'U' : result.grade.toString();
        }
      } catch (error) {
        // Fall back to percentage-based calculation
      }
    }

    // Fallback to percentage-based grade calculation
    const percentage = (score / totalMarks) * 100;

    if (percentage >= 97) return '9';
    if (percentage >= 90) return '8';
    if (percentage >= 80) return '7';
    if (percentage >= 70) return '6';
    if (percentage >= 60) return '5';
    if (percentage >= 50) return '4';
    if (percentage >= 40) return '3';
    if (percentage >= 30) return '2';
    if (percentage >= 20) return '1';
    return 'U';
  }

  protected buildPrompt(request: MarkingRequest): { systemPrompt: string; userPrompt: string } {
    const context: MarkingContext = {
      question: request.question,
      answer: request.answer,
      markScheme: request.markScheme,
      totalMarks: request.marksTotal,
      subject: request.subject,
      examBoard: request.examBoard,
    };

    return buildMarkingPrompt(context);
  }

  protected async validateAndLogResponse(
    response: any, 
    request: MarkingRequest
  ): Promise<{ isValid: boolean; response: any }> {
    const validation = validateMarkingQuality(
      response, 
      request.subject, 
      request.marksTotal
    );

    if (validation.humanReviewRequired) {
      await logForHumanReview({
        prompt: request.question,
        aiResponse: response,
        subject: request.subject,
        validationErrors: validation.errors,
      });
    }

    return {
      isValid: validation.isValid,
      response: response
    };
  }

  /**
   * Parse AI response using strict JSON-only parser
   * @param text - Raw text response from AI
   * @param modelUsed - The AI model that generated the response
   * @returns Parsed and validated response object
   * @throws Error if parsing fails
   */
  protected parseResponse(text: string, modelUsed: string): MarkingResponse {
    return AIResponseParser.parseResponse(text, modelUsed);
  }
}
