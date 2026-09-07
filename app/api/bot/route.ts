import { NextResponse } from 'next/server';
import { botManager } from '@/lib/bot/botManager';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const status = botManager.getStatus();
    const logs = botManager.getLogs();
    const features = botManager.getFeatures();
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
        return NextResponse.json({ success: true, data: result });
      }

      case 'toggleFeature': {
        const { featureId } = payload;
        const features = botManager.toggleFeature(featureId);
        return NextResponse.json({ success: true, data: { features } });
      }

      case 'updateFeature': {
        const { featureId, updates } = payload;
        const features = botManager.updateFeature(featureId, updates);
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
