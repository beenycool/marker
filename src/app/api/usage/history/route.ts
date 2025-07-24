import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireAuth } from '@/lib/auth-middleware';
import { logger } from '@/lib/logger';

export const GET = requireAuth(async req => {
  try {
    const user = req.user;

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const url = new URL(req.url);
    const days = parseInt(url.searchParams.get('days') || '30');
    const limit = Math.min(
      parseInt(url.searchParams.get('limit') || '100'),
      100
    );

    // Calculate date range
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(endDate.getDate() - days);

    // Get usage history
    const dbClient = await db;
    const { data: usageHistory, error } = await dbClient
      .from('usage_tracking')
      .select('date, api_calls_used, tier')
      .eq('user_id', user.id)
      .gte('date', startDate.toISOString().split('T')[0])
      .lte('date', endDate.toISOString().split('T')[0])
      .order('date', { ascending: false })
      .limit(limit);

    if (error) {
      logger.error('Error fetching usage history', error, { userId: user.id });
      return NextResponse.json(
        { error: 'Failed to fetch usage history' },
        { status: 500 }
      );
    }

    // Get total stats
    const { data: totalStats } = await dbClient
      .from('usage_tracking')
      .select('api_calls_used')
      .eq('user_id', user.id);

    const totalApiCalls =
      totalStats?.reduce(
        (sum: number, record: any) => sum + (record.api_calls_used || 0),
        0
      ) || 0;

    // Calculate daily averages and trends
    const dailyUsage = usageHistory || [];
    const averageDailyUsage =
      dailyUsage.length > 0
        ? dailyUsage.reduce(
            (sum: number, day: any) => sum + (day.api_calls_used || 0),
            0
          ) / dailyUsage.length
        : 0;

    // Calculate week-over-week change if we have enough data
    let weeklyChange = 0;
    if (dailyUsage.length >= 14) {
      const lastWeek = dailyUsage
        .slice(0, 7)
        .reduce((sum: number, day: any) => sum + (day.api_calls_used || 0), 0);
      const previousWeek = dailyUsage
        .slice(7, 14)
        .reduce((sum: number, day: any) => sum + (day.api_calls_used || 0), 0);
      weeklyChange =
        previousWeek > 0 ? ((lastWeek - previousWeek) / previousWeek) * 100 : 0;
    }

    return NextResponse.json({
      dailyUsage: dailyUsage.map((day: any) => ({
        date: day.date,
        usage: day.api_calls_used || 0,
        tier: day.tier || 'FREE',
      })),
      stats: {
        totalApiCalls,
        averageDailyUsage: Math.round(averageDailyUsage * 100) / 100,
        weeklyChange: Math.round(weeklyChange * 100) / 100,
        daysTracked: dailyUsage.length,
      },
    });
  } catch (error) {
    logger.error('Usage history error', error);
    return NextResponse.json(
      { error: 'Failed to fetch usage history' },
      { status: 500 }
    );
  }
});
