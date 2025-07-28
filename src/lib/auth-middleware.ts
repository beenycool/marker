// Legacy auth middleware file - use /auth/index.ts instead
// This file is maintained for backward compatibility

import { withAuth as withAuthentication } from './auth/middleware';
import { NextRequest, NextResponse } from 'next/server';
import type { User } from '@/types';

export const withAuth = withAuthentication;

interface AuthenticatedRequest extends NextRequest {
  user?: User;
}

export function requireAuth(
  handler: (req: AuthenticatedRequest) => Promise<NextResponse>
) {
  return withAuth(handler, { requireAuth: true });
}

export function requirePro(
  handler: (req: AuthenticatedRequest) => Promise<NextResponse>
) {
  return async (req: NextRequest): Promise<NextResponse> => {
    // Dynamic import to avoid bundling server code in client
    const { getCurrentUser } = await import('./auth/server');
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (user.subscriptionTier !== 'PRO') {
      return NextResponse.json(
        { error: 'Pro subscription required' },
        { status: 403 }
      );
    }

    // Add user to request
    const authenticatedReq = req as AuthenticatedRequest;
    authenticatedReq.user = user;

    return handler(authenticatedReq);
  };
}
