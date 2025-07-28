import { z } from 'zod';

// Zod schema for structured AI response validation
export const AIResponseSchema = z.object({
  score: z.number().min(0).max(100),
  grade: z.string().regex(/^[1-9U]$/),
  aosMet: z.array(z.string()).min(1),
  improvementSuggestions: z.array(z.string()).min(1),
  detailedFeedback: z.string().min(10),
  confidenceScore: z.number().min(0).max(1).default(0.8),
  reasoning: z.string().optional(),
});

export type StructuredAIResponse = z.infer<typeof AIResponseSchema>;

// Function calling schema for AI providers that support it
export const markingFunctionSchema = {
  name: 'provide_marking_feedback',
  description: 'Provide structured feedback for a GCSE student submission',
  parameters: {
    type: 'object',
    properties: {
      score: {
        type: 'number',
        description: 'Score out of 100 for the submission',
        minimum: 0,
        maximum: 100,
      },
      grade: {
        type: 'string',
        description: 'GCSE grade (1-9 or U for unclassified)',
        pattern: '^[1-9U]$',
      },
      aosMet: {
        type: 'array',
        description: 'List of Assessment Objectives that were met',
        items: {
          type: 'string',
        },
        minItems: 1,
      },
      improvementSuggestions: {
        type: 'array',
        description: 'Specific suggestions for improvement',
        items: {
          type: 'string',
        },
        minItems: 1,
      },
      detailedFeedback: {
        type: 'string',
        description: 'Comprehensive feedback on the submission',
        minLength: 10,
      },
      confidenceScore: {
        type: 'number',
        description: 'Confidence in the marking (0-1)',
        minimum: 0,
        maximum: 1,
      },
      reasoning: {
        type: 'string',
        description: 'Brief explanation of the marking rationale',
        optional: true,
      },
    },
    required: [
      'score',
      'grade',
      'aosMet',
      'improvementSuggestions',
      'detailedFeedback',
    ],
  },
};

// Enhanced response parser with validation
export class AIResponseParser {
  static parseStructuredResponse(
    response: any,
    fallbackText?: string
  ): StructuredAIResponse {
    try {
      // If response is already structured (from function calling)
      if (typeof response === 'object' && response !== null) {
        return AIResponseSchema.parse(response);
      }

      // Try to parse JSON from text response
      if (typeof response === 'string') {
        const jsonMatch = response.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          const parsed = JSON.parse(jsonMatch[0]);
          return AIResponseSchema.parse(parsed);
        }
      }

      // Fallback to text parsing
      if (fallbackText) {
        return this.parseFromText(fallbackText);
      }

      throw new Error('Unable to parse structured response');
    } catch (error) {
      if (error instanceof z.ZodError) {
        throw new Error(`Response validation failed: ${error.message}`);
      }
      throw error;
    }
  }

  private static parseFromText(text: string): StructuredAIResponse {
    // Extract score
    const scoreMatch = text.match(/(?:score|marks?)[:\s]*(\d+(?:\.\d+)?)/i);
    const score = scoreMatch ? parseFloat(scoreMatch[1]) : 50;

    // Extract grade
    const gradeMatch = text.match(/(?:grade)[:\s]*([1-9U])/i);
    const grade = gradeMatch
      ? gradeMatch[1]
      : this.generateGradeFromScore(score);

    // Extract AOs (simple pattern matching)
    const aoMatch = text.match(
      /(?:AO|assessment objective)[s]?[:\s]*([^.]+)/gi
    );
    const aosMet = aoMatch
      ? aoMatch.map(ao => ao.trim())
      : ['AO1: Content understanding'];

    // Extract improvement suggestions
    const improvementMatch = text.match(
      /(?:improve|suggestion|recommendation)[s]?[:\s]*([^.]+)/gi
    );
    const improvementSuggestions = improvementMatch
      ? improvementMatch.map(imp => imp.trim())
      : ['Review key concepts and provide more detailed examples'];

    // Use the full text as detailed feedback if no structured parts found
    const detailedFeedback =
      text.length > 20 ? text : 'No detailed feedback provided';

    return {
      score,
      grade,
      aosMet,
      improvementSuggestions,
      detailedFeedback,
      confidenceScore: 0.6, // Lower confidence for text parsing
      reasoning: 'Parsed from unstructured text response',
    };
  }

  private static generateGradeFromScore(score: number): string {
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
}

// Response quality validator
export class ResponseQualityValidator {
  static validateResponse(response: StructuredAIResponse): {
    isValid: boolean;
    qualityScore: number;
    issues: string[];
  } {
    const issues: string[] = [];
    let qualityScore = 1.0;

    // Check if score and grade are consistent
    const expectedGrade = this.generateGradeFromScore(response.score);
    if (response.grade !== expectedGrade) {
      issues.push('Score and grade are inconsistent');
      qualityScore -= 0.2;
    }

    // Check feedback quality
    if (response.detailedFeedback.length < 50) {
      issues.push('Detailed feedback is too brief');
      qualityScore -= 0.1;
    }

    if (response.improvementSuggestions.length < 2) {
      issues.push('Insufficient improvement suggestions');
      qualityScore -= 0.1;
    }

    // Check AO coverage
    if (response.aosMet.length < 1) {
      issues.push('No Assessment Objectives identified');
      qualityScore -= 0.2;
    }

    // Check confidence score reasonableness
    if (response.confidenceScore < 0.3) {
      issues.push('Very low confidence score');
      qualityScore -= 0.1;
    }

    return {
      isValid: issues.length === 0,
      qualityScore: Math.max(0, qualityScore),
      issues,
    };
  }

  private static generateGradeFromScore(score: number): string {
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
}
