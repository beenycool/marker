import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/admin-auth';
import { getSupabase } from '@/lib/supabase';
import { logger } from '@/lib/logger';

export async function GET(request: NextRequest) {
  try {
    await requireAdmin();

    const { searchParams } = new URL(request.url);
    const range = searchParams.get('range') || '30d';

    const supabase = await getSupabase();
    const now = new Date();
    const daysBack = range === '7d' ? 7 : range === '30d' ? 30 : 90;

    // Generate daily trend data
    const trendData = [];
    for (let i = daysBack - 1; i >= 0; i--) {
      const date = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
      const dateStr = date.toISOString().split('T')[0];

      // Get daily submissions
      const { data: dailySubmissions } = await supabase
        .from('submissions')
        .select('id')
        .gte('created_at', `${dateStr}T00:00:00`)
        .lt('created_at', `${dateStr}T23:59:59`);

      // Get daily feedback for scores
      const { data: dailyFeedback } = await supabase
        .from('feedback')
        .select('score')
        .gte('created_at', `${dateStr}T00:00:00`)
        .lt('created_at', `${dateStr}T23:59:59`);

      const validScores =
        dailyFeedback?.filter(
          (f: { score: number | null }) => f.score !== null
        ) || [];
      const avgScore =
        validScores.length > 0
          ? validScores.reduce(
              (sum: number, f: { score: number }) => sum + f.score,
              0
            ) / validScores.length
          : 0;

      // Mock revenue and user data
      const submissions = dailySubmissions?.length || 0;
      const mockRevenue = submissions * 0.1; // Mock revenue per submission
      const mockUsers = Math.floor(submissions * 0.8); // Mock active users

      trendData.push({
        date: date.toISOString().split('T')[0],
        revenue: mockRevenue,
        users: mockUsers,
        submissions,
        avg_score: avgScore,
      });
    }

    return NextResponse.json(trendData);
  } catch (error) {
    logger.error('Error fetching trend data:', error);
    return NextResponse.json(
      { error: 'Failed to fetch trend data' },
      { status: 500 }
    );
  }
}
