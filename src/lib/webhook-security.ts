import crypto from 'crypto';

/**
 * Webhook security utilities for request validation and signing
 */

export interface WebhookSignatureOptions {
  secret: string;
  timestamp?: number;
  tolerance?: number; // seconds
}

/**
 * Generate a webhook signature for request validation
 */
export function generateWebhookSignature(
  payload: string,
  secret: string,
  timestamp?: number
): string {
  const ts = timestamp || Math.floor(Date.now() / 1000);
  const signedPayload = `${ts}.${payload}`;
  const signature = crypto
    .createHmac('sha256', secret)
    .update(signedPayload, 'utf8')
    .digest('hex');

  return `t=${ts},v1=${signature}`;
}

/**
 * Verify webhook signature with timestamp validation
 */
export function verifyWebhookSignature(
  payload: string,
  signature: string,
  options: WebhookSignatureOptions
): boolean {
  const { secret, tolerance = 300 } = options; // 5 minutes default tolerance

  try {
    // Parse signature header
    const elements = signature.split(',');
    let timestamp: number | undefined;
    let signatures: string[] = [];

    for (const element of elements) {
      const [key, value] = element.split('=');
      if (key === 't') {
        timestamp = parseInt(value, 10);
      } else if (key === 'v1') {
        signatures.push(value);
      }
    }

    if (!timestamp || signatures.length === 0) {
      return false;
    }

    // Check timestamp tolerance
    const now = Math.floor(Date.now() / 1000);
    if (Math.abs(now - timestamp) > tolerance) {
      return false;
    }

    // Verify signatures
    const expectedSignature = crypto
      .createHmac('sha256', secret)
      .update(`${timestamp}.${payload}`, 'utf8')
      .digest('hex');

    return signatures.some(sig =>
      crypto.timingSafeEqual(
        Buffer.from(expectedSignature, 'hex'),
        Buffer.from(sig, 'hex')
      )
    );
  } catch (error) {
    return false;
  }
}

/**
 * Create a secure webhook endpoint wrapper
 */
export function withWebhookSecurity(
  handler: (payload: any) => Promise<Response | void>,
  options: Omit<WebhookSignatureOptions, 'timestamp'>
) {
  return async (request: Request): Promise<Response> => {
    try {
      const body = await request.text();
      const signature =
        request.headers.get('X-Webhook-Signature') ||
        request.headers.get('webhook-signature') ||
        '';

      if (!verifyWebhookSignature(body, signature, options)) {
        return new Response(
          JSON.stringify({ error: 'Invalid webhook signature' }),
          {
            status: 401,
            headers: { 'Content-Type': 'application/json' },
          }
        );
      }

      const payload = JSON.parse(body);
      const result = await handler(payload);

      return (
        result ||
        new Response(JSON.stringify({ received: true }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        })
      );
    } catch (error) {
      return new Response(
        JSON.stringify({ error: 'Webhook processing failed' }),
        {
          status: 500,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }
  };
}

/**
 * Rate limiting for webhook endpoints
 */
const webhookRateLimits = new Map<
  string,
  { count: number; resetTime: number }
>();

export function rateLimitWebhook(
  identifier: string,
  limit: number = 100,
  windowMs: number = 60000 // 1 minute
): boolean {
  const now = Date.now();
  const current = webhookRateLimits.get(identifier);

  if (!current || now > current.resetTime) {
    webhookRateLimits.set(identifier, {
      count: 1,
      resetTime: now + windowMs,
    });
    return true;
  }

  if (current.count >= limit) {
    return false;
  }

  current.count++;
  return true;
}

/**
 * Validate webhook payload structure
 */
export function validateWebhookPayload<T>(
  payload: unknown,
  validator: (data: unknown) => data is T
): T | null {
  try {
    if (validator(payload)) {
      return payload;
    }
    return null;
  } catch {
    return null;
  }
}
