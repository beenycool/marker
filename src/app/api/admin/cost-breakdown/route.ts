import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/admin-auth';
import { getSupabase } from '@/lib/supabase';
import { logger } from '@/lib/logger';

export async function GET(request: NextRequest) {
  try {
    await requireAdmin();
    
    const { searchParams } = new URL(request.url);
    const range = searchParams.get('range') || '30d';
    
    const supabase = await getSupabase();
    const now = new Date();
    const daysBack = range === '7d' ? 7 : range === '30d' ? 30 : 90;
    const startDate = new Date(now.getTime() - daysBack * 24 * 60 * 60 * 1000);
    
    // Get feedback with model information
    const { data: feedback } = await supabase
      .from('feedback')
      .select('model_used, cost_usd')
      .gte('created_at', startDate.toISOString())
      .not('cost_usd', 'is', null);

    // Group costs by provider
    const costByProvider: Record<string, number> = {};
    
    feedback?.forEach(f => {
      const provider = f.model_used?.includes('OpenRouter') ? 'OpenRouter' :
                      f.model_used?.includes('Gemini') ? 'Google Gemini' :
                      f.model_used?.includes('DeepSeek') ? 'DeepSeek' :
                      f.model_used?.includes('Kimi') ? 'Kimi' : 'Other';
      
      costByProvider[provider] = (costByProvider[provider] || 0) + (f.cost_usd || 0);
    });

    const totalCost = Object.values(costByProvider).reduce((sum, cost) => sum + cost, 0);
    
    const colors = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6'];
    
    const costBreakdown = Object.entries(costByProvider).map(([provider, cost], index) => ({
      provider,
      cost,
      percentage: totalCost > 0 ? cost / totalCost : 0,
      color: colors[index % colors.length]
    }));

    return NextResponse.json(costBreakdown);
  } catch (error) {
    logger.error('Error fetching cost breakdown:', error);
    return NextResponse.json(
      { error: 'Failed to fetch cost breakdown' },
      { status: 500 }
    );
  }
}