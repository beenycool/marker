import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { getDb } from '@/lib/db';
import { logger } from '@/lib/logger';
import { trackOnboardingCompleted } from '@/lib/analytics';

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { yearGroup, subjects, examBoards, studyGoals, preferredStudyTime } =
      body;

    // Validate required fields
    if (!yearGroup || !subjects || subjects.length === 0) {
      return NextResponse.json(
        { error: 'Year group and at least one subject are required' },
        { status: 400 }
      );
    }

    // Get the actual database client
    const client = await getDb();
    // Update user with onboarding data
    const { data: updatedUser, error } = await client
      .from('users')
      .update({
        onboarding_completed: true,
        year_group: yearGroup,
        subjects,
        exam_boards: examBoards,
        study_goals: studyGoals,
        preferred_study_time: preferredStudyTime,
        updated_at: new Date().toISOString(),
      })
      .eq('id', user.id)
      .select('*')
      .single();

    if (error || !updatedUser) {
      logger.error('Supabase user update error', error, { userId: user.id });
      return NextResponse.json(
        { error: 'Failed to update user onboarding' },
        { status: 500 }
      );
    }

    // Track onboarding completion
    trackOnboardingCompleted(user.id);

    return NextResponse.json({
      success: true,
      message: 'Onboarding completed successfully',
      user: updatedUser,
    });
  } catch (error) {
    logger.error('Onboarding API error', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
