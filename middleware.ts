// GDPR REMOVAL: All personal data collection commented out
/*
import { rateLimiters, rateLimit } from '@/lib/rate-limit';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { getEnvVar } from '@/lib/cloudflare-env';
import { getNonce } from 'get-nonce';

// Enhanced rate limiting with Redis-backed sliding window - Cloudflare Workers compatible

// Generate a nonce for Content Security Policy
function generateNonce(): string {
  const nonce = getNonce();
  return nonce || crypto.randomUUID();
}
*/

export default async function middleware() {
  // GDPR REMOVAL: All IP tracking, rate limiting, and auth checking disabled
  /*
  const url = new URL(req.url);
  const { pathname } = url;

  // Generate nonce for CSP
  const nonce = generateNonce();

  // Apply rate limiting to API routes
  if (pathname.startsWith('/api/')) {
    let limiter = rateLimiters.api;

    // Get IP address from Cloudflare headers or fallback - COLLECTS PERSONAL DATA
    let identifier =
      req.headers.get('cf-connecting-ip') ||
      req.headers.get('x-forwarded-for') ||
      req.headers.get('x-real-ip') ||
      '127.0.0.1';

    // Skip rate limiting for webhooks and auth routes
    if (
      pathname.startsWith('/api/stripe/webhook') ||
      pathname.startsWith('/api/auth/')
    ) {
      // Skip rate limiting for webhooks and auth - they have their own validation
      return;
    } else if (pathname.startsWith('/api/mark')) {
      limiter = rateLimiters.marking;
    } else if (pathname.startsWith('/api/ocr')) {
      limiter = rateLimiters.upload;
    }

    // Apply rate limiting - convert Request to NextRequest-like object for compatibility
    const nextReqLike = {
      ...req,
      nextUrl: url,
      ip: identifier,
      headers: {
        get: (name: string) => req.headers.get(name),
      },
    } as any;

    try {
      const rateLimitResponse = await rateLimit(
        nextReqLike,
        limiter,
        identifier
      );
      if (rateLimitResponse) {
        // Convert NextResponse to standard Response for Workers
        const response = new Response(rateLimitResponse.body, {
          status: rateLimitResponse.status,
          headers: rateLimitResponse.headers,
        });
        return addCSPHeader(response, nonce);
      }
    } catch (error) {
      console.error('Rate limiting error in middleware:', error);
      // Continue processing if rate limiting fails
    }

  }

  // Protected routes that require authentication - COLLECTS USER DATA
  const protectedRoutes = ['/dashboard', '/settings', '/mark', '/past-papers'];
  const isProtectedRoute = protectedRoutes.some(route =>
    pathname.startsWith(route)
  );

  if (isProtectedRoute) {
    try {
      // Get Supabase client for edge runtime
      const supabase = createRouteHandlerClient({ req });
      
      // Check auth session
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        const response = Response.redirect(new URL('/auth/sign-in', req.url));
        return addCSPHeader(response, nonce);
      }
    } catch (error) {
      console.error('Auth middleware error:', error);
      const response = Response.redirect(new URL('/auth/sign-in', req.url));
      return addCSPHeader(response, nonce);
    }
  }

  // Redirect authenticated users away from auth pages
  if (pathname.startsWith('/auth/') && pathname !== '/auth/sign-out') {
    try {
      const supabase = createRouteHandlerClient({ req });
      const { data: { session } } = await supabase.auth.getSession();
      
      if (session) {
        const response = Response.redirect(new URL('/dashboard', req.url));
        return addCSPHeader(response, nonce);
      }
    } catch (error) {
      // Continue to auth page if there's an error checking auth
    }
  }

  return addCSPHeader(new Response(null, { status: 200 }), nonce);
  */

  // Simple passthrough - no personal data collection
  return new Response(null, { status: 200 });
}

export const config = {
  matcher: ['/((?!.*\\..*|_next).*)', '/', '/(api|trpc)(.*)'],
};
