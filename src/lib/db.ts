import { getSupabase } from './supabase';

// Workers-compatible database client - export the actual client
export const db = getSupabase();

// Legacy function export for backward compatibility
export async function getDb() {
  return await getSupabase();
}
