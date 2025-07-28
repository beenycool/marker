// GDPR REMOVAL: All error tracking with user context commented out
/*
// Server-side only Sentry integration
let Sentry: any = null;

// Dynamic import for server-side only
if (typeof window === 'undefined') {
  import('@sentry/node').then((sentryModule) => {
    Sentry = sentryModule;
  }).catch(console.error);
}

let sentryInitialized = false;

export async function initializeSentry() {
  if (sentryInitialized || typeof window !== 'undefined' || !Sentry) return;

  try {
    const { getEnvVar } = await import('./cloudflare-env');
    const sentryDsn = await getEnvVar('SENTRY_DSN');
    const environment = await getEnvVar('NODE_ENV') || 'development';
    
    if (!sentryDsn) {
      // eslint-disable-next-line no-console
console.warn('SENTRY_DSN not configured, skipping Sentry initialization');
      return;
    }

    Sentry.init({
      dsn: sentryDsn,
      environment,
      tracesSampleRate: environment === 'production' ? 0.1 : 1.0,
      profilesSampleRate: environment === 'production' ? 0.1 : 1.0,
      integrations: [
        Sentry.nodeProfilingIntegration(),
      ],
      beforeSend(event: any) {
        // Don't send events in development unless explicitly enabled
        if (environment === 'development' && !process.env.SENTRY_DEBUG) {
          return null;
        }
        return event;
      },
      beforeSendTransaction(event: any) {
        // Sample down transactions in production
        if (environment === 'production' && Math.random() > 0.1) {
          return null;
        }
        return event;
      }
    });

    sentryInitialized = true;
    // eslint-disable-next-line no-console
console.log('Sentry initialized successfully');
  } catch (error) {
    // eslint-disable-next-line no-console
console.error('Failed to initialize Sentry:', error);
  }
}

export function captureException(error: any, context?: any) {
  if (!Sentry || !sentryInitialized) {
    // eslint-disable-next-line no-console
console.error('Sentry not initialized, logging error:', error);
    return;
  }

  Sentry.withScope((scope: any) => {
    if (context) {
      Object.keys(context).forEach(key => {
        scope.setTag(key, context[key]);
      });
    }
    Sentry.captureException(error);
  });
}

export function captureMessage(message: string, level: 'debug' | 'info' | 'warning' | 'error' = 'info', context?: any) {
  if (!Sentry || !sentryInitialized) {
    // eslint-disable-next-line no-console
console.log(`Sentry not initialized, logging message [${level}]:`, message);
    return;
  }

  Sentry.withScope((scope: any) => {
    if (context) {
      Object.keys(context).forEach(key => {
        scope.setTag(key, context[key]);
      });
    }
    Sentry.captureMessage(message, level);
  });
}

export function setUserContext(user: { id: string; email?: string; tier?: string }) {
  if (!Sentry || !sentryInitialized) return;

  Sentry.setUser({
    id: user.id,
    email: user.email,
    tier: user.tier,
  });
}

export function clearUserContext() {
  if (!Sentry || !sentryInitialized) return;
  Sentry.setUser(null);
}

export function addBreadcrumb(message: string, category?: string, level?: string, data?: any) {
  if (!Sentry || !sentryInitialized) return;

  Sentry.addBreadcrumb({
    message,
    category: category || 'custom',
    level: level || 'info',
    data,
    timestamp: Date.now() / 1000,
  });
}

export function startTransaction(name: string, op?: string) {
  if (!Sentry || !sentryInitialized) return null;

  return Sentry.startTransaction({
    name,
    op: op || 'custom',
  });
}
*/

// GDPR-SAFE: No error tracking with user context
export async function initializeSentry() {
  // No initialization - no tracking
}

export function captureException(error: any, _context?: any) {
  // Simple console logging without user data
  // eslint-disable-next-line no-console
  console.error('Error occurred:', error);
}

export function captureMessage(
  message: string,
  level: 'debug' | 'info' | 'warning' | 'error' = 'info',
  _context?: any
) {
  // Simple console logging
  // eslint-disable-next-line no-console
  console.log(`[${level}]: ${message}`);
}

export function setUserContext(_user: any) {
  // No user context tracking
}

export function clearUserContext() {
  // No user context to clear
}

export function addBreadcrumb(
  _message: string,
  _category?: string,
  _level?: string,
  _data?: any
) {
  // No breadcrumb tracking
}

export function startTransaction(_name: string, _op?: string) {
  // No transaction tracking
  return null;
}
