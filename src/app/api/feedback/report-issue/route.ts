import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { z } from 'zod';
import { logger } from '@/lib/logger';

const ReportIssueSchema = z.object({
  promptVersion: z.string().optional().nullable(),
  modelUsed: z.string().optional().nullable(),
  failedResponseText: z.string().min(1, 'Failed response text is required'),
  metadata: z.record(z.any()).optional().default({}),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validate request body
    const validatedData = ReportIssueSchema.parse(body);

    // Insert anonymous report into database
    // IMPORTANT: This is stateless and anonymous - no user authentication required
    const { data, error } = await (db as any)
      .from('ai_failure_log')
      .insert({
        prompt_version: validatedData.promptVersion,
        model_used: validatedData.modelUsed,
        failed_response_text: validatedData.failedResponseText,
        metadata: validatedData.metadata,
        reported_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) {
      logger.error('Database error storing AI failure report', error);
      return NextResponse.json(
        { error: 'Failed to store report' },
        { status: 500 }
      );
    }

    // Log the anonymous report for monitoring (without personal data)
    logger.info('Anonymous AI failure report submitted', {
      reportId: data.id,
      modelUsed: validatedData.modelUsed,
      promptVersion: validatedData.promptVersion,
      responseLength: validatedData.failedResponseText.length,
    });

    return NextResponse.json(
      {
        message: 'Report submitted successfully',
        reportId: data.id,
      },
      { status: 201 }
    );
  } catch (error) {
    logger.error('Error processing AI failure report', error);

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