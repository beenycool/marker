import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from './server';
import type { User, Tier } from '@/types';

interface AuthOptions {
  requireAuth?: boolean;
  requiredTier?: Tier;
  redirectTo?: string;
}

interface AuthenticatedRequest extends NextRequest {
  user?: User;
}

/**
 * Higher-order function for adding authentication to API routes
 */
export function withAuth(
  handler: (req: AuthenticatedRequest) => Promise<NextResponse>,
  options: AuthOptions = {}
) {
  return async (req: NextRequest): Promise<NextResponse> => {
    const { requireAuth = true, requiredTier } = options;

    // If auth is not required, just run the handler
    if (!requireAuth) {
      return handler(req as AuthenticatedRequest);
    }

    const user = await getCurrentUser();

    // Check if user is authenticated
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check tier requirements if specified
    if (requiredTier && !hasMinimumTier(user, requiredTier)) {
      return NextResponse.json(
        { error: `${requiredTier} subscription required` },
        { status: 403 }
      );
    }

    // Add user to request
    const authenticatedReq = req as AuthenticatedRequest;
    authenticatedReq.user = user;

    return handler(authenticatedReq);
  };
}

/**
 * Check if a user has a specific tier or higher
 */
function hasMinimumTier(user: User | null, requiredTier: Tier): boolean {
  if (!user) return false;

  const tierHierarchy: Record<Tier, number> = {
    FREE: 0,
    PRO: 1,
  };

  return tierHierarchy[user.subscriptionTier] >= tierHierarchy[requiredTier];
}

/**
 * Middleware specifically for admin routes
 */
export function withAdminAuth(
  handler: (req: AuthenticatedRequest) => Promise<NextResponse>
) {
  return withAuth(handler, {
    requireAuth: true,
    requiredTier: 'PRO', // Assuming PRO users can access admin features
  });
}

/**
 * Check if user is authenticated (for conditional rendering)
 */
export async function isAuthenticated(): Promise<boolean> {
  const user = await getCurrentUser();
  return user !== null;
}

/**
 * Require authentication for a page (use in page components)
 */
export async function requireAuth(
  redirectTo: string = '/auth/sign-in'
): Promise<User> {
  const user = await getCurrentUser();

  if (!user) {
    // In a real Next.js app, you'd use redirect() from 'next/navigation'
    throw new Error(`Authentication required. Redirect to: ${redirectTo}`);
  }

  return user;
}
