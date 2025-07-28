// No payment processing
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
