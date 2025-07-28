// GDPR REMOVAL: All user tracking and analytics commented out - collects personal data
/*
// import { logger } from './logger';
import posthog from 'posthog-js';

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

import { clientEnv } from './env';

// Initialize PostHog - COLLECTS USER DATA
if (typeof window !== 'undefined') {
  posthog.init(clientEnv.POSTHOG_KEY || '', {
    api_host: clientEnv.POSTHOG_HOST,
    person_profiles: 'identified_only',
    capture_pageview: false,
    capture_pageleave: false,
  });
}

// Track user signed up event - COLLECTS EMAIL AND USER ID
export const trackUserSignedUp = (userId: string, email: string) => {
  if (typeof window !== 'undefined') {
    posthog.identify(userId, {
      email: email,
    });
    posthog.capture('user_signed_up', {
      user_id: userId,
      email: email,
    });
  }
};

// Track onboarding completed event
export const trackOnboardingCompleted = (userId: string) => {
  if (typeof window !== 'undefined') {
    posthog.capture('onboarding_completed', {
      user_id: userId,
    });
  }
};

// Track submission created event
export const trackSubmissionCreated = (params: {
  userId: string;
  submissionId: string;
  subject: string | null;
}) => {
  if (typeof window !== 'undefined') {
    posthog.capture('submission_created', {
      user_id: params.userId,
      submission_id: params.submissionId,
      subject: params.subject,
    });
  }
};

// Track pro subscription started event
export const trackProSubscriptionStarted = (
  userId: string,
  subscriptionId: string,
  plan: string
) => {
  if (typeof window !== 'undefined') {
    posthog.capture('pro_subscription_started', {
      user_id: userId,
      subscription_id: subscriptionId,
      plan: plan,
    });
  }
};

// Track past paper attempted event
export const trackPastPaperAttempted = (
  userId: string,
  paperId: string,
  subject: string,
  examBoard: string
) => {
  if (typeof window !== 'undefined') {
    posthog.capture('past_paper_attempted', {
      user_id: userId,
      paper_id: paperId,
      subject: subject,
      exam_board: examBoard,
    });
  }
};

// Track daily active users
export const trackDailyActive = (userId: string) => {
  if (typeof window !== 'undefined') {
    posthog.capture('daily_active', {
      user_id: userId,
    });
  }
};

// Track free to pro conversion
export const trackFreeToProConversion = (userId: string) => {
  if (typeof window !== 'undefined') {
    posthog.capture('free_to_pro_conversion', {
      user_id: userId,
    });
  }
};

// Track upgrade prompt shown
export const trackUpgradePromptShown = (
  userId: string,
  context: 'limit_reached' | 'pro_feature'
) => {
  if (typeof window !== 'undefined') {
    posthog.capture('upgrade_prompt_shown', {
      user_id: userId,
      context: context,
    });
  }
};

// Track upgrade prompt clicked
export const trackUpgradePromptClicked = (
  userId: string,
  context: 'limit_reached' | 'pro_feature'
) => {
  if (typeof window !== 'undefined') {
    posthog.capture('upgrade_prompt_clicked', {
      user_id: userId,
      context: context,
    });
  }
};

// Track usage limit reached
export const trackUsageLimitReached = (
  userId: string,
  limitType: 'daily_marks' | 'advanced_ai' | 'ocr_upload'
) => {
  if (typeof window !== 'undefined') {
    posthog.capture('usage_limit_reached', {
      user_id: userId,
      limit_type: limitType,
    });
  }
};

// Track A/B test variant
export const trackABTestVariant = (
  userId: string,
  testName: string,
  variant: string
) => {
  if (typeof window !== 'undefined') {
    posthog.capture('ab_test_variant', {
      user_id: userId,
      test_name: testName,
      variant: variant,
    });
  }
};

// Track email journey triggered
export const trackEmailJourneyTriggered = (
  userId: string,
  journeyType: 'welcome' | 'upgrade_nudge' | 're_engagement'
) => {
  if (typeof window !== 'undefined') {
    posthog.capture('email_journey_triggered', {
      user_id: userId,
      journey_type: journeyType,
    });
  }
};

// Track weekly active users
export const trackWeeklyActive = (userId: string) => {
  if (typeof window !== 'undefined') {
    posthog.capture('weekly_active', {
      user_id: userId,
    });
  }
};

// Track monthly active users
export const trackMonthlyActive = (userId: string) => {
  if (typeof window !== 'undefined') {
    posthog.capture('monthly_active', {
      user_id: userId,
    });
  }
};

// Identify user - COLLECTS USER DATA
export const identifyUser = (
  userId: string,
  traits: Record<string, any> = {}
) => {
  if (typeof window !== 'undefined') {
    posthog.identify(userId, traits);
  }
};

// Reset user identification
export const resetAnalytics = () => {
  if (typeof window !== 'undefined') {
    posthog.reset();
  }
};
*/

// GDPR-SAFE: No user tracking or analytics
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
