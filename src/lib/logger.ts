// Logger module: no import needed for logger itself
import { clientEnv } from '@/lib/env';
import { initializeSentry, Sentry, captureAIProviderError, captureAPIError } from './sentry';
type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface LogContext {
  [key: string]: any;
}

// Structured event types for production observability
interface BaseEvent {
  timestamp: string;
  sessionId?: string;
  userId?: string;
  submissionId?: string;
}

interface AIProviderEvent extends BaseEvent {
  provider: 'openai' | 'google' | 'anthropic';
  model: string;
  promptVersion: string;
  tokenCount?: number;
  costUsd?: number;
  latencyMs: number;
  success: boolean;
  errorCode?: string;
}

interface DatabaseEvent extends BaseEvent {
  operation: 'read' | 'write' | 'update' | 'delete';
  table: string;
  queryTimeMs: number;
  success: boolean;
  errorCode?: string;
}

interface UserEvent extends BaseEvent {
  eventType: 'signup' | 'login' | 'subscription_created' | 'subscription_cancelled' | 'feedback_submitted';
  plan?: 'free' | 'pro';
  source?: string;
}

interface APIEvent extends BaseEvent {
  endpoint: string;
  method: string;
  statusCode: number;
  responseTimeMs: number;
  userAgent?: string;
  ip?: string;
}

class Logger {
  private static instance: Logger;
  private logLevel: LogLevel;
  private productionLogger: any;

  private constructor() {
    this.logLevel = (clientEnv.LOG_LEVEL as LogLevel) || 'info';
    this.setupProductionLogging();
    // Initialize Sentry asynchronously
    initializeSentry().catch(console.error);
  }

  public static getInstance(): Logger {
    if (!Logger.instance) {
      Logger.instance = new Logger();
    }
    return Logger.instance;
  }

  private shouldLog(level: LogLevel): boolean {
    const levels: Record<LogLevel, number> = {
      debug: 0,
      info: 1,
      warn: 2,
      error: 3,
    };
    return levels[level] >= levels[this.logLevel];
  }

  private formatMessage(
    level: LogLevel,
    message: string,
    context?: LogContext
  ): string {
    const timestamp = new Date().toISOString();
    const contextStr = context ? ` ${JSON.stringify(context)}` : '';
    return `[${timestamp}] [${level.toUpperCase()}] ${message}${contextStr}`;
  }

  private async setupProductionLogging() {
    try {
      const { getEnvVar } = await import('./cloudflare-env');
      const logService = await getEnvVar('LOGGING_SERVICE');

      if (logService === 'sentry') {
        const sentryDsn = await getEnvVar('SENTRY_DSN');
        if (sentryDsn) {
          // Skip Sentry initialization in Cloudflare Workers environment
          // as @sentry/node is not compatible with Workers
          console.warn(
            'Sentry logging not available in Cloudflare Workers environment'
          );
        }
      } else if (logService === 'logflare') {
        const logflareKey = await getEnvVar('LOGFLARE_API_KEY');
        const logflareId = await getEnvVar('LOGFLARE_SOURCE_ID');
        if (logflareKey && logflareId) {
          // Skip winston-logflare in Cloudflare Workers as it has Node.js dependencies
          console.warn(
            'Winston-Logflare logging not available in Cloudflare Workers environment'
          );
        }
      } else if (logService === 'datadog') {
        const datadogKey = await getEnvVar('DATADOG_API_KEY');
        if (datadogKey) {
          const { datadogLogs } = await import('@datadog/browser-logs');
          datadogLogs.init({
            clientToken: datadogKey,
            site: 'datadoghq.com',
            forwardErrorsToLogs: true,
          });
          this.productionLogger = datadogLogs;
        }
      }
    } catch (error) {
      console.error('Failed to initialize production logging:', error);
    }
  }

  debug(message: string, context?: LogContext) {
    if (this.shouldLog('debug')) {
      // eslint-disable-next-line no-console
      console.debug(this.formatMessage('debug', message, context));
    }
  }

  info(message: string, context?: LogContext) {
    if (this.shouldLog('info')) {
      // eslint-disable-next-line no-console
      console.info(this.formatMessage('info', message, context));

      // Send to production logger if available
      if (this.productionLogger) {
        if (this.productionLogger.captureMessage) {
          this.productionLogger.captureMessage(message, 'info', context);
        } else if (this.productionLogger.logger) {
          this.productionLogger.logger.info(message, context);
        }
      }
    }
  }

  warn(message: string, context?: LogContext) {
    if (this.shouldLog('warn')) {
      // eslint-disable-next-line no-console
      console.warn(this.formatMessage('warn', message, context));

      // Send to production logger if available
      if (this.productionLogger) {
        if (this.productionLogger.captureMessage) {
          this.productionLogger.captureMessage(message, 'warning', context);
        } else if (this.productionLogger.logger) {
          this.productionLogger.logger.warn(message, context);
        }
      }
    }
  }

  error(message: string, error?: Error | any, context?: LogContext) {
    if (this.shouldLog('error')) {
      const errorContext = error
        ? { error: error.message || error, stack: error.stack }
        : {};
      // eslint-disable-next-line no-console
      console.error(
        this.formatMessage('error', message, { ...context, ...errorContext })
      );

      // Send to Sentry for error tracking
      if (Sentry && typeof window === 'undefined') {
        if (error instanceof Error) {
          Sentry.withScope((scope: any) => {
            if (context) {
              Object.entries(context).forEach(([key, value]) => {
                scope.setExtra(key, value);
              });
            }
            scope.setLevel('error');
            Sentry.captureException(error);
          });
        } else {
          Sentry.captureMessage(message, 'error');
        }
      }

      // Send to production logger if available
      if (this.productionLogger) {
        if (this.productionLogger.captureException) {
          this.productionLogger.captureException(error || new Error(message), {
            contexts: { context },
          });
        } else if (this.productionLogger.logger) {
          this.productionLogger.logger.error(message, {
            ...context,
            ...errorContext,
          });
        }
      }
    }
  }

  // Structured event logging methods
  logAIProviderEvent(event: Omit<AIProviderEvent, 'timestamp'>) {
    const fullEvent: AIProviderEvent = {
      ...event,
      timestamp: new Date().toISOString(),
    };
    
    // Log failures as warnings for alerting
    if (!fullEvent.success) {
      this.warn('AI Provider Event Failed', fullEvent);
      
      // Send AI provider failures to Sentry for alerting
      captureAIProviderError(new Error(`AI Provider ${fullEvent.provider} failed: ${fullEvent.errorCode || 'Unknown error'}`), {
        provider: fullEvent.provider,
        model: fullEvent.model,
        userId: fullEvent.userId,
        sessionId: fullEvent.sessionId,
        requestDetails: {
          latencyMs: fullEvent.latencyMs,
          costUsd: fullEvent.costUsd,
          errorCode: fullEvent.errorCode
        }
      });
    } else {
      this.info('AI Provider Event', fullEvent);
    }
    
    // Send structured event to production logger
    if (this.productionLogger && this.productionLogger.logger) {
      this.productionLogger.logger.info('ai_provider_event', fullEvent);
    }
  }

  logDatabaseEvent(event: Omit<DatabaseEvent, 'timestamp'>) {
    const fullEvent: DatabaseEvent = {
      ...event,
      timestamp: new Date().toISOString(),
    };
    
    if (event.queryTimeMs > 1000) {
      this.warn('Slow Database Query', fullEvent);
    } else {
      this.debug('Database Event', fullEvent);
    }
    
    if (this.productionLogger && this.productionLogger.logger) {
      this.productionLogger.logger.info('database_event', fullEvent);
    }
  }

  logUserEvent(event: Omit<UserEvent, 'timestamp'>) {
    const fullEvent: UserEvent = {
      ...event,
      timestamp: new Date().toISOString(),
    };
    
    this.info('User Event', fullEvent);
    
    if (this.productionLogger && this.productionLogger.logger) {
      this.productionLogger.logger.info('user_event', fullEvent);
    }
  }

  logAPIEvent(event: Omit<APIEvent, 'timestamp'>) {
    const fullEvent: APIEvent = {
      ...event,
      timestamp: new Date().toISOString(),
    };
    
    if (fullEvent.statusCode >= 500) {
      this.error('API Server Error', undefined, fullEvent);
      
      // Send 5xx errors to Sentry for immediate alerting
      captureAPIError(new Error(`API Error ${fullEvent.statusCode} on ${fullEvent.endpoint}`), {
        endpoint: fullEvent.endpoint,
        method: fullEvent.method,
        userId: fullEvent.userId,
        requestId: fullEvent.sessionId,
        statusCode: fullEvent.statusCode
      });
    } else if (fullEvent.statusCode >= 400) {
      this.warn('API Client Error', fullEvent);
    } else if (fullEvent.responseTimeMs > 2000) {
      this.warn('Slow API Response', fullEvent);
      
      // Alert on consistently slow responses
      if (fullEvent.responseTimeMs > 5000 && Sentry && typeof window === 'undefined') {
        Sentry.captureMessage(`Very slow API response: ${fullEvent.endpoint} took ${fullEvent.responseTimeMs}ms`, 'warning');
      }
    } else {
      this.debug('API Event', fullEvent);
    }
    
    if (this.productionLogger && this.productionLogger.logger) {
      this.productionLogger.logger.info('api_event', fullEvent);
    }
  }

  // Helper method to create base event context
  createBaseEvent(userId?: string, submissionId?: string, sessionId?: string): BaseEvent {
    return {
      timestamp: new Date().toISOString(),
      userId,
      submissionId,
      sessionId,
    };
  }
}

export const logger = Logger.getInstance();
