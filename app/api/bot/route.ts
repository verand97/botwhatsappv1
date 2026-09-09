import { NextResponse } from 'next/server';
import {
  dbSaveFeatureConfigs,
  dbGetActivityLogs,
  dbGetBotInstance,
  dbLoadFeatureConfigs,
  dbSaveBotInstance,
} from '@/lib/supabase/client';
import { DEFAULT_FEATURES, DEFAULT_RATE_LIMIT } from '@/lib/constants';

export const dynamic = 'force-dynamic';

// Lazy loader untuk botManager (agar tidak mengimpor native binary C++ seperti sharp/baileys di serverless Vercel)
async function getLazyBotManager() {
  try {
    const mod = await import('@/lib/bot/botManager');
    return mod.botManager;
  } catch (err) {
    console.warn('[API/Bot] Lazy import botManager skipped on serverless:', err);
    return null;
  }
}

export async function GET() {
  try {
    let botStatus = 'disconnected';
    let nomorWa: string | null = null;
    let pushName: string | null = 'Verand Bot Core';
    let connectedAt: string | null = null;
    let qrRaw: string | null = null;
    let qrDataUrl: string | null = null;

    // 1. Coba ambil status dari Supabase Database (sumber kebenaran utama worker)
    const dbBot = await dbGetBotInstance('inst-core');
    if (dbBot) {
      botStatus = dbBot.status || 'disconnected';
      nomorWa = dbBot.nomor_wa || null;
      pushName = dbBot.push_name || pushName;
      connectedAt = dbBot.connected_at || null;
      if (botStatus !== 'connected') {
        qrRaw = dbBot.qr_raw || null;
        qrDataUrl = dbBot.qr_data_url || null;
      }
    }

    // 2. Jika di lokal dan botManager aktif, ambil data live memori
    const botManager = await getLazyBotManager();
    if (botManager) {
      const localStatus = botManager.getStatus();
      if (localStatus.status === 'connected') {
        botStatus = 'connected';
        nomorWa = localStatus.nomor_wa || nomorWa;
        pushName = localStatus.push_name || pushName;
        connectedAt = localStatus.connected_at || connectedAt;
      }
      if (localStatus.qr_raw) {
        qrRaw = localStatus.qr_raw;
      }
      if (localStatus.qr_data_url) {
        qrDataUrl = localStatus.qr_data_url;
      }
    }

    // 3. Ambil log aktivitas dari Supabase atau lokal
    let logs = (await dbGetActivityLogs(50)) || [];
    if (logs.length === 0 && botManager) {
      logs = botManager.getLogs();
    }

    // 4. Ambil konfigurasi fitur dari Supabase atau default
    let features = [...DEFAULT_FEATURES];
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

    const rateLimit = botManager ? botManager.getRateLimit() : DEFAULT_RATE_LIMIT;

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
        commands_count_today: logs.filter((l) => l.status === 'success').length,
        stickers_count_today: logs.filter((l) => l.feature_key === 'sticker_maker').length,
        media_downloaded_today: logs.filter((l) => l.feature_key === 'downloader').length,
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
        if (botManager && process.env.IS_WORKER === 'true') {
          try {
            const code = await botManager.getPairingCode(phoneNumber);
            return NextResponse.json({ success: true, data: { code } });
          } catch (err: unknown) {
            const errorMsg = err instanceof Error ? err.message : 'Gagal meminta pairing code';
            return NextResponse.json({ success: false, error: errorMsg }, { status: 400 });
          }
        }
        return NextResponse.json({
          success: false,
          error: 'Untuk keamanan sesi multi-device, minta pairing code via worker terminal: npm run worker -- ' + (phoneNumber || ''),
        }, { status: 400 });
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
        await dbSaveFeatureConfigs(updatedFeatures);
        return NextResponse.json({ success: true, data: { features: updatedFeatures } });
      }

      case 'updateRateLimit': {
        const rateLimit = botManager ? botManager.updateRateLimit(payload) : { ...DEFAULT_RATE_LIMIT, ...payload };
        return NextResponse.json({ success: true, data: { rateLimit } });
      }

      case 'clearLogs': {
        if (botManager) botManager.clearLogs();
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
