/**
 * Anonymous-first types. All user/account/subscription constructs removed.
 */

export interface MarkingRequest {
  question: string;
  answer: string;
  markScheme?: string;
  marksTotal?: number;
  subject?: string;
  examBoard?: string;
}

export interface MarkingResponse {
  score: number;
  grade: string;
  aosMet: string[];
  improvementSuggestions: string[];
  aiResponse: string;
  modelUsed: string;
  confidenceScore?: number;
}

export interface UsageStats {
  used: number;
  limit: number;
  canUse: boolean;
}

/**
 * Dashboard data for local-only analytics (session-scoped).
 */
export interface DashboardData {
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
    progressOverTime: { date: string; score: number }[];
  };
  usageStats: UsageStats;
}

/**
 * Past paper shapes independent of accounts.
 */
export interface PastPaperQuestion {
  id: string;
  question: string;
  marks: number;
  subject: string;
  topic?: string;
}

/**
 * Minimal PastPaper representation used by the Past Papers feature.
 */
export interface PastPaper {
  id: string;
  title: string;
  questions: any[];
  subject: string;
  year: number;
  examBoard: string;
}

/**
 * AI Provider availability without subscription tiers.
 */
export interface AIProvider {
  name: string;
  model: string;
  available: boolean;
}

export interface OCRResult {
  text: string;
  confidence: number;
  processingTime: number;
}
