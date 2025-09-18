import { createClient } from '@supabase/supabase-js';
import type { Database } from './database.types';

// Create admin client (server-side only)
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

export const adminSupabase = createClient<Database>(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

export interface AdminUser {
  id: string;
  email: string;
  full_name: string | null;
  user_type: string | null;
  is_admin: boolean | null;
  created_at: string | null;
  last_sign_in_at: string | null;
  stripe_customer_id: string | null;
  has_used_trial: boolean | null;
  trial_ends_at: string | null;
}

export interface AdminSubscription {
  id: string;
  user_id: string;
  plan: string;
  status: string;
  current_period_end: string | null;
  created_at: string | null;
  cancel_at: string | null;
  stripe_subscription_id: string | null;
  user_email?: string;
  user_name?: string;
}

export interface LoginAttempt {
  id: string;
  user_id: string | null;
  ip_address: string;
  user_agent: string | null;
  success: boolean;
  created_at: string | null;
  user_email?: string;
}

export interface AuditLog {
  id: string;
  user_id: string | null;
  action: string;
  table_name: string;
  record_id: string | null;
  old_data: any;
  new_data: any;
  ip_address: string | null;
  user_agent: string | null;
  created_at: string | null;
}

/**
 * Get all users with admin data
 */
export async function getAdminUsers(): Promise<AdminUser[]> {
  const { data: profiles, error } = await adminSupabase
    .from('profiles')
    .select(`
      id,
      email,
      full_name,
      user_type,
      is_admin,
      created_at,
      stripe_customer_id,
      has_used_trial,
      trial_ends_at
    `)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching admin users:', error);
    return [];
  }

  // Get auth users for last_sign_in_at
  const { data: authUsers } = await adminSupabase.auth.admin.listUsers();
  
  const usersWithAuth = profiles?.map(profile => {
    const authUser = authUsers.users.find(u => u.id === profile.id);
    return {
      ...profile,
      last_sign_in_at: authUser?.last_sign_in_at || null
    };
  }) || [];

  return usersWithAuth;
}

/**
 * Get all subscriptions with user data
 */
export async function getAdminSubscriptions(): Promise<AdminSubscription[]> {
  const { data: subscriptions, error } = await adminSupabase
    .from('subscriptions')
    .select(`
      id,
      user_id,
      plan,
      status,
      current_period_end,
      created_at,
      cancel_at,
      stripe_subscription_id,
      profiles:user_id (
        email,
        full_name
      )
    `)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching admin subscriptions:', error);
    return [];
  }

  return subscriptions?.map(sub => ({
    ...sub,
    user_email: sub.profiles?.email || '',
    user_name: sub.profiles?.full_name || ''
  })) || [];
}

/**
 * Get login attempts with user data
 */
export async function getLoginAttempts(): Promise<LoginAttempt[]> {
  const { data: attempts, error } = await adminSupabase
    .from('auth_login_attempts')
    .select(`
      id,
      user_id,
      ip_address,
      user_agent,
      success,
      created_at
    `)
    .order('created_at', { ascending: false })
    .limit(100);

  if (error) {
    console.error('Error fetching login attempts:', error);
    return [];
  }

  // Get user emails for attempts
  const userIds = attempts?.filter(a => a.user_id).map(a => a.user_id) || [];
  const { data: profiles } = await adminSupabase
    .from('profiles')
    .select('id, email')
    .in('id', userIds);

  return attempts?.map(attempt => ({
    ...attempt,
    ip_address: attempt.ip_address as string,
    user_email: profiles?.find(p => p.id === attempt.user_id)?.email || null
  })) || [];
}

/**
 * Get audit logs
 */
export async function getAuditLogs(): Promise<AuditLog[]> {
  const { data: logs, error } = await adminSupabase
    .from('audit_logs')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(100);

  if (error) {
    console.error('Error fetching audit logs:', error);
    return [];
  }

  return logs || [];
}

/**
 * Get auth settings (for security settings)
 */
export async function getAuthSettings(): Promise<Record<string, string>> {
  const { data: settings, error } = await adminSupabase
    .from('auth_settings')
    .select('setting_name, setting_value');

  if (error) {
    console.error('Error fetching auth settings:', error);
    return {};
  }

  const settingsMap: Record<string, string> = {};
  settings?.forEach(setting => {
    settingsMap[setting.setting_name] = setting.setting_value;
  });

  return settingsMap;
}

/**
 * Update auth setting
 */
export async function updateAuthSetting(settingName: string, settingValue: string): Promise<boolean> {
  const { error } = await adminSupabase
    .from('auth_settings')
    .upsert({ 
      setting_name: settingName, 
      setting_value: settingValue,
      updated_at: new Date().toISOString()
    });

  if (error) {
    console.error('Error updating auth setting:', error);
    return false;
  }

  return true;
}

/**
 * Get dashboard statistics
 */
export async function getDashboardStats() {
  // Users count
  const { count: usersCount } = await adminSupabase
    .from('profiles')
    .select('*', { count: 'exact', head: true });

  // Active subscriptions count
  const { count: activeSubsCount } = await adminSupabase
    .from('subscriptions')
    .select('*', { count: 'exact', head: true })
    .in('status', ['active', 'trialing']);

  // Recent subscriptions for revenue calculation
  const { data: recentSubs } = await adminSupabase
    .from('subscriptions')
    .select('plan, status, created_at')
    .eq('status', 'active')
    .gte('created_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString());

  // Calculate monthly revenue (simplified)
  const monthlyRevenue = recentSubs?.reduce((total, sub) => {
    switch (sub.plan) {
      case 'pro_business': return total + 29.99;
      case 'enterprise': return total + 99.99;
      default: return total;
    }
  }, 0) || 0;

  return {
    totalUsers: usersCount || 0,
    activeSubscriptions: activeSubsCount || 0,
    monthlyRevenue: monthlyRevenue,
    freeUsers: (usersCount || 0) - (activeSubsCount || 0)
  };
}
