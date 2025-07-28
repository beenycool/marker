// No rate limiting, no personal data collection
export const rateLimiters = {
  api: null,
  marking: null,
  auth: null,
  upload: null,
  markingPro: null,
  waitlist: null,
};

export async function rateLimit(): Promise<null> {
  // No rate limiting - allows all requests
  return null;
}

export function withRateLimit(
  _limiter: any,
  handler: (req: any) => Promise<any>
) {
  return handler; // Just return the handler without rate limiting
}

export async function rateLimitByUser(): Promise<{
  success: boolean;
  limit: number;
  remaining: number;
  reset: Date;
}> {
  // Always allow - no user tracking
  return {
    success: true,
    limit: 0,
    remaining: 0,
    reset: new Date(),
  };
}

export async function checkRateLimit(): Promise<{
  success: boolean;
  limit: number;
  remaining: number;
  reset: Date;
}> {
  // Always allow - no tracking
  return {
    success: true,
    limit: 0,
    remaining: 0,
    reset: new Date(),
  };
}

export async function cleanupRateLimits(): Promise<void> {
  // No cleanup needed - no rate limiting
}
