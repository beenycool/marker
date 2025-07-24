import { logger } from '../logger';
import { getSupabase } from '../supabase';

export interface StructuredLogEvent {
  timestamp: string;
  level: 'debug' | 'info' | 'warn' | 'error';
  event: string;
  message: string;
  context: {
    userId?: string;
    requestId?: string;
    sessionId?: string;
    userAgent?: string;
    ip?: string;
    [key: string]: any;
  };
  metrics?: {
    duration_ms?: number;
    bytes_processed?: number;
    tokens_used?: number;
    cost_usd?: number;
    [key: string]: number;
  };
  tags?: string[];
}

export class StructuredLogger {
  private static instance: StructuredLogger;
  private buffer: StructuredLogEvent[] = [];
  private batchSize = 50;
  private flushInterval = 30000; // 30 seconds
  private supabase: any;

  private constructor() {
    this.initSupabase();
    this.startFlushTimer();
  }

  public static getInstance(): StructuredLogger {
    if (!StructuredLogger.instance) {
      StructuredLogger.instance = new StructuredLogger();
    }
    return StructuredLogger.instance;
  }

  private async initSupabase() {
    this.supabase = await getSupabase();
  }

  private startFlushTimer() {
    setInterval(() => {
      this.flush();
    }, this.flushInterval);
  }

  /**
   * Log a user action (signup, login, subscription, etc.)
   */
  logUserAction(
    action: string,
    userId: string,
    details: any = {},
    requestId?: string
  ) {
    this.log({
      level: 'info',
      event: 'user_action',
      message: `User ${action}`,
      context: {
        userId,
        requestId,
        action,
        ...details,
      },
      tags: ['user', action],
    });
  }

  /**
   * Log API request/response
   */
  logApiRequest(
    method: string,
    path: string,
    statusCode: number,
    duration: number,
    context: any = {}
  ) {
    const level = statusCode >= 400 ? 'error' : statusCode >= 300 ? 'warn' : 'info';
    
    this.log({
      level,
      event: 'api_request',
      message: `${method} ${path} - ${statusCode}`,
      context: {
        method,
        path,
        statusCode,
        ...context,
      },
      metrics: {
        duration_ms: duration,
      },
      tags: ['api', method.toLowerCase(), `status_${statusCode}`],
    });
  }

  /**
   * Log AI provider interaction
   */
  logAiProviderCall(
    provider: string,
    model: string,
    success: boolean,
    duration: number,
    details: any = {}
  ) {
    this.log({
      level: success ? 'info' : 'error',
      event: 'ai_provider_call',
      message: `AI call to ${provider}/${model} ${success ? 'succeeded' : 'failed'}`,
      context: {
        provider,
        model,
        success,
        ...details,
      },
      metrics: {
        duration_ms: duration,
        tokens_used: details.tokensUsed,
        cost_usd: details.cost,
      },
      tags: ['ai', provider, success ? 'success' : 'failure'],
    });
  }

  /**
   * Log business metrics
   */
  logBusinessMetric(
    metric: string,
    value: number,
    unit: string,
    context: any = {}
  ) {
    this.log({
      level: 'info',
      event: 'business_metric',
      message: `${metric}: ${value} ${unit}`,
      context: {
        metric,
        unit,
        ...context,
      },
      metrics: {
        [metric]: value,
      },
      tags: ['business', metric],
    });
  }

  /**
   * Log security events
   */
  logSecurityEvent(
    event: string,
    severity: 'low' | 'medium' | 'high' | 'critical',
    context: any = {}
  ) {
    const level = severity === 'critical' ? 'error' : severity === 'high' ? 'error' : 'warn';
    
    this.log({
      level,
      event: 'security_event',
      message: `Security event: ${event}`,
      context: {
        event,
        severity,
        ...context,
      },
      tags: ['security', severity, event.toLowerCase().replace(/\s+/g, '_')],
    });
  }

  /**
   * Log performance metrics
   */
  logPerformanceMetric(
    operation: string,
    duration: number,
    context: any = {}
  ) {
    const level = duration > 5000 ? 'warn' : 'info';
    
    this.log({
      level,
      event: 'performance_metric',
      message: `${operation} completed in ${duration}ms`,
      context: {
        operation,
        ...context,
      },
      metrics: {
        duration_ms: duration,
      },
      tags: ['performance', operation.toLowerCase().replace(/\s+/g, '_')],
    });
  }

  /**
   * Log database operations
   */
  logDatabaseOperation(
    operation: string,
    table: string,
    duration: number,
    success: boolean,
    context: any = {}
  ) {
    this.log({
      level: success ? 'info' : 'error',
      event: 'database_operation',
      message: `Database ${operation} on ${table} ${success ? 'succeeded' : 'failed'}`,
      context: {
        operation,
        table,
        success,
        ...context,
      },
      metrics: {
        duration_ms: duration,
      },
      tags: ['database', operation, table, success ? 'success' : 'failure'],
    });
  }

  /**
   * Log errors with context
   */
  logError(
    error: Error,
    context: any = {},
    tags: string[] = []
  ) {
    this.log({
      level: 'error',
      event: 'error',
      message: error.message,
      context: {
        error: error.name,
        stack: error.stack,
        ...context,
      },
      tags: ['error', ...tags],
    });
  }

  /**
   * Core logging method
   */
  private log(event: Omit<StructuredLogEvent, 'timestamp'>) {
    const logEvent: StructuredLogEvent = {
      ...event,
      timestamp: new Date().toISOString(),
    };

    // Add to buffer
    this.buffer.push(logEvent);

    // Also log to console for immediate visibility
    const level = event.level;
    const message = `[${event.event}] ${event.message}`;
    const context = { ...event.context, ...event.metrics };

    switch (level) {
      case 'debug':
        logger.debug(message, context);
        break;
      case 'info':
        logger.info(message, context);
        break;
      case 'warn':
        logger.warn(message, context);
        break;
      case 'error':
        logger.error(message, undefined, context);
        break;
    }

    // Flush if buffer is full
    if (this.buffer.length >= this.batchSize) {
      this.flush();
    }
  }

  /**
   * Flush logs to database
   */
  private async flush() {
    if (this.buffer.length === 0) return;

    const logsToFlush = [...this.buffer];
    this.buffer = [];

    try {
      if (this.supabase) {
        await this.supabase
          .from('structured_logs')
          .insert(logsToFlush.map(log => ({
            timestamp: log.timestamp,
            level: log.level,
            event: log.event,
            message: log.message,
            context: log.context,
            metrics: log.metrics || {},
            tags: log.tags || [],
          })));
      }
    } catch (error) {
      // Don't use structured logger here to avoid infinite loop
      console.error('Failed to flush structured logs:', error);
      
      // Put logs back in buffer to retry later
      this.buffer.unshift(...logsToFlush);
      
      // Limit buffer size to prevent memory issues
      if (this.buffer.length > 1000) {
        this.buffer = this.buffer.slice(0, 1000);
      }
    }
  }

  /**
   * Manually flush logs (useful for shutdown)
   */
  public async forceFlush() {
    await this.flush();
  }
}

export const structuredLogger = StructuredLogger.getInstance();