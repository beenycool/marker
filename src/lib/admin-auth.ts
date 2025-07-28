import { logger } from './logger';
import { getCurrentUser } from './auth';
import { getSupabase } from './supabase';

export interface AdminUser {
  id: string;
  email: string;
  role: 'admin' | 'moderator';
  created_at: string;
  last_login?: string;
}

export async function isAdmin(): Promise<boolean> {
  try {
    const user = await getCurrentUser();
    if (!user) return false;

    const supabase = await getSupabase();
    const { data: adminUser } = await supabase
      .from('admin_users')
      .select('*')
      .eq('email', user.email)
      .single();

    return Boolean(adminUser);
  } catch (error) {
    logger.error('Error checking admin status:', error);
    return false;
  }
}

export async function requireAdmin(): Promise<AdminUser> {
  const user = await getCurrentUser();
  if (!user) {
    throw new Error('Authentication required');
  }

  const supabase = await getSupabase();
  const { data: adminUser, error } = await supabase
    .from('admin_users')
    .select('*')
    .eq('email', user.email)
    .single();

  if (error || !adminUser) {
    throw new Error('Admin access required');
  }

  // Update last login
  await supabase
    .from('admin_users')
    .update({ last_login: new Date().toISOString() })
    .eq('id', adminUser.id);

  return adminUser;
}

export async function getAdminUser(): Promise<AdminUser | null> {
  try {
    const user = await getCurrentUser();
    if (!user) return null;

    const supabase = await getSupabase();
    const { data: adminUser } = await supabase
      .from('admin_users')
      .select('*')
      .eq('email', user.email)
      .single();

    return adminUser || null;
  } catch (error) {
    logger.error('Error getting admin user:', error);
    return null;
  }
}

export async function hasPermission(permission: string): Promise<boolean> {
  const adminUser = await getAdminUser();
  if (!adminUser) return false;

  // Admin has all permissions, moderator has limited permissions
  if (adminUser.role === 'admin') return true;

  // Define moderator permissions
  const moderatorPermissions = [
    'view_users',
    'view_submissions',
    'view_analytics',
    'manage_prompts',
  ];

  return moderatorPermissions.includes(permission);
}
