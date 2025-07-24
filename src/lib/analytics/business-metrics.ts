import { getSupabase } from '../supabase';
import { logger } from '../logger';
import { metrics } from '../observability/metrics';

export interface BusinessMetrics {
  // User metrics
  totalUsers: number;
  activeUsers: number;
  newSignups: number;
  churnRate: number;
  
  // Revenue metrics
  totalRevenue: number;
  monthlyRecurringRevenue: number;
  averageRevenuePerUser: number;
  conversionRate: number;
  
  // Usage metrics
  totalSubmissions: number;
  submissionsPerUser: number;
  apiUsage: number;
  
  // Cost metrics
  totalCosts: number;
  costPerUser: number;
  aiProviderCosts: Record<string, number>;
  profitMargin: number;
  
  // Quality metrics
  averageScore: number;
  userSatisfaction: number;
  errorRate: number;
  responseTimeP95: number;
}

export interface CohortAnalysis {
  cohort: string; // e.g., "2024-01"
  users: number;
  retention: Record<string, number>; // month -> retention rate
  revenue: Record<string, number>; // month -> revenue
}

export interface FunnelMetrics {
  stage: string;
  users: number;
  conversionRate: number;
}

export class BusinessAnalytics {
  private static instance: BusinessAnalytics;
  private supabase: any;

  private constructor() {
    this.initSupabase();
  }

  public static getInstance(): BusinessAnalytics {
    if (!BusinessAnalytics.instance) {
      BusinessAnalytics.instance = new BusinessAnalytics();
    }
    return BusinessAnalytics.instance;
  }

  private async initSupabase() {
    this.supabase = await getSupabase();
  }

  /**
   * Get comprehensive business metrics for a time period
   */
  async getBusinessMetrics(
    startDate: Date,
    endDate: Date
  ): Promise<BusinessMetrics> {
    try {
      const [
        userMetrics,
        revenueMetrics,
        usageMetrics,
        costMetrics,
        qualityMetrics,
      ] = await Promise.all([
        this.getUserMetrics(startDate, endDate),
        this.getRevenueMetrics(startDate, endDate),
        this.getUsageMetrics(startDate, endDate),
        this.getCostMetrics(startDate, endDate),
        this.getQualityMetrics(startDate, endDate),
      ]);

      return {
        ...userMetrics,
        ...revenueMetrics,
        ...usageMetrics,
        ...costMetrics,
        ...qualityMetrics,
      };
    } catch (error) {
      logger.error('Error getting business metrics:', error);
      throw error;
    }
  }

  private async getUserMetrics(startDate: Date, endDate: Date) {
    // Get total users
    const { data: allUsers, error: usersError } = await this.supabase
      .from('users')
      .select('id, created_at')
      .lte('created_at', endDate.toISOString());

    if (usersError) throw usersError;

    const totalUsers = allUsers?.length || 0;
    const newSignups = allUsers?.filter(u => 
      new Date(u.created_at) >= startDate
    ).length || 0;

    // Get active users (users with activity in the period)
    const { data: activeUserData, error: activeError } = await this.supabase
      .from('usage_tracking')
      .select('user_id')
      .gte('date', startDate.toISOString().split('T')[0])
      .lte('date', endDate.toISOString().split('T')[0]);

    if (activeError) throw activeError;

    const activeUsers = new Set(activeUserData?.map(u => u.user_id) || []).size;

    // Calculate churn rate (simplified - users who were active last period but not this period)
    const lastPeriodStart = new Date(startDate.getTime() - (endDate.getTime() - startDate.getTime()));
    const { data: lastPeriodActive } = await this.supabase
      .from('usage_tracking')
      .select('user_id')
      .gte('date', lastPeriodStart.toISOString().split('T')[0])
      .lt('date', startDate.toISOString().split('T')[0]);

    const lastPeriodActiveUsers = new Set(lastPeriodActive?.map(u => u.user_id) || []);
    const currentActiveUsers = new Set(activeUserData?.map(u => u.user_id) || []);
    
    const churnedUsers = [...lastPeriodActiveUsers].filter(userId => 
      !currentActiveUsers.has(userId)
    ).length;

    const churnRate = lastPeriodActiveUsers.size > 0 
      ? churnedUsers / lastPeriodActiveUsers.size 
      : 0;

    return {
      totalUsers,
      activeUsers,
      newSignups,
      churnRate,
    };
  }

  private async getRevenueMetrics(startDate: Date, endDate: Date) {
    // This would integrate with Stripe API for real revenue data
    // For now, we'll calculate based on subscription assumptions
    const { data: proUsers } = await this.supabase
      .from('users')
      .select('id, subscription_tier, created_at')
      .eq('subscription_tier', 'PRO')
      .lte('created_at', endDate.toISOString());

    const proUserCount = proUsers?.length || 0;
    const monthlyPrice = 2.99; // £2.99 per month
    
    // Calculate revenue based on pro users
    const totalRevenue = proUserCount * monthlyPrice;
    const monthlyRecurringRevenue = totalRevenue; // Simplified
    
    // Get total users for ARPU calculation
    const { data: allUsers } = await this.supabase
      .from('users')
      .select('id')
      .lte('created_at', endDate.toISOString());

    const totalUsers = allUsers?.length || 1; // Avoid division by zero
    const averageRevenuePerUser = totalRevenue / totalUsers;

    // Calculate conversion rate (free to paid)
    const freeUsers = totalUsers - proUserCount;
    const conversionRate = totalUsers > 0 ? proUserCount / totalUsers : 0;

    return {
      totalRevenue,
      monthlyRecurringRevenue,
      averageRevenuePerUser,
      conversionRate,
    };
  }

  private async getUsageMetrics(startDate: Date, endDate: Date) {
    // Get submission count
    const { data: submissions } = await this.supabase
      .from('submissions')
      .select('id, user_id')
      .gte('created_at', startDate.toISOString())
      .lte('created_at', endDate.toISOString());

    const totalSubmissions = submissions?.length || 0;
    const uniqueUsers = new Set(submissions?.map(s => s.user_id) || []).size;
    const submissionsPerUser = uniqueUsers > 0 ? totalSubmissions / uniqueUsers : 0;

    // Get API usage
    const { data: apiUsageData } = await this.supabase
      .from('usage_tracking')
      .select('count')
      .gte('date', startDate.toISOString().split('T')[0])
      .lte('date', endDate.toISOString().split('T')[0]);

    const apiUsage = apiUsageData?.reduce((sum, u) => sum + u.count, 0) || 0;

    return {
      totalSubmissions,
      submissionsPerUser,
      apiUsage,
    };
  }

  private async getCostMetrics(startDate: Date, endDate: Date) {
    // Get AI provider costs
    const { data: costs } = await this.supabase
      .from('cost_tracking')
      .select('provider_name, cost_usd')
      .gte('created_at', startDate.toISOString())
      .lte('created_at', endDate.toISOString());

    const totalCosts = costs?.reduce((sum, c) => sum + c.cost_usd, 0) || 0;

    // Group costs by provider
    const aiProviderCosts: Record<string, number> = {};
    costs?.forEach(cost => {
      aiProviderCosts[cost.provider_name] = 
        (aiProviderCosts[cost.provider_name] || 0) + cost.cost_usd;
    });

    // Get user count for cost per user
    const { data: users } = await this.supabase
      .from('users')
      .select('id')
      .lte('created_at', endDate.toISOString());

    const userCount = users?.length || 1;
    const costPerUser = totalCosts / userCount;

    // Calculate profit margin (simplified)
    const revenue = await this.getRevenueMetrics(startDate, endDate);
    const profitMargin = revenue.totalRevenue > 0 
      ? (revenue.totalRevenue - totalCosts) / revenue.totalRevenue 
      : 0;

    return {
      totalCosts,
      costPerUser,
      aiProviderCosts,
      profitMargin,
    };
  }

  private async getQualityMetrics(startDate: Date, endDate: Date) {
    // Get feedback data for quality metrics
    const { data: feedback } = await this.supabase
      .from('feedback')
      .select('score, user_rating, response_time_ms, error_message')
      .gte('created_at', startDate.toISOString())
      .lte('created_at', endDate.toISOString());

    const validScores = feedback?.filter(f => f.score !== null).map(f => f.score) || [];
    const averageScore = validScores.length > 0 
      ? validScores.reduce((sum, score) => sum + score, 0) / validScores.length 
      : 0;

    const validRatings = feedback?.filter(f => f.user_rating !== null).map(f => f.user_rating) || [];
    const userSatisfaction = validRatings.length > 0 
      ? validRatings.reduce((sum, rating) => sum + rating, 0) / validRatings.length 
      : 0;

    const errorCount = feedback?.filter(f => f.error_message !== null).length || 0;
    const errorRate = feedback?.length ? errorCount / feedback.length : 0;

    const responseTimes = feedback?.filter(f => f.response_time_ms !== null).map(f => f.response_time_ms || 0) || [];
    responseTimes.sort((a, b) => a - b);
    const responseTimeP95 = responseTimes.length > 0 
      ? responseTimes[Math.floor(responseTimes.length * 0.95)] 
      : 0;

    return {
      averageScore,
      userSatisfaction,
      errorRate,
      responseTimeP95,
    };
  }

  /**
   * Generate cohort analysis for user retention
   */
  async getCohortAnalysis(): Promise<CohortAnalysis[]> {
    try {
      const { data: users } = await this.supabase
        .from('users')
        .select('id, created_at')
        .order('created_at');

      if (!users) return [];

      // Group users by month of signup
      const cohorts: Record<string, string[]> = {};
      users.forEach(user => {
        const cohortMonth = new Date(user.created_at).toISOString().slice(0, 7); // YYYY-MM
        if (!cohorts[cohortMonth]) {
          cohorts[cohortMonth] = [];
        }
        cohorts[cohortMonth].push(user.id);
      });

      // Calculate retention for each cohort
      const cohortAnalysis: CohortAnalysis[] = [];
      
      for (const [cohortMonth, userIds] of Object.entries(cohorts)) {
        const cohort: CohortAnalysis = {
          cohort: cohortMonth,
          users: userIds.length,
          retention: {},
          revenue: {},
        };

        // Calculate retention for each subsequent month
        const cohortStart = new Date(cohortMonth + '-01');
        for (let i = 0; i < 12; i++) { // Look at 12 months of retention
          const monthStart = new Date(cohortStart.getFullYear(), cohortStart.getMonth() + i, 1);
          const monthEnd = new Date(cohortStart.getFullYear(), cohortStart.getMonth() + i + 1, 0);
          const monthKey = `month_${i}`;

          // Get active users from this cohort in this month
          const { data: activeUsers } = await this.supabase
            .from('usage_tracking')
            .select('user_id')
            .in('user_id', userIds)
            .gte('date', monthStart.toISOString().split('T')[0])
            .lte('date', monthEnd.toISOString().split('T')[0]);

          const activeCount = new Set(activeUsers?.map(u => u.user_id) || []).size;
          cohort.retention[monthKey] = activeCount / userIds.length;

          // Calculate revenue (simplified - assume PRO users generate £2.99/month)
          const { data: proUsers } = await this.supabase
            .from('users')
            .select('id')
            .in('id', userIds)
            .eq('subscription_tier', 'PRO');

          cohort.revenue[monthKey] = (proUsers?.length || 0) * 2.99;
        }

        cohortAnalysis.push(cohort);
      }

      return cohortAnalysis;
    } catch (error) {
      logger.error('Error generating cohort analysis:', error);
      throw error;
    }
  }

  /**
   * Get conversion funnel metrics
   */
  async getFunnelMetrics(): Promise<FunnelMetrics[]> {
    try {
      // Define funnel stages
      const stages = [
        'Visitor', // Would need web analytics integration
        'Signup',
        'First Submission',
        'Active User (5+ submissions)',
        'Pro Subscriber',
      ];

      const funnel: FunnelMetrics[] = [];

      // Get total signups
      const { data: allUsers } = await this.supabase
        .from('users')
        .select('id');
      const totalSignups = allUsers?.length || 0;

      // Get users with submissions
      const { data: usersWithSubmissions } = await this.supabase
        .from('submissions')
        .select('user_id')
        .limit(1);
      const uniqueSubmitters = new Set(usersWithSubmissions?.map(s => s.user_id) || []).size;

      // Get active users (5+ submissions)
      const { data: submissionCounts } = await this.supabase
        .rpc('get_user_submission_counts');
      const activeUsers = submissionCounts?.filter(u => u.count >= 5).length || 0;

      // Get pro subscribers
      const { data: proUsers } = await this.supabase
        .from('users')
        .select('id')
        .eq('subscription_tier', 'PRO');
      const proCount = proUsers?.length || 0;

      // Build funnel (assuming visitor count is 10x signups for demo)
      const visitorCount = totalSignups * 10; // This would come from web analytics

      funnel.push({
        stage: 'Visitor',
        users: visitorCount,
        conversionRate: 1.0,
      });

      funnel.push({
        stage: 'Signup',
        users: totalSignups,
        conversionRate: totalSignups / visitorCount,
      });

      funnel.push({
        stage: 'First Submission',
        users: uniqueSubmitters,
        conversionRate: uniqueSubmitters / totalSignups,
      });

      funnel.push({
        stage: 'Active User (5+ submissions)',
        users: activeUsers,
        conversionRate: activeUsers / totalSignups,
      });

      funnel.push({
        stage: 'Pro Subscriber',
        users: proCount,
        conversionRate: proCount / totalSignups,
      });

      return funnel;
    } catch (error) {
      logger.error('Error generating funnel metrics:', error);
      throw error;
    }
  }

  /**
   * Track a business event (revenue, conversion, etc.)
   */
  async trackBusinessEvent(
    eventType: string,
    value: number,
    userId?: string,
    metadata?: any
  ) {
    try {
      // Record in metrics system
      metrics.gauge(`business.${eventType}`, value, { userId });

      // Also track in structured logs for detailed analysis
      const { structuredLogger } = await import('../observability/structured-logger');
      structuredLogger.logBusinessMetric(eventType, value, 'count', {
        userId,
        ...metadata,
      });

      logger.info(`Business event tracked: ${eventType} = ${value}`, { userId, metadata });
    } catch (error) {
      logger.error('Error tracking business event:', error);
    }
  }

  /**
   * Get customer lifetime value
   */
  async getCustomerLifetimeValue(userId: string): Promise<number> {
    try {
      // Get user's subscription history and usage
      const { data: user } = await this.supabase
        .from('users')
        .select('created_at, subscription_tier')
        .eq('id', userId)
        .single();

      if (!user) return 0;

      // Calculate months since signup
      const monthsSinceSignup = Math.ceil(
        (Date.now() - new Date(user.created_at).getTime()) / (1000 * 60 * 60 * 24 * 30)
      );

      // Simple CLV calculation: if PRO user, assume £2.99/month
      if (user.subscription_tier === 'PRO') {
        return monthsSinceSignup * 2.99;
      }

      return 0; // Free users don't generate revenue
    } catch (error) {
      logger.error('Error calculating CLV:', error);
      return 0;
    }
  }

  /**
   * Get unit economics (LTV/CAC ratio, payback period, etc.)
   */
  async getUnitEconomics(): Promise<{
    ltv: number;
    cac: number;
    ltvCacRatio: number;
    paybackPeriod: number;
  }> {
    try {
      // Calculate average LTV
      const { data: proUsers } = await this.supabase
        .from('users')
        .select('id, created_at')
        .eq('subscription_tier', 'PRO');

      let totalLtv = 0;
      if (proUsers) {
        for (const user of proUsers) {
          totalLtv += await this.getCustomerLifetimeValue(user.id);
        }
      }

      const avgLtv = proUsers?.length ? totalLtv / proUsers.length : 0;

      // Estimate CAC (Customer Acquisition Cost)
      // For demo purposes, assume £10 CAC (this would come from marketing spend data)
      const estimatedCac = 10;

      const ltvCacRatio = estimatedCac > 0 ? avgLtv / estimatedCac : 0;
      const monthlyRevenue = 2.99;
      const paybackPeriod = monthlyRevenue > 0 ? estimatedCac / monthlyRevenue : 0;

      return {
        ltv: avgLtv,
        cac: estimatedCac,
        ltvCacRatio,
        paybackPeriod,
      };
    } catch (error) {
      logger.error('Error calculating unit economics:', error);
      return { ltv: 0, cac: 0, ltvCacRatio: 0, paybackPeriod: 0 };
    }
  }
}

export const businessAnalytics = BusinessAnalytics.getInstance();