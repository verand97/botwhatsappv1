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
    // Ambil session_data lama jika ada untuk di-merge
    let sessionData: Record<string, unknown> = {};
    const existing = await supabase
      .from('bot_instances')
      .select('session_data, nomor_wa, push_name, status, created_at')
      .eq('id', bot.id || 'inst-core')
      .maybeSingle();

    if (existing?.data?.session_data && typeof existing.data.session_data === 'object') {
      sessionData = { ...(existing.data.session_data as Record<string, unknown>) };
    }

    if (bot.session_name !== undefined) sessionData.session_name = bot.session_name;
    if (bot.qr_raw !== undefined) sessionData.qr_raw = bot.qr_raw;
    if (bot.qr_data_url !== undefined) sessionData.qr_data_url = bot.qr_data_url;
    if (bot.pairing_requested_phone !== undefined) sessionData.pairing_requested_phone = bot.pairing_requested_phone;
    if (bot.pairing_code !== undefined) sessionData.pairing_code = bot.pairing_code;

    const { data, error } = await supabase
      .from('bot_instances')
      .upsert(
        {
          id: bot.id || 'inst-core',
          nomor_wa: bot.nomor_wa !== undefined ? bot.nomor_wa : existing?.data?.nomor_wa,
          push_name: bot.push_name !== undefined ? bot.push_name : existing?.data?.push_name,
          status: bot.status || existing?.data?.status || 'disconnected',
          session_data: Object.keys(sessionData).length > 0 ? sessionData : null,
          created_at: bot.connected_at || existing?.data?.created_at || new Date().toISOString(),
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
 * Fetch bot instance status from Supabase
 */
export async function dbGetBotInstance(id: string = 'inst-core'): Promise<Partial<BotInstance> | null> {
  const supabase = getSupabaseClient();
  if (!supabase) return null;

  try {
    const { data, error } = await supabase
      .from('bot_instances')
      .select('*')
      .eq('id', id)
      .maybeSingle();

    if (error || !data) return null;
    return {
      id: data.id,
      nomor_wa: data.nomor_wa || undefined,
      push_name: data.push_name || 'Verand Bot',
      status: data.status || 'disconnected',
      connected_at: data.created_at || undefined,
      session_name: data.session_data?.session_name || 'inst-core',
      qr_raw: data.session_data?.qr_raw || null,
      qr_data_url: data.session_data?.qr_data_url || null,
      pairing_requested_phone: data.session_data?.pairing_requested_phone || null,
      pairing_code: data.session_data?.pairing_code || null,
      uptime_seconds: 0,
    };
  } catch (err) {
    console.warn('[Supabase] Get bot instance exception:', err);
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
