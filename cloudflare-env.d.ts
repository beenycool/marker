interface CloudflareEnv {
  // Environment variables
  NODE_ENV: string;

  // Stripe configuration
  STRIPE_SECRET_KEY: string;
  STRIPE_WEBHOOK_SECRET: string;
  NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: string;

  // Supabase configuration
  NEXT_PUBLIC_SUPABASE_URL: string;
  NEXT_PUBLIC_SUPABASE_ANON_KEY: string;
  SUPABASE_SERVICE_ROLE_KEY: string;

  // AI Services
  OPENAI_API_KEY: string;
  GOOGLE_AI_API_KEY: string;

  // Redis/Upstash
  UPSTASH_REDIS_REST_URL: string;
  UPSTASH_REDIS_REST_TOKEN: string;

  // Stack Auth
  STACK_SECRET_SERVER_KEY: string;

  // Cloudflare bindings
  ASSETS: any; // Fetcher
  CACHE: any; // KVNamespace
  RATE_LIMIT: any; // KVNamespace
  R2_BUCKET: any; // R2Bucket
  CACHE_BUCKET: any; // R2Bucket
}

declare global {
  namespace CloudflareEnv {
    export interface Env extends CloudflareEnv {}
  }
}

export {};
