import { NextRequest } from 'next/server';
import { z } from 'zod';
import { getDb } from '@/lib/db';
import { requireServerAuth } from '@/lib/auth-server';
import {
  successResponse,
  notFoundResponse,
} from '@/lib/api-response';
import { validateRequestBody } from '@/lib/api-wrapper';
import { logger } from '@/lib/logger';
import { handleAPIError, createAuthError, createValidationError } from '@/lib/error-handler';

const updateSubmissionSchema = z.object({
  question: z.string().optional(),
  answer: z.string().optional(),
  markScheme: z.string().optional(),
  marksTotal: z.number().int().positive().optional(),
  subject: z.string().optional(),
  examBoard: z.string().optional(),
});

export const GET = async (req: NextRequest) => {
  try {
    const user = await requireServerAuth();
    const submissionId = req.url.split('/').pop();
    if (!submissionId || submissionId === 'route') {
      return handleAPIError(createValidationError('Invalid submission ID'));
    }

    const dbClient = await getDb();
    const { data: submission, error } = await dbClient
      .from('submissions')
      .select(
        `
        *,
        feedback (
          id,
          score,
          grade,
          aos_met,
          improvement_suggestions,
          ai_response,
          model_used,
          created_at
        ),
        user_feedback (
          id,
          rating,
          comment,
          helpfulness,
          accuracy,
          created_at
        )
      `
      )
      .eq('id', submissionId)
      .eq('user_id', user.id)
      .single();

    if (error || !submission) {
      return notFoundResponse('Submission not found');
    }

    return successResponse(submission);
  } catch (error) {
    return handleAPIError(createAuthError());
  }
};

export const PUT = async (req: NextRequest) => {
  try {
    const user = await requireServerAuth();
    const submissionId = req.url.split('/').pop();
    if (!submissionId || submissionId === 'route') {
      return handleAPIError(createValidationError('Invalid submission ID'));
    }
    const body = await req.json();
    const validatedData = validateRequestBody(updateSubmissionSchema, body);

    // Convert field names to snake_case for Supabase
    const updateData: any = {};
    if (validatedData.question) updateData.question = validatedData.question;
    if (validatedData.answer) updateData.answer = validatedData.answer;
    if (validatedData.markScheme)
      updateData.mark_scheme = validatedData.markScheme;
    if (validatedData.marksTotal)
      updateData.marks_total = validatedData.marksTotal;
    if (validatedData.subject) updateData.subject = validatedData.subject;
    if (validatedData.examBoard)
      updateData.exam_board = validatedData.examBoard;
    updateData.updated_at = new Date().toISOString();

    // Verify the submission belongs to the user and update it
    const dbClient = await getDb();
    const { data: updatedSubmission, error } = await dbClient
      .from('submissions')
      .update(updateData)
      .eq('id', submissionId)
      .eq('user_id', user.id)
      .select(
        `
        *,
        feedback (
          id,
          score,
          grade,
          aos_met,
          improvement_suggestions,
          model_used,
          created_at
        )
      `
      )
      .single();

    if (error || !updatedSubmission) {
      if (error?.code === 'PGRST116') {
        return notFoundResponse('Submission not found');
      }
      logger.error('Supabase update error', error, { submissionId });
      return handleAPIError(new Error('Failed to update submission'));
    }

    return successResponse(
      updatedSubmission,
      'Submission updated successfully'
    );
  } catch (error) {
    return handleAPIError(createAuthError());
  }
};

export const DELETE = async (req: NextRequest) => {
  try {
    const user = await requireServerAuth();
    const submissionId = req.url.split('/').pop();
    if (!submissionId || submissionId === 'route') {
      return handleAPIError(createValidationError('Invalid submission ID'));
    }

    // Delete the submission (verify ownership and cascade will handle feedback)
    const dbClient = await getDb();
    const { error } = await dbClient
      .from('submissions')
      .delete()
      .eq('id', submissionId)
      .eq('user_id', user.id);

    if (error) {
      logger.error('Supabase delete error', error, { submissionId });
      return handleAPIError(new Error('Failed to delete submission'));
    }

    return successResponse(null, 'Submission deleted successfully');
  } catch (error) {
    return handleAPIError(createAuthError());
  }
};
