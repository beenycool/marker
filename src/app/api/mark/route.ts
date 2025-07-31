import { logger } from '@/lib/logger';
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { rateLimit } from '@/lib/rate-limit';
import { aiRouter } from '@/lib/ai/router';
import { MarkingRequest } from '@/types';
import {
  GradeEnhancedMarkingService,
  EnhancedMarkingResponse,
} from '@/lib/marking/grade-enhanced-marking';

// Use Node.js runtime for Cloudflare compatibility
export const runtime = 'nodejs';

const markingRequestSchema = z.object({
  question: z
    .string()
    .min(1, 'Question is required')
    .max(10000, 'Question is too long'),
  answer: z
    .string()
    .min(1, 'Answer is required')
    .max(50000, 'Answer is too long'),
  markScheme: z.string().max(10000, 'Mark scheme is too long').optional(),
  marksTotal: z.number().int().positive().max(1000).optional(),
  subject: z.string().max(100).optional(),
  examBoard: z.string().max(100).optional(),
  preferredProvider: z.string().max(50).optional(),
  includeGradeBoundaries: z.boolean().optional().default(false),
  subjectCode: z.string().max(20).optional(),
});

/**
 * POST /api/mark - Submit work for AI marking
 * GDPR-COMPLIANT: No personal data is stored in databases.
 * All processing is ephemeral and results are returned directly.
 *
 * @param request - The request object
 * @returns A response with the marking results
 */
export async function POST(request: NextRequest) {
  const requestId = Math.random().toString(36).substring(2, 15);
  const startTime = Date.now();

  logger.logAPIEvent({
    sessionId: requestId,
    endpoint: '/api/mark',
    method: 'POST',
    statusCode: 0, // Will be updated later
    responseTimeMs: 0, // Will be updated later
  });

  try {
    // Check anonymous rate limiting
    const rateLimitResponse = await rateLimit(request);
    if (rateLimitResponse) {
      return rateLimitResponse;
    }

    logger.info('Anonymous user request for marking', {
      requestId,
    });

    // Parse and validate the request body
    let body;
    try {
      body = await request.json();
    } catch (error) {
      logger.error('Failed to parse JSON body', {
        requestId,
        error: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined,
      });
      return NextResponse.json(
        {
          error: 'Invalid JSON in request body',
          requestId,
        },
        { status: 400 }
      );
    }

    // Validate request body
    const validatedData = markingRequestSchema.safeParse(body);
    if (!validatedData.success) {
      logger.warn('Validation failed for marking request', {
        requestId,
        errors: validatedData.error.errors,
      });
      return NextResponse.json(
        {
          error: 'Validation failed',
          details: validatedData.error.errors,
          requestId,
        },
        { status: 400 }
      );
    }

    logger.info('Request body validated successfully', {
      requestId,
      questionLength: validatedData.data.question.length,
      answerLength: validatedData.data.answer.length,
      subject: validatedData.data.subject,
      examBoard: validatedData.data.examBoard,
    });

    // Prepare the marking request
    const markingRequest: MarkingRequest = {
      question: validatedData.data.question,
      answer: validatedData.data.answer,
      markScheme: validatedData.data.markScheme,
      marksTotal: validatedData.data.marksTotal,
      subject: validatedData.data.subject,
      examBoard: validatedData.data.examBoard,
    };

    logger.info(`Processing marking request for anonymous user`, {
      requestId,
    });

    // Get AI marking response
    let markingResponse;
    try {
      markingResponse = await aiRouter.mark(
        markingRequest,
        'FREE', // Anonymous users get free tier
        validatedData.data.preferredProvider,
        undefined, // No user ID for anonymous
        requestId
      );
      logger.info(
        `Successfully received AI marking response for anonymous user`,
        {
          requestId,
          modelUsed: markingResponse.modelUsed,
          score: markingResponse.score,
        }
      );
    } catch (error) {
      logger.error('AI marking failed', {
        requestId,
        error: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined,
      });
      return NextResponse.json(
        {
          error: 'Failed to process marking request',
          details:
            'Our AI systems are currently experiencing issues. Please try again later.',
          requestId,
        },
        { status: 503 }
      );
    }

    // Enhance with grade boundaries if requested
    let enhancedResponse: EnhancedMarkingResponse = markingResponse;
    if (
      validatedData.data.includeGradeBoundaries &&
      validatedData.data.subjectCode &&
      validatedData.data.marksTotal
    ) {
      try {
        logger.info(
          `Enhancing response with grade boundaries for subject ${validatedData.data.subjectCode}`,
          {
            requestId,
            subjectCode: validatedData.data.subjectCode,
          }
        );
        enhancedResponse =
          await GradeEnhancedMarkingService.enhanceWithGradeBoundaries(
            markingResponse,
            validatedData.data.subjectCode
          );
        logger.info(`Successfully enhanced response with grade boundaries`, {
          requestId,
          grade: enhancedResponse.grade,
        });
      } catch (error) {
        logger.warn('Failed to enhance with grade boundaries', {
          requestId,
          error: error instanceof Error ? error.message : 'Unknown error',
          subjectCode: validatedData.data.subjectCode,
        });
        // Continue with the original response if enhancement fails
      }
    }

    // GDPR-COMPLIANT: No database storage of personal data
    // Analytics are handled client-side via localStorage only

    // Log successful API completion
    const totalResponseTime = Date.now() - startTime;
    logger.logAPIEvent({
      sessionId: requestId,
      endpoint: '/api/mark',
      method: 'POST',
      statusCode: 200,
      responseTimeMs: totalResponseTime,
    });

    // Return success response with ephemeral data
    return NextResponse.json({
      success: true,
      id: requestId, // Use request ID instead of database ID
      feedback: {
        score: enhancedResponse.score,
        grade: enhancedResponse.grade,
        aosMet: enhancedResponse.aosMet,
        improvementSuggestions: enhancedResponse.improvementSuggestions,
        aiResponse: enhancedResponse.aiResponse,
        modelUsed: enhancedResponse.modelUsed,
        gradeBoundaries: enhancedResponse.gradeBoundaries,
      },
      requestId,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    logger.error('Unexpected error in POST /api/mark', {
      requestId,
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
    });
    return NextResponse.json(
      {
        error: 'Internal server error',
        details: 'An unexpected error occurred. Please try again later.',
        requestId,
      },
      { status: 500 }
    );
  }
}

/**
 * GET /api/mark - Get marking information for anonymous users
 *
 * @param request - The request object
 * @returns A response with marking information
 */
export async function GET() {
  const requestId = Math.random().toString(36).substring(2, 15);
  logger.info('GET /api/mark request received', { requestId });

  try {
    // Get available providers for anonymous users
    const availableProviders = aiRouter.getProviderInfo('FREE');

    logger.info(`Returning marking info for anonymous user`, {
      requestId,
      providerCount: availableProviders.length,
    });

    // Return success response
    return NextResponse.json({
      success: true,
      providers: availableProviders,
      requestId,
    });
  } catch (error) {
    logger.error('Error in GET /api/mark', {
      requestId,
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
    });
    return NextResponse.json(
      {
        error: 'Internal server error',
        details: 'An unexpected error occurred. Please try again later.',
        requestId,
      },
      { status: 500 }
    );
  }
}