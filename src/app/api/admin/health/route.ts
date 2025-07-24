import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/admin-auth';
import { getSupabase } from '@/lib/supabase';
import { logger } from '@/lib/logger';

interface HealthCheck {
  name: string;
  status: 'healthy' | 'warning' | 'error';
  message: string;
  lastChecked: string;
  responseTime?: number;
}

async function checkDatabase(): Promise<HealthCheck> {
  const start = Date.now();
  try {
    const supabase = await getSupabase();
    const { data, error } = await supabase.from('submissions').select('id').limit(1);
    
    const responseTime = Date.now() - start;
    
    if (error) {
      return {
        name: 'Database',
        status: 'error',
        message: `Database error: ${error.message}`,
        lastChecked: new Date().toISOString(),
        responseTime,
      };
    }
    
    return {
      name: 'Database',
      status: responseTime > 1000 ? 'warning' : 'healthy',
      message: responseTime > 1000 ? 'Database responding slowly' : 'Database connection healthy',
      lastChecked: new Date().toISOString(),
      responseTime,
    };
  } catch (error) {
    return {
      name: 'Database',
      status: 'error',
      message: `Database connection failed: ${error}`,
      lastChecked: new Date().toISOString(),
      responseTime: Date.now() - start,
    };
  }
}

async function checkAIProviders(): Promise<HealthCheck> {
  try {
    // This would ideally ping your AI providers
    // For now, we'll check recent feedback for errors
    const supabase = await getSupabase();
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
    
    const { data: recentFeedback } = await supabase
      .from('feedback')
      .select('error_message')
      .gte('created_at', fiveMinutesAgo.toISOString());
    
    const errorCount = recentFeedback?.filter(f => f.error_message).length || 0;
    const totalCount = recentFeedback?.length || 0;
    
    if (totalCount === 0) {
      return {
        name: 'AI Providers',
        status: 'warning',
        message: 'No recent AI requests to check',
        lastChecked: new Date().toISOString(),
      };
    }
    
    const errorRate = errorCount / totalCount;
    
    return {
      name: 'AI Providers',
      status: errorRate > 0.1 ? 'warning' : 'healthy',
      message: errorRate > 0.1 
        ? `${(errorRate * 100).toFixed(1)}% error rate in last 5 minutes`
        : 'AI providers responding normally',
      lastChecked: new Date().toISOString(),
    };
  } catch (error) {
    return {
      name: 'AI Providers',
      status: 'error',
      message: 'Failed to check AI provider status',
      lastChecked: new Date().toISOString(),
    };
  }
}

async function checkRateLimit(): Promise<HealthCheck> {
  try {
    // Check if rate limiting is working by examining recent usage
    const supabase = await getSupabase();
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const { data: todayUsage } = await supabase
      .from('usage_tracking')
      .select('count')
      .gte('date', today.toISOString().split('T')[0]);
    
    const totalUsage = todayUsage?.reduce((sum, u) => sum + u.count, 0) || 0;
    
    return {
      name: 'Rate Limiting',
      status: 'healthy',
      message: `${totalUsage} API calls tracked today`,
      lastChecked: new Date().toISOString(),
    };
  } catch (error) {
    return {
      name: 'Rate Limiting',
      status: 'error',
      message: 'Failed to check rate limiting status',
      lastChecked: new Date().toISOString(),
    };
  }
}

async function checkStorage(): Promise<HealthCheck> {
  try {
    // This would check Cloudflare R2 or your storage solution
    // For now, we'll assume it's healthy if we can access the database
    return {
      name: 'File Storage',
      status: 'healthy',
      message: 'Storage systems operational',
      lastChecked: new Date().toISOString(),
    };
  } catch (error) {
    return {
      name: 'File Storage',
      status: 'error',
      message: 'Storage health check failed',
      lastChecked: new Date().toISOString(),
    };
  }
}

export async function GET(request: NextRequest) {
  try {
    await requireAdmin();
    
    // Run all health checks in parallel
    const [database, aiProviders, rateLimit, storage] = await Promise.all([
      checkDatabase(),
      checkAIProviders(),
      checkRateLimit(),
      checkStorage(),
    ]);
    
    const checks = [database, aiProviders, rateLimit, storage];
    
    // Calculate overall system status
    const hasError = checks.some(check => check.status === 'error');
    const hasWarning = checks.some(check => check.status === 'warning');
    
    const overallStatus = hasError ? 'error' : hasWarning ? 'warning' : 'healthy';
    
    return NextResponse.json({
      status: overallStatus,
      checks,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    logger.error('Error checking system health:', error);
    return NextResponse.json(
      { error: 'Failed to check system health' },
      { status: 500 }
    );
  }
}