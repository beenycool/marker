// IMPORTANT: IP addresses are considered PII in the EU. Our implementation uses pseudonymization
// (hashing IPs with daily keys) to minimize risk, but be aware this is a GDPR grey area.
// We must balance abuse prevention with privacy concerns. Logs are automatically deleted daily.
import { getSupabase } from './supabase';
import { getTodayKey, getResetTime } from './anonymous';
import { createHash } from 'crypto';

function hashIp(ip: string): string {
  // Create a daily salt for the hash
  const salt = process.env.RATE_LIMIT_SALT || getTodayKey();
  
  // Hash IP with salt to anonymize while maintaining daily consistency
  return createHash('sha256')
    .update(ip + salt)
    .digest('hex');
}

export async function rateLimit(request: Request): Promise<Response | null> {
  const ip = request.headers.get('x-forwarded-for')?.split(',')[0] ||
             request.headers.get('x-real-ip') ||
             'unknown';
  
  // Don't rate limit localhost/development
  if (ip === '127.0.0.1' || ip === 'localhost' || process.env.NODE_ENV === 'development') {
    return null;
  }

  // Use hashed IP instead of raw IP
  const hashedIp = hashIp(ip);
  const key = `rate_limit:${hashedIp}:${getTodayKey()}`;
  const supabase = await getSupabase();
  
  try {
    // Use Supabase edge function to increment counter atomically
    const { data, error } = await supabase
      .rpc('increment_anonymous_counter', {
        key,
        increment: 1,
        max_value: 200
      });

    if (error) {
      console.error('Rate limit check failed:', error);
      return null; // Allow on error to prevent blocking users
    }

    if (data?.count > 200) {
      return new Response(JSON.stringify({
        error: "Daily limit reached",
        message: "You've reached the daily limit of 200 marks. Resets at midnight UTC.",
        reset: getResetTime().toISOString()
      }), {
        status: 429,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    return null; // Allow request
  } catch (error) {
    console.error('Rate limit error:', error);
    return null; // Allow on error
  }
}

export async function checkRateLimit(request: Request): Promise<{
  success: boolean;
  limit: number;
  remaining: number;
  reset: Date;
}> {
  const ip = request.headers.get('x-forwarded-for')?.split(',')[0] ||
             request.headers.get('x-real-ip') ||
             'unknown';
  
  if (ip === '127.0.0.1' || ip === 'localhost' || process.env.NODE_ENV === 'development') {
    return {
      success: true,
      limit: 200,
      remaining: 200,
      reset: getResetTime(),
    };
  }

  // Use hashed IP instead of raw IP
  const hashedIp = hashIp(ip);
  const key = `rate_limit:${hashedIp}:${getTodayKey()}`;
  const supabase = await getSupabase();
  
  try {
    const { data } = await supabase
      .rpc('get_anonymous_counter', { key });

    const used = data?.count || 0;
    
    return {
      success: used < 200,
      limit: 200,
      remaining: Math.max(0, 200 - used),
      reset: getResetTime(),
    };
  } catch (error) {
    return {
      success: true,
      limit: 200,
      remaining: 200,
      reset: getResetTime(),
    };
  }
}
