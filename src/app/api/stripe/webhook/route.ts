import { logger } from '@/lib/logger';
import { NextRequest } from 'next/server';
import { headers } from 'next/headers';
import { stripe } from '@/lib/stripe';
import { getDb } from '@/lib/db';
import { rateLimitWebhook } from '@/lib/webhook-security';
import Stripe from 'stripe';

export async function POST(req: NextRequest) {
  // Rate limit webhook requests
  const clientIP =
    (req as any).ip || req.headers.get('x-forwarded-for') || '127.0.0.1';
  if (!rateLimitWebhook(clientIP, 50, 60000)) {
    // 50 requests per minute
    return Response.json({ error: 'Too many requests' }, { status: 429 });
  }

  const body = await req.text();
  const signature = (await headers()).get('stripe-signature');

  if (!signature) {
    return Response.json({ error: 'No signature' }, { status: 400 });
  }

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch (error) {
    if (process.env.NODE_ENV === 'development') {
      logger.error('Webhook signature verification failed:', error);
    }
    return Response.json({ error: 'Invalid signature' }, { status: 400 });
  }

  if (process.env.NODE_ENV === 'development') {
    logger.info(`Received webhook event: ${event.type}`);
  }

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        const subscription = await stripe.subscriptions.retrieve(
          session.subscription as string
        );

        const dbClient = await getDb();
        await dbClient
          .from('users')
          .update({
            stripe_customer_id: subscription.customer as string,
            stripe_subscription_id: subscription.id,
            subscription_status: 'active',
            updated_at: new Date().toISOString(),
          })
          .eq('id', session.metadata?.userId || '');

        if (process.env.NODE_ENV === 'development') {
          logger.info('Subscription created/updated successfully');
        }
        break;
      }

      case 'invoice.payment_succeeded': {
        if (process.env.NODE_ENV === 'development') {
          logger.info('Subscription payment succeeded');
        }
        break;
      }

      case 'invoice.payment_failed': {
        if (process.env.NODE_ENV === 'development') {
          logger.info('Subscription payment failed');
        }
        break;
      }

      case 'customer.subscription.updated': {
        const subscription = event.data.object as Stripe.Subscription;

        const dbClient = await getDb();
        await dbClient
          .from('users')
          .update({
            subscription_status:
              subscription.status === 'active' ? 'active' : 'canceled',
            updated_at: new Date().toISOString(),
          })
          .eq('stripe_subscription_id', subscription.id);

        if (process.env.NODE_ENV === 'development') {
          logger.info('Subscription updated');
        }
        break;
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription;

        const dbClient = await getDb();
        await dbClient
          .from('users')
          .update({
            subscription_status: 'canceled',
            updated_at: new Date().toISOString(),
          })
          .eq('stripe_subscription_id', subscription.id);

        if (process.env.NODE_ENV === 'development') {
          logger.info('Subscription cancelled');
        }
        break;
      }

      default:
        if (process.env.NODE_ENV === 'development') {
          logger.info(`Unhandled event type: ${event.type}`);
        }
    }

    return Response.json({ received: true });
  } catch (error) {
    if (process.env.NODE_ENV === 'development') {
      logger.error('Webhook handler error:', error);
    }
    return Response.json({ error: 'Webhook handler failed' }, { status: 500 });
  }
}
