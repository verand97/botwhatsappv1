// lib/supabase/client.ts
// Supabase Client integration for bot sessions, configurations, logs, and rate limit states (§7)

import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { FeatureConfig, ActivityLog, BotInstance } from '../types';

export interface SupabaseConfig {
  supabaseUrl: string;
  supabaseAnonKey: string;
  isConfigured: boolean;
}

let cachedClient: SupabaseClient | null = null;

export function getSupabaseConfig(): SupabaseConfig {
  let url = (process.env.NEXT_PUBLIC_SUPABASE_URL || '').trim();
  if (url.endsWith('/rest/v1') || url.endsWith('/rest/v1/')) {
    url = url.replace(/\/rest\/v1\/?$/, '');
  }
  url = url.replace(/\/+$/, '');

  const key = (
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    ''
  ).trim();

  return {
    supabaseUrl: url,
    supabaseAnonKey: key,
    isConfigured: Boolean(url && key),
  };
}

export function getSupabaseClient(): SupabaseClient | null {
  const { supabaseUrl, supabaseAnonKey, isConfigured } = getSupabaseConfig();
  if (!isConfigured) return null;

  if (!cachedClient) {
    cachedClient = createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: false,
      },
    });
  }
  return cachedClient;
}

/**
 * Persist bot instance connection state to Supabase
 */
export async function dbSaveBotInstance(bot: Partial<BotInstance>) {
  const supabase = getSupabaseClient();
  if (!supabase) return null;

  try {
    const { data, error } = await supabase
      .from('bot_instances')
      .upsert(
        {
          id: bot.id || 'inst-core',
          nomor_wa: bot.nomor_wa,
          status: bot.status || 'disconnected',
          session_data: bot.session_name ? { session_name: bot.session_name } : null,
          created_at: bot.connected_at || new Date().toISOString(),
        },
        { onConflict: 'id' }
      )
      .select()
      .single();

    if (error) console.warn('[Supabase] Save instance error:', error.message);
    return data;
  } catch (err) {
    console.warn('[Supabase] Save instance exception:', err);
    return null;
  }
}

/**
 * Persist feature configs to Supabase
 */
export async function dbSaveFeatureConfigs(features: FeatureConfig[]) {
  const supabase = getSupabaseClient();
  if (!supabase) return null;

  try {
    const rows = features.map((f) => ({
      id: f.id,
      feature_key: f.feature_key,
      is_enabled: f.is_enabled,
      command_trigger: f.command_trigger,
      extra_settings: f.extra_settings,
      updated_at: new Date().toISOString(),
    }));

    const { error } = await supabase.from('feature_configs').upsert(rows, { onConflict: 'id' });
    if (error) console.warn('[Supabase] Save features error:', error.message);
    return !error;
  } catch (err) {
    console.warn('[Supabase] Save features exception:', err);
    return false;
  }
}

/**
 * Load feature configs from Supabase
 */
export async function dbLoadFeatureConfigs(): Promise<FeatureConfig[] | null> {
  const supabase = getSupabaseClient();
  if (!supabase) return null;

  try {
    const { data, error } = await supabase.from('feature_configs').select('*');
    if (error || !data || data.length === 0) return null;
    return data as FeatureConfig[];
  } catch (err) {
    console.warn('[Supabase] Load features exception:', err);
    return null;
  }
}

/**
 * Insert activity log to Supabase
 */
export async function dbInsertActivityLog(log: ActivityLog) {
  const supabase = getSupabaseClient();
  if (!supabase) return null;

  try {
    const { error } = await supabase.from('activity_logs').insert({
      id: log.id,
      feature_key: log.feature_key,
      sender_masked: log.sender_masked,
      command: log.command,
      status: log.status,
      execution_time_ms: log.execution_time_ms,
      created_at: log.created_at,
    });
    if (error) console.warn('[Supabase] Insert log error:', error.message);
  } catch (err) {
    console.warn('[Supabase] Insert log exception:', err);
  }
}

/**
 * Get recent activity logs from Supabase
 */
export async function dbGetActivityLogs(limit: number = 50): Promise<ActivityLog[] | null> {
  const supabase = getSupabaseClient();
  if (!supabase) return null;

  try {
    const { data, error } = await supabase
      .from('activity_logs')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error || !data) return null;
    return data as ActivityLog[];
  } catch (err) {
    console.warn('[Supabase] Get logs exception:', err);
    return null;
  }
}
