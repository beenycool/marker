import { logger } from '../logger';
import { metrics } from './metrics';
import { getSupabase } from '../supabase';

export interface AlertRule {
  id: string;
  name: string;
  description: string;
  metric: string;
  condition: 'gt' | 'lt' | 'eq' | 'gte' | 'lte';
  threshold: number;
  window_minutes: number;
  severity: 'low' | 'medium' | 'high' | 'critical';
  enabled: boolean;
  tags?: Record<string, string>;
  created_at: string;
  updated_at: string;
}

export interface Alert {
  id: string;
  rule_id: string;
  message: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  status: 'firing' | 'resolved';
  triggered_at: string;
  resolved_at?: string;
  metadata: any;
}

export interface AlertChannel {
  type: 'email' | 'slack' | 'webhook' | 'discord';
  config: {
    webhook_url?: string;
    email?: string;
    channel?: string;
    [key: string]: any;
  };
  severity_filter: string[]; // Which severities to alert on
}

export class AlertingSystem {
  private static instance: AlertingSystem;
  private rules: AlertRule[] = [];
  private channels: AlertChannel[] = [];
  private activeAlerts: Map<string, Alert> = new Map();
  private checkInterval = 60000; // 1 minute
  private supabase: any;

  private constructor() {
    this.initSupabase();
    this.initializeDefaultRules();
    this.startAlertChecking();
  }

  public static getInstance(): AlertingSystem {
    if (!AlertingSystem.instance) {
      AlertingSystem.instance = new AlertingSystem();
    }
    return AlertingSystem.instance;
  }

  private async initSupabase() {
    this.supabase = await getSupabase();
    await this.loadRules();
    await this.loadChannels();
  }

  private initializeDefaultRules() {
    const defaultRules: Omit<AlertRule, 'id' | 'created_at' | 'updated_at'>[] =
      [
        {
          name: 'High API Error Rate',
          description: 'API error rate exceeds 5% over 5 minutes',
          metric: 'api.errors',
          condition: 'gt',
          threshold: 0.05,
          window_minutes: 5,
          severity: 'high',
          enabled: true,
        },
        {
          name: 'AI Provider Failures',
          description: 'AI provider failure rate exceeds 10% over 10 minutes',
          metric: 'ai.errors',
          condition: 'gt',
          threshold: 0.1,
          window_minutes: 10,
          severity: 'high',
          enabled: true,
        },
        {
          name: 'Slow API Response Time',
          description: 'Average API response time exceeds 2 seconds',
          metric: 'api.duration',
          condition: 'gt',
          threshold: 2000,
          window_minutes: 5,
          severity: 'medium',
          enabled: true,
        },
        {
          name: 'High AI Costs',
          description: 'Hourly AI costs exceed $10',
          metric: 'ai.cost',
          condition: 'gt',
          threshold: 10,
          window_minutes: 60,
          severity: 'medium',
          enabled: true,
        },
        {
          name: 'Database Query Failures',
          description: 'Database error rate exceeds 2%',
          metric: 'database.errors',
          condition: 'gt',
          threshold: 0.02,
          window_minutes: 5,
          severity: 'high',
          enabled: true,
        },
        {
          name: 'Low User Satisfaction',
          description: 'User rating drops below 3.5',
          metric: 'user.rating',
          condition: 'lt',
          threshold: 3.5,
          window_minutes: 30,
          severity: 'medium',
          enabled: true,
        },
        {
          name: 'Golden Dataset Degradation',
          description: 'Golden dataset pass rate drops below 80%',
          metric: 'golden_dataset.pass_rate',
          condition: 'lt',
          threshold: 0.8,
          window_minutes: 60,
          severity: 'critical',
          enabled: true,
        },
      ];

    // Create default rules if they don't exist
    defaultRules.forEach(rule => {
      if (!this.rules.find(r => r.name === rule.name)) {
        this.createRule(rule);
      }
    });
  }

  private startAlertChecking() {
    setInterval(async () => {
      await this.checkAllRules();
    }, this.checkInterval);

    // Initial check
    setTimeout(() => this.checkAllRules(), 5000);
  }

  async createRule(
    rule: Omit<AlertRule, 'id' | 'created_at' | 'updated_at'>
  ): Promise<string> {
    const newRule: AlertRule = {
      ...rule,
      id: `rule_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    try {
      if (this.supabase) {
        await this.supabase.from('alert_rules').insert(newRule);
      }
      this.rules.push(newRule);
      logger.info(`Created alert rule: ${newRule.name}`);
      return newRule.id;
    } catch (error) {
      logger.error('Failed to create alert rule:', error);
      throw error;
    }
  }

  async updateRule(ruleId: string, updates: Partial<AlertRule>): Promise<void> {
    try {
      const updatedRule = {
        ...updates,
        updated_at: new Date().toISOString(),
      };

      if (this.supabase) {
        await this.supabase
          .from('alert_rules')
          .update(updatedRule)
          .eq('id', ruleId);
      }

      const ruleIndex = this.rules.findIndex(r => r.id === ruleId);
      if (ruleIndex >= 0) {
        this.rules[ruleIndex] = { ...this.rules[ruleIndex], ...updatedRule };
      }

      logger.info(`Updated alert rule: ${ruleId}`);
    } catch (error) {
      logger.error('Failed to update alert rule:', error);
      throw error;
    }
  }

  async addChannel(channel: AlertChannel): Promise<void> {
    try {
      if (this.supabase) {
        await this.supabase.from('alert_channels').insert(channel);
      }
      this.channels.push(channel);
      logger.info(`Added alert channel: ${channel.type}`);
    } catch (error) {
      logger.error('Failed to add alert channel:', error);
      throw error;
    }
  }

  private async checkAllRules(): Promise<void> {
    for (const rule of this.rules) {
      if (!rule.enabled) continue;

      try {
        await this.checkRule(rule);
      } catch (error) {
        logger.error(`Error checking rule ${rule.name}:`, error);
      }
    }
  }

  private async checkRule(rule: AlertRule): Promise<void> {
    const endTime = new Date();
    const startTime = new Date(
      endTime.getTime() - rule.window_minutes * 60 * 1000
    );

    try {
      // Calculate the metric value for the time window
      const metricValue = await this.calculateMetricValue(
        rule,
        startTime,
        endTime
      );

      // Check if the condition is met
      const conditionMet = this.evaluateCondition(
        metricValue,
        rule.condition,
        rule.threshold
      );

      const alertKey = `${rule.id}_${rule.metric}`;
      const existingAlert = this.activeAlerts.get(alertKey);

      if (conditionMet && !existingAlert) {
        // Fire new alert
        await this.fireAlert(rule, metricValue);
      } else if (
        !conditionMet &&
        existingAlert &&
        existingAlert.status === 'firing'
      ) {
        // Resolve existing alert
        await this.resolveAlert(existingAlert);
      }
    } catch (error) {
      logger.error(`Error evaluating rule ${rule.name}:`, error);
    }
  }

  private async calculateMetricValue(
    rule: AlertRule,
    startTime: Date,
    endTime: Date
  ): Promise<number> {
    // For rate-based metrics, calculate the rate
    if (rule.metric.includes('errors') || rule.metric.includes('rate')) {
      const errorMetric = rule.metric;
      const totalMetric = errorMetric.replace('.errors', '.requests');

      const [errors, total] = await Promise.all([
        metrics.getAggregatedMetrics(
          errorMetric,
          startTime,
          endTime,
          'sum',
          rule.tags
        ),
        metrics.getAggregatedMetrics(
          totalMetric,
          startTime,
          endTime,
          'sum',
          rule.tags
        ),
      ]);

      return total > 0 ? errors / total : 0;
    }

    // For other metrics, use average
    return metrics.getAggregatedMetrics(
      rule.metric,
      startTime,
      endTime,
      'avg',
      rule.tags
    );
  }

  private evaluateCondition(
    value: number,
    condition: string,
    threshold: number
  ): boolean {
    switch (condition) {
      case 'gt':
        return value > threshold;
      case 'gte':
        return value >= threshold;
      case 'lt':
        return value < threshold;
      case 'lte':
        return value <= threshold;
      case 'eq':
        return value === threshold;
      default:
        return false;
    }
  }

  private async fireAlert(rule: AlertRule, value: number): Promise<void> {
    const alert: Alert = {
      id: `alert_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      rule_id: rule.id,
      message: `${rule.name}: ${rule.description} (current value: ${value.toFixed(2)}, threshold: ${rule.threshold})`,
      severity: rule.severity,
      status: 'firing',
      triggered_at: new Date().toISOString(),
      metadata: {
        rule_name: rule.name,
        metric: rule.metric,
        value,
        threshold: rule.threshold,
        condition: rule.condition,
      },
    };

    try {
      if (this.supabase) {
        await this.supabase.from('alerts').insert(alert);
      }

      this.activeAlerts.set(`${rule.id}_${rule.metric}`, alert);

      // Send notifications
      await this.sendAlertNotifications(alert);

      logger.warn(`Alert fired: ${alert.message}`);
    } catch (error) {
      logger.error('Failed to fire alert:', error);
    }
  }

  private async resolveAlert(alert: Alert): Promise<void> {
    const resolvedAlert = {
      ...alert,
      status: 'resolved' as const,
      resolved_at: new Date().toISOString(),
    };

    try {
      if (this.supabase) {
        await this.supabase
          .from('alerts')
          .update({
            status: 'resolved',
            resolved_at: resolvedAlert.resolved_at,
          })
          .eq('id', alert.id);
      }

      this.activeAlerts.delete(`${alert.rule_id}_${alert.metadata.metric}`);

      logger.info(`Alert resolved: ${alert.message}`);
    } catch (error) {
      logger.error('Failed to resolve alert:', error);
    }
  }

  private async sendAlertNotifications(alert: Alert): Promise<void> {
    const relevantChannels = this.channels.filter(channel =>
      channel.severity_filter.includes(alert.severity)
    );

    for (const channel of relevantChannels) {
      try {
        await this.sendNotification(channel, alert);
      } catch (error) {
        logger.error(`Failed to send alert to ${channel.type}:`, error);
      }
    }
  }

  private async sendNotification(
    channel: AlertChannel,
    alert: Alert
  ): Promise<void> {
    const message = this.formatAlertMessage(alert);

    switch (channel.type) {
      case 'webhook':
        await this.sendWebhookNotification(
          channel.config.webhook_url!,
          alert,
          message
        );
        break;
      case 'slack':
        await this.sendSlackNotification(
          channel.config.webhook_url!,
          alert,
          message
        );
        break;
      case 'discord':
        await this.sendDiscordNotification(
          channel.config.webhook_url!,
          alert,
          message
        );
        break;
      case 'email':
        // Email implementation would go here
        logger.info(`Would send email to ${channel.config.email}: ${message}`);
        break;
    }
  }

  private async sendWebhookNotification(
    url: string,
    alert: Alert,
    message: string
  ): Promise<void> {
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        alert_id: alert.id,
        severity: alert.severity,
        status: alert.status,
        message: message,
        timestamp: alert.triggered_at,
        metadata: alert.metadata,
      }),
    });

    if (!response.ok) {
      throw new Error(`Webhook returned ${response.status}`);
    }
  }

  private async sendSlackNotification(
    url: string,
    alert: Alert,
    message: string
  ): Promise<void> {
    const color = this.getSeverityColor(alert.severity);

    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        attachments: [
          {
            color,
            title: `🚨 ${alert.severity.toUpperCase()} Alert`,
            text: message,
            fields: [
              { title: 'Severity', value: alert.severity, short: true },
              {
                title: 'Triggered',
                value: new Date(alert.triggered_at).toLocaleString(),
                short: true,
              },
              {
                title: 'Value',
                value: alert.metadata.value?.toFixed(2) || 'N/A',
                short: true,
              },
              {
                title: 'Threshold',
                value: alert.metadata.threshold?.toString() || 'N/A',
                short: true,
              },
            ],
            footer: 'AIMARKER Monitoring',
            ts: Math.floor(new Date(alert.triggered_at).getTime() / 1000),
          },
        ],
      }),
    });

    if (!response.ok) {
      throw new Error(`Slack webhook returned ${response.status}`);
    }
  }

  private async sendDiscordNotification(
    url: string,
    alert: Alert,
    message: string
  ): Promise<void> {
    const color = this.getSeverityColorInt(alert.severity);

    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        embeds: [
          {
            title: `🚨 ${alert.severity.toUpperCase()} Alert`,
            description: message,
            color: color,
            fields: [
              { name: 'Severity', value: alert.severity, inline: true },
              {
                name: 'Triggered',
                value: new Date(alert.triggered_at).toLocaleString(),
                inline: true,
              },
              {
                name: 'Value',
                value: alert.metadata.value?.toFixed(2) || 'N/A',
                inline: true,
              },
              {
                name: 'Threshold',
                value: alert.metadata.threshold?.toString() || 'N/A',
                inline: true,
              },
            ],
            footer: { text: 'AIMARKER Monitoring' },
            timestamp: alert.triggered_at,
          },
        ],
      }),
    });

    if (!response.ok) {
      throw new Error(`Discord webhook returned ${response.status}`);
    }
  }

  private formatAlertMessage(alert: Alert): string {
    return `**${alert.metadata.rule_name}**\n${alert.message}`;
  }

  private getSeverityColor(severity: string): string {
    switch (severity) {
      case 'critical':
        return 'danger';
      case 'high':
        return 'warning';
      case 'medium':
        return 'good';
      case 'low':
        return '#36a64f';
      default:
        return 'good';
    }
  }

  private getSeverityColorInt(severity: string): number {
    switch (severity) {
      case 'critical':
        return 0xff0000; // Red
      case 'high':
        return 0xff8c00; // Orange
      case 'medium':
        return 0xffff00; // Yellow
      case 'low':
        return 0x36a64f; // Green
      default:
        return 0x36a64f;
    }
  }

  private async loadRules(): Promise<void> {
    try {
      if (this.supabase) {
        const { data, error } = await this.supabase
          .from('alert_rules')
          .select('*')
          .eq('enabled', true);

        if (error) throw error;
        this.rules = data || [];
      }
    } catch (error) {
      logger.error('Failed to load alert rules:', error);
    }
  }

  private async loadChannels(): Promise<void> {
    try {
      if (this.supabase) {
        const { data, error } = await this.supabase
          .from('alert_channels')
          .select('*');

        if (error) throw error;
        this.channels = data || [];
      }
    } catch (error) {
      logger.error('Failed to load alert channels:', error);
    }
  }

  // Public methods for management
  async getActiveAlerts(): Promise<Alert[]> {
    return Array.from(this.activeAlerts.values());
  }

  async getAllRules(): Promise<AlertRule[]> {
    return [...this.rules];
  }

  async getAlertHistory(limit: number = 100): Promise<Alert[]> {
    try {
      if (this.supabase) {
        const { data, error } = await this.supabase
          .from('alerts')
          .select('*')
          .order('triggered_at', { ascending: false })
          .limit(limit);

        if (error) throw error;
        return data || [];
      }
      return [];
    } catch (error) {
      logger.error('Failed to get alert history:', error);
      return [];
    }
  }
}

export const alerting = AlertingSystem.getInstance();
