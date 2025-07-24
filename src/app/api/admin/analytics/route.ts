import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/admin-auth';
import { businessAnalytics } from '@/lib/analytics/business-metrics';
import { costTracker } from '@/lib/analytics/cost-tracker';
import { logger } from '@/lib/logger';

export async function GET(request: NextRequest) {
  try {
    await requireAdmin();
    
    const { searchParams } = new URL(request.url);
    const period = searchParams.get('period') || '30d';
    const metric = searchParams.get('metric') || 'overview';

    // Calculate date range based on period
    const endDate = new Date();
    let startDate: Date;
    
    switch (period) {
      case '7d':
        startDate = new Date(endDate.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case '30d':
        startDate = new Date(endDate.getTime() - 30 * 24 * 60 * 60 * 1000);
        break;
      case '90d':
        startDate = new Date(endDate.getTime() - 90 * 24 * 60 * 60 * 1000);
        break;
      case '1y':
        startDate = new Date(endDate.getTime() - 365 * 24 * 60 * 60 * 1000);
        break;
      default:
        startDate = new Date(endDate.getTime() - 30 * 24 * 60 * 60 * 1000);
    }

    let data: any = {};

    switch (metric) {
      case 'overview':
        const [businessMetrics, costBreakdown, costProjection] = await Promise.all([
          businessAnalytics.getBusinessMetrics(startDate, endDate),
          costTracker.getCostBreakdown(startDate, endDate),
          costTracker.getCostProjection(),
        ]);

        data = {
          businessMetrics,
          costBreakdown,
          costProjection,
          period,
        };
        break;

      case 'cohorts':
        data = {
          cohorts: await businessAnalytics.getCohortAnalysis(),
          period,
        };
        break;

      case 'funnel':
        data = {
          funnel: await businessAnalytics.getFunnelMetrics(),
          period,
        };
        break;

      case 'costs':
        const [breakdown, trends, efficiency, optimization] = await Promise.all([
          costTracker.getCostBreakdown(startDate, endDate),
          costTracker.getCostTrends(startDate, endDate, 'day'),
          costTracker.getCostEfficiencyMetrics(startDate, endDate),
          costTracker.getCostOptimizationSuggestions(),
        ]);

        data = {
          breakdown,
          trends,
          efficiency,
          optimization,
          period,
        };
        break;

      case 'unit-economics':
        const unitEconomics = await businessAnalytics.getUnitEconomics();
        data = {
          unitEconomics,
          period,
        };
        break;

      default:
        return NextResponse.json(
          { error: 'Invalid metric parameter' },
          { status: 400 }
        );
    }

    return NextResponse.json(data);
  } catch (error) {
    logger.error('Error fetching analytics data:', error);
    return NextResponse.json(
      { error: 'Failed to fetch analytics data' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    await requireAdmin();
    const body = await request.json();

    const { action, ...params } = body;

    switch (action) {
      case 'track_event':
        await businessAnalytics.trackBusinessEvent(
          params.eventType,
          params.value,
          params.userId,
          params.metadata
        );
        break;

      case 'set_budget_alert':
        await costTracker.setBudgetAlert(
          params.threshold,
          params.period,
          params.alertChannels
        );
        break;

      default:
        return NextResponse.json(
          { error: 'Invalid action parameter' },
          { status: 400 }
        );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    logger.error('Error handling analytics action:', error);
    return NextResponse.json(
      { error: 'Failed to handle analytics action' },
      { status: 500 }
    );
  }
}