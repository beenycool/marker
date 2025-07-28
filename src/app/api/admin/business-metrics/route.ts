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
    const startDate = new Date(now.getTime() - daysBack * 24 * 60 * 60 * 1000);

    // Get user metrics
    const { data: users } = await supabase
      .from('auth.users')
      .select('id, email, created_at, last_sign_in_at, subscription_tier')
      .gte('created_at', startDate.toISOString());

    const totalUsers = users?.length || 0;
    const activeUsers =
      users?.filter(
        (u: { last_sign_in_at: string | null }) =>
          u.last_sign_in_at &&
          new Date(u.last_sign_in_at) >
            new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
      ).length || 0;
    const newToday =
      users?.filter(
        (u: { created_at: string }) =>
          new Date(u.created_at).toDateString() === now.toDateString()
      ).length || 0;

    // Get submission metrics
    const { data: submissions } = await supabase
      .from('submissions')
      .select('id, created_at, user_id')
      .gte('created_at', startDate.toISOString());

    const totalSubmissions = submissions?.length || 0;
    const todaySubmissions =
      submissions?.filter(
        (s: { created_at: string }) =>
          new Date(s.created_at).toDateString() === now.toDateString()
      ).length || 0;

    // Get feedback metrics for AI performance and costs
    const { data: feedback } = await supabase
      .from('feedback')
      .select('score, cost_usd, response_time_ms, user_rating, created_at')
      .gte('created_at', startDate.toISOString());

    const validFeedback =
      feedback?.filter((f: { score: number | null }) => f.score !== null) || [];
    const avgScore =
      validFeedback.length > 0
        ? validFeedback.reduce(
            (sum: number, f: { score: number }) => sum + f.score,
            0
          ) / validFeedback.length
        : 0;

    const successRate = feedback?.length
      ? (validFeedback.length / feedback.length) * 100
      : 0;

    const avgResponseTime = feedback?.length
      ? feedback.reduce(
          (sum: number, f: { response_time_ms: number | null }) =>
            sum + (f.response_time_ms || 0),
          0
        ) / feedback.length
      : 0;

    const totalCost =
      feedback?.reduce(
        (sum: number, f: { cost_usd: number | null }) =>
          sum + (f.cost_usd || 0),
        0
      ) || 0;
    const costPerRequest =
      totalSubmissions > 0 ? totalCost / totalSubmissions : 0;

    // Mock revenue data - replace with Stripe integration
    const mockRevenue = {
      total: totalUsers * 2.99 * 0.3, // Assume 30% conversion at £2.99
      monthly: totalUsers * 2.99 * 0.3 * 0.8, // 80% of total is monthly
      daily: todaySubmissions * 0.1, // Mock daily revenue
      growth: 0.15, // 15% growth
    };

    const businessMetrics = {
      revenue: mockRevenue,
      users: {
        total: totalUsers,
        active: activeUsers,
        new_today: newToday,
        conversion_rate: totalUsers > 0 ? activeUsers / totalUsers : 0,
        churn_rate: 0.05, // Mock churn rate
      },
      ai_performance: {
        avg_score: avgScore,
        success_rate: successRate,
        avg_response_time: Math.round(avgResponseTime),
        total_cost: totalCost,
        cost_per_request: costPerRequest,
      },
      submissions: {
        total: totalSubmissions,
        today: todaySubmissions,
        week:
          submissions?.filter(
            (s: { created_at: string }) =>
              new Date(s.created_at) >
              new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
          ).length || 0,
        month: totalSubmissions,
      },
    };

    return NextResponse.json(businessMetrics);
  } catch (error) {
    logger.error('Error fetching business metrics:', error);
    return NextResponse.json(
      { error: 'Failed to fetch business metrics' },
      { status: 500 }
    );
  }
}
