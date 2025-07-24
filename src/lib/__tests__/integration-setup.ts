import { createClient } from '@supabase/supabase-js';
import { getEnvVar } from '../cloudflare-env';

// Create Supabase client for integration tests
export async function createTestClient() {
  const supabaseUrl = 'http://localhost:5433';
  const supabaseAnonKey = 'testpass';
  
  return createClient(supabaseUrl, supabaseAnonKey);
}