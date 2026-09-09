import fs from 'fs';
import path from 'path';
import { NextResponse } from 'next/server';
import {
  dbSaveFeatureConfigs,
  dbGetActivityLogs,
  dbGetBotInstance,
  dbLoadFeatureConfigs,
  dbSaveBotInstance,
} from '@/lib/supabase/client';
import { DEFAULT_FEATURES, DEFAULT_RATE_LIMIT } from '@/lib/constants';
import { ActivityLog, FeatureConfig, RateLimitConfig } from '@/lib/types';

interface BotConfigFile {
  features?: FeatureConfig[];
  rateLimit?: RateLimitConfig;
}

export const dynamic = 'force-dynamic';

// Loader untuk botManager instance
async function getLazyBotManager() {
  try {
    const mod = await import('@/lib/bot/botManager');
    return mod.botManager;
  } catch (err) {
    console.warn('[API/Bot] Lazy import botManager error:', err);
    return null;
  }
}

export async function GET() {
  try {
    let botStatus = 'disconnected';
    let nomorWa: string | null = null;
    let pushName: string | null = 'Verand Bot';
    let connectedAt: string | null = null;
    let qrRaw: string | null = null;
    let qrDataUrl: string | null = null;
    let commandsCountToday = 0;
    let stickersCountToday = 0;
    let mediaDownloadedToday = 0;

    // 1. Ambil status live langsung dari botManager in-memory (singleton di dalam Next.js)
    const botManager = await getLazyBotManager();
    if (botManager) {
      const live = botManager.getStatus();
      if (live.status === 'connected') {
        botStatus = 'connected';
        nomorWa = live.nomor_wa;
        pushName = live.push_name || pushName;
        connectedAt = live.connected_at;
        qrRaw = null;
        qrDataUrl = null;
      } else if (live.status === 'connecting') {
        botStatus = 'connecting';
      }
      if (live.qr_raw) qrRaw = live.qr_raw;
      if (live.qr_data_url) qrDataUrl = live.qr_data_url;
      if (live.commands_count_today) commandsCountToday = live.commands_count_today;
      if (live.stickers_count_today) stickersCountToday = live.stickers_count_today;
      if (live.media_downloaded_today) mediaDownloadedToday = live.media_downloaded_today;
    }

    // 2. Jika belum terhubung dan ada sessions/bot_state.json lokal, baca state
    if (botStatus !== 'connected') {
      const stateFile = path.join(process.cwd(), 'sessions', 'bot_state.json');
      if (fs.existsSync(stateFile)) {
        try {
          const localState = JSON.parse(fs.readFileSync(stateFile, 'utf8'));
          if (localState.status === 'connected') {
            botStatus = 'connected';
            nomorWa = localState.nomor_wa || nomorWa;
            pushName = localState.push_name || pushName;
            connectedAt = localState.connected_at || connectedAt;
            qrRaw = null;
            qrDataUrl = null;
          }
          if (localState.qr_raw) qrRaw = localState.qr_raw;
          if (localState.qr_data_url) qrDataUrl = localState.qr_data_url;
        } catch (e) {
          console.warn('Error reading local state:', e);
        }
      }
    }

    // 2. Ambil status dari Supabase jika belum terhubung atau ada pembaruan
    if (botStatus !== 'connected') {
      try {
        const dbBot = await dbGetBotInstance('inst-core');
        if (dbBot) {
          if (dbBot.status === 'connected') {
            botStatus = 'connected';
            nomorWa = dbBot.nomor_wa || nomorWa;
            pushName = dbBot.push_name || pushName;
            connectedAt = dbBot.connected_at || connectedAt;
            qrRaw = null;
            qrDataUrl = null;
          } else if (botStatus === 'disconnected') {
            qrRaw = dbBot.qr_raw || qrRaw;
            qrDataUrl = dbBot.qr_data_url || qrDataUrl;
          }
        }
      } catch {}
    }

    // 3. Ambil log aktivitas dari file sessions/bot_logs.json, fallback Supabase
    const logsFile = path.join(process.cwd(), 'sessions', 'bot_logs.json');
    let logs: ActivityLog[] = [];
    if (fs.existsSync(logsFile)) {
      try {
        logs = JSON.parse(fs.readFileSync(logsFile, 'utf8'));
      } catch {}
    }
    if (!logs || logs.length === 0) {
      logs = (await dbGetActivityLogs(50)) || [];
    }

    // 4. Ambil konfigurasi fitur dari sessions/bot_config.json, fallback Supabase / default
    let features = [...DEFAULT_FEATURES];
    let rateLimit = DEFAULT_RATE_LIMIT;
    const configFile = path.join(process.cwd(), 'sessions', 'bot_config.json');
    if (fs.existsSync(configFile)) {
      try {
        const configData = JSON.parse(fs.readFileSync(configFile, 'utf8'));
        if (configData.features && Array.isArray(configData.features)) {
          features = configData.features;
        }
        if (configData.rateLimit) {
          rateLimit = configData.rateLimit;
        }
      } catch {}
    } else {
      try {
        const dbFeatures = await dbLoadFeatureConfigs();
        if (dbFeatures && dbFeatures.length > 0) {
          features = features.map((f) => {
            const match = dbFeatures.find((df) => df.id === f.id || df.feature_key === f.feature_key);
            return match
              ? {
                  ...f,
                  is_enabled: match.is_enabled,
                  command_trigger: match.command_trigger || f.command_trigger,
                  extra_settings: match.extra_settings || f.extra_settings,
                }
              : f;
          });
        }
      } catch {}
    }

    // Hitung counter jika belum tercatat di file state
    if (commandsCountToday === 0 && logs.length > 0) {
      commandsCountToday = logs.filter((l: ActivityLog) => l.status === 'success').length;
    }
    if (stickersCountToday === 0 && logs.length > 0) {
      stickersCountToday = logs.filter((l: ActivityLog) => l.feature_key === 'sticker_maker').length;
    }
    if (mediaDownloadedToday === 0 && logs.length > 0) {
      mediaDownloadedToday = logs.filter((l: ActivityLog) => l.feature_key === 'downloader').length;
    }

    return NextResponse.json({
      success: true,
      data: {
        status: botStatus,
        nomor_wa: nomorWa,
        push_name: pushName,
        connected_at: connectedAt,
        qr_raw: qrRaw,
        qr_data_url: qrDataUrl,
        active_features_count: features.filter((f) => f.is_enabled).length,
        total_features_count: features.length,
        commands_count_today: commandsCountToday,
        stickers_count_today: stickersCountToday,
        media_downloaded_today: mediaDownloadedToday,
        features,
        logs,
        rateLimit,
      },
    });
  } catch (err: unknown) {
    const error = err instanceof Error ? err.message : 'Gagal mengambil status bot';
    console.error('[API/Bot] GET Error:', error);
    return NextResponse.json(
      {
        success: true,
        data: {
          status: 'disconnected',
          nomor_wa: null,
          push_name: 'Verand Bot',
          connected_at: null,
          features: DEFAULT_FEATURES,
          logs: [],
          rateLimit: DEFAULT_RATE_LIMIT,
        },
      },
      { status: 200 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { action, payload } = body;
    const botManager = await getLazyBotManager();

    switch (action) {
      case 'start': {
        if (botManager && process.env.IS_WORKER === 'true') {
          const result = await botManager.startBot();
          return NextResponse.json({ success: true, data: result });
        }
        const currentBot = await dbGetBotInstance('inst-core');
        return NextResponse.json({
          success: true,
          data: {
            status: currentBot?.status || 'disconnected',
            qr_raw: currentBot?.qr_raw || null,
            qr_data_url: currentBot?.qr_data_url || null,
            message: 'Worker WhatsApp Baileys berjalan terpisah. Jalankan "npm run worker" di terminal atau server.',
          },
        });
      }

      case 'disconnect': {
        if (botManager && process.env.IS_WORKER === 'true') {
          await botManager.disconnect();
        }
        await dbSaveBotInstance({
          id: 'inst-core',
          status: 'disconnected',
          qr_raw: null,
          qr_data_url: null,
        });
        return NextResponse.json({ success: true, data: { status: 'disconnected' } });
      }

      case 'simulateConnect': {
        const phone = payload?.nomor_wa || '+62851-***-2326';
        const now = new Date().toISOString();
        await dbSaveBotInstance({
          id: 'inst-core',
          nomor_wa: phone,
          status: 'connected',
          connected_at: now,
        });
        return NextResponse.json({
          success: true,
          data: { status: 'connected', nomor_wa: phone, connected_at: now },
        });
      }

      case 'getPairingCode': {
        const { phoneNumber } = payload || {};
        const cleanPhone = (phoneNumber || '').replace(/\D/g, '');
        if (!cleanPhone || cleanPhone.length < 9) {
          return NextResponse.json({
            success: false,
            error: 'Nomor WhatsApp tidak valid. Masukkan nomor lengkap dengan kode negara (contoh: 6281234567890)',
          }, { status: 400 });
        }

        // 1. Jika botManager berjalan langsung di dalam Next.js
        if (botManager) {
          try {
            const code = await botManager.getPairingCode(cleanPhone);
            return NextResponse.json({ success: true, data: { code } });
          } catch (err: unknown) {
            const errorMsg = err instanceof Error ? err.message : 'Gagal meminta pairing code';
            return NextResponse.json({ success: false, error: errorMsg }, { status: 400 });
          }
        }

        // 2. Tulis permintaan ke file lokal sessions/pairing_request.json (IPC lokal cepat)
        const reqFile = path.join(process.cwd(), 'sessions', 'pairing_request.json');
        const resFile = path.join(process.cwd(), 'sessions', 'pairing_response.json');
        if (fs.existsSync(resFile)) {
          try { fs.unlinkSync(resFile); } catch {}
        }
        try {
          fs.writeFileSync(reqFile, JSON.stringify({ phone: cleanPhone, requested_at: Date.now() }));
        } catch {}

        // 3. Kirim juga ke Supabase
        await dbSaveBotInstance({
          id: 'inst-core',
          pairing_code: null,
          pairing_requested_phone: cleanPhone,
        });

        // Tunggu hingga worker menerbitkan pairing code (polling file lokal atau Supabase maks 12 detik)
        for (let i = 0; i < 24; i++) {
          await new Promise((r) => setTimeout(r, 500));
          if (fs.existsSync(resFile)) {
            try {
              const resData = JSON.parse(fs.readFileSync(resFile, 'utf8'));
              if (resData?.code) {
                return NextResponse.json({ success: true, data: { code: resData.code } });
              }
            } catch {}
          }
          const current = await dbGetBotInstance('inst-core');
          if (current?.pairing_code) {
            return NextResponse.json({ success: true, data: { code: current.pairing_code } });
          }
        }

        return NextResponse.json({
          success: false,
          error: 'Worker WhatsApp sedang offline atau belum berjalan. Pastikan perintah "npm run dev" aktif di terminal Anda.',
        }, { status: 504 });
      }

      case 'toggleFeature': {
        const { featureId } = payload;
        let updatedFeatures = [...DEFAULT_FEATURES];
        if (botManager) {
          updatedFeatures = botManager.toggleFeature(featureId);
        } else {
          updatedFeatures = updatedFeatures.map((f) =>
            f.id === featureId ? { ...f, is_enabled: !f.is_enabled } : f
          );
        }

        // Simpan ke sessions/bot_config.json lokal
        try {
          const cfgPath = path.join(process.cwd(), 'sessions', 'bot_config.json');
          let currentCfg: BotConfigFile = {};
          if (fs.existsSync(cfgPath)) {
            try { currentCfg = JSON.parse(fs.readFileSync(cfgPath, 'utf8')); } catch {}
          }
          currentCfg.features = updatedFeatures;
          fs.writeFileSync(cfgPath, JSON.stringify(currentCfg, null, 2));
        } catch {}

        await dbSaveFeatureConfigs(updatedFeatures);
        return NextResponse.json({ success: true, data: { features: updatedFeatures } });
      }

      case 'updateFeature': {
        const { featureId, updates } = payload;
        let updatedFeatures = [...DEFAULT_FEATURES];
        if (botManager) {
          updatedFeatures = botManager.updateFeature(featureId, updates);
        } else {
          updatedFeatures = updatedFeatures.map((f) =>
            f.id === featureId ? { ...f, ...updates } : f
          );
        }

        // Simpan ke sessions/bot_config.json lokal
        try {
          const cfgPath = path.join(process.cwd(), 'sessions', 'bot_config.json');
          let currentCfg: BotConfigFile = {};
          if (fs.existsSync(cfgPath)) {
            try { currentCfg = JSON.parse(fs.readFileSync(cfgPath, 'utf8')); } catch {}
          }
          currentCfg.features = updatedFeatures;
          fs.writeFileSync(cfgPath, JSON.stringify(currentCfg, null, 2));
        } catch {}

        await dbSaveFeatureConfigs(updatedFeatures);
        return NextResponse.json({ success: true, data: { features: updatedFeatures } });
      }

      case 'updateRateLimit': {
        const rateLimit = botManager ? botManager.updateRateLimit(payload) : { ...DEFAULT_RATE_LIMIT, ...payload };
        try {
          const cfgPath = path.join(process.cwd(), 'sessions', 'bot_config.json');
          let currentCfg: BotConfigFile = {};
          if (fs.existsSync(cfgPath)) {
            try { currentCfg = JSON.parse(fs.readFileSync(cfgPath, 'utf8')); } catch {}
          }
          currentCfg.rateLimit = rateLimit;
          fs.writeFileSync(cfgPath, JSON.stringify(currentCfg, null, 2));
        } catch {}
        return NextResponse.json({ success: true, data: { rateLimit } });
      }

      case 'clearLogs': {
        if (botManager) botManager.clearLogs();
        try {
          const logsFile = path.join(process.cwd(), 'sessions', 'bot_logs.json');
          fs.writeFileSync(logsFile, '[]');
        } catch {}
        return NextResponse.json({ success: true });
      }

      default:
        return NextResponse.json(
          { success: false, error: 'Unknown action' },
          { status: 400 }
        );
    }
  } catch (err: unknown) {
    const error = err instanceof Error ? err.message : 'Server error';
    return NextResponse.json(
      { success: false, error },
      { status: 500 }
    );
  }
}
