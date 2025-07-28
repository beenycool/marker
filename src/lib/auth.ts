// Legacy auth file - use /auth/index.ts instead
// This file is maintained for backward compatibility

import { getSupabase } from './supabase';
import { logger } from './logger';
import type { Tier } from '@/types';
import { getEnv } from './env';

export async function getCurrentUser() {
  if (typeof window !== 'undefined') {
    // Client-side: return null as this should be handled by auth provider
    return null;
  }

  // Server-side: dynamic import to avoid bundling server code in client
  const { getCurrentUser: getUser } = await import('./auth/server');
  return getUser();
}

export async function checkUsageLimit(
  userId: string
): Promise<{ canUse: boolean; usedToday: number; limit: number }> {
  const supabase = await getSupabase();

  // Check if summer promotion is active first
  const { data: _promotionFlag } = await supabase.rpc('is_feature_active', {
    flag_name: 'summer_promotion_2024',
  });

  const { data: user, error: userError } = await supabase
    .from('users')
    .select('*')
    .eq('id', userId)
    .single();

  if (userError || !user) {
    return { canUse: false, usedToday: 0, limit: 0 };
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayStr = today.toISOString().split('T')[0];

  const { data: usageToday } = await supabase
    .from('usage_tracking')
    .select('*')
    .eq('user_id', userId)
    .eq('date', todayStr)
    .single();

  let finalUsageToday = usageToday;
  if (!usageToday) {
    const { data: newUsage, error: createError } = await supabase
      .from('usage_tracking')
      .insert({
        user_id: user.id,
        date: todayStr,
        api_calls_used: 0,
        tier: user.subscription_tier,
      })
      .select('*')
      .single();

    if (createError) {
      logger.error('Error creating usage tracking:', createError);
      return { canUse: false, usedToday: 0, limit: 0 };
    }
    finalUsageToday = newUsage;
  }

  // Everyone gets Pro limits (200/day)
  const env = await getEnv();
  const limit = env.PRO_TIER_DAILY_LIMIT;

  return {
    canUse: (finalUsageToday?.api_calls_used || 0) < limit,
    usedToday: finalUsageToday?.api_calls_used || 0,
    limit,
  };
}

export async function incrementUsage(userId: string): Promise<void> {
  const supabase = await getSupabase();

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const todayStr = today.toISOString().split('T')[0];

  // Try to update existing usage record
  const { data: existingUsage } = await supabase
    .from('usage_tracking')
    .select('*')
    .eq('user_id', userId)
    .eq('date', todayStr)
    .single();

  if (existingUsage) {
    // Update existing record
    await supabase
      .from('usage_tracking')
      .update({
        api_calls_used: existingUsage.api_calls_used + 1,
      })
      .eq('user_id', userId)
      .eq('date', todayStr);
  } else {
    // Create new record
    const { data: user } = await supabase
      .from('users')
      .select('subscription_tier')
      .eq('id', userId)
      .single();

    await supabase.from('usage_tracking').insert({
      user_id: userId,
      date: todayStr,
      api_calls_used: 1,
      tier: user?.subscription_tier || 'FREE',
    });
  }
}

export async function getUserSubscriptionTier(_userId: string): Promise<Tier> {
  // Everyone gets PRO access
  return 'PRO';
}

export async function isSummerPromotionActive(): Promise<boolean> {
  if (typeof window !== 'undefined') {
    // Client-side: return false for now, should be handled by client auth
    return false;
  }

  const supabase = await getSupabase();

  const { data: _promotionFlag } = await supabase.rpc('is_feature_active', {
    flag_name: 'summer_promotion_2024',
  });

  return Boolean(_promotionFlag);
}

export async function requireServerAuth() {
  if (typeof window !== 'undefined') {
    throw new Error('requireServerAuth can only be used on server side');
  }

  // Dynamic import to avoid bundling server code in client
  const { requireServerAuth: serverRequireAuth } = await import(
    './auth-server'
  );
  return serverRequireAuth();
}
