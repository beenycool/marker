import { logger } from '@/lib/logger';
import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { db } from '@/lib/db';

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Clerk removed: skipping userId check

    const resolvedParams = await params;
    const dbClient = await db;
    const { data: pastPaper, error } = await dbClient
      .from('past_papers')
      .select('*')
      .eq('id', resolvedParams.id)
      .single();

    if (error || !pastPaper) {
      return NextResponse.json(
        { error: 'Past paper not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      ...pastPaper,
      questions: Array.isArray(pastPaper.questions) ? pastPaper.questions : [],
    });
  } catch (error) {
    logger.error('Past paper fetch error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch past paper' },
      { status: 500 }
    );
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Clerk removed: skipping userId check

    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const resolvedParams = await params;
    const dbClient = await db;
    const { data: pastPaper, error } = await dbClient
      .from('past_papers')
      .select('*')
      .eq('id', resolvedParams.id)
      .single();

    if (error || !pastPaper) {
      return NextResponse.json(
        { error: 'Past paper not found' },
        { status: 404 }
      );
    }

    const body = await request.json();
    const { answers } = body;

    if (!answers || typeof answers !== 'object') {
      return NextResponse.json(
        { error: 'Invalid answers format' },
        { status: 400 }
      );
    }

    // Create a new submission for the attempt
    const { data: submission, error: submissionError } = await dbClient
      .from('submissions')
      .insert({
        user_id: user.id,
        question: `Past Paper: ${pastPaper.title}`,
        answer: JSON.stringify(answers),
        subject: pastPaper.subject,
        exam_board: pastPaper.exam_board,
        marks_total: Array.isArray(pastPaper.questions)
          ? pastPaper.questions.reduce(
              (sum: number, q: any) => sum + (q.marks || 0),
              0
            )
          : 0,
      })
      .select('id, created_at')
      .single();

    if (submissionError || !submission) {
      logger.error('Supabase submission creation error:', submissionError);
      return NextResponse.json(
        { error: 'Failed to create submission' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      submission: {
        id: submission.id,
        createdAt: submission.created_at,
      },
      message: 'Past paper submitted successfully',
    });
  } catch (error) {
    logger.error('Past paper submission error:', error);
    return NextResponse.json(
      { error: 'Failed to submit past paper' },
      { status: 500 }
    );
  }
}
