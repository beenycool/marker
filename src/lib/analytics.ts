// No user tracking or analytics
export interface PerformanceMetrics {
  totalSubmissions: number;
  averageScore: number;
  subjectBreakdown: Record<string, number>;
  progressOverTime: Array<{
    date: string;
    score: number;
    count: number;
  }>;
  gradeDistribution: Record<string, number>;
}

export class AnalyticsService {
  static calculateAverageScore(scores: number[]): number {
    if (scores.length === 0) return 0;
    return scores.reduce((sum, score) => sum + score, 0) / scores.length;
  }

  static calculateSubjectBreakdown(
    submissions: Array<{ subject: string | null }>
  ): Record<string, number> {
    return submissions.reduce((acc: Record<string, number>, submission) => {
      const subject = submission.subject || 'Other';
      acc[subject] = (acc[subject] || 0) + 1;
      return acc;
    }, {});
  }

  static calculateProgressOverTime(
    submissions: Array<{
      created_at: string;
      feedback: Array<{ score: number }>;
    }>,
    startDate: Date = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
  ): Array<{ date: string; score: number; count: number }> {
    // Filter submissions within date range
    const filteredSubmissions = submissions.filter(
      submission => new Date(submission.created_at) >= startDate
    );

    // Group by date
    const progressData = filteredSubmissions.reduce(
      (acc: Record<string, { total: number; count: number }>, submission) => {
        const date = submission.created_at.split('T')[0];
        if (!acc[date]) {
          acc[date] = { total: 0, count: 0 };
        }
        acc[date].total += submission.feedback?.[0]?.score || 0;
        acc[date].count += 1;
        return acc;
      },
      {}
    );

    // Convert to array and calculate average score
    return Object.entries(progressData).map(([date, data]) => ({
      date,
      score: data.total / data.count,
      count: data.count,
    }));
  }

  static calculateGradeDistribution(
    submissions: Array<{ feedback: Array<{ grade: string }> }>
  ): Record<string, number> {
    return submissions.reduce((acc: Record<string, number>, submission) => {
      const grade = submission.feedback?.[0]?.grade || 'N/A';
      acc[grade] = (acc[grade] || 0) + 1;
      return acc;
    }, {});
  }

  static getPerformanceMetrics(
    submissions: Array<{
      subject: string | null;
      created_at: string;
      feedback: Array<{ score: number; grade: string }>;
    }>
  ): PerformanceMetrics {
    const scores = submissions
      .filter(s => s.feedback && s.feedback.length > 0)
      .map(s => s.feedback[0].score);
    const averageScore = this.calculateAverageScore(scores);
    const subjectBreakdown = this.calculateSubjectBreakdown(submissions);
    const progressOverTime = this.calculateProgressOverTime(submissions);
    const gradeDistribution = this.calculateGradeDistribution(submissions);

    return {
      totalSubmissions: submissions.length,
      averageScore,
      subjectBreakdown,
      progressOverTime,
      gradeDistribution,
    };
  }
}

// All tracking functions disabled - no personal data collection
export const trackUserSignedUp = () => {};
export const trackOnboardingCompleted = () => {};
export const trackSubmissionCreated = () => {};
export const trackProSubscriptionStarted = () => {};
export const trackPastPaperAttempted = () => {};
export const trackDailyActive = () => {};
export const trackFreeToProConversion = () => {};
export const trackUpgradePromptShown = () => {};
export const trackUpgradePromptClicked = () => {};
export const trackUsageLimitReached = () => {};
export const trackABTestVariant = () => {};
export const trackEmailJourneyTriggered = () => {};
export const trackWeeklyActive = () => {};
export const trackMonthlyActive = () => {};
export const identifyUser = () => {};
export const resetAnalytics = () => {};
