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
    console.log(`Sentry initialized for environment: ${environment}`);
  } catch (error) {
    console.error('Failed to initialize Sentry:', error);
  }
}

// Enhanced error capture with context
export function captureAIProviderError(error: Error, context: {
  provider: string;
  model: string;
  userId?: string;
  sessionId?: string;
  requestDetails?: any;
}) {
  if (!Sentry || typeof window !== 'undefined') return;
  
  Sentry.withScope((scope: any) => {
    scope.setTag('error_type', 'ai_provider_failure');
    scope.setTag('provider', context.provider);
    scope.setTag('model', context.model);
    
    if (context.userId) {
      scope.setUser({ id: context.userId });
    }
    
    scope.setContext('ai_request', {
      provider: context.provider,
      model: context.model,
      sessionId: context.sessionId,
      requestDetails: context.requestDetails
    });
    
    Sentry.captureException(error);
  });
}

export function captureAPIError(error: Error, context: {
  endpoint: string;
  method: string;
  userId?: string;
  requestId?: string;
  statusCode?: number;
}) {
  if (!Sentry || typeof window !== 'undefined') return;
  
  Sentry.withScope((scope: any) => {
    scope.setTag('error_type', 'api_error');
    scope.setTag('endpoint', context.endpoint);
    scope.setTag('method', context.method);
    
    if (context.statusCode) {
      scope.setTag('status_code', context.statusCode.toString());
    }
    
    if (context.userId) {
      scope.setUser({ id: context.userId });
    }
    
    scope.setContext('api_request', {
      endpoint: context.endpoint,
      method: context.method,
      requestId: context.requestId,
      statusCode: context.statusCode
    });
    
    Sentry.captureException(error);
  });
}

export function captureBusinessMetric(metricName: string, value: number, tags: Record<string, string> = {}) {
  if (!Sentry || typeof window !== 'undefined') return;
  
  Sentry.withScope((scope: any) => {
    scope.setTag('metric_type', 'business');
    Object.entries(tags).forEach(([key, val]) => {
      scope.setTag(key, val);
    });
    
    scope.setContext('metric_data', {
      name: metricName,
      value,
      timestamp: new Date().toISOString(),
      tags
    });
    
    // Create a custom event for business metrics
    Sentry.addBreadcrumb({
      category: 'business_metric',
      message: `${metricName}: ${value}`,
      level: 'info',
      data: { value, tags }
    });
  });
}

// Performance monitoring  
export function startTransaction(name: string, operation: string) {
  if (!Sentry || typeof window !== 'undefined') return null;
  
  return Sentry.startTransaction({
    name,
    op: operation
  });
}

export function addBreadcrumb(message: string, category: string, data?: any) {
  if (!Sentry || typeof window !== 'undefined') return;
  
  Sentry.addBreadcrumb({
    message,
    category,
    data,
    level: 'info',
    timestamp: Date.now() / 1000
  });
}

export { Sentry };