import { logger } from '@/lib/logger';
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getSupabase } from '@/lib/supabase';
import { successResponse, notFoundResponse } from '@/lib/api-response';
import { validateRequestBody, validateSearchParams } from '@/lib/api-wrapper';
import { handleAPIError, createValidationError } from '@/lib/error-handler';

const createFeedbackSchema = z.object({
  submissionId: z.string().uuid(),
  rating: z.number().min(1).max(5),
  comment: z.string().optional(),
  helpfulness: z.number().min(1).max(5).optional(),
  accuracy: z.number().min(1).max(5).optional(),
});

const feedbackQuerySchema = z.object({
  submissionId: z.string().uuid().optional(),
  limit: z.coerce.number().min(1).max(100).optional(),
  offset: z.coerce.number().min(0).optional(),
});

export async function POST(req: NextRequest) {
  try {
    const supabase = await getSupabase();
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = session.user;
    const body = await req.json();
    const validatedData = validateRequestBody(createFeedbackSchema, body);
    // Verify the submission belongs to the user
    const { data: submission, error: submissionError } = await supabase
      .from('submissions')
      .select('id')
      .eq('id', validatedData.submissionId)
      .eq('user_id', user.id)
      .single();

    if (submissionError || !submission) {
      return notFoundResponse('Submission not found');
    }

    // Create user feedback
    const { data: feedback, error: feedbackError } = await supabase
      .from('user_feedback')
      .insert({
        submission_id: validatedData.submissionId,
        user_id: user.id,
        rating: validatedData.rating,
        comment: validatedData.comment,
        helpfulness: validatedData.helpfulness,
        accuracy: validatedData.accuracy,
      })
      .select('*')
      .single();

    if (feedbackError || !feedback) {
      logger.error('Supabase feedback creation error:', feedbackError);
      return handleAPIError(new Error('Failed to create feedback'));
    }

    return successResponse(feedback, 'Feedback submitted successfully');
  } catch (error) {
    logger.error('Feedback POST error:', error);
    return handleAPIError(error);
  }
}

export async function GET(req: NextRequest) {
  try {
    const supabase = await getSupabase();
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = session.user;
    const { searchParams } = new URL(req.url);
    const validatedParams = validateSearchParams(
      feedbackQuerySchema,
      searchParams
    );

    let query = supabase
      .from('user_feedback')
      .select(
        `
        *,
        submissions (
          id,
          question,
          subject,
          exam_board,
          created_at
        )
      `
      )
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .range(
        validatedParams.offset || 0,
        (validatedParams.offset || 0) + (validatedParams.limit || 50) - 1
      );

    if (validatedParams.submissionId) {
      query = query.eq('submission_id', validatedParams.submissionId);
    }

    const { data: feedback, error } = await query;

    if (error) {
      logger.error('Supabase feedback query error:', error);
      return handleAPIError(new Error('Failed to fetch feedback'));
    }

    return successResponse(feedback);
  } catch (error) {
    logger.error('Feedback GET error:', error);
    return handleAPIError(error);
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const supabase = await getSupabase();
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = session.user;
    const { searchParams } = new URL(req.url);
    const feedbackId = searchParams.get('id');

    if (!feedbackId) {
      return handleAPIError(createValidationError('Feedback ID is required'));
    }

    // Delete the feedback (verify ownership)
    const { error } = await supabase
      .from('user_feedback')
      .delete()
      .eq('id', feedbackId)
      .eq('user_id', user.id);

    if (error) {
      logger.error('Supabase feedback delete error:', error);
      return handleAPIError(new Error('Failed to delete feedback'));
    }

    return successResponse(null, 'Feedback deleted successfully');
  } catch (error) {
    logger.error('Feedback DELETE error:', error);
    return handleAPIError(error);
  }
}
