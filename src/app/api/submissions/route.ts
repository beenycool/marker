import { NextRequest } from 'next/server';
import { z } from 'zod';
import { getDb } from '@/lib/db';
import { requireServerAuth } from '@/lib/auth-server';
import { successResponse, notFoundResponse } from '@/lib/api-response';
import { validateSearchParams } from '@/lib/api-wrapper';
import { logger } from '@/lib/logger';
import {
  handleAPIError,
  createAuthError,
  createValidationError,
} from '@/lib/error-handler';

const submissionQuerySchema = z.object({
  page: z.coerce.number().min(1).optional(),
  limit: z.coerce.number().min(1).max(100).optional(),
  subject: z.string().optional(),
  examBoard: z.string().optional(),
  hasGrade: z.coerce.boolean().optional(),
  sortBy: z.enum(['createdAt', 'score', 'grade']).optional(),
  sortOrder: z.enum(['asc', 'desc']).optional(),
  search: z.string().optional(),
});

export const GET = async (req: NextRequest) => {
  try {
    const user = await requireServerAuth();
    const { searchParams } = new URL(req.url);
    const validatedParams = validateSearchParams(
      submissionQuerySchema,
      searchParams
    );

    const page = validatedParams.page || 1;
    const limit = Math.min(validatedParams.limit || 20, 100); // Max 100 per page
    const offset = (page - 1) * limit;

    // Build base query
    const dbClient = await getDb();
    let query = dbClient
      .from('submissions')
      .select(
        `
        id,
        question,
        answer,
        subject,
        exam_board,
        mark_scheme,
        marks_total,
        created_at,
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
      .eq('user_id', user.id);

    // Add filters
    if (validatedParams.subject) {
      query = query.eq('subject', validatedParams.subject);
    }

    if (validatedParams.examBoard) {
      query = query.eq('exam_board', validatedParams.examBoard);
    }

    // Add search filter
    if (validatedParams.search) {
      query = query.or(
        `question.ilike.%${validatedParams.search}%,answer.ilike.%${validatedParams.search}%`
      );
    }

    // Add ordering
    if (validatedParams.sortBy === 'createdAt') {
      query = query.order('created_at', {
        ascending: validatedParams.sortOrder === 'asc',
      });
    } else {
      // For score/grade sorting, we'll need to handle this after data retrieval
      query = query.order('created_at', { ascending: false });
    }

    // Add pagination
    query = query.range(offset, offset + limit - 1);

    const { data: submissions, error } = await query;

    if (error) {
      logger.error('Supabase error', error, { userId: user.id });
      return handleAPIError(new Error('Failed to fetch submissions'));
    }

    // Get total count for pagination
    let countQuery = dbClient
      .from('submissions')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id);

    if (validatedParams.subject) {
      countQuery = countQuery.eq('subject', validatedParams.subject);
    }

    if (validatedParams.examBoard) {
      countQuery = countQuery.eq('exam_board', validatedParams.examBoard);
    }

    if (validatedParams.search) {
      countQuery = countQuery.or(
        `question.ilike.%${validatedParams.search}%,answer.ilike.%${validatedParams.search}%`
      );
    }

    const { count: totalCount, error: countError } = await countQuery;

    if (countError) {
      logger.error('Supabase count error', countError, {
        userId: user.id,
      });
      return handleAPIError(new Error('Failed to count submissions'));
    }

    // Filter by hasGrade and apply sorting
    let filteredSubmissions = submissions || [];

    if (validatedParams.hasGrade !== undefined) {
      filteredSubmissions = filteredSubmissions.filter((submission: any) => {
        const hasFeedback =
          submission.feedback && submission.feedback.length > 0;
        return validatedParams.hasGrade ? hasFeedback : !hasFeedback;
      });
    }

    // Apply score/grade sorting if needed
    if (validatedParams.sortBy === 'score') {
      filteredSubmissions.sort((a: any, b: any) => {
        const scoreA = a.feedback?.[0]?.score || 0;
        const scoreB = b.feedback?.[0]?.score || 0;
        return validatedParams.sortOrder === 'asc'
          ? scoreA - scoreB
          : scoreB - scoreA;
      });
    } else if (validatedParams.sortBy === 'grade') {
      filteredSubmissions.sort((a: any, b: any) => {
        const gradeA = a.feedback?.[0]?.grade || '';
        const gradeB = b.feedback?.[0]?.grade || '';
        return validatedParams.sortOrder === 'asc'
          ? gradeA.localeCompare(gradeB)
          : gradeB.localeCompare(gradeA);
      });
    }

    // Format the response
    const formattedSubmissions = filteredSubmissions.map((submission: any) => ({
      id: submission.id,
      question: submission.question,
      answer: submission.answer,
      subject: submission.subject,
      examBoard: submission.exam_board,
      markScheme: submission.mark_scheme,
      marksTotal: submission.marks_total,
      createdAt: submission.created_at,
      feedback: submission.feedback?.[0] || null,
    }));

    return successResponse({
      submissions: formattedSubmissions,
      pagination: {
        page,
        limit,
        totalCount: totalCount || 0,
        totalPages: Math.ceil((totalCount || 0) / limit),
        hasNextPage: page * limit < (totalCount || 0),
        hasPreviousPage: page > 1,
      },
    });
  } catch (error) {
    return handleAPIError(createAuthError());
  }
};

export const DELETE = async (req: NextRequest) => {
  try {
    const user = await requireServerAuth();
    const { searchParams } = new URL(req.url);
    const submissionId = searchParams.get('id');

    if (!submissionId) {
      return handleAPIError(createValidationError('Submission ID is required'));
    }

    // Verify the submission belongs to the user
    const dbClient = await getDb();
    const { data: submission, error: fetchError } = await dbClient
      .from('submissions')
      .select('id')
      .eq('id', submissionId)
      .eq('user_id', user.id)
      .single();

    if (fetchError || !submission) {
      return notFoundResponse('Submission not found');
    }

    // Delete the submission (feedback will be cascade deleted due to foreign key)
    const { error: deleteError } = await dbClient
      .from('submissions')
      .delete()
      .eq('id', submissionId);

    if (deleteError) {
      logger.error('Supabase delete error', deleteError, { submissionId });
      return handleAPIError(new Error('Failed to delete submission'));
    }

    return successResponse(null, 'Submission deleted successfully');
  } catch (error) {
    return handleAPIError(createAuthError());
  }
};
