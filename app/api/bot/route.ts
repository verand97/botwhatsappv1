import { NextResponse } from 'next/server';
import { botManager } from '@/lib/bot/botManager';
import {
  dbSaveFeatureConfigs,
  dbGetActivityLogs,
  dbGetBotInstance,
  dbLoadFeatureConfigs,
  dbSaveBotInstance,
} from '@/lib/supabase/client';

export const dynamic = 'force-dynamic';
// Updated menu & downloader v1.2

export async function GET() {
  try {
    let status = botManager.getStatus();

    // Sinkronisasi status dari database Supabase (jika worker aktif di remote/VPS)
    if (status.status === 'disconnected') {
      const dbBot = await dbGetBotInstance('inst-core');
      if (dbBot && dbBot.status === 'connected') {
        status = {
          ...status,
          status: 'connected',
          nomor_wa: dbBot.nomor_wa || status.nomor_wa,
          push_name: dbBot.push_name || status.push_name,
          connected_at: dbBot.connected_at || status.connected_at,
        };
      }
    }

    let logs = botManager.getLogs();
    if (logs.length === 0) {
      const dbLogs = await dbGetActivityLogs(50);
      if (dbLogs && dbLogs.length > 0) {
        logs = dbLogs;
      }
    }

    let features = botManager.getFeatures();
    const dbFeatures = await dbLoadFeatureConfigs();
    if (dbFeatures && dbFeatures.length > 0) {
      features = features.map((f) => {
        const match = dbFeatures.find((df) => df.id === f.id);
        return match ? { ...f, is_enabled: match.is_enabled } : f;
      });
    }

    const rateLimit = botManager.getRateLimit();

    return NextResponse.json({
      success: true,
      data: {
        ...status,
        features,
        logs,
        rateLimit,
      },
    });
  } catch (err: unknown) {
    const error = err instanceof Error ? err.message : 'Failed to fetch bot status';
    return NextResponse.json(
      { success: false, error },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { action, payload } = body;

    switch (action) {
      case 'start': {
        const result = await botManager.startBot();
        return NextResponse.json({ success: true, data: result });
      }

      case 'disconnect': {
        const result = await botManager.disconnect();
        dbSaveBotInstance({
          id: 'inst-core',
          status: 'disconnected',
        }).catch(() => {});
        return NextResponse.json({ success: true, data: result });
      }

      case 'simulateConnect': {
        const phone = payload?.nomor_wa || '+62812-***-7890';
        await dbSaveBotInstance({
          id: 'inst-core',
          nomor_wa: phone,
          status: 'connected',
          connected_at: new Date().toISOString(),
        });
        return NextResponse.json({
          success: true,
          data: { status: 'connected', nomor_wa: phone },
        });
      }

      case 'getPairingCode': {
        const { phoneNumber } = payload || {};
        try {
          const code = await botManager.getPairingCode(phoneNumber);
          return NextResponse.json({ success: true, data: { code } });
        } catch (err: unknown) {
          const errorMsg = err instanceof Error ? err.message : 'Gagal meminta pairing code';
          return NextResponse.json({ success: false, error: errorMsg }, { status: 400 });
        }
      }

      case 'toggleFeature': {
        const { featureId } = payload;
        const features = botManager.toggleFeature(featureId);
        dbSaveFeatureConfigs(features).catch(() => {});
        return NextResponse.json({ success: true, data: { features } });
      }

      case 'updateFeature': {
        const { featureId, updates } = payload;
        const features = botManager.updateFeature(featureId, updates);
        dbSaveFeatureConfigs(features).catch(() => {});
        return NextResponse.json({ success: true, data: { features } });
      }

      case 'updateRateLimit': {
        const rateLimit = botManager.updateRateLimit(payload);
        return NextResponse.json({ success: true, data: { rateLimit } });
      }

      case 'clearLogs': {
        botManager.clearLogs();
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
