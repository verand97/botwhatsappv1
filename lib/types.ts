export type BotConnectionStatus = 'disconnected' | 'connecting' | 'connected' | 'error';

export interface BotInstance {
  id: string;
  nomor_wa: string | null;
  status: BotConnectionStatus;
  session_name: string;
  connected_at: string | null;
  battery_level?: number;
  push_name?: string;
  uptime_seconds: number;
}

export type FeatureCategory = 'core' | 'media' | 'utility' | 'ai_fun';

export interface FeatureConfig {
  id: string;
  feature_key: string;
  name: string;
  tagline: string;
  category: FeatureCategory;
  is_enabled: boolean;
  command_trigger: string;
  aliases: string[];
  is_beta?: boolean;
  extra_settings: {
    pack_name?: string;
    author_name?: string;
    max_duration_sec?: number;
    quality?: 'high' | 'medium' | 'low';
    supported_platforms?: string[];
    ai_system_prompt?: string;
    auto_replies?: { trigger: string; response: string }[];
    welcome_message?: string;
    anti_link?: boolean;
  };
}

export interface ActivityLog {
  id: string;
  feature_key: string;
  feature_name: string;
  command: string;
  sender_masked: string;
  status: 'success' | 'rate_limited' | 'failed';
  execution_time_ms: number;
  created_at: string;
  detail?: string;
}

export interface RateLimitConfig {
  cooldown_seconds: number;
  command_prefix: string;
  max_per_minute: number;
  anti_spam_active: boolean;
  blacklisted_senders: string[];
  whitelist_groups_only: boolean;
  whitelisted_groups: string[];
}

export interface UsageStatPoint {
  date: string;
  commands_count: number;
  stickers_created: number;
  media_downloaded: number;
  ai_chats: number;
}
