import { z } from 'zod';
import { MarkingResponse } from '@/types';

// Strict validation schema for AI responses
const MarkingResponseSchema = z.object({
  score: z.number().int().min(0).max(100),
  aosMet: z.array(z.string()).min(0),
  improvementSuggestions: z.array(z.string()).min(1).max(5),
  detailedFeedback: z.string().min(50),
  confidenceScore: z.number().int().min(1).max(10),
});

export class AIResponseParser {
  /**
   * Parse and validate AI response with strict JSON-only approach
   * @param rawResponse - Raw response text from AI
   * @param modelUsed - The AI model that generated the response
   * @returns Validated MarkingResponse
   * @throws Error if parsing fails or validation fails
   */
  static parseResponse(
    rawResponse: string,
    modelUsed: string
  ): MarkingResponse {
    try {
      // Attempt to parse JSON directly
      const jsonResponse = JSON.parse(rawResponse);

      // Validate the response structure
      const validatedResponse = MarkingResponseSchema.parse(jsonResponse);

      return {
        score: validatedResponse.score,
        grade: this.generateGradeFromScore(validatedResponse.score),
        aosMet: validatedResponse.aosMet,
        improvementSuggestions: validatedResponse.improvementSuggestions,
        aiResponse: validatedResponse.detailedFeedback,
        modelUsed,
      };
    } catch (error) {
      if (error instanceof SyntaxError) {
        throw new Error(
          `Invalid JSON response from AI model: ${error.message}. Raw response: ${rawResponse.substring(0, 200)}...`
        );
      }

      if (error instanceof z.ZodError) {
        const missingFields = error.errors
          .map(e => e.path.join('.'))
          .join(', ');
        throw new Error(
          `AI response validation failed. Missing or invalid fields: ${missingFields}. Raw response: ${rawResponse.substring(0, 200)}...`
        );
      }

      throw new Error(
        `Failed to parse AI response: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  /**
   * Generate GCSE grade from numerical score
   * @param score - Numerical score
   * @param totalMarks - Total marks available (default 100)
   * @returns GCSE grade string
   */
  private static generateGradeFromScore(
    score: number,
    totalMarks: number = 100
  ): string {
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

  /**
   * Validate that a response has all required fields for debugging
   * @param response - Response object to validate
   * @returns Validation result with detailed errors
   */
  static validateResponse(response: any): { valid: boolean; errors: string[] } {
    try {
      MarkingResponseSchema.parse(response);
      return { valid: true, errors: [] };
    } catch (error) {
      if (error instanceof z.ZodError) {
        const errors = error.errors.map(
          e => `${e.path.join('.')}: ${e.message}`
        );
        return { valid: false, errors };
      }
      return { valid: false, errors: ['Unknown validation error'] };
    }
  }
}
