import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { errorResponse, validationErrorResponse } from './api-response';

export interface ApiHandlerConfig {
  requireAuth?: boolean;
  allowedMethods?: string[];
  rateLimitKey?: string;
  rateLimitMax?: number;
  rateLimitWindowMs?: number;
}

export function withApiHandler(
  handler: (req: NextRequest, context?: any) => Promise<NextResponse>,
  config: ApiHandlerConfig = {}
) {
  return async (req: NextRequest, context?: any): Promise<NextResponse> => {
    try {
      // Method validation
      if (
        config.allowedMethods &&
        !config.allowedMethods.includes(req.method)
      ) {
        return errorResponse(`Method ${req.method} not allowed`, 405);
      }

      // Auth validation (if required)
      if (config.requireAuth) {
        const authHeader = req.headers.get('authorization');
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
          return errorResponse('Authorization header required', 401);
        }
      }

      // Execute the handler
      return await handler(req, context);
    } catch (error) {
      if (process.env.NODE_ENV === 'development') {
        // Development error logging
      }

      // Handle Zod validation errors
      if (error instanceof z.ZodError) {
        return validationErrorResponse(error);
      }

      // Handle other errors
      if (error instanceof Error) {
        return errorResponse(error.message, 500);
      }

      return errorResponse('Internal server error', 500);
    }
  };
}

export function validateRequestBody<T>(schema: z.ZodSchema<T>, body: any): T {
  return schema.parse(body);
}

export function validateSearchParams<T>(
  schema: z.ZodSchema<T>,
  searchParams: URLSearchParams
): T {
  const params = Object.fromEntries(searchParams);
  return schema.parse(params);
}
