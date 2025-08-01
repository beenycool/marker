import { NextResponse } from 'next/server';

// Error codes for different types of errors
export enum ErrorCode {
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  NOT_FOUND = 'NOT_FOUND',
  UNAUTHORIZED = 'UNAUTHORIZED',
  FORBIDDEN = 'FORBIDDEN',
  USAGE_LIMIT_EXCEEDED = 'USAGE_LIMIT_EXCEEDED',
  AI_SERVICE_ERROR = 'AI_SERVICE_ERROR',
}

// Custom error class for application errors
export class AppError extends Error {
  constructor(
    public code: ErrorCode,
    message: string,
    public details?: any,
    public userMessage?: string,
    public shouldLog?: boolean
  ) {
    super(message);
    this.name = 'AppError';
  }
}

export const createUsageLimitError = (used: number, limit: number, tier: string) =>
  new AppError(
    ErrorCode.USAGE_LIMIT_EXCEEDED,
    'Daily usage limit exceeded',
    { used, limit, tier },
    'Please wait until tomorrow for your limits to reset.',
    false
  );

export const createAIServiceError = (provider: string, details?: any) =>
  new AppError(
    ErrorCode.AI_SERVICE_ERROR,
    `AI service error with ${provider}`,
    details,
    'The AI service is temporarily unavailable. Please try again in a few minutes.',
    true
  );

export const createValidationError = (field: string, message: string) =>
  new AppError(
    ErrorCode.VALIDATION_ERROR,
    `Validation error for ${field}`,
    { field, message },
    message,
    false
  );

export const createNotFoundError = (resource: string) =>
  new AppError(
    ErrorCode.NOT_FOUND,
    `${resource} not found`,
    { resource },
    `The requested ${resource} could not be found.`,
    false
  );

export const createUnauthorizedError = () =>
  new AppError(
    ErrorCode.UNAUTHORIZED,
    'Unauthorized access',
    {},
    'You must be logged in to access this resource.',
    false
  );

export const createForbiddenError = () =>
  new AppError(
    ErrorCode.FORBIDDEN,
    'Access forbidden',
    {},
    'You do not have permission to access this resource.',
    false
  );
