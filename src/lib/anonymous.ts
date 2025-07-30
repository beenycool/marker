// Anonymous user management for GDPR-compliant operations
export const isAnonymous = true;

export const getUsageLimits = () => ({
  freeMarks: 200, // Daily limit for everyone
  resetTime: "midnight UTC"
});

export type AnonymousRateLimit = {
  canUse: boolean;
  usedToday: number;
  limit: number;
  resetAt: Date;
};

// Get today's date string for consistent rate limiting
export function getTodayKey(): string {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return today.toISOString().split('T')[0];
}

// Get tomorrow midnight for reset time
export function getResetTime(): Date {
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  tomorrow.setHours(0, 0, 0, 0);
  return tomorrow;
}