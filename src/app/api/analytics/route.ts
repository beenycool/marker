import { logger } from '@/lib/logger';
import { NextRequest } from 'next/server';
import { getDb } from '@/lib/db';
import { subDays, format } from 'date-fns';
import { requireServerAuth } from '@/lib/auth-server';
import { successResponse } from '@/lib/api-response';

export const GET = async (request: NextRequest) => {
  try {
    const user = await requireServerAuth();

    const { searchParams } = new URL(request.url);
    const days = parseInt(searchParams.get('days') || '30');
    const startDate = subDays(new Date(), days);

    // Get submissions with feedback
    const dbClient = await getDb();
    const { data: submissions, error } = await dbClient
      .from('submissions')
      .select(
        `
        *,
        feedback (*)
      `
      )
      .eq('user_id', user.id)
      .gte('created_at', startDate.toISOString())
      .order('created_at', { ascending: false });

    if (error) {
      logger.error('Supabase submissions query error:', error);
      return Response.json(
        { error: 'Failed to fetch submissions' },
        { status: 500 }
      );
    }

    // Calculate analytics
    const totalSubmissions = submissions.length;
    const submissionsWithFeedback = submissions.filter(
      (s: any) => s.feedback && s.feedback.length > 0
    );

    const averageScore =
      submissionsWithFeedback.length > 0
        ? submissionsWithFeedback.reduce(
            (sum: number, s: any) => sum + (s.feedback[0]?.score || 0),
            0
          ) / submissionsWithFeedback.length
        : 0;

    // Subject breakdown
    const subjectBreakdown: Record<string, number> = {};
    submissions.forEach((submission: any) => {
      const subject = submission.subject || 'Unknown';
      subjectBreakdown[subject] = (subjectBreakdown[subject] || 0) + 1;
    });

    // Grade distribution
    const gradeDistribution: Record<string, number> = {
      'A*': 0,
      A: 0,
      B: 0,
      C: 0,
      D: 0,
      E: 0,
      F: 0,
    };
    submissionsWithFeedback.forEach((submission: any) => {
      const grade = submission.feedback[0]?.grade || 'F';
      if (gradeDistribution[grade] !== undefined) {
        gradeDistribution[grade]++;
      }
    });

    // Progress over time (group by day)
    const progressOverTime: Array<{
      date: string;
      score: number;
      count: number;
    }> = [];
    const dailyScores: Record<string, { scores: number[]; count: number }> = {};

    submissionsWithFeedback.forEach((submission: any) => {
      const date = format(new Date(submission.created_at), 'yyyy-MM-dd');
      if (!dailyScores[date]) {
        dailyScores[date] = { scores: [], count: 0 };
      }
      dailyScores[date].scores.push(submission.feedback[0]?.score || 0);
      dailyScores[date].count++;
    });

    // Convert to array and calculate daily averages
    Object.entries(dailyScores).forEach(([date, data]) => {
      const averageScore =
        data.scores.length > 0
          ? data.scores.reduce((sum, score) => sum + score, 0) /
            data.scores.length
          : 0;

      progressOverTime.push({
        date,
        score: Math.round(averageScore * 10) / 10,
        count: data.count,
      });
    });

    // Sort by date
    progressOverTime.sort(
      (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
    );

    // Recent submissions for activity feed
    const recentSubmissions = submissions
      .slice(0, 10)
      .map((submission: any) => ({
        id: submission.id,
        question:
          submission.question.length > 100
            ? submission.question.substring(0, 100) + '...'
            : submission.question,
        subject: submission.subject,
        examBoard: submission.exam_board,
        score: submission.feedback[0]?.score || null,
        grade: submission.feedback[0]?.grade || null,
        createdAt: submission.created_at,
        feedback: submission.feedback[0]
          ? {
              id: submission.feedback[0].id,
              score: submission.feedback[0].score,
              grade: submission.feedback[0].grade,
              aosMet: submission.feedback[0].aos_met,
              improvementSuggestions:
                submission.feedback[0].improvement_suggestions.slice(0, 2), // First 2 suggestions
            }
          : null,
      }));

    // Performance insights
    const insights = generateInsights({
      totalSubmissions,
      averageScore,
      subjectBreakdown,
      gradeDistribution,
      progressOverTime,
      recentSubmissions,
    });

    return successResponse({
      analytics: {
        totalSubmissions,
        averageScore,
        subjectBreakdown,
        gradeDistribution,
        progressOverTime,
        insights,
      },
      recentSubmissions,
      period: {
        days,
        startDate: startDate.toISOString(),
        endDate: new Date().toISOString(),
      },
    });
  } catch (error) {
    logger.error('Analytics API error:', error);
    return Response.json(
      { error: 'Failed to fetch analytics' },
      { status: 500 }
    );
  }
};

function generateInsights(data: {
  totalSubmissions: number;
  averageScore: number;
  subjectBreakdown: Record<string, number>;
  gradeDistribution: Record<string, number>;
  progressOverTime: Array<{ date: string; score: number; count: number }>;
  recentSubmissions: any[];
}) {
  const insights = [];

  // Performance trend
  if (data.progressOverTime.length >= 2) {
    const recent = data.progressOverTime.slice(-5);
    const earlier = data.progressOverTime.slice(0, -5);

    if (recent.length > 0 && earlier.length > 0) {
      const recentAvg =
        recent.reduce((sum, item) => sum + item.score, 0) / recent.length;
      const earlierAvg =
        earlier.reduce((sum, item) => sum + item.score, 0) / earlier.length;

      if (recentAvg > earlierAvg + 2) {
        insights.push({
          type: 'positive',
          title: 'Improving Performance',
          description: `Your average score has increased by ${(recentAvg - earlierAvg).toFixed(1)} points recently.`,
          icon: 'trending-up',
        });
      } else if (recentAvg < earlierAvg - 2) {
        insights.push({
          type: 'warning',
          title: 'Performance Dip',
          description: `Your recent scores are ${(earlierAvg - recentAvg).toFixed(1)} points lower than before.`,
          icon: 'trending-down',
        });
      }
    }
  }

  // Subject focus
  const topSubject = Object.entries(data.subjectBreakdown).sort(
    ([, a], [, b]) => b - a
  )[0];
  if (topSubject) {
    insights.push({
      type: 'info',
      title: 'Most Practiced Subject',
      description: `You've submitted ${topSubject[1]} questions in ${topSubject[0]}.`,
      icon: 'book-open',
    });
  }

  // Grade achievement
  const highGrades =
    (data.gradeDistribution['A*'] || 0) + (data.gradeDistribution['A'] || 0);
  const totalGraded = Object.values(data.gradeDistribution).reduce(
    (sum, count) => sum + count,
    0
  );

  if (totalGraded > 0) {
    const highGradePercentage = (highGrades / totalGraded) * 100;
    if (highGradePercentage >= 60) {
      insights.push({
        type: 'positive',
        title: 'Excellent Performance',
        description: `${highGradePercentage.toFixed(0)}% of your work achieved A* or A grades.`,
        icon: 'award',
      });
    }
  }

  // Consistency check
  if (data.progressOverTime.length >= 5) {
    const scores = data.progressOverTime.map(item => item.score);
    const variance = calculateVariance(scores);

    if (variance < 10) {
      insights.push({
        type: 'positive',
        title: 'Consistent Performance',
        description: 'Your scores show good consistency over time.',
        icon: 'target',
      });
    }
  }

  return insights;
}

function calculateVariance(numbers: number[]): number {
  const mean = numbers.reduce((sum, num) => sum + num, 0) / numbers.length;
  const squaredDiffs = numbers.map(num => Math.pow(num - mean, 2));
  return squaredDiffs.reduce((sum, diff) => sum + diff, 0) / numbers.length;
}
