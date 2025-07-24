import { NextResponse } from 'next/server';
import { ZodError } from 'zod';

export enum ErrorCode {
  UNAUTHORIZED = 'UNAUTHORIZED',
  FORBIDDEN = 'FORBIDDEN',
  NOT_FOUND = 'NOT_FOUND',
  RATE_LIMITED = 'RATE_LIMITED',
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  USAGE_LIMIT_EXCEEDED = 'USAGE_LIMIT_EXCEEDED',
  AI_SERVICE_ERROR = 'AI_SERVICE_ERROR',
  OCR_ERROR = 'OCR_ERROR',
  PAYMENT_ERROR = 'PAYMENT_ERROR',
  INTERNAL_ERROR = 'INTERNAL_ERROR',
}

export interface APIError {
  code: ErrorCode;
  message: string;
  details?: any;
  suggestion?: string;
  retryable?: boolean;
}

export class AppError extends Error {
  constructor(
    public code: ErrorCode,
    public message: string,
    public details?: any,
    public suggestion?: string,
    public retryable: boolean = false
  ) {
    super(message);
    this.name = 'AppError';
  }
}

export function handleAPIError(error: unknown): NextResponse {
  if (process.env.NODE_ENV === 'development') {
    // Development error logging
  }

  // Handle known application errors
  if (error instanceof AppError) {
    return NextResponse.json(
      {
        error: {
          code: error.code,
          message: error.message,
          details: error.details,
          suggestion: error.suggestion,
          retryable: error.retryable,
        },
      },
      { status: getStatusCode(error.code) }
    );
  }

  // Handle validation errors
  if (error instanceof ZodError) {
    return NextResponse.json(
      {
        error: {
          code: ErrorCode.VALIDATION_ERROR,
          message: 'Invalid request data',
          details: error.errors,
          suggestion: 'Please check your input and try again.',
          retryable: false,
        },
      },
      { status: 400 }
    );
  }

  // Handle generic errors
  if (error instanceof Error) {
    return NextResponse.json(
      {
        error: {
          code: ErrorCode.INTERNAL_ERROR,
          message:
            process.env.NODE_ENV === 'development'
              ? error.message
              : 'An unexpected error occurred',
          suggestion:
            'Please try again later. If the problem persists, contact support.',
          retryable: true,
        },
      },
      { status: 500 }
    );
  }

  // Fallback for unknown errors
  return NextResponse.json(
    {
      error: {
        code: ErrorCode.INTERNAL_ERROR,
        message: 'An unexpected error occurred',
        suggestion:
          'Please try again later. If the problem persists, contact support.',
        retryable: true,
      },
    },
    { status: 500 }
  );
}

function getStatusCode(code: ErrorCode): number {
  switch (code) {
    case ErrorCode.UNAUTHORIZED:
      return 401;
    case ErrorCode.FORBIDDEN:
    case ErrorCode.USAGE_LIMIT_EXCEEDED:
      return 403;
    case ErrorCode.NOT_FOUND:
      return 404;
    case ErrorCode.RATE_LIMITED:
      return 429;
    case ErrorCode.VALIDATION_ERROR:
      return 400;
    case ErrorCode.PAYMENT_ERROR:
      return 402;
    case ErrorCode.AI_SERVICE_ERROR:
    case ErrorCode.OCR_ERROR:
      return 503;
    case ErrorCode.INTERNAL_ERROR:
    default:
      return 500;
  }
}

// Specific error creators
export const createAuthError = (message: string = 'Authentication required') =>
  new AppError(
    ErrorCode.UNAUTHORIZED,
    message,
    undefined,
    'Please sign in to continue.',
    false
  );

export const createForbiddenError = (message: string = 'Access denied') =>
  new AppError(
    ErrorCode.FORBIDDEN,
    message,
    undefined,
    'You do not have permission to perform this action.',
    false
  );

export const createNotFoundError = (resource: string = 'Resource') =>
  new AppError(
    ErrorCode.NOT_FOUND,
    `${resource} not found`,
    undefined,
    'Please check the URL and try again.',
    false
  );

export const createRateLimitError = (limit: number, reset: Date) =>
  new AppError(
    ErrorCode.RATE_LIMITED,
    'Rate limit exceeded',
    { limit, reset },
    `You have exceeded the rate limit of ${limit} requests. Please wait before trying again.`,
    true
  );

export const createUsageLimitError = (
  used: number,
  limit: number,
  tier: string
) =>
  new AppError(
    ErrorCode.USAGE_LIMIT_EXCEEDED,
    'Daily usage limit exceeded',
    { used, limit, tier },
    tier === 'FREE'
      ? 'Upgrade to Pro for higher limits or wait until tomorrow.'
      : 'Please wait until tomorrow for your limits to reset.',
    false
  );

export const createAIServiceError = (provider: string, details?: any) =>
  new AppError(
    ErrorCode.AI_SERVICE_ERROR,
    'AI service temporarily unavailable',
    { provider, details },
    'We are experiencing issues with our AI service. Please try again in a few minutes.',
    true
  );

export const createOCRError = (details?: any) =>
  new AppError(
    ErrorCode.OCR_ERROR,
    'Failed to process image',
    details,
    'Please try uploading a clearer image or a different file format.',
    true
  );

export const createPaymentError = (message: string, details?: any) =>
  new AppError(
    ErrorCode.PAYMENT_ERROR,
    message,
    details,
    'Please check your payment details and try again.',
    true
  );

export const createValidationError = (message: string, details?: any) =>
  new AppError(
    ErrorCode.VALIDATION_ERROR,
    message,
    details,
    'Please check your input and try again.',
    false
  );

// Client-side error handling
export function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }
  if (typeof error === 'string') {
    return error;
  }
  return 'An unexpected error occurred';
}

export function isRetryableError(error: unknown): boolean {
  if (error instanceof AppError) {
    return error.retryable;
  }
  return false;
}

export function getErrorSuggestion(error: unknown): string | undefined {
  if (error instanceof AppError) {
    return error.suggestion;
  }
  return undefined;
}
