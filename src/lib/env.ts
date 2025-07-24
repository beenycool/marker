import { getEnvVar } from './cloudflare-env';

// Centralized environment variable access
export const env = {
  // Server-side environment variables
  get NODE_ENV() {
    return process.env.NODE_ENV || 'development';
  },

  get SUPABASE_URL() {
    return getEnvVar('NEXT_PUBLIC_SUPABASE_URL');
  },

  get SUPABASE_ANON_KEY() {
    return getEnvVar('NEXT_PUBLIC_SUPABASE_ANON_KEY');
  },

  get SUPABASE_SERVICE_ROLE_KEY() {
    return getEnvVar('SUPABASE_SERVICE_ROLE_KEY');
  },

  get STRIPE_SECRET_KEY() {
    return getEnvVar('STRIPE_SECRET_KEY');
  },

  get STRIPE_WEBHOOK_SECRET() {
    return getEnvVar('STRIPE_WEBHOOK_SECRET');
  },

  get STRIPE_PRO_MONTHLY_PRICE_ID() {
    return getEnvVar('STRIPE_PRO_MONTHLY_PRICE_ID') || 'price_1RksqiDb7SYU5gvXjID3h3H4';
  },

  get STRIPE_PRO_YEARLY_PRICE_ID() {
    return getEnvVar('STRIPE_PRO_YEARLY_PRICE_ID') || 'price_1RksqiDb7SYU5gvXjID3h3H4';
  },

  get POSTHOG_KEY() {
    return getEnvVar('NEXT_PUBLIC_POSTHOG_KEY');
  },

  get POSTHOG_HOST() {
    return getEnvVar('NEXT_PUBLIC_POSTHOG_HOST') || 'https://app.posthog.com';
  },

  get LOG_LEVEL() {
    return getEnvVar('NEXT_PUBLIC_LOG_LEVEL') || 'info';
  },

  get APP_URL() {
    return getEnvVar('NEXT_PUBLIC_APP_URL') || 'http://localhost:3000';
  },

  get FREE_TIER_DAILY_LIMIT() {
    return 20;
  },

  get PRO_TIER_DAILY_LIMIT() {
    return 200;
  },

  get EASYOCR_API_ENDPOINT() {
    return getEnvVar('EASYOCR_API_ENDPOINT') || 'http://localhost:8080';
  },

  get EASYOCR_API_KEY() {
    return getEnvVar('EASYOCR_API_KEY');
  },

  // Client-side environment variables (these will use process.env directly)
  get isDevelopment() {
    return this.NODE_ENV === 'development';
  },

  get isProduction() {
    return this.NODE_ENV === 'production';
  },
};

// Helper function for client-side environment access
export const clientEnv = {
  get SUPABASE_URL() {
    return process.env.NEXT_PUBLIC_SUPABASE_URL!;
  },
  get SUPABASE_ANON_KEY() {
    return process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
  },
  get POSTHOG_KEY() {
    return process.env.NEXT_PUBLIC_POSTHOG_KEY || '';
  },
  get POSTHOG_HOST() {
    return process.env.NEXT_PUBLIC_POSTHOG_HOST || 'https://app.posthog.com';
  },
  get APP_URL() {
    return process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
  },
  get LOG_LEVEL() {
    return process.env.NEXT_PUBLIC_LOG_LEVEL || 'info';
  },
};

// Async version for server-side usage
export const getEnv = async () => {
  const [
    freeTierLimit,
    proTierLimit,
  ] = await Promise.all([
    getEnvVar('FREE_TIER_DAILY_LIMIT').then(v => parseInt(v || '20')),
    getEnvVar('PRO_TIER_DAILY_LIMIT').then(v => parseInt(v || '200')),
  ]);

  return {
    ...env,
    FREE_TIER_DAILY_LIMIT: freeTierLimit,
    PRO_TIER_DAILY_LIMIT: proTierLimit,
  };
};