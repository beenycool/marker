import { getDb } from '@/lib/db';
import { checkUsageLimit } from '@/lib/auth';
import { logger } from '@/lib/logger';

interface DashboardData {
  recentSubmissions: Array<{
    id: string;
    question: string;
    subject: string | null;
    examBoard: string | null;
    createdAt: string;
    score: number;
    grade: string;
  }>;
  analytics: {
    totalSubmissions: number;
    averageScore: number;
    subjectBreakdown: Record<string, number>;
    progressOverTime: Array<{
      date: string;
      score: number;
      count: number;
    }>;
    gradeDistribution: Record<string, number>;
  };
  usage: {
    used: number;
    limit: number;
    remaining: number;
    canUse: boolean;
    percentage: number;
  };
  pagination?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export async function getDashboardData(
  userId: string,
  page: number = 1,
  limit: number = 10
): Promise<DashboardData> {
  try {
    // Get usage information
    const usageCheck = await checkUsageLimit(userId);
    const client = await getDb();

    // Call PostgreSQL function for all analytics
    const { data, error } = await client.rpc('get_user_dashboard', {
      user_id: userId,
      page_num: page,
      page_size: limit
    });

    if (error) {
      logger.error('Error fetching dashboard data:', error);
      throw error;
    }

    if (!data || data.length === 0) {
      return {
        recentSubmissions: [],
        analytics: {
          totalSubmissions: 0,
          averageScore: 0,
          subjectBreakdown: {},
          progressOverTime: [],
          gradeDistribution: {}
        },
        usage: {
          used: usageCheck.usedToday,
          limit: usageCheck.limit,
          remaining: usageCheck.limit - usageCheck.usedToday,
          canUse: usageCheck.canUse,
          percentage: (usageCheck.usedToday / usageCheck.limit) * 100
        },
        pagination: {
          page,
          limit,
          total: 0,
          totalPages: 0
        }
      };
    }

    const result = data[0];
    
    return {
      recentSubmissions: result.recent_submissions || [],
      analytics: {
        totalSubmissions: result.total_submissions || 0,
        averageScore: result.average_score || 0,
        subjectBreakdown: result.subject_breakdown || {},
        progressOverTime: result.progress_over_time || [],
        gradeDistribution: result.grade_distribution || {}
      },
      usage: {
        used: usageCheck.usedToday,
        limit: usageCheck.limit,
        remaining: usageCheck.limit - usageCheck.usedToday,
        canUse: usageCheck.canUse,
        percentage: (usageCheck.usedToday / usageCheck.limit) * 100
      },
      pagination: {
        page,
        limit,
        total: result.total_submissions || 0,
        totalPages: Math.ceil((result.total_submissions || 0) / limit)
      }
    };
  } catch (error) {
    logger.error('Error in getDashboardData:', error);
    throw error;
  }
}
