// GDPR REMOVAL: All structured logging with user data commented out
/*
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

// Production logger for structured events
class Logger {
  private isDevelopment: boolean;
  private sessionId: string;

  constructor() {
    this.isDevelopment = clientEnv.NODE_ENV === 'development';
    this.sessionId = this.generateSessionId();
    
    // Initialize Sentry for production error tracking
    if (!this.isDevelopment) {
      initializeSentry();
    }
  }

  private generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
  }

  private formatMessage(level: LogLevel, message: string, context?: LogContext): string {
    const timestamp = new Date().toISOString();
    const contextStr = context ? ` ${JSON.stringify(context)}` : '';
    return `[${timestamp}] ${level.toUpperCase()}: ${message}${contextStr}`;
  }

  debug(message: string, context?: LogContext) {
    if (this.isDevelopment) {
      console.debug(this.formatMessage('debug', message, context));
    }
  }

  info(message: string, context?: LogContext) {
    const formatted = this.formatMessage('info', message, context);
    console.info(formatted);
    
    if (!this.isDevelopment && context?.userId) {
      // Send structured log to monitoring service
      this.sendStructuredLog('info', message, context);
    }
  }

  warn(message: string, context?: LogContext) {
    const formatted = this.formatMessage('warn', message, context);
    console.warn(formatted);
    
    if (!this.isDevelopment) {
      this.sendStructuredLog('warn', message, context);
    }
  }

  error(message: string, error?: Error | unknown, context?: LogContext) {
    const formatted = this.formatMessage('error', message, context);
    console.error(formatted, error);
    
    if (!this.isDevelopment) {
      // Send to error tracking service
      if (error instanceof Error) {
        captureAIProviderError?.(error, context);
      } else {
        captureAPIError?.(new Error(message), context);
      }
      
      this.sendStructuredLog('error', message, { ...context, error: error?.toString() });
    }
  }

  // Structured event logging for production observability
  logAIProviderEvent(event: Omit<AIProviderEvent, 'timestamp' | 'sessionId'>) {
    const fullEvent: AIProviderEvent = {
      ...event,
      timestamp: new Date().toISOString(),
      sessionId: this.sessionId,
    };

    if (this.isDevelopment) {
      console.info('AI Provider Event:', fullEvent);
    } else {
      this.sendEventLog('ai_provider', fullEvent);
    }
  }

  logDatabaseEvent(event: Omit<DatabaseEvent, 'timestamp' | 'sessionId'>) {
    const fullEvent: DatabaseEvent = {
      ...event,
      timestamp: new Date().toISOString(),
      sessionId: this.sessionId,
    };

    if (this.isDevelopment) {
      console.info('Database Event:', fullEvent);
    } else {
      this.sendEventLog('database', fullEvent);
    }
  }

  logUserEvent(event: Omit<UserEvent, 'timestamp' | 'sessionId'>) {
    const fullEvent: UserEvent = {
      ...event,
      timestamp: new Date().toISOString(),
      sessionId: this.sessionId,
    };

    if (this.isDevelopment) {
      console.info('User Event:', fullEvent);
    } else {
      this.sendEventLog('user', fullEvent);
    }
  }

  logAPIEvent(event: Omit<APIEvent, 'timestamp' | 'sessionId'>) {
    const fullEvent: APIEvent = {
      ...event,
      timestamp: new Date().toISOString(),
      sessionId: this.sessionId,
    };

    if (this.isDevelopment) {
      console.info('API Event:', fullEvent);
    } else {
      this.sendEventLog('api', fullEvent);
    }
  }

  private sendStructuredLog(level: LogLevel, message: string, context?: LogContext) {
    // In production, this would send to a logging service like DataDog, Logflare, etc.
    // For now, we'll just ensure it's properly formatted
    const logEntry = {
      level,
      message,
      timestamp: new Date().toISOString(),
      sessionId: this.sessionId,
      ...context,
    };

    // Send to external logging service
    this.sendToLoggingService(logEntry);
  }

  private sendEventLog(eventType: string, event: any) {
    // Send structured events to monitoring/analytics service
    this.sendToLoggingService({
      type: 'event',
      eventType,
      ...event,
    });
  }

  private sendToLoggingService(data: any) {
    // Implementation would depend on the logging service
    // Could be DataDog, Logflare, or custom endpoint
    if (typeof window !== 'undefined') {
      // Client-side logging
      this.sendClientLog(data);
    } else {
      // Server-side logging
      this.sendServerLog(data);
    }
  }

  private sendClientLog(data: any) {
    // Send to client-side logging endpoint
    // Batched and rate-limited for performance
    try {
      fetch('/api/logs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      }).catch(console.error);
    } catch (error) {
      console.error('Failed to send client log:', error);
    }
  }

  private sendServerLog(data: any) {
    // Send to server-side logging service
    // Would use appropriate SDK or HTTP client
    console.log('Server log:', JSON.stringify(data));
  }
}

export const logger = new Logger();
*/

// GDPR-SAFE: Simple console logging without user data
type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface LogContext {
  [key: string]: any;
}

class Logger {
  private formatMessage(
    level: LogLevel,
    message: string,
    context?: LogContext
  ): string {
    const timestamp = new Date().toISOString();
    // Filter out any potential personal data from context
    const safeContext = context ? this.sanitizeContext(context) : {};
    const contextStr =
      Object.keys(safeContext).length > 0
        ? ` ${JSON.stringify(safeContext)}`
        : '';
    return `[${timestamp}] ${level.toUpperCase()}: ${message}${contextStr}`;
  }

  private sanitizeContext(context: LogContext): LogContext {
    const safe: LogContext = {};
    for (const [key, value] of Object.entries(context)) {
      // Skip fields that might contain personal data
      if (!['userId', 'email', 'ip', 'userAgent', 'sessionId'].includes(key)) {
        safe[key] = value;
      }
    }
    return safe;
  }

  debug(message: string, context?: LogContext) {
    // eslint-disable-next-line no-console
    console.debug(this.formatMessage('debug', message, context));
  }

  info(message: string, context?: LogContext) {
    // eslint-disable-next-line no-console
    console.info(this.formatMessage('info', message, context));
  }

  warn(message: string, context?: LogContext) {
    // eslint-disable-next-line no-console
    console.warn(this.formatMessage('warn', message, context));
  }

  error(message: string, error?: Error | unknown, context?: LogContext) {
    // eslint-disable-next-line no-console
    console.error(this.formatMessage('error', message, context), error);
  }

  // No-op event logging methods - no data collection
  logAIProviderEvent(event: any) {
    // eslint-disable-next-line no-console
    console.info('AI Provider Event (sanitized):', {
      provider: event.provider,
      success: event.success,
      latencyMs: event.latencyMs,
    });
  }

  logDatabaseEvent(event: any) {
    // eslint-disable-next-line no-console
    console.info('Database Event (sanitized):', {
      operation: event.operation,
      success: event.success,
      queryTimeMs: event.queryTimeMs,
    });
  }

  logUserEvent(_event: any) {
    // No user event logging
  }

  logAPIEvent(event: any) {
    // eslint-disable-next-line no-console
    console.info('API Event (sanitized):', {
      endpoint: event.endpoint,
      method: event.method,
      statusCode: event.statusCode,
    });
  }
}

export const logger = new Logger();
