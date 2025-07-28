import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/admin-auth';
import { getSupabase } from '@/lib/supabase';
import { logger } from '@/lib/logger';

export async function GET() {
  try {
    await requireAdmin();

    const supabase = await getSupabase();
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Get user metrics
    const { data: userMetrics } = await supabase.rpc('get_user_metrics');

    // Get submission metrics
    const { data: submissions, error: submissionsError } = await supabase
      .from('submissions')
      .select('id, created_at')
      .gte('created_at', thirtyDaysAgo.toISOString());

    if (submissionsError) {
      logger.error('Error fetching submissions:', submissionsError);
    }

    const todaySubmissions =
      submissions?.filter(
        (s: { created_at: string }) => new Date(s.created_at) >= today
      ).length || 0;

    // Get feedback metrics for scoring and costs
    const { data: feedback, error: feedbackError } = await supabase
      .from('feedback')
      .select(
        'score, cost_usd, response_time_ms, user_rating, error_message, created_at'
      )
      .gte('created_at', thirtyDaysAgo.toISOString());

    if (feedbackError) {
      logger.error('Error fetching feedback:', feedbackError);
    }

    // Calculate metrics
    const validFeedback =
      feedback?.filter((f: { score: number | null }) => f.score !== null) || [];
    const averageScore =
      validFeedback.length > 0
        ? validFeedback.reduce(
            (sum: number, f: { score: number }) => sum + f.score,
            0
          ) / validFeedback.length
        : 0;

    const totalCost =
      feedback?.reduce(
        (sum: number, f: { cost_usd: number | null }) =>
          sum + (f.cost_usd || 0),
        0
      ) || 0;

    const responseTimes =
      feedback
        ?.filter((f: { response_time_ms: number | null }) => f.response_time_ms)
        .map((f: { response_time_ms: number | null }) => f.response_time_ms) ||
      [];
    const avgResponseTime =
      responseTimes.length > 0
        ? responseTimes.reduce((sum: number, time: number) => sum + time, 0) /
          responseTimes.length
        : 0;

    const errorCount =
      feedback?.filter((f: { error_message: string | null }) => f.error_message)
        .length || 0;
    const errorRate = feedback?.length ? errorCount / feedback.length : 0;

    // Get subscription revenue (mock data - you'll need to integrate with Stripe)
    const totalRevenue = 2847; // This should come from Stripe
    const monthlyRevenue = 1247; // This should come from Stripe

    const metrics = {
      totalUsers: userMetrics?.total_users || 0,
      activeUsers: userMetrics?.active_users || 0,
      totalSubmissions: submissions?.length || 0,
      todaySubmissions,
      totalRevenue,
      monthlyRevenue,
      averageScore,
      errorRate,
      avgResponseTime: Math.round(avgResponseTime),
      totalCost,
    };

    return NextResponse.json(metrics);
  } catch (error) {
    logger.error('Error fetching admin metrics:', error);
    return NextResponse.json(
      { error: 'Failed to fetch metrics' },
      { status: 500 }
    );
  }
}
