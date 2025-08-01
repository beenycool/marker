// Cloudflare Workers optimizations for API routes
// Type definitions for Cloudflare Workers bindings
export interface Env {
  CACHE: any; // KVNamespace
  RATE_LIMIT: any; // KVNamespace
  STORAGE: any; // R2Bucket
  SUPABASE_URL: string;
  SUPABASE_ANON_KEY: string;
  SUPABASE_SERVICE_ROLE_KEY: string;
  OPENAI_API_KEY: string;
  GOOGLE_AI_API_KEY: string;
  OPENROUTER_API_KEY: string;
  OCR_TUNNEL_CLIENT_ID: string;
  OCR_TUNNEL_CLIENT_SECRET: string;
  OCR_TUNNEL_TOKEN: string;
}

// Enhanced rate limiting using Workers KV
export class WorkersRateLimit {
  constructor(
    private kv: any,
    private defaultLimit = 100
  ) {}

  async checkLimit(
    key: string,
    windowMs = 86400000,
    limit = this.defaultLimit
  ): Promise<{
    allowed: boolean;
    remaining: number;
    resetTime: number;
  }> {
    const now = Date.now();
    const windowStart = now - windowMs;

    const data = (await this.kv.get(`rate_limit:${key}`, 'json')) as {
      count: number;
      resetTime: number;
    } | null;

    if (!data || data.resetTime < windowStart) {
      // Reset window
      const resetTime = now + windowMs;
      await this.kv.put(
        `rate_limit:${key}`,
        JSON.stringify({
          count: 1,
          resetTime,
        }),
        { expirationTtl: Math.ceil(windowMs / 1000) }
      );

      return {
        allowed: true,
        remaining: limit - 1,
        resetTime,
      };
    }

    if (data.count >= limit) {
      return {
        allowed: false,
        remaining: 0,
        resetTime: data.resetTime,
      };
    }

    // Increment count
    const newCount = data.count + 1;
    await this.kv.put(
      `rate_limit:${key}`,
      JSON.stringify({
        count: newCount,
        resetTime: data.resetTime,
      }),
      { expirationTtl: Math.ceil((data.resetTime - now) / 1000) }
    );

    return {
      allowed: true,
      remaining: limit - newCount,
      resetTime: data.resetTime,
    };
  }
}

// Cache helper for Workers KV
export class WorkersCache {
  constructor(private kv: any) {}

  async get<T>(key: string): Promise<T | null> {
    const value = await this.kv.get(key, 'json');
    return value as T;
  }

  async set(key: string, value: any, ttl?: number): Promise<void> {
    const options = ttl ? { expirationTtl: ttl } : undefined;
    await this.kv.put(key, JSON.stringify(value), options);
  }

  async delete(key: string): Promise<void> {
    await this.kv.delete(key);
  }
}

// File upload handler for Workers with R2
export class WorkersFileHandler {
  constructor(private bucket: any) {}

  async uploadFile(file: File, key: string): Promise<string> {
    const arrayBuffer = await file.arrayBuffer();

    await this.bucket.put(key, arrayBuffer, {
      httpMetadata: {
        contentType: file.type,
      },
    });

    return key;
  }

  async getFile(key: string): Promise<ReadableStream | null> {
    const object = await this.bucket.get(key);
    return object?.body || null;
  }

  async deleteFile(key: string): Promise<void> {
    await this.bucket.delete(key);
  }
}

// Edge-optimized Supabase client
export function createEdgeSupabaseClient(url: string, key: string) {
  // Use fetch directly for better Workers compatibility
  return {
    from: (table: string) => ({
      select: (columns?: string) => ({
        eq: (column: string, value: any) => ({
          single: async () => {
            const response = await fetch(
              `${url}/rest/v1/${table}?select=${columns || '*'}&${column}=eq.${value}`,
              {
                headers: {
                  Authorization: `Bearer ${key}`,
                  apikey: key,
                  Accept: 'application/vnd.pgjson',
                  'Accept-Profile': 'public',
                },
              }
            );
            const data = await response.json();
            return { data: data[0] || null, error: null };
          },
        }),
      }),
      insert: (values: any) => ({
        select: (columns?: string) => ({
          single: async () => {
            const response = await fetch(
              `${url}/rest/v1/${table}?select=${columns || '*'}`,
              {
                method: 'POST',
                headers: {
                  Authorization: `Bearer ${key}`,
                  apikey: key,
                  'Content-Type': 'application/json',
                  Prefer: 'return=representation',
                },
                body: JSON.stringify(values),
              }
            );
            const data = await response.json();
            return { data: data[0] || null, error: null };
          },
        }),
      }),
    }),
  };
}

// Request context helper for Workers
export function getWorkerContext(request: any): {
  cf: any;
  env: Env;
} {
  // Access Cloudflare Workers context
  // @ts-ignore - Workers runtime provides these
  return {
    cf: request.cf || {},
    env: (globalThis as any).ENV || {},
  };
}

// Optimized error handling for Workers
export function handleWorkerError(): Response {
  // In production, use proper logging service
  if (process.env.NODE_ENV === 'development') {
    // Worker error logged in development mode
  }

  return new Response(
    JSON.stringify({
      success: false,
      error: 'Internal server error',
      timestamp: new Date().toISOString(),
    }),
    {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
      },
    }
  );
}
