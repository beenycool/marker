import { createClient } from '@supabase/supabase-js';
import { getEnvVar } from './cloudflare-env';

let supabaseInstance: any = null;

export async function getSupabase() {
  if (!supabaseInstance) {
    const supabaseUrl = await getEnvVar('NEXT_PUBLIC_SUPABASE_URL');
    const supabaseAnonKey = await getEnvVar('NEXT_PUBLIC_SUPABASE_ANON_KEY');

    if (!supabaseUrl || !supabaseAnonKey) {
      throw new Error('Missing Supabase configuration');
    }

    supabaseInstance = createClient(supabaseUrl, supabaseAnonKey);
  }

  return supabaseInstance;
}


export type Database = {
  public: {
    Tables: {
      users: {
        Row: {
          id: string;
          email: string;
          role: 'STUDENT' | 'ADMIN';
          subscription_tier: 'FREE' | 'PRO';
          onboarding_completed: boolean;
          year_group: string | null;
          subjects: string[];
          exam_boards: any | null;
          study_goals: string[];
          preferred_study_time: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          email: string;
          role?: 'STUDENT' | 'ADMIN';
          subscription_tier?: 'FREE' | 'PRO';
          onboarding_completed?: boolean;
          year_group?: string | null;
          subjects?: string[];
          exam_boards?: any | null;
          study_goals?: string[];
          preferred_study_time?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          email?: string;
          role?: 'STUDENT' | 'ADMIN';
          subscription_tier?: 'FREE' | 'PRO';
          onboarding_completed?: boolean;
          year_group?: string | null;
          subjects?: string[];
          exam_boards?: any | null;
          study_goals?: string[];
          preferred_study_time?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      subscriptions: {
        Row: {
          id: string;
          user_id: string;
          stripe_subscription_id: string | null;
          stripe_customer_id: string | null;
          status: 'ACTIVE' | 'INACTIVE' | 'CANCELED' | 'PAST_DUE';
          current_period_start: string | null;
          current_period_end: string | null;
          cancel_at_period_end: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          stripe_subscription_id?: string | null;
          stripe_customer_id?: string | null;
          status?: 'ACTIVE' | 'INACTIVE' | 'CANCELED' | 'PAST_DUE';
          current_period_start?: string | null;
          current_period_end?: string | null;
          cancel_at_period_end?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          stripe_subscription_id?: string | null;
          stripe_customer_id?: string | null;
          status?: 'ACTIVE' | 'INACTIVE' | 'CANCELED' | 'PAST_DUE';
          current_period_start?: string | null;
          current_period_end?: string | null;
          cancel_at_period_end?: boolean;
          created_at?: string;
          updated_at?: string;
        };
      };
      submissions: {
        Row: {
          id: string;
          user_id: string;
          question: string;
          answer: string;
          mark_scheme: string | null;
          marks_total: number | null;
          subject: string | null;
          exam_board: string | null;
          subject_code: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          question: string;
          answer: string;
          mark_scheme?: string | null;
          marks_total?: number | null;
          subject?: string | null;
          exam_board?: string | null;
          subject_code?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          question?: string;
          answer?: string;
          mark_scheme?: string | null;
          marks_total?: number | null;
          subject?: string | null;
          exam_board?: string | null;
          subject_code?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      feedback: {
        Row: {
          id: string;
          submission_id: string;
          ai_response: string;
          score: number;
          grade: string;
          aos_met: string[];
          improvement_suggestions: string[];
          model_used: string;
          grade_boundaries: any | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          submission_id: string;
          ai_response: string;
          score: number;
          grade: string;
          aos_met: string[];
          improvement_suggestions: string[];
          model_used: string;
          grade_boundaries?: any | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          submission_id?: string;
          ai_response?: string;
          score?: number;
          grade?: string;
          aos_met?: string[];
          improvement_suggestions?: string[];
          model_used?: string;
          grade_boundaries?: any | null;
          created_at?: string;
        };
      };
      analytics: {
        Row: {
          id: string;
          user_id: string;
          date: string;
          submissions_count: number;
          avg_score: number | null;
          subject_breakdown: any | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          date: string;
          submissions_count?: number;
          avg_score?: number | null;
          subject_breakdown?: any | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          date?: string;
          submissions_count?: number;
          avg_score?: number | null;
          subject_breakdown?: any | null;
          created_at?: string;
        };
      };
      past_papers: {
        Row: {
          id: string;
          title: string;
          questions: any;
          subject: string;
          year: number;
          exam_board: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          title: string;
          questions: any;
          subject: string;
          year: number;
          exam_board: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          title?: string;
          questions?: any;
          subject?: string;
          year?: number;
          exam_board?: string;
          created_at?: string;
          updated_at?: string;
        };
      };
      usage_tracking: {
        Row: {
          id: string;
          user_id: string;
          date: string;
          api_calls_used: number;
          tier: 'FREE' | 'PRO';
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          date: string;
          api_calls_used?: number;
          tier: 'FREE' | 'PRO';
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          date?: string;
          api_calls_used?: number;
          tier?: 'FREE' | 'PRO';
          created_at?: string;
        };
      };
      user_feedback: {
        Row: {
          id: string;
          user_id: string;
          submission_id: string;
          rating: number;
          comment: string | null;
          helpfulness: number | null;
          accuracy: number | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          submission_id: string;
          rating: number;
          comment?: string | null;
          helpfulness?: number | null;
          accuracy?: number | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          submission_id?: string;
          rating?: number;
          comment?: string | null;
          helpfulness?: number | null;
          accuracy?: number | null;
          created_at?: string;
        };
      };
    };
  };
};
