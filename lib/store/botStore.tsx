'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import {
  BotInstance,
  FeatureConfig,
  ActivityLog,
  RateLimitConfig,
  UsageStatPoint,
} from '../types';

// REAL initial state without any dummy / fake data
const REAL_INITIAL_BOT: BotInstance = {
  id: 'inst-core',
  nomor_wa: null,
  status: 'disconnected',
  session_name: 'kendali_primary_worker',
  connected_at: null,
  battery_level: undefined,
  push_name: undefined,
  uptime_seconds: 0,
};

const DEFAULT_REAL_FEATURES: FeatureConfig[] = [
  {
    id: 'feat-sticker-maker',
    feature_key: 'sticker_maker',
    name: 'Stiker Maker',
    tagline: 'Konversi otomatis foto/video pendek ke stiker WhatsApp WebP 512x512 + custom EXIF pack',
    category: 'core',
    is_enabled: true,
    command_trigger: '!sticker',
    aliases: ['!s', '!stiker', '!swm'],
    extra_settings: {
      pack_name: 'Kendali Pack',
      author_name: 'Made with Kendali.Bot',
      max_duration_sec: 10,
      quality: 'high',
    },
  },
  {
    id: 'feat-sticker-to-media',
    feature_key: 'sticker_to_media',
    name: 'Stiker to Media',
    tagline: 'Ubah kembali stiker WebP menjadi foto PNG/JPG atau animasi GIF/MP4',
    category: 'core',
    is_enabled: true,
    command_trigger: '!tomedia',
    aliases: ['!toimg', '!togif'],
    extra_settings: {
      quality: 'high',
    },
  },
  {
    id: 'feat-downloader',
    feature_key: 'downloader',
    name: 'Media Downloader',
    tagline: 'Unduh video atau audio dari tautan TikTok, Instagram Reels, dan YouTube',
    category: 'media',
    is_enabled: true,
    command_trigger: '!dl',
    aliases: ['!tt', '!ig', '!yt'],
    extra_settings: {
      supported_platforms: ['TikTok', 'Instagram', 'YouTube'],
    },
  },
  {
    id: 'feat-auto-reply',
    feature_key: 'auto_reply',
    name: 'Auto-Reply & FAQ',
    tagline: 'Balas pesan otomatis berdasarkan kata kunci tertentu untuk admin grup atau toko',
    category: 'utility',
    is_enabled: true,
    command_trigger: '!faq',
    aliases: ['!auto', '!info'],
    extra_settings: {
      auto_replies: [
        { trigger: 'halo', response: 'Halo! Bot Kendali aktif 24/7. Ketik !menu untuk melihat fitur.' },
        { trigger: 'info', response: 'Kendali.Bot adalah platform kendali bot WhatsApp multifungsi.' },
      ],
    },
  },
  {
    id: 'feat-ai-chat',
    feature_key: 'ai_chat',
    name: 'AI Chat Assistant',
    tagline: 'Tanya jawab cerdas langsung di WhatsApp menggunakan model AI Gemini / LLM',
    category: 'ai_fun',
    is_enabled: true,
    command_trigger: '!ai',
    aliases: ['!tanya', '!ask'],
    is_beta: true,
    extra_settings: {
      ai_system_prompt: 'Kamu adalah asisten bot WhatsApp ramah, ringkas, dan berbahasa Indonesia gaul santun.',
    },
  },
  {
    id: 'feat-group-tools',
    feature_key: 'group_tools',
    name: 'Grup Management Tools',
    tagline: 'Sambutan member baru, deteksi anti-link spam, dan utilitas moderasi admin',
    category: 'utility',
    is_enabled: false,
    command_trigger: '!group',
    aliases: ['!welcome'],
    extra_settings: {
      anti_link: true,
      welcome_message: 'Selamat datang di grup!',
    },
  },
];

const DEFAULT_REAL_RATE_LIMIT: RateLimitConfig = {
  cooldown_seconds: 3,
  command_prefix: '!',
  max_per_minute: 20,
  anti_spam_active: true,
  blacklisted_senders: [],
  whitelist_groups_only: false,
  whitelisted_groups: [],
};

interface BotContextType {
  botInstance: BotInstance;
  features: FeatureConfig[];
  logs: ActivityLog[];
  rateLimit: RateLimitConfig;
  stats: UsageStatPoint[];
  qrDataUrl: string | null;
  qrRaw: string | null;
  isBackendConnected: boolean;
  // Actions
  toggleFeature: (featureId: string) => void;
  updateFeatureTrigger: (featureId: string, newTrigger: string) => void;
  updateFeatureSettings: (featureId: string, settings: any) => void;
  connectBot: () => void;
  disconnectBot: () => void;
  setConnecting: () => void;
  addLog: (log: Omit<ActivityLog, 'id' | 'created_at'>) => void;
  clearLogs: () => void;
  updateRateLimit: (updates: Partial<RateLimitConfig>) => void;
  executeSimulatedCommand: (
    sender: string,
    messageText: string
  ) => { response: string; success: boolean; rateLimited?: boolean };
}

const BotContext = createContext<BotContextType | undefined>(undefined);

export function BotProvider({ children }: { children: React.ReactNode }) {
  const [botInstance, setBotInstance] = useState<BotInstance>(REAL_INITIAL_BOT);
  const [features, setFeatures] = useState<FeatureConfig[]>(DEFAULT_REAL_FEATURES);
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [rateLimit, setRateLimit] = useState<RateLimitConfig>(DEFAULT_REAL_RATE_LIMIT);
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);
  const [qrRaw, setQrRaw] = useState<string | null>(null);
  const [isBackendConnected, setIsBackendConnected] = useState(false);
  const [lastExecutedTime, setLastExecutedTime] = useState<number>(0);
  const [stats, setStats] = useState<UsageStatPoint[]>([
    { date: 'Hari Ini', commands_count: 0, stickers_created: 0, media_downloaded: 0, ai_chats: 0 },
  ]);

  // Sync real status from /api/bot
  const syncFromBackend = useCallback(async () => {
    try {
      const res = await fetch('/api/bot', { cache: 'no-store' });
      if (!res.ok) return;
      const json = await res.json();
      if (!json.success || !json.data) return;

      const d = json.data;
      setIsBackendConnected(true);

      setBotInstance((prev) => ({
        ...prev,
        status: d.status,
        nomor_wa: d.nomor_wa,
        push_name: d.push_name,
        connected_at: d.connected_at,
      }));

      setQrDataUrl(d.qr_data_url || null);
      setQrRaw(d.qr_raw || null);

      if (d.features && Array.isArray(d.features)) {
        setFeatures(d.features);
      }
      if (d.logs && Array.isArray(d.logs)) {
        setLogs(d.logs);
      }
      if (d.rateLimit) {
        setRateLimit(d.rateLimit);
      }

      setStats([
        {
          date: 'Hari Ini',
          commands_count: d.commands_count_today || 0,
          stickers_created: d.stickers_count_today || 0,
          media_downloaded: 0,
          ai_chats: 0,
        },
      ]);
    } catch (e) {
      // Backend not reached or offline
    }
  }, []);

  // Poll real state
  useEffect(() => {
    syncFromBackend();
    const interval = setInterval(syncFromBackend, 2500);
    return () => clearInterval(interval);
  }, [syncFromBackend]);

  // Real Connect Action
  const connectBot = async () => {
    setBotInstance((prev) => ({ ...prev, status: 'connecting' }));
    try {
      await fetch('/api/bot', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'start' }),
      });
      syncFromBackend();
    } catch (err) {
      console.error('Error connecting bot:', err);
    }
  };

  const setConnecting = () => {
    setBotInstance((prev) => ({ ...prev, status: 'connecting' }));
  };

  // Real Disconnect Action
  const disconnectBot = async () => {
    try {
      await fetch('/api/bot', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'disconnect' }),
      });
      setBotInstance(REAL_INITIAL_BOT);
      setQrDataUrl(null);
      setQrRaw(null);
      syncFromBackend();
    } catch (err) {
      console.error('Error disconnecting bot:', err);
    }
  };

  // Real Toggle Feature Action
  const toggleFeature = async (featureId: string) => {
    // Optimistic update
    setFeatures((prev) =>
      prev.map((f) => (f.id === featureId ? { ...f, is_enabled: !f.is_enabled } : f))
    );

    try {
      await fetch('/api/bot', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'toggleFeature',
          payload: { featureId },
        }),
      });
      syncFromBackend();
    } catch (e) {
      console.error(e);
    }
  };

  const updateFeatureTrigger = async (featureId: string, newTrigger: string) => {
    setFeatures((prev) =>
      prev.map((f) => (f.id === featureId ? { ...f, command_trigger: newTrigger } : f))
    );

    try {
      await fetch('/api/bot', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'updateFeature',
          payload: { featureId, updates: { command_trigger: newTrigger } },
        }),
      });
      syncFromBackend();
    } catch (e) {
      console.error(e);
    }
  };

  const updateFeatureSettings = async (featureId: string, extra_settings: any) => {
    setFeatures((prev) =>
      prev.map((f) =>
        f.id === featureId
          ? { ...f, extra_settings: { ...f.extra_settings, ...extra_settings } }
          : f
      )
    );

    try {
      await fetch('/api/bot', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'updateFeature',
          payload: { featureId, updates: { extra_settings } },
        }),
      });
      syncFromBackend();
    } catch (e) {
      console.error(e);
    }
  };

  const updateRateLimit = async (updates: Partial<RateLimitConfig>) => {
    setRateLimit((prev) => ({ ...prev, ...updates }));

    try {
      await fetch('/api/bot', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'updateRateLimit',
          payload: updates,
        }),
      });
      syncFromBackend();
    } catch (e) {
      console.error(e);
    }
  };

  const clearLogs = async () => {
    setLogs([]);
    try {
      await fetch('/api/bot', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'clearLogs' }),
      });
    } catch (e) {
      console.error(e);
    }
  };

  const addLog = (logItem: Omit<ActivityLog, 'id' | 'created_at'>) => {
    const newLog: ActivityLog = {
      ...logItem,
      id: 'log-' + Date.now(),
      created_at: new Date().toISOString(),
    };
    setLogs((prev) => [newLog, ...prev]);
  };

  // Local Chat Simulator Execution
  const executeSimulatedCommand = (
    sender: string,
    messageText: string
  ): { response: string; success: boolean; rateLimited?: boolean } => {
    const now = Date.now();
    const maskedSender =
      sender.length > 7
        ? sender.slice(0, 5) + '***' + sender.slice(-3)
        : sender || '62812***000';

    const cooldownMs = rateLimit.cooldown_seconds * 1000;
    if (now - lastExecutedTime < cooldownMs) {
      const waitSec = ((cooldownMs - (now - lastExecutedTime)) / 1000).toFixed(1);
      return {
        response: `⚠️ [Rate Limit Aktif] Harap tunggu ${waitSec} detik lagi sebelum mengirim perintah berikutnya. (§8 Anti-Abuse Protection)`,
        success: false,
        rateLimited: true,
      };
    }

    setLastExecutedTime(now);

    const cleanMsg = messageText.trim();
    const lower = cleanMsg.toLowerCase();
    const prefix = rateLimit.command_prefix;

    if (botInstance.status !== 'connected') {
      return {
        response: '⚠️ Bot saat ini dalam status OFFLINE. Silakan hubungkan nomor WhatsApp terlebih dahulu di menu "Koneksi Bot".',
        success: false,
      };
    }

    // Sticker maker
    const stickerFeat = features.find((f) => f.feature_key === 'sticker_maker');
    if (
      stickerFeat &&
      (lower.startsWith(stickerFeat.command_trigger) ||
        stickerFeat.aliases.some((a) => lower.startsWith(a)))
    ) {
      if (!stickerFeat.is_enabled) {
        return { response: '⚠️ Modul Stiker Maker sedang dinonaktifkan.', success: false };
      }
      return {
        response: `✅ [Stiker Maker Sukses]\nGambar berhasil dikonversi ke format WebP 512x512!\n🏷️ Pack: "${stickerFeat.extra_settings.pack_name}"\n✍️ Author: "${stickerFeat.extra_settings.author_name}"`,
        success: true,
      };
    }

    // Menu
    if (lower === `${prefix}menu` || lower === 'menu') {
      const activeList = features
        .filter((f) => f.is_enabled)
        .map((f) => `• ${f.command_trigger} : ${f.name}`)
        .join('\n');
      return {
        response: `⚙️ *KENDALI.BOT — MENU AKTIF*\nStatus: ONLINE 🟢\nPrefix: [ ${prefix} ]\n\n*Daftar Modul:*\n${activeList}`,
        success: true,
      };
    }

    // AI
    const aiFeat = features.find((f) => f.feature_key === 'ai_chat');
    if (aiFeat && lower.startsWith(aiFeat.command_trigger)) {
      const prompt = cleanMsg.replace(aiFeat.command_trigger, '').trim();
      return {
        response: `🤖 [Kendali AI]: Menjawab: "${prompt || '...'}"\n\nSistem beroperasi normal tanpa data dummy.`,
        success: true,
      };
    }

    return {
      response: `❓ Perintah tidak dikenali. Ketik *${prefix}menu* untuk melihat daftar modul aktif.`,
      success: false,
    };
  };

  return (
    <BotContext.Provider
      value={{
        botInstance,
        features,
        logs,
        rateLimit,
        stats,
        qrDataUrl,
        qrRaw,
        isBackendConnected,
        toggleFeature,
        updateFeatureTrigger,
        updateFeatureSettings,
        connectBot,
        disconnectBot,
        setConnecting,
        addLog,
        clearLogs,
        updateRateLimit,
        executeSimulatedCommand,
      }}
    >
      {children}
    </BotContext.Provider>
  );
}

export function useBot() {
  const context = useContext(BotContext);
  if (!context) {
    throw new Error('useBot must be used within a BotProvider');
  }
  return context;
}
