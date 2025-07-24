import { logger } from '@/lib/logger';
import { stripe } from '@/lib/stripe';
import { getDb } from '@/lib/db';
import { requireServerAuth } from '@/lib/auth-server';
import { clientEnv } from '@/lib/env';

export const POST = async () => {
  try {
    const user = await requireServerAuth();

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

    const portalSession = await stripe.billingPortal.sessions.create({
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
