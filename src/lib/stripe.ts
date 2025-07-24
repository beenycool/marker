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
      'Community support',
    ],
    limits: {
      dailyMarks: 20,
      providers: ['gemini'],
    },
  },
  PRO: {
    name: 'Pro',
    price: 2.99,
    interval: 'month',
    features: [
      '200 AI marks per day',
      'Advanced feedback with AO breakdown',
      'Progress analytics',
      'All AI models (Gemini, Kimi, DeepSeek)',
      'OCR handwriting recognition',
      'Export to Google Classroom',
      'Priority support',
    ],
    limits: {
      dailyMarks: 200,
      providers: ['gemini', 'kimi', 'deepseek'],
    },
  },
} as const;

export type PlanType = keyof typeof PLANS;
