// Quality validation for AI marking responses
import { validateMarkingResponse } from './prompt-templates';

export interface MarkingValidationResult {
  isValid: boolean;
  errors: string[];
  shouldRetry: boolean;
  humanReviewRequired: boolean;
}

export function validateMarkingQuality(
  response: any, 
  subject?: string,
  totalMarks?: number
): MarkingValidationResult {
  const errors: string[] = [];
  let shouldRetry = false;
  let humanReviewRequired = false;

  // Basic structure validation using template
  if (!validateMarkingResponse(response, subject)) {
    errors.push('Response missing required fields (score, errors, improvements)');
    shouldRetry = true;
  }

  // Score validation
  if (typeof response?.score !== 'number') {
    errors.push('Score must be a number');
    shouldRetry = true;
  } else if (totalMarks && (response.score < 0 || response.score > totalMarks)) {
    errors.push(`Score ${response.score} is outside valid range (0-${totalMarks})`);
    shouldRetry = true;
  }

  // Feedback quality validation
  if (!Array.isArray(response?.errors) || response.errors.length === 0) {
    // Only require errors if score is not perfect
    if (response?.score !== totalMarks) {
      errors.push('Must provide specific errors for non-perfect scores');
      shouldRetry = true;
    }
  }

  if (!Array.isArray(response?.improvements) || response.improvements.length === 0) {
    if (response?.score !== totalMarks) {
      errors.push('Must provide improvement suggestions');
      shouldRetry = true;
    }
  }

  // Content quality checks
  if (response?.improvements) {
    const hasVagueAdvice = response.improvements.some((improvement: string) => 
      typeof improvement === 'string' && 
      (improvement.includes('try harder') || 
       improvement.includes('do better') ||
       improvement.length < 20)
    );
    
    if (hasVagueAdvice) {
      errors.push('Improvements too vague - need specific actionable advice');
      humanReviewRequired = true;
    }
  }

  // Flag for human review (10% sample)
  if (Math.random() < 0.1) {
    humanReviewRequired = true;
  }

  return {
    isValid: errors.length === 0,
    errors,
    shouldRetry: shouldRetry && errors.length <= 2, // Don't retry if too many errors
    humanReviewRequired
  };
}

export async function logForHumanReview(data: {
  prompt: string;
  aiResponse: any;
  subject?: string;
  validationErrors?: string[];
}): Promise<void> {
  // In a real app, this would log to a human review queue
  console.log('Flagged for human review:', {
    timestamp: new Date().toISOString(),
    subject: data.subject,
    hasValidationErrors: !!data.validationErrors?.length,
    responseScore: data.aiResponse?.score,
  });
  
  // You could integrate with your database here to store for review
}