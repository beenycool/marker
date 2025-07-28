import { getSupabase } from '../supabase';
import { logger } from '../logger';
import { metrics } from '../observability/metrics';

export interface CostEntry {
  id?: string;
  user_id?: string;
  request_id?: string;
  provider_name: string;
  model_name?: string;
  tokens_used?: number;
  cost_usd: number;
  request_type: string;
  created_at?: string;
}

export interface CostBreakdown {
  provider: string;
  totalCost: number;
  totalRequests: number;
  averageCostPerRequest: number;
  costByModel: Record<string, number>;
}

export interface CostProjection {
  dailyProjection: number;
  monthlyProjection: number;
  yearlyProjection: number;
  confidenceInterval: number;
}

export class CostTracker {
  private static instance: CostTracker;
  private supabase: any;

  // Provider pricing (cost per 1K tokens)
  private providerPricing: Record<string, Record<string, number>> = {
    openrouter: {
      'gpt-4': 0.03,
      'gpt-3.5-turbo': 0.002,
      'claude-3-sonnet': 0.015,
      'claude-3-haiku': 0.00025,
    },
    deepseek: {
      'deepseek-coder': 0.0014,
      'deepseek-chat': 0.0014,
    },
    kimi: {
      'moonshot-v1': 0.012,
    },
    gemini: {
      'gemini-pro': 0.000125, // Free tier, very low cost
      'gemini-pro-vision': 0.00025,
    },
  };

  private constructor() {
    this.initSupabase();
  }

  public static getInstance(): CostTracker {
    if (!CostTracker.instance) {
      CostTracker.instance = new CostTracker();
    }
    return CostTracker.instance;
  }

  private async initSupabase() {
    this.supabase = await getSupabase();
  }

  /**
   * Track a cost entry for an API call
   */
  async trackCost(entry: Omit<CostEntry, 'id' | 'created_at'>): Promise<void> {
    try {
      // Calculate cost if not provided
      let finalCost = entry.cost_usd;
      if (!finalCost && entry.tokens_used && entry.model_name) {
        finalCost = this.calculateCost(
          entry.provider_name,
          entry.model_name,
          entry.tokens_used
        );
      }

      const costEntry: CostEntry = {
        ...entry,
        cost_usd: finalCost,
        created_at: new Date().toISOString(),
      };

      // Store in database
      if (this.supabase) {
        await this.supabase.from('cost_tracking').insert(costEntry);
      }

      // Record in metrics system
      metrics.gauge('cost.total', finalCost, {
        provider: entry.provider_name,
        model: entry.model_name || 'unknown',
        request_type: entry.request_type,
      });

      logger.info(
        `Cost tracked: ${entry.provider_name} - $${finalCost.toFixed(4)}`,
        {
          provider: entry.provider_name,
          model: entry.model_name,
          tokens: entry.tokens_used,
          cost: finalCost,
        }
      );
    } catch (error) {
      logger.error('Error tracking cost:', error);
    }
  }

  /**
   * Calculate cost based on provider, model, and token usage
   */
  calculateCost(provider: string, model: string, tokens: number): number {
    const providerPricing = this.providerPricing[provider.toLowerCase()];
    if (!providerPricing) {
      logger.warn(`Unknown provider for cost calculation: ${provider}`);
      return 0.01; // Default cost estimate
    }

    const modelPricing = providerPricing[model.toLowerCase()];
    if (!modelPricing) {
      logger.warn(`Unknown model for cost calculation: ${provider}/${model}`);
      // Use average pricing for provider
      const prices = Object.values(providerPricing);
      const avgPrice = prices.reduce((sum, p) => sum + p, 0) / prices.length;
      return (tokens / 1000) * avgPrice;
    }

    return (tokens / 1000) * modelPricing;
  }

  /**
   * Get cost breakdown by provider for a time period
   */
  async getCostBreakdown(
    startDate: Date,
    endDate: Date
  ): Promise<CostBreakdown[]> {
    try {
      const { data: costs, error } = await this.supabase
        .from('cost_tracking')
        .select('*')
        .gte('created_at', startDate.toISOString())
        .lte('created_at', endDate.toISOString());

      if (error) throw error;

      // Group by provider
      const providerGroups: Record<string, CostEntry[]> = {};
      costs?.forEach((cost: CostEntry) => {
        const provider = cost.provider_name;
        if (!providerGroups[provider]) {
          providerGroups[provider] = [];
        }
        providerGroups[provider].push(cost);
      });

      // Calculate breakdown for each provider
      const breakdown: CostBreakdown[] = [];
      for (const [provider, providerCosts] of Object.entries(providerGroups)) {
        const totalCost = providerCosts.reduce((sum, c) => sum + c.cost_usd, 0);
        const totalRequests = providerCosts.length;
        const averageCostPerRequest =
          totalRequests > 0 ? totalCost / totalRequests : 0;

        // Group by model
        const costByModel: Record<string, number> = {};
        providerCosts.forEach(cost => {
          const model = cost.model_name || 'unknown';
          costByModel[model] = (costByModel[model] || 0) + cost.cost_usd;
        });

        breakdown.push({
          provider,
          totalCost,
          totalRequests,
          averageCostPerRequest,
          costByModel,
        });
      }

      return breakdown.sort((a, b) => b.totalCost - a.totalCost);
    } catch (error) {
      logger.error('Error getting cost breakdown:', error);
      throw error;
    }
  }

  /**
   * Get total costs for a time period
   */
  async getTotalCosts(startDate: Date, endDate: Date): Promise<number> {
    try {
      const { data: costs, error } = await this.supabase
        .from('cost_tracking')
        .select('cost_usd')
        .gte('created_at', startDate.toISOString())
        .lte('created_at', endDate.toISOString());

      if (error) throw error;

      return (
        costs?.reduce((sum: number, c: CostEntry) => sum + c.cost_usd, 0) || 0
      );
    } catch (error) {
      logger.error('Error getting total costs:', error);
      throw error;
    }
  }

  /**
   * Get cost trends over time
   */
  async getCostTrends(
    startDate: Date,
    endDate: Date,
    granularity: 'hour' | 'day' | 'week' | 'month' = 'day'
  ): Promise<Array<{ period: string; cost: number; requests: number }>> {
    try {
      const { data: costs, error } = await this.supabase
        .from('cost_tracking')
        .select('cost_usd, created_at')
        .gte('created_at', startDate.toISOString())
        .lte('created_at', endDate.toISOString())
        .order('created_at');

      if (error) throw error;

      // Group by time period
      const trends: Record<string, { cost: number; requests: number }> = {};
      costs?.forEach((cost: CostEntry) => {
        const date = new Date(cost.created_at || Date.now());
        let period: string;

        switch (granularity) {
          case 'hour':
            period = date.toISOString().slice(0, 13);
            break;
          case 'day':
            period = date.toISOString().slice(0, 10);
            break;
          case 'week':
            const weekStart = new Date(date);
            weekStart.setDate(date.getDate() - date.getDay());
            period = weekStart.toISOString().slice(0, 10);
            break;
          case 'month':
            period = date.toISOString().slice(0, 7);
            break;
        }

        if (!trends[period]) {
          trends[period] = { cost: 0, requests: 0 };
        }
        trends[period].cost += cost.cost_usd;
        trends[period].requests += 1;
      });

      return Object.entries(trends)
        .map(([period, data]) => ({ period, ...data }))
        .sort((a, b) => a.period.localeCompare(b.period));
    } catch (error) {
      logger.error('Error getting cost trends:', error);
      throw error;
    }
  }

  /**
   * Get cost projection based on recent trends
   */
  async getCostProjection(daysToAnalyze: number = 7): Promise<CostProjection> {
    try {
      const endDate = new Date();
      const startDate = new Date(
        endDate.getTime() - daysToAnalyze * 24 * 60 * 60 * 1000
      );

      const trends = await this.getCostTrends(startDate, endDate, 'day');

      if (trends.length === 0) {
        return {
          dailyProjection: 0,
          monthlyProjection: 0,
          yearlyProjection: 0,
          confidenceInterval: 0,
        };
      }

      // Calculate average daily cost
      const avgDailyCost =
        trends.reduce((sum, t) => sum + t.cost, 0) / trends.length;

      // Calculate variance for confidence interval
      const costVariance =
        trends.reduce((sum, t) => sum + Math.pow(t.cost - avgDailyCost, 2), 0) /
        trends.length;
      const standardDeviation = Math.sqrt(costVariance);

      // Project future costs
      const dailyProjection = avgDailyCost;
      const monthlyProjection = avgDailyCost * 30;
      const yearlyProjection = avgDailyCost * 365;

      // 95% confidence interval (±2 standard deviations)
      const confidenceInterval = 2 * standardDeviation;

      return {
        dailyProjection,
        monthlyProjection,
        yearlyProjection,
        confidenceInterval,
      };
    } catch (error) {
      logger.error('Error calculating cost projection:', error);
      return {
        dailyProjection: 0,
        monthlyProjection: 0,
        yearlyProjection: 0,
        confidenceInterval: 0,
      };
    }
  }

  /**
   * Get most expensive users
   */
  async getMostExpensiveUsers(
    startDate: Date,
    endDate: Date,
    limit: number = 10
  ): Promise<
    Array<{ userId: string; totalCost: number; requestCount: number }>
  > {
    try {
      const { data: costs, error } = await this.supabase
        .from('cost_tracking')
        .select('user_id, cost_usd')
        .gte('created_at', startDate.toISOString())
        .lte('created_at', endDate.toISOString())
        .not('user_id', 'is', null);

      if (error) throw error;

      // Group by user
      const userCosts: Record<
        string,
        { totalCost: number; requestCount: number }
      > = {};
      costs?.forEach((cost: CostEntry) => {
        const userId = cost.user_id;
        if (userId && !userCosts[userId]) {
          userCosts[userId] = { totalCost: 0, requestCount: 0 };
        }
        if (userId) {
          userCosts[userId].totalCost += cost.cost_usd;
          userCosts[userId].requestCount += 1;
        }
      });

      return Object.entries(userCosts)
        .map(([userId, data]) => ({ userId, ...data }))
        .sort((a, b) => b.totalCost - a.totalCost)
        .slice(0, limit);
    } catch (error) {
      logger.error('Error getting most expensive users:', error);
      throw error;
    }
  }

  /**
   * Get cost efficiency metrics
   */
  async getCostEfficiencyMetrics(
    startDate: Date,
    endDate: Date
  ): Promise<{
    costPerUser: number;
    costPerSubmission: number;
    costPerSuccessfulRequest: number;
    mostEfficientProvider: string;
    leastEfficientProvider: string;
  }> {
    try {
      const [costData, submissionData, userData] = await Promise.all([
        this.getCostBreakdown(startDate, endDate),
        this.supabase
          .from('submissions')
          .select('id')
          .gte('created_at', startDate.toISOString())
          .lte('created_at', endDate.toISOString()),
        this.supabase
          .from('users')
          .select('id')
          .lte('created_at', endDate.toISOString()),
      ]);

      const totalCost = costData.reduce((sum, c) => sum + c.totalCost, 0);
      const totalSubmissions = submissionData.data?.length || 1;
      const totalUsers = userData.data?.length || 1;

      // Get successful request rate from feedback table
      const { data: feedback } = await this.supabase
        .from('feedback')
        .select('error_message')
        .gte('created_at', startDate.toISOString())
        .lte('created_at', endDate.toISOString());

      const successfulRequests =
        feedback?.filter((f: any) => !f.error_message).length || 1;

      // Find most/least efficient providers
      const providerEfficiency = costData.map(p => ({
        provider: p.provider,
        efficiency: p.averageCostPerRequest,
      }));

      providerEfficiency.sort((a, b) => a.efficiency - b.efficiency);

      return {
        costPerUser: totalCost / totalUsers,
        costPerSubmission: totalCost / totalSubmissions,
        costPerSuccessfulRequest: totalCost / successfulRequests,
        mostEfficientProvider: providerEfficiency[0]?.provider || 'none',
        leastEfficientProvider:
          providerEfficiency[providerEfficiency.length - 1]?.provider || 'none',
      };
    } catch (error) {
      logger.error('Error calculating cost efficiency metrics:', error);
      throw error;
    }
  }

  /**
   * Set budget alerts
   */
  async setBudgetAlert(
    threshold: number,
    period: 'daily' | 'monthly'
  ): Promise<void> {
    try {
      // This would integrate with the alerting system
      const { alerting } = await import('../observability/alerting');

      const metricName = period === 'daily' ? 'cost.daily' : 'cost.monthly';
      const windowMinutes = period === 'daily' ? 1440 : 43200; // 24 hours or 30 days

      await alerting.createRule({
        name: `Budget Alert - ${period}`,
        description: `${period} costs exceeded $${threshold}`,
        metric: metricName,
        condition: 'gt',
        threshold,
        window_minutes: windowMinutes,
        severity: 'high',
        enabled: true,
      });

      logger.info(`Budget alert set: $${threshold} ${period}`);
    } catch (error) {
      logger.error('Error setting budget alert:', error);
      throw error;
    }
  }

  /**
   * Optimize costs by suggesting provider/model changes
   */
  async getCostOptimizationSuggestions(): Promise<
    Array<{
      type: string;
      description: string;
      potentialSavings: number;
      priority: 'high' | 'medium' | 'low';
    }>
  > {
    try {
      const suggestions: Array<{
        type: string;
        description: string;
        potentialSavings: number;
        priority: 'high' | 'medium' | 'low';
      }> = [];

      // Analyze last 30 days
      const endDate = new Date();
      const startDate = new Date(endDate.getTime() - 30 * 24 * 60 * 60 * 1000);

      const breakdown = await this.getCostBreakdown(startDate, endDate);
      const totalCost = breakdown.reduce((sum, b) => sum + b.totalCost, 0);

      // Check for expensive providers
      breakdown.forEach(provider => {
        if (provider.averageCostPerRequest > 0.05) {
          // $0.05 per request
          const potentialSavings = provider.totalCost * 0.3; // Assume 30% savings
          suggestions.push({
            type: 'provider_optimization',
            description: `Consider switching from ${provider.provider} to a more cost-effective provider. Current average: $${provider.averageCostPerRequest.toFixed(4)}/request`,
            potentialSavings,
            priority: potentialSavings > totalCost * 0.1 ? 'high' : 'medium',
          });
        }
      });

      // Check for underutilized expensive models
      for (const provider of breakdown) {
        const expensiveModels = Object.entries(provider.costByModel)
          .filter(([, cost]) => cost > provider.totalCost * 0.3)
          .filter(
            ([model]) =>
              model.includes('gpt-4') || model.includes('claude-3-opus')
          );

        expensiveModels.forEach(([model, cost]) => {
          suggestions.push({
            type: 'model_optimization',
            description: `High usage of expensive model ${model}. Consider using ${model.replace('gpt-4', 'gpt-3.5-turbo').replace('opus', 'sonnet')} for non-critical tasks`,
            potentialSavings: cost * 0.5,
            priority: cost > totalCost * 0.2 ? 'high' : 'medium',
          });
        });
      }

      // Check for caching opportunities
      const efficiency = await this.getCostEfficiencyMetrics(
        startDate,
        endDate
      );
      if (efficiency.costPerSuccessfulRequest > 0.02) {
        suggestions.push({
          type: 'caching_optimization',
          description:
            'Implement more aggressive caching to reduce duplicate API calls',
          potentialSavings: totalCost * 0.15,
          priority: 'medium',
        });
      }

      return suggestions.sort(
        (a, b) => b.potentialSavings - a.potentialSavings
      );
    } catch (error) {
      logger.error('Error generating cost optimization suggestions:', error);
      return [];
    }
  }
}

export const costTracker = CostTracker.getInstance();
