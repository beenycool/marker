import { NextRequest } from 'next/server';
import { getSupabase } from '@/lib/supabase';
import { successResponse } from '@/lib/api-response';
import { getDashboardData } from '@/lib/data/get-dashboard-data';
import { handleAPIError, createAuthError } from '@/lib/error-handler';

export async function GET(request: NextRequest) {
  try {
    const supabase = await getSupabase();
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session) {
      return handleAPIError(createAuthError());
    }

    const user = session.user;

    // Parse query parameters
    const url = new URL(request.url);
    const page = parseInt(url.searchParams.get('page') || '1');
    const limit = parseInt(url.searchParams.get('limit') || '10');

    const dashboardData = await getDashboardData(user.id, page, limit);
    return successResponse(dashboardData);
  } catch (error) {
    return handleAPIError(error);
  }
}
