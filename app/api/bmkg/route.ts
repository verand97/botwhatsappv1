import { NextResponse } from 'next/server';
import {
  getLatestEarthquake,
  getRecentEarthquakes,
  getFeltEarthquakes,
  getWeatherForecast,
  getMaritimeWarnings,
  getAirQuality,
  searchIndonesianLocations,
  formatEarthquakeText,
  formatWeatherText,
} from '@/lib/bot/bmkgService';

export const dynamic = 'force-dynamic';

async function getLazyBotManager() {
  try {
    const mod = await import('@/lib/bot/botManager');
    return mod.botManager;
  } catch (err) {
    console.warn('[API/BMKG] Lazy import botManager error:', err);
    return null;
  }
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const type = searchParams.get('type') || 'summary';
  const q = searchParams.get('q') || '';
  const elevationParam = searchParams.get('elevation');
  const elevation = elevationParam ? Number(elevationParam) : undefined;

  try {
    switch (type) {
      case 'search_locations': {
        const results = await searchIndonesianLocations(q, 8);
        return NextResponse.json({ success: true, data: results });
      }

      case 'summary': {
        const [earthquakeResult, weatherResult, maritimeResult] = await Promise.allSettled([
          getLatestEarthquake(),
          getWeatherForecast(q || 'Jakarta', elevation),
          getMaritimeWarnings(),
        ]);

        const earthquake = earthquakeResult.status === 'fulfilled' ? earthquakeResult.value.data : null;
        const weather = weatherResult.status === 'fulfilled' ? weatherResult.value : null;
        const maritime = maritimeResult.status === 'fulfilled' ? maritimeResult.value : null;

        return NextResponse.json({
          success: true,
          data: {
            earthquake,
            weather,
            maritimeCount: maritime?.regions?.length || 0,
            maritimePreview: maritime?.regions?.slice(0, 5) || [],
            satellites: {
              awan: 'https://inderaja.bmkg.go.id/IMAGE/HIMA/H08_EH_Indonesia.png',
              hujan: 'https://inderaja.bmkg.go.id/IMAGE/HIMA/H08_RP_Indonesia.png',
              hotspot: 'https://inderaja.bmkg.go.id/IMAGE/HOTSPOT/Hotspot_Indonesia.png',
            },
          },
        });
      }

      case 'weather': {
        const location = q || 'Jakarta';
        const forecast = await getWeatherForecast(location, elevation);
        return NextResponse.json({ success: true, data: forecast });
      }

      case 'earthquakes': {
        const [latestResult, recentResult, feltResult] = await Promise.allSettled([
          getLatestEarthquake(),
          getRecentEarthquakes(),
          getFeltEarthquakes(),
        ]);

        return NextResponse.json({
          success: true,
          data: {
            latest: latestResult.status === 'fulfilled' ? latestResult.value.data : null,
            recent: recentResult.status === 'fulfilled' ? recentResult.value : [],
            felt: feltResult.status === 'fulfilled' ? feltResult.value : [],
          },
        });
      }

      case 'maritime': {
        const warnings = await getMaritimeWarnings(q || undefined);
        return NextResponse.json({ success: true, data: warnings });
      }

      case 'air': {
        const city = q || 'Jakarta';
        const aqi = await getAirQuality(city);
        return NextResponse.json({ success: true, data: aqi });
      }

      case 'satellites': {
        return NextResponse.json({
          success: true,
          data: {
            awan: {
              name: 'Himawari-9 Enhanced Infrared (Awan & Badai)',
              url: 'https://inderaja.bmkg.go.id/IMAGE/HIMA/H08_EH_Indonesia.png',
              description: 'Menampilkan distribusi awan konvektif dan potensi badai aktif.',
            },
            hujan: {
              name: 'Satelit Potensi Hujan (Rain Potential)',
              url: 'https://inderaja.bmkg.go.id/IMAGE/HIMA/H08_RP_Indonesia.png',
              description: 'Menampilkan sebaran intensitas curah hujan terkini di seluruh Indonesia.',
            },
            hotspot: {
              name: 'Peta Sebaran Titik Panas (Hotspot Karhutla)',
              url: 'https://inderaja.bmkg.go.id/IMAGE/HOTSPOT/Hotspot_Indonesia.png',
              description: 'Menampilkan titik panas potensi kebakaran hutan dan lahan.',
            },
          },
        });
      }

      default:
        return NextResponse.json({ success: false, error: 'Unknown type parameter' }, { status: 400 });
    }
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : 'Gagal memproses permintaan BMKG';
    console.error('[API/BMKG] Error:', errorMsg);
    return NextResponse.json({ success: false, error: errorMsg }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { action, targetJid, city } = body;
    const botManager = await getLazyBotManager();

    if (!botManager) {
      return NextResponse.json({
        success: false,
        error: 'Bot WhatsApp belum siap atau worker belum aktif.',
      }, { status: 503 });
    }

    const liveStatus = botManager.getStatus();
    if (liveStatus.status !== 'connected') {
      return NextResponse.json({
        success: false,
        error: 'Bot WhatsApp belum terhubung ke nomor. Hubungkan bot terlebih dahulu di menu Koneksi.',
      }, { status: 400 });
    }

    if (!targetJid) {
      return NextResponse.json({
        success: false,
        error: 'Nomor WhatsApp atau ID Grup tujuan harus diisi.',
      }, { status: 400 });
    }

    const cleanJid = targetJid.includes('@') ? targetJid : `${targetJid.replace(/\D/g, '')}@s.whatsapp.net`;

    if (action === 'sendEarthquakeAlert') {
      const { data: gempa, imageBuffer } = await getLatestEarthquake();
      const text = formatEarthquakeText(gempa, false);

      const sock = botManager.getSocket();
      if (!sock) {
        return NextResponse.json({ success: false, error: 'Socket WhatsApp tidak tersedia.' }, { status: 500 });
      }

      if (imageBuffer) {
        await sock.sendMessage(cleanJid, {
          image: imageBuffer,
          caption: text,
        });
      } else {
        await sock.sendMessage(cleanJid, { text });
      }

      return NextResponse.json({
        success: true,
        message: `Laporan gempa terkini M ${gempa.Magnitude} berhasil dikirim ke ${cleanJid}!`,
      });
    }

    if (action === 'sendWeatherReport') {
      const location = city || 'Jakarta';
      const customElev = body.elevation ? Number(body.elevation) : undefined;
      const forecast = await getWeatherForecast(location, customElev);
      const text = formatWeatherText(forecast);

      const sock = botManager.getSocket();
      if (!sock) {
        return NextResponse.json({ success: false, error: 'Socket WhatsApp tidak tersedia.' }, { status: 500 });
      }

      await sock.sendMessage(cleanJid, { text });
      return NextResponse.json({
        success: true,
        message: `Prakiraan cuaca ${forecast.locationName} (${forecast.elevation || 0} mdpl) berhasil dikirim ke ${cleanJid}!`,
      });
    }

    return NextResponse.json({ success: false, error: 'Aksi tidak dikenali' }, { status: 400 });
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : 'Terjadi kesalahan pengiriman pesan.';
    return NextResponse.json({ success: false, error: errorMsg }, { status: 500 });
  }
}
