// GDPR REMOVAL: All payment processing commented out - collects personal data
/*
import Stripe from 'stripe';
import { getEnvVar } from './cloudflare-env';

let stripeInstance: Stripe | null = null;

export async function getStripe() {
  if (!stripeInstance) {
    const secretKey = await getEnvVar('STRIPE_SECRET_KEY');
    if (!secretKey) {
      throw new Error('STRIPE_SECRET_KEY is required');
    }

    stripeInstance = new Stripe(secretKey, {
      apiVersion: '2025-06-30.basil',
      typescript: true,
    });
  }

  return stripeInstance;
}

// Legacy export for compatibility - will be removed in favor of getStripe()
export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-06-30.basil',
  typescript: true,
});

export const getStripeJs = async () => {
  const { loadStripe } = await import('@stripe/stripe-js');
  const publishableKey = await getEnvVar('NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY');
  return loadStripe(publishableKey!);
};

export const PRICE_ID = {
  PRO_MONTHLY:
    getEnvVar('STRIPE_PRO_MONTHLY_PRICE_ID') || 'price_1RksqiDb7SYU5gvXjID3h3H4',
  PRO_YEARLY:
    getEnvVar('STRIPE_PRO_YEARLY_PRICE_ID') || 'price_1RksqiDb7SYU5gvXjID3h3H4',
};

export const PLANS = {
  FREE: {
    name: 'Free',
    price: 0,
    interval: 'forever',
    features: [
      '20 AI marks per day',
      'Basic feedback',
      'Progress tracking',
      'Gemini AI model',
    ],
  },
  PRO: {
    name: 'Pro',
    price: 9.99,
    interval: 'month',
    features: [
      'Unlimited AI marks',
      'Advanced feedback',
      'OCR image uploads',
      'Priority support',
      'Multiple AI models',
      'Export feedback as PDF',
    ],
  },
};
*/

// GDPR-SAFE: No payment processing
export const getStripe = () => null;
export const stripe = null;
export const getStripeJs = () => null;

export const PRICE_ID = {
  PRO_MONTHLY: 'price_placeholder_pro_monthly',
  PRO_YEARLY: 'price_placeholder_pro_yearly',
};

export const PLANS = {
  FREE: {
    name: 'Free',
    price: 0,
    interval: 'forever',
    features: [
      'Anonymous AI marking',
      'Basic feedback',
      'Simple rate limiting',
    ],
  },
  PRO: {
    name: 'Pro',
    price: 2.99,
    interval: 'month',
    features: [
      '200 AI marks per day',
      'All AI models (Gemini, Kimi, DeepSeek)',
      'All GCSE subjects + exam boards',
      'OCR handwriting recognition',
      'Advanced analytics & insights',
      'Export to Google Classroom',
      'Priority support',
    ],
  },
};
