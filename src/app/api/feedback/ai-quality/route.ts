import { NextRequest, NextResponse } from 'next/server';
import { requireServerAuth } from '@/lib/auth';
import { db } from '@/lib/db';
import { z } from 'zod';
import { logger } from '@/lib/logger';

const AIFeedbackSchema = z.object({
  submissionId: z.string().uuid(),
  feedbackId: z.string().uuid(),
  rating: z.enum(['helpful', 'not_helpful']),
  comment: z.string().optional(),
  promptVersion: z.string().optional(),
  timestamp: z.string(),
  accuracy: z.number().min(1).max(5).optional(),
  helpfulness: z.number().min(1).max(5).optional(),
});

export async function POST(request: NextRequest) {
  try {
    const user = await requireServerAuth();
    const body = await request.json();

    // Validate request body
    const validatedData = AIFeedbackSchema.parse(body);

    // Convert rating to numeric score
    const ratingScore = validatedData.rating === 'helpful' ? 5 : 2;

    // Store feedback in database
    const { data, error } = await (db as any)
      .from('user_feedback')
      .insert({
        user_id: user.id,
        submission_id: validatedData.submissionId,
        feedback_id: validatedData.feedbackId,
        rating: ratingScore,
        comment: validatedData.comment || null,
        helpfulness: validatedData.helpfulness || ratingScore,
        accuracy: validatedData.accuracy || ratingScore,
        response_quality_score: ratingScore / 5, // Normalize to 0-1
        parsing_success: true,
        provider_used: 'unknown', // Will be updated when we track this
        prompt_version_id: null, // Will be updated when prompt versioning is integrated
        created_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) {
      logger.error('Database error storing AI feedback', error);
      return NextResponse.json(
        { error: 'Failed to store feedback' },
        { status: 500 }
      );
    }

    // Update feedback analytics if this is negative feedback
    if (validatedData.rating === 'not_helpful') {
      await updateFeedbackAnalytics(validatedData.feedbackId, 'negative');
    } else {
      await updateFeedbackAnalytics(validatedData.feedbackId, 'positive');
    }

    return NextResponse.json({
      message: 'Feedback stored successfully',
      feedbackId: data.id,
    });
  } catch (error) {
    logger.error('Error processing AI feedback', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request data', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

async function updateFeedbackAnalytics(
  feedbackId: string,
  sentiment: 'positive' | 'negative'
) {
  try {
    // This could be used to update AI model performance metrics
    // For now, we'll just log it
    logger.info(`Feedback analytics: ${feedbackId} rated as ${sentiment}`);

    // In the future, this could:
    // 1. Update prompt performance statistics
    // 2. Trigger automatic prompt optimization
    // 3. Alert administrators to quality issues
    // 4. Feed into A/B testing systems
  } catch (error) {
    logger.error('Failed to update feedback analytics', error);
  }
}

export async function GET(request: NextRequest) {
  try {
    const user = await requireServerAuth();
    const { searchParams } = new URL(request.url);
    const submissionId = searchParams.get('submissionId');

    if (!submissionId) {
      return NextResponse.json(
        { error: 'submissionId is required' },
        { status: 400 }
      );
    }

    // Get existing feedback for this submission by this user
    const { data, error } = await (db as any)
      .from('user_feedback')
      .select('*')
      .eq('user_id', user.id)
      .eq('submission_id', submissionId)
      .order('created_at', { ascending: false })
      .limit(1);

    if (error) {
      logger.error('Database error fetching AI feedback', error);
      return NextResponse.json(
        { error: 'Failed to fetch feedback' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      feedback: data?.[0] || null,
    });
  } catch (error) {
    logger.error('Error fetching AI feedback', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
