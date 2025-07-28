import { logger } from '@/lib/logger';
import { stripe } from '@/lib/stripe';
import { getDb } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';
import { clientEnv } from '@/lib/env';

export const POST = async () => {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return Response.json(
        {
          error: 'Authentication required',
        },
        { status: 401 }
      );
    }

    // Get user's Stripe customer ID from the database
    const dbClient = await getDb();
    const { data: userData, error: userError } = await dbClient
      .from('users')
      .select('stripe_customer_id')
      .eq('id', user.id)
      .single();

    if (userError || !userData?.stripe_customer_id) {
      return Response.json(
        {
          error:
            'No Stripe customer found. Please create a subscription first.',
        },
        { status: 400 }
      );
    }

    // Check if Stripe is available (GDPR compliance)
    if (!stripe) {
      return Response.json(
        { error: 'Payment processing is currently unavailable' },
        { status: 503 }
      );
    }

    const portalSession = await (stripe as any).billingPortal.sessions.create({
      customer: userData.stripe_customer_id,
      return_url: `${clientEnv.APP_URL}/settings`,
    });

    return Response.json({ url: portalSession.url });
  } catch (error) {
    logger.error('Portal session error:', error);
    return Response.json(
      { error: 'Failed to create portal session' },
      { status: 500 }
    );
  }
};
