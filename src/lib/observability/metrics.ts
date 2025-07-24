import { getSupabase } from '../supabase';
import { logger } from '../logger';

export interface MetricPoint {
  name: string;
  value: number;
  timestamp: string;
  tags?: Record<string, string>;
  unit?: string;
}

export interface TimeSeries {
  name: string;
  points: Array<{
    timestamp: string;
    value: number;
  }>;
  tags?: Record<string, string>;
}

export class MetricsCollector {
  private static instance: MetricsCollector;
  private buffer: MetricPoint[] = [];
  private batchSize = 100;
  private flushInterval = 60000; // 1 minute
  private supabase: any;

  private constructor() {
    this.initSupabase();
    this.startFlushTimer();
  }

  public static getInstance(): MetricsCollector {
    if (!MetricsCollector.instance) {
      MetricsCollector.instance = new MetricsCollector();
    }
    return MetricsCollector.instance;
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
   * Record a counter metric (monotonically increasing)
   */
  counter(name: string, value: number = 1, tags?: Record<string, string>) {
    this.record({
      name,
      value,
      timestamp: new Date().toISOString(),
      tags,
      unit: 'count',
    });
  }

  /**
   * Record a gauge metric (can go up or down)
   */
  gauge(name: string, value: number, tags?: Record<string, string>) {
    this.record({
      name,
      value,
      timestamp: new Date().toISOString(),
      tags,
      unit: 'value',
    });
  }

  /**
   * Record a histogram metric (for measuring distributions)
   */
  histogram(name: string, value: number, tags?: Record<string, string>) {
    this.record({
      name,
      value,
      timestamp: new Date().toISOString(),
      tags,
      unit: 'histogram',
    });
  }

  /**
   * Record a timing metric
   */
  timing(name: string, durationMs: number, tags?: Record<string, string>) {
    this.record({
      name,
      value: durationMs,
      timestamp: new Date().toISOString(),
      tags,
      unit: 'milliseconds',
    });
  }

  /**
   * Record custom application metrics
   */
  
  // User metrics
  recordUserSignup(userId: string, tier: string) {
    this.counter('user.signup', 1, { tier });
    this.gauge('user.total', 1, { tier });
  }

  recordUserSubscription(userId: string, tier: string, revenue: number) {
    this.counter('subscription.created', 1, { tier });
    this.gauge('revenue.monthly', revenue, { tier });
  }

  recordUserActivity(userId: string, action: string) {
    this.counter('user.activity', 1, { action });
  }

  // API metrics
  recordApiRequest(method: string, path: string, statusCode: number, duration: number) {
    this.counter('api.requests', 1, { method, path, status: statusCode.toString() });
    this.timing('api.duration', duration, { method, path });
    
    if (statusCode >= 400) {
      this.counter('api.errors', 1, { method, path, status: statusCode.toString() });
    }
  }

  // AI Provider metrics
  recordAiProviderCall(provider: string, model: string, success: boolean, duration: number, cost?: number, tokens?: number) {
    this.counter('ai.requests', 1, { provider, model, success: success.toString() });
    this.timing('ai.duration', duration, { provider, model });
    
    if (cost !== undefined) {
      this.gauge('ai.cost', cost, { provider, model });
    }
    
    if (tokens !== undefined) {
      this.gauge('ai.tokens', tokens, { provider, model });
    }

    if (!success) {
      this.counter('ai.errors', 1, { provider, model });
    }
  }

  // Business metrics
  recordSubmissionProcessed(subject: string, examBoard: string, score: number, grade: string) {
    this.counter('submissions.processed', 1, { subject, examBoard, grade });
    this.histogram('submissions.score', score, { subject, examBoard });
  }

  recordRevenueEvent(amount: number, currency: string, type: string) {
    this.gauge('revenue.event', amount, { currency, type });
  }

  // Performance metrics
  recordDatabaseQuery(table: string, operation: string, duration: number, success: boolean) {
    this.counter('database.queries', 1, { table, operation, success: success.toString() });
    this.timing('database.duration', duration, { table, operation });
    
    if (!success) {
      this.counter('database.errors', 1, { table, operation });
    }
  }

  recordCacheOperation(operation: string, hit: boolean, duration: number) {
    this.counter('cache.operations', 1, { operation, hit: hit.toString() });
    this.timing('cache.duration', duration, { operation });
  }

  // System metrics
  recordMemoryUsage(usage: number) {
    this.gauge('system.memory', usage, {});
  }

  recordActiveConnections(count: number) {
    this.gauge('system.connections', count, {});
  }

  /**
   * Time a function execution and record the metric
   */
  async time<T>(name: string, fn: () => Promise<T>, tags?: Record<string, string>): Promise<T> {
    const start = Date.now();
    try {
      const result = await fn();
      this.timing(name, Date.now() - start, tags);
      return result;
    } catch (error) {
      this.timing(name, Date.now() - start, { ...tags, error: 'true' });
      throw error;
    }
  }

  /**
   * Get metrics for a specific time range
   */
  async getMetrics(
    name: string,
    startTime: Date,
    endTime: Date,
    tags?: Record<string, string>
  ): Promise<TimeSeries> {
    try {
      let query = this.supabase
        .from('system_metrics')
        .select('metric_value, timestamp')
        .eq('metric_name', name)
        .gte('timestamp', startTime.toISOString())
        .lte('timestamp', endTime.toISOString())
        .order('timestamp', { ascending: true });

      // Add tag filters if provided
      if (tags) {
        for (const [key, value] of Object.entries(tags)) {
          query = query.eq(`metadata->>${key}`, value);
        }
      }

      const { data, error } = await query;

      if (error) throw error;

      return {
        name,
        points: (data || []).map(point => ({
          timestamp: point.timestamp,
          value: point.metric_value,
        })),
        tags,
      };
    } catch (error) {
      logger.error('Error fetching metrics:', error);
      throw error;
    }
  }

  /**
   * Get aggregated metrics (sum, avg, min, max)
   */
  async getAggregatedMetrics(
    name: string,
    startTime: Date,
    endTime: Date,
    aggregation: 'sum' | 'avg' | 'min' | 'max' | 'count',
    tags?: Record<string, string>
  ): Promise<number> {
    try {
      const timeSeries = await this.getMetrics(name, startTime, endTime, tags);
      const values = timeSeries.points.map(p => p.value);

      if (values.length === 0) return 0;

      switch (aggregation) {
        case 'sum':
          return values.reduce((sum, val) => sum + val, 0);
        case 'avg':
          return values.reduce((sum, val) => sum + val, 0) / values.length;
        case 'min':
          return Math.min(...values);
        case 'max':
          return Math.max(...values);
        case 'count':
          return values.length;
        default:
          throw new Error(`Unknown aggregation: ${aggregation}`);
      }
    } catch (error) {
      logger.error('Error calculating aggregated metrics:', error);
      throw error;
    }
  }

  private record(metric: MetricPoint) {
    this.buffer.push(metric);

    if (this.buffer.length >= this.batchSize) {
      this.flush();
    }
  }

  private async flush() {
    if (this.buffer.length === 0) return;

    const metricsToFlush = [...this.buffer];
    this.buffer = [];

    try {
      if (this.supabase) {
        await this.supabase
          .from('system_metrics')
          .insert(metricsToFlush.map(metric => ({
            metric_name: metric.name,
            metric_value: metric.value,
            timestamp: metric.timestamp,
            metadata: {
              tags: metric.tags || {},
              unit: metric.unit,
            },
          })));
      }
    } catch (error) {
      logger.error('Failed to flush metrics:', error);
      
      // Put metrics back in buffer to retry later
      this.buffer.unshift(...metricsToFlush);
      
      // Limit buffer size to prevent memory issues
      if (this.buffer.length > 1000) {
        this.buffer = this.buffer.slice(0, 1000);
      }
    }
  }

  public async forceFlush() {
    await this.flush();
  }
}

export const metrics = MetricsCollector.getInstance();