import { createTestClient } from '../../lib/__tests__/integration-setup';
import { describe, it, expect, beforeEach } from '@jest/globals';

describe('Dashboard API', () => {
  let supabase: any;

  beforeEach(async () => {
    supabase = await createTestClient();

    // Clear test data before each test
    await supabase.from('users').delete().neq('id', '0');
    await supabase.from('submissions').delete().neq('id', '0');
    await supabase.from('feedback').delete().neq('id', '0');
    await supabase.from('analytics').delete().neq('id', '0');
  });

  it('should get dashboard data for a user', async () => {
    // Create test user
    const { data: user } = await supabase
      .from('users')
      .insert({
        id: 'test-user-1',
        email: 'test@example.com',
        subscription_tier: 'FREE',
        onboarding_completed: true,
      })
      .select()
      .single();

    // Create test submissions
    await supabase.from('submissions').insert([
      {
        id: 'sub-1',
        user_id: user.id,
        question: 'What is 2+2?',
        answer: '4',
        subject: 'Mathematics',
        created_at: new Date().toISOString(),
      },
      {
        id: 'sub-2',
        user_id: user.id,
        question: 'What is the capital of France?',
        answer: 'Paris',
        subject: 'Geography',
        created_at: new Date().toISOString(),
      },
    ]);

    // Create test feedback
    await supabase.from('feedback').insert([
      {
        id: 'fb-1',
        submission_id: 'sub-1',
        ai_response: 'Correct!',
        score: 1,
        grade: 'A',
        created_at: new Date().toISOString(),
      },
      {
        id: 'fb-2',
        submission_id: 'sub-2',
        ai_response: 'Correct!',
        score: 1,
        grade: 'A',
        created_at: new Date().toISOString(),
      },
    ]);

    // Call the dashboard API
    const response = await fetch('/api/dashboard', {
      headers: {
        Cookie: 'sb-access-token=test-token',
      },
    });

    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data.submissionsCount).toBe(2);
    expect(data.averageScore).toBe(1);
    expect(data.subjectBreakdown).toEqual({
      Mathematics: 1,
      Geography: 1,
    });
  });
});
