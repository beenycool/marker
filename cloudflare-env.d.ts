interface CloudflareEnv {
  // Environment variables
  NODE_ENV: string;

  // Supabase configuration
  NEXT_PUBLIC_SUPABASE_URL: string;
  NEXT_PUBLIC_SUPABASE_ANON_KEY: string;
  SUPABASE_SERVICE_ROLE_KEY: string;

  // AI Services
  OPENAI_API_KEY: string;
  GOOGLE_AI_API_KEY: string;
  OPENROUTER_API_KEY: string;

  // OCR Service
  OCR_TUNNEL_CLIENT_ID: string;
  OCR_TUNNEL_CLIENT_SECRET: string;
  OCR_TUNNEL_TOKEN: string;

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
