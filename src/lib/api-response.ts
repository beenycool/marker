import { NextResponse } from 'next/server';
import { ZodError } from 'zod';

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
  statusCode: number;
}

export function successResponse<T>(
  data: T,
  message?: string,
  statusCode: number = 200
): NextResponse<ApiResponse<T>> {
  return NextResponse.json(
    {
      success: true,
      data,
      message,
      statusCode,
    },
    { status: statusCode }
  );
}

export function errorResponse(
  error: string,
  statusCode: number = 500,
  data?: any
): NextResponse<ApiResponse> {
  return NextResponse.json(
    {
      success: false,
      error,
      data,
      statusCode,
    },
    { status: statusCode }
  );
}

export function validationErrorResponse(
  error: ZodError
): NextResponse<ApiResponse> {
  const formattedErrors = error.errors.map(err => ({
    field: err.path.join('.'),
    message: err.message,
  }));

  return NextResponse.json(
    {
      success: false,
      error: 'Validation failed',
      data: { errors: formattedErrors },
      statusCode: 400,
    },
    { status: 400 }
  );
}

export function unauthorizedResponse(
  message: string = 'Unauthorized'
): NextResponse<ApiResponse> {
  return errorResponse(message, 401);
}

export function forbiddenResponse(
  message: string = 'Forbidden'
): NextResponse<ApiResponse> {
  return errorResponse(message, 403);
}

export function notFoundResponse(
  message: string = 'Not found'
): NextResponse<ApiResponse> {
  return errorResponse(message, 404);
}

export function rateLimitResponse(
  message: string = 'Rate limit exceeded'
): NextResponse<ApiResponse> {
  return errorResponse(message, 429);
}
