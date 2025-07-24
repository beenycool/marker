import { getSupabase } from './supabase';

// Workers-compatible database client
export async function getDb() {
  return await getSupabase();
}

