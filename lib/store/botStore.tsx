'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  BotInstance,
  FeatureConfig,
  ActivityLog,
  RateLimitConfig,
  UsageStatPoint,
} from '../types';
import {
  INITIAL_BOT_INSTANCE,
  INITIAL_FEATURES,
  INITIAL_LOGS,
  INITIAL_RATE_LIMIT,
  INITIAL_USAGE_STATS,
} from '../mockData';

interface BotContextType {
  botInstance: BotInstance;
  features: FeatureConfig[];
  logs: ActivityLog[];
  rateLimit: RateLimitConfig;
  stats: UsageStatPoint[];
  // Actions
  toggleFeature: (featureId: string) => void;
  updateFeatureTrigger: (featureId: string, newTrigger: string) => void;
  updateFeatureSettings: (featureId: string, settings: any) => void;
  connectBot: (nomorWa?: string) => void;
  disconnectBot: () => void;
  setConnecting: () => void;
  addLog: (log: Omit<ActivityLog, 'id' | 'created_at'>) => void;
  clearLogs: () => void;
  updateRateLimit: (updates: Partial<RateLimitConfig>) => void;
  // Simulator helpers
  lastExecutedTime: number;
  executeSimulatedCommand: (
    sender: string,
    messageText: string
  ) => { response: string; success: boolean; rateLimited?: boolean };
}

const BotContext = createContext<BotContextType | undefined>(undefined);

export function BotProvider({ children }: { children: React.ReactNode }) {
  const [botInstance, setBotInstance] = useState<BotInstance>(INITIAL_BOT_INSTANCE);
  const [features, setFeatures] = useState<FeatureConfig[]>(INITIAL_FEATURES);
  const [logs, setLogs] = useState<ActivityLog[]>(INITIAL_LOGS);
  const [rateLimit, setRateLimit] = useState<RateLimitConfig>(INITIAL_RATE_LIMIT);
  const [stats] = useState<UsageStatPoint[]>(INITIAL_USAGE_STATS);
  const [lastExecutedTime, setLastExecutedTime] = useState<number>(0);

  // Toggle module on/off
  const toggleFeature = (featureId: string) => {
    setFeatures((prev) =>
      prev.map((f) => {
        if (f.id === featureId) {
          const nextState = !f.is_enabled;
          // Log the toggle change
          addLog({
            feature_key: f.feature_key,
            feature_name: f.name,
            command: `[SYS] Module ${f.name} toggled ${nextState ? 'ON' : 'OFF'}`,
            sender_masked: 'System Admin',
            status: 'success',
            execution_time_ms: 10,
            detail: `Status fitur diubah menjadi ${nextState ? 'Aktif' : 'Nonaktif'} melalui panel kendali.`,
          });
          return { ...f, is_enabled: nextState };
        }
        return f;
      })
    );
  };

  const updateFeatureTrigger = (featureId: string, newTrigger: string) => {
    setFeatures((prev) =>
      prev.map((f) =>
        f.id === featureId
          ? { ...f, command_trigger: newTrigger.trim() || f.command_trigger }
          : f
      )
    );
  };

  const updateFeatureSettings = (featureId: string, settings: any) => {
    setFeatures((prev) =>
      prev.map((f) =>
        f.id === featureId
          ? { ...f, extra_settings: { ...f.extra_settings, ...settings } }
          : f
      )
    );
  };

  const connectBot = (nomorWa = '+62 812-***-9081') => {
    setBotInstance({
      id: 'inst-' + Math.random().toString(36).substring(2, 8),
      nomor_wa: nomorWa,
      status: 'connected',
      session_name: 'kendali_primary_worker',
      connected_at: new Date().toISOString(),
      battery_level: 98,
      push_name: 'Kendali Assistant',
      uptime_seconds: 1,
    });
    addLog({
      feature_key: 'system',
      feature_name: 'Koneksi Baileys',
      command: `[SYS] Device Pair Success (${nomorWa})`,
      sender_masked: 'System Core',
      status: 'success',
      execution_time_ms: 320,
      detail: 'Socket WhatsApp Multi-Device terhubung stabil. Session auth tersimpan.',
    });
  };

  const setConnecting = () => {
    setBotInstance((prev) => ({
      ...prev,
      status: 'connecting',
    }));
  };

  const disconnectBot = () => {
    setBotInstance((prev) => ({
      ...prev,
      nomor_wa: null,
      status: 'disconnected',
      connected_at: null,
      uptime_seconds: 0,
    }));
    addLog({
      feature_key: 'system',
      feature_name: 'Koneksi Baileys',
      command: '[SYS] Disconnected by user',
      sender_masked: 'System Core',
      status: 'success',
      execution_time_ms: 50,
      detail: 'Sesi WhatsApp di-logout dari panel kendali.',
    });
  };

  const addLog = (logItem: Omit<ActivityLog, 'id' | 'created_at'>) => {
    const newLog: ActivityLog = {
      ...logItem,
      id: 'log-' + Date.now() + '-' + Math.floor(Math.random() * 1000),
      created_at: new Date().toISOString(),
    };
    setLogs((prev) => [newLog, ...prev.slice(0, 49)]);
  };

  const clearLogs = () => {
    setLogs([]);
  };

  const updateRateLimit = (updates: Partial<RateLimitConfig>) => {
    setRateLimit((prev) => ({ ...prev, ...updates }));
  };

  // Execute a command from the Simulator
  const executeSimulatedCommand = (
    sender: string,
    messageText: string
  ): { response: string; success: boolean; rateLimited?: boolean } => {
    const now = Date.now();
    const maskedSender =
      sender.length > 7
        ? sender.slice(0, 5) + '***' + sender.slice(-3)
        : sender || '62812***777';

    // Check rate limit
    const cooldownMs = rateLimit.cooldown_seconds * 1000;
    if (now - lastExecutedTime < cooldownMs) {
      const waitSec = ((cooldownMs - (now - lastExecutedTime)) / 1000).toFixed(1);
      const rateLimitMsg = `⚠️ [Rate Limit] Harap tunggu ${waitSec} detik lagi sebelum mengirim perintah berikutnya. (§8 Anti-Abuse Protection)`;

      addLog({
        feature_key: 'anti_abuse',
        feature_name: 'Rate Limiter',
        command: messageText,
        sender_masked: maskedSender,
        status: 'rate_limited',
        execution_time_ms: 8,
        detail: `Ditolak oleh middleware rate-limiting. Cooldown aktif: ${rateLimit.cooldown_seconds}s.`,
      });

      return { response: rateLimitMsg, success: false, rateLimited: true };
    }

    setLastExecutedTime(now);

    const cleanMsg = messageText.trim();
    const lower = cleanMsg.toLowerCase();
    const prefix = rateLimit.command_prefix;

    // Check bot connection
    if (botInstance.status !== 'connected') {
      return {
        response: '❌ Bot saat ini dalam status OFFLINE/Terputus. Buka menu "Koneksi Bot" untuk menghubungkan nomor WhatsApp terlebih dahulu.',
        success: false,
      };
    }

    // Command matching
    // 1. Sticker maker
    const stickerFeat = features.find((f) => f.feature_key === 'sticker_maker');
    if (
      stickerFeat &&
      (lower.startsWith(stickerFeat.command_trigger) ||
        stickerFeat.aliases.some((a) => lower.startsWith(a)))
    ) {
      if (!stickerFeat.is_enabled) {
        return {
          response: '⚠️ Modul "Stiker Maker" sedang dinonaktifkan oleh administrator bot.',
          success: false,
        };
      }
      addLog({
        feature_key: 'sticker_maker',
        feature_name: 'Stiker Maker',
        command: cleanMsg,
        sender_masked: maskedSender,
        status: 'success',
        execution_time_ms: 220,
        detail: `Stiker WebP 512x512 dibuat [Pack: ${stickerFeat.extra_settings.pack_name || 'Kendali'} | Author: ${stickerFeat.extra_settings.author_name || 'Bot'}]`,
      });
      return {
        response: `✅ [Stiker Maker Sukses]\nGambar berhasil dikonversi ke format WebP 512x512!\n🏷️ Pack: "${stickerFeat.extra_settings.pack_name}"\n✍️ Author: "${stickerFeat.extra_settings.author_name}"\n⚡ Diproses dalam 220ms.`,
        success: true,
      };
    }

    // 2. Sticker to media
    const toMediaFeat = features.find((f) => f.feature_key === 'sticker_to_media');
    if (
      toMediaFeat &&
      (lower.startsWith(toMediaFeat.command_trigger) ||
        toMediaFeat.aliases.some((a) => lower.startsWith(a)))
    ) {
      if (!toMediaFeat.is_enabled) {
        return {
          response: '⚠️ Modul "Stiker to Media" sedang dinonaktifkan oleh administrator bot.',
          success: false,
        };
      }
      addLog({
        feature_key: 'sticker_to_media',
        feature_name: 'Stiker to Media',
        command: cleanMsg,
        sender_masked: maskedSender,
        status: 'success',
        execution_time_ms: 190,
        detail: 'Stiker WebP dikonversi balik menjadi file PNG transparan beresolusi tinggi.',
      });
      return {
        response: '🖼️ [Stiker to Media Sukses]\nStiker WebP berhasil diurai kembali menjadi gambar PNG transparan (480 KB).',
        success: true,
      };
    }

    // 3. Downloader
    const dlFeat = features.find((f) => f.feature_key === 'downloader');
    if (
      dlFeat &&
      (lower.startsWith(dlFeat.command_trigger) ||
        dlFeat.aliases.some((a) => lower.startsWith(a)))
    ) {
      if (!dlFeat.is_enabled) {
        return {
          response: '⚠️ Modul "Media Downloader" sedang dinonaktifkan oleh administrator bot.',
          success: false,
        };
      }
      addLog({
        feature_key: 'downloader',
        feature_name: 'Media Downloader',
        command: cleanMsg,
        sender_masked: maskedSender,
        status: 'success',
        execution_time_ms: 1100,
        detail: 'Tautan media diunduh (HD No-Watermark MP4).',
      });
      return {
        response: '📥 [Media Downloader Sukses]\nVideo TikTok / IG Reels berhasil diproses tanpa watermark!\n🎥 Resolusi: 1080p HD\n📦 Ukuran: 4.2 MB',
        success: true,
      };
    }

    // 4. AI Chat
    const aiFeat = features.find((f) => f.feature_key === 'ai_chat');
    if (
      aiFeat &&
      (lower.startsWith(aiFeat.command_trigger) ||
        aiFeat.aliases.some((a) => lower.startsWith(a)))
    ) {
      if (!aiFeat.is_enabled) {
        return {
          response: '⚠️ Modul "AI Chat" sedang dinonaktifkan oleh administrator bot.',
          success: false,
        };
      }
      const prompt = cleanMsg.replace(aiFeat.command_trigger, '').trim();
      addLog({
        feature_key: 'ai_chat',
        feature_name: 'AI Chat Assistant',
        command: cleanMsg,
        sender_masked: maskedSender,
        status: 'success',
        execution_time_ms: 720,
        detail: 'Gemini flash streaming response.',
      });
      return {
        response: `🤖 [Kendali AI]: Halo! Terkait pertanyaanmu: "${prompt || '...'}"\n\nSistem bot Kendali WhatsApp mengusung arsitektur Baileys multi-device socket terisolasi dengan dashboard Next.js modern dan proteksi anti-banned berbasis jeda waktu adaptif. Ada hal lain yang ingin kamu tanyakan?`,
        success: true,
      };
    }

    // 5. Auto Reply check
    const autoFeat = features.find((f) => f.feature_key === 'auto_reply');
    if (autoFeat && autoFeat.is_enabled && autoFeat.extra_settings.auto_replies) {
      const match = autoFeat.extra_settings.auto_replies.find((r) =>
        lower.includes(r.trigger.toLowerCase())
      );
      if (match) {
        addLog({
          feature_key: 'auto_reply',
          feature_name: 'Auto-Reply & FAQ',
          command: cleanMsg,
          sender_masked: maskedSender,
          status: 'success',
          execution_time_ms: 40,
          detail: `Trigger matched: "${match.trigger}"`,
        });
        return {
          response: `💬 ${match.response}`,
          success: true,
        };
      }
    }

    // 6. Menu command
    if (lower === `${prefix}menu` || lower === `${prefix}help` || lower === 'menu') {
      const activeList = features
        .filter((f) => f.is_enabled)
        .map((f) => `• ${f.command_trigger} : ${f.name}`)
        .join('\n');

      addLog({
        feature_key: 'system',
        feature_name: 'Bot Menu',
        command: cleanMsg,
        sender_masked: maskedSender,
        status: 'success',
        execution_time_ms: 30,
        detail: 'Daftar menu command dikirimkan.',
      });

      return {
        response: `⚙️ *KENDALI.BOT — PUSAT KONTROL*\nStatus: ONLINE 🟢\nPrefix: [ ${prefix} ]\n\n*Daftar Modul Aktif:*\n${activeList}\n\nKetik command di atas untuk berinteraksi!`,
        success: true,
      };
    }

    // Fallback unknown
    addLog({
      feature_key: 'unknown',
      feature_name: 'Unknown Command',
      command: cleanMsg,
      sender_masked: maskedSender,
      status: 'failed',
      execution_time_ms: 15,
      detail: `Command tidak dikenali atau modul nonaktif.`,
    });

    return {
      response: `❓ Perintah tidak dikenali. Ketik *${prefix}menu* untuk melihat daftar modul yang aktif di papan kendali.`,
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
        toggleFeature,
        updateFeatureTrigger,
        updateFeatureSettings,
        connectBot,
        disconnectBot,
        setConnecting,
        addLog,
        clearLogs,
        updateRateLimit,
        lastExecutedTime,
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
