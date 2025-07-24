// Legacy auth file - use /auth/index.ts instead
// This file is maintained for backward compatibility

import { getCurrentUser as getUser } from './auth/server';

export async function getCurrentUser() {
  return getUser();
}

  // Get or create user in database
  const { data: existingUser, error: _selectError } = await supabase
    .from('users')
    .select('*')
    .eq('id', userId)
    .single();

  let dbUser;
  if (existingUser) {
    // Update existing user
    const { data: updatedUser, error: updateError } = await supabase
      .from('users')
      .update({
        email,
        updated_at: new Date().toISOString(),
      })
      .eq('id', userId)
      .select('*')
      .single();

    if (updateError) {
      logger.error('Error updating user:', updateError);
      return null;
    }
    dbUser = updatedUser;
  } else {
    // Create new user
    const { data: newUser, error: insertError } = await supabase
      .from('users')
      .insert({
        id: userId,
        email,
        subscription_tier: 'FREE',
        role: 'STUDENT',
        onboarding_completed: false,
      })
      .select('*')
      .single();

    if (insertError) {
      logger.error('Error creating user:', insertError);
      return null;
    }
    dbUser = newUser;
  }

  // Cache the result
  userCache.set(cacheKey, {
    user: dbUser,
    timestamp: Date.now(),
  });

  // Clean up old cache entries periodically
  if (userCache.size > 50) {
    const now = Date.now();
    for (const [key, value] of userCache.entries()) {
      if (now - value.timestamp > CACHE_TTL) {
        userCache.delete(key);
      }
    }
  }

  return dbUser;
}

export async function checkUsageLimit(
  userId: string
): Promise<{ canUse: boolean; usedToday: number; limit: number }> {
  const supabase = await getSupabase();

  // Check if summer promotion is active first
  const { data: promotionFlag } = await supabase.rpc('is_feature_active', {
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
  const env = await import('./env').then(m => m.getEnv());
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

export async function getUserSubscriptionTier(userId: string): Promise<Tier> {
  // Everyone gets PRO access
  return 'PRO';
}

export async function isSummerPromotionActive(): Promise<boolean> {
  const supabase = await getSupabase();

  const { data: promotionFlag } = await supabase.rpc('is_feature_active', {
    flag_name: 'summer_promotion_2024',
  });

  return Boolean(promotionFlag);
}
