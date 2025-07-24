export type User = {
  id: string;
  email: string;
  role: 'STUDENT' | 'ADMIN';
  subscriptionTier: 'FREE' | 'PRO';
  onboardingCompleted: boolean;
  yearGroup: string | null;
  subjects: string[];
  examBoards: any | null;
  studyGoals: string[];
  preferredStudyTime: string | null;
  createdAt: Date;
  updatedAt: Date;
};

export type Tier = 'FREE' | 'PRO';

export type Submission = {
  id: string;
  userId: string;
  question: string;
  answer: string;
  markScheme: string | null;
  marksTotal: number | null;
  subject: string | null;
  examBoard: string | null;
  subjectCode: string | null;
  createdAt: Date;
  updatedAt: Date;
};

export type Feedback = {
  id: string;
  submissionId: string;
  aiResponse: string;
  score: number;
  grade: string;
  aosMet: string[];
  improvementSuggestions: string[];
  modelUsed: string;
  gradeBoundaries: any | null;
  createdAt: Date;
};

export type Analytics = {
  id: string;
  userId: string;
  date: Date;
  submissionsCount: number;
  avgScore: number | null;
  subjectBreakdown: any | null;
  createdAt: Date;
};

export type PastPaper = {
  id: string;
  title: string;
  questions: any;
  subject: string;
  year: number;
  examBoard: string;
  createdAt: Date;
  updatedAt: Date;
};

export type UsageTracking = {
  id: string;
  userId: string;
  date: Date;
  apiCallsUsed: number;
  tier: Tier;
  createdAt: Date;
};

export type Subscription = {
  id: string;
  userId: string;
  stripeSubscriptionId: string | null;
  stripeCustomerId: string | null;
  status: 'ACTIVE' | 'INACTIVE' | 'CANCELED' | 'PAST_DUE';
  currentPeriodStart: Date | null;
  currentPeriodEnd: Date | null;
  cancelAtPeriodEnd: boolean;
  createdAt: Date;
  updatedAt: Date;
};

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

export interface DashboardData {
  recentSubmissions: any[];
  analytics: {
    totalSubmissions: number;
    averageScore: number;
    subjectBreakdown: Record<string, number>;
    progressOverTime: { date: string; score: number }[];
  };
  usageStats: UsageStats;
}

export interface PastPaperQuestion {
  id: string;
  question: string;
  marks: number;
  subject: string;
  topic?: string;
}

export interface PastPaperAttempt {
  id: string;
  paperId: string;
  answers: Record<string, string>;
  startedAt: Date;
  completedAt?: Date;
  score?: number;
  feedback?: Record<string, MarkingResponse>;
}

export interface AIProvider {
  name: string;
  model: string;
  tier: 'free' | 'pro';
  available: boolean;
}

export interface OCRResult {
  text: string;
  confidence: number;
  processingTime: number;
}
