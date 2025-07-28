import { NextResponse } from 'next/server';
import { logger } from '@/lib/logger';

export const GET = async () => {
  try {
    // GDPR-safe: No user tracking or usage history
    return NextResponse.json({
      dailyUsage: [],
      stats: {
        totalApiCalls: 0,
        averageDailyUsage: 0,
        weeklyChange: 0,
        daysTracked: 0,
      },
    });
  } catch (error) {
    logger.error('Usage history error', error);
    return NextResponse.json(
      { error: 'Failed to fetch usage history' },
      { status: 500 }
    );
  }
};
