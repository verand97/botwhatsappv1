import makeWASocket, {
  Browsers,
  DisconnectReason,
  useMultiFileAuthState as initMultiFileAuthState,
  fetchLatestBaileysVersion,
  WASocket,
  WAMessage,
  downloadMediaMessage,
} from '@whiskeysockets/baileys';
import QRCode from 'qrcode';
import sharp from 'sharp';
import path from 'path';
import fs from 'fs';
import pino from 'pino';
import { addExifToWebp } from './exif';
import {
  downloadMediaFromUrl,
  parseSlideRequest,
  downloadMediaBuffer,
  detectPlatform,
  getYouTubeInfo,
  VideoResolution,
} from './mediaDownloader';
import { generateMenuText, generateFaqText } from './menuHelper';
import {
  getLatestEarthquake,
  getRecentEarthquakes,
  getFeltEarthquakes,
  getWeatherForecast,
  getSatelliteImage,
  getMaritimeWarnings,
  getAirQuality,
  formatEarthquakeText,
  formatRecentEarthquakesText,
  formatFeltEarthquakesText,
  formatWeatherText,
  formatMaritimeText,
  formatAirQualityText,
  formatBmkgMenuText,
} from './bmkgService';
import { ActivityLog, FeatureConfig, RateLimitConfig, BotConnectionStatus } from '../types';
import { dbInsertActivityLog, dbSaveBotInstance, dbLoadFeatureConfigs, dbGetBotInstance } from '../supabase/client';

// Default initial features
const DEFAULT_FEATURES: FeatureConfig[] = [
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
      pack_name: 'Verand Pack',
      author_name: 'Made with Verand.Bot',
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
    tagline: 'Unduh video atau audio dari tautan TikTok, Instagram Reels, YouTube, Facebook, dan Twitter/X',
    category: 'media',
    is_enabled: true,
    command_trigger: '!dl',
    aliases: ['!tt', '!ig', '!yt', '!ytmp3', '!fb', '!tiktok', '!youtube', '!instagram', '!twitter'],
    extra_settings: {
      supported_platforms: ['TikTok', 'Instagram', 'YouTube', 'Facebook', 'Twitter/X'],
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
        { trigger: 'halo', response: 'Halo! Verand Bot aktif 24/7. Ketik !menu untuk melihat fitur.' },
        { trigger: 'info', response: 'Verand.Bot adalah platform bot WhatsApp multifungsi.' },
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
  {
    id: 'feat-bmkg-monitor',
    feature_key: 'bmkg_monitor',
    name: 'Pantauan BMKG & Bencana',
    tagline: 'Pantau gempa bumi real-time, infografis Shakemap, cuaca kota, citra satelit Himawari, peringatan gelombang, dan hotspot karhutla',
    category: 'utility',
    is_enabled: true,
    command_trigger: '!bmkg',
    aliases: [
      '!gempa',
      '!gempaterkini',
      '!autogempa',
      '!gempa5m',
      '!gempadirasakan',
      '!cuaca',
      '!satelit',
      '!gelombang',
      '!maritim',
      '!hotspot',
      '!karhutla',
      '!udara',
      '!aqi',
      '!bencana',
    ],
    extra_settings: {
      bmkg_auto_alert: false,
      bmkg_alert_recipients: [],
      bmkg_min_magnitude: 5.0,
      default_weather_city: 'Jakarta',
    },
  },
];

const DEFAULT_RATE_LIMIT: RateLimitConfig = {
  cooldown_seconds: 3,
  command_prefix: '/',
  max_per_minute: 20,
  anti_spam_active: true,
  blacklisted_senders: [],
  whitelist_groups_only: false,
  whitelisted_groups: [],
};

interface PendingYouTubeRequest {
  url: string;
  sender: string;
  remoteJid: string;
  title: string;
  author: string;
  duration: string;
  thumbnail: string;
  createdAt: number;
}

class BotManager {
  private sock: WASocket | null = null;
  private status: BotConnectionStatus = 'disconnected';
  private qrRaw: string | null = null;
  private qrDataUrl: string | null = null;
  private nomorWa: string | null = null;
  private pendingYouTubeMap = new Map<string, PendingYouTubeRequest>();
  private pushName: string | null = null;
  private connectedAt: string | null = null;
  private logs: ActivityLog[] = [];
  private features: FeatureConfig[] = DEFAULT_FEATURES;
  private rateLimit: RateLimitConfig = DEFAULT_RATE_LIMIT;
  private userLastCommandMap = new Map<string, number>();
  private commandsCountToday = 0;
  private stickersCountToday = 0;
  private mediaDownloadedToday = 0;
  private isConnecting = false;
  private lastFeatureSync = 0;
  private pairingListenerInterval: NodeJS.Timeout | null = null;
  private isRequestingPairing = false;
  private bmkgWatcherInterval: NodeJS.Timeout | null = null;
  private lastKnownEarthquakeId: string | null = null;
  private authDir: string;
  private configFile: string;
  private stateFile: string;
  private logsFile: string;

  constructor() {
    try {
      const baseDir = process.cwd();
      this.authDir = path.join(baseDir, 'sessions', 'baileys_auth');
      this.configFile = path.join(baseDir, 'sessions', 'bot_config.json');
      this.stateFile = path.join(baseDir, 'sessions', 'bot_state.json');
      this.logsFile = path.join(baseDir, 'sessions', 'bot_logs.json');

      if (!fs.existsSync(this.authDir)) {
        fs.mkdirSync(this.authDir, { recursive: true });
      }

      this.loadConfig();
      this.loadLogs();
      this.loadState();

      // Otomatis aktifkan koneksi bot WhatsApp saat Next.js berjalan (npm run dev)
      setTimeout(() => {
        this.startBot().catch((e) => console.error('[BotManager] Auto-start error:', e));
      }, 1000);
    } catch (err) {
      console.warn('[BotManager] Error initializing local sessions:', err);
      this.authDir = path.join(process.cwd(), 'sessions', 'baileys_auth');
      this.configFile = path.join(process.cwd(), 'sessions', 'bot_config.json');
      this.stateFile = path.join(process.cwd(), 'sessions', 'bot_state.json');
      this.logsFile = path.join(process.cwd(), 'sessions', 'bot_logs.json');
    }
  }

  private loadConfig() {
    try {
      if (fs.existsSync(this.configFile)) {
        const data = JSON.parse(fs.readFileSync(this.configFile, 'utf-8'));
        if (data.features) this.features = data.features;
        if (data.rateLimit) this.rateLimit = data.rateLimit;
      }
    } catch (e) {
      console.warn('Error loading config:', e);
    }
  }

  private saveConfig() {
    try {
      const sessDir = path.dirname(this.configFile);
      if (!fs.existsSync(sessDir)) {
        fs.mkdirSync(sessDir, { recursive: true });
      }
      fs.writeFileSync(
        this.configFile,
        JSON.stringify(
          {
            features: this.features,
            rateLimit: this.rateLimit,
          },
          null,
          2
        )
      );
    } catch (e) {
      console.warn('Warning saving config:', e);
    }
  }

  public saveState() {
    try {
      const sessDir = path.dirname(this.stateFile);
      if (!fs.existsSync(sessDir)) {
        fs.mkdirSync(sessDir, { recursive: true });
      }
      fs.writeFileSync(
        this.stateFile,
        JSON.stringify(
          {
            status: this.status,
            nomor_wa: this.nomorWa,
            push_name: this.pushName,
            connected_at: this.connectedAt,
            qr_raw: this.qrRaw,
            qr_data_url: this.qrDataUrl,
            commands_count_today: this.commandsCountToday,
            stickers_count_today: this.stickersCountToday,
            media_downloaded_today: this.mediaDownloadedToday,
            updated_at: new Date().toISOString(),
          },
          null,
          2
        )
      );
    } catch (e) {
      console.warn('Warning saving state:', e);
    }
  }

  public loadState() {
    try {
      if (fs.existsSync(this.stateFile)) {
        const data = JSON.parse(fs.readFileSync(this.stateFile, 'utf-8'));
        if (data.status) this.status = data.status;
        if (data.nomor_wa !== undefined) this.nomorWa = data.nomor_wa;
        if (data.push_name !== undefined) this.pushName = data.push_name;
        if (data.connected_at !== undefined) this.connectedAt = data.connected_at;
        if (data.qr_raw !== undefined) this.qrRaw = data.qr_raw;
        if (data.qr_data_url !== undefined) this.qrDataUrl = data.qr_data_url;
        if (data.commands_count_today) this.commandsCountToday = data.commands_count_today;
        if (data.stickers_count_today) this.stickersCountToday = data.stickers_count_today;
        if (data.media_downloaded_today) this.mediaDownloadedToday = data.media_downloaded_today;
      }
    } catch (e) {
      console.warn('Error loading state:', e);
    }
  }

  private saveLogs() {
    try {
      const sessDir = path.dirname(this.logsFile);
      if (!fs.existsSync(sessDir)) {
        fs.mkdirSync(sessDir, { recursive: true });
      }
      fs.writeFileSync(this.logsFile, JSON.stringify(this.logs.slice(0, 100), null, 2));
    } catch (e) {
      console.warn('Warning saving logs:', e);
    }
  }

  private loadLogs() {
    try {
      if (fs.existsSync(this.logsFile)) {
        const data = JSON.parse(fs.readFileSync(this.logsFile, 'utf-8'));
        if (Array.isArray(data)) {
          this.logs = data;
        }
      }
    } catch (e) {
      console.warn('Error loading logs:', e);
    }
  }

  public getSocket(): WASocket | null {
    return this.sock;
  }

  public getStatus() {
    if (!this.sock && this.status === 'disconnected') {
      this.loadState();
    }
    return {
      status: this.status,
      nomor_wa: this.nomorWa,
      push_name: this.pushName,
      connected_at: this.connectedAt,
      qr_raw: this.qrRaw,
      qr_data_url: this.qrDataUrl,
      active_features_count: this.features.filter((f) => f.is_enabled).length,
      total_features_count: this.features.length,
      commands_count_today: this.commandsCountToday,
      stickers_count_today: this.stickersCountToday,
      media_downloaded_today: this.mediaDownloadedToday,
    };
  }

  public getLogs(): ActivityLog[] {
    if (this.logs.length === 0) {
      this.loadLogs();
    }
    return this.logs;
  }

  public getFeatures(): FeatureConfig[] {
    return this.features;
  }

  public async syncFeaturesFromDb() {
    this.loadConfig();
    try {
      const dbFeatures = await dbLoadFeatureConfigs();
      if (dbFeatures && dbFeatures.length > 0) {
        this.features = this.features.map((f) => {
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
    } catch {
      // Abaikan jika koneksi db bermasalah
    }
  }

  // Listener untuk menangani permintaan 8-digit pairing code dari Web Dashboard
  public startPairingRequestListener() {
    if (this.pairingListenerInterval) return;
    this.pairingListenerInterval = setInterval(async () => {
      if (this.status === 'connected' || !this.sock) return;
      try {
        const reqFile = path.join(process.cwd(), 'sessions', 'pairing_request.json');
        let requestedPhone: string | null = null;
        if (fs.existsSync(reqFile)) {
          try {
            const reqData = JSON.parse(fs.readFileSync(reqFile, 'utf8'));
            if (reqData && reqData.phone) {
              requestedPhone = reqData.phone;
            }
          } catch {}
        }

        if (!requestedPhone) {
          const dbBot = await dbGetBotInstance('inst-core');
          if (dbBot?.pairing_requested_phone) {
            requestedPhone = dbBot.pairing_requested_phone;
          }
        }

        if (requestedPhone && !this.isRequestingPairing) {
          this.isRequestingPairing = true;
          const phone = requestedPhone.replace(/\D/g, '');
          console.log(`\n[Worker] Menerima permintaan Pairing Code dari Web Dashboard untuk nomor: +${phone}...`);
          try {
            const code = await this.sock.requestPairingCode(phone);
            const formatted = code?.match(/.{1,4}/g)?.join('-') || code;
            console.log(`[Worker] 8-Digit Pairing Code terbit: ${formatted}`);

            const resFile = path.join(process.cwd(), 'sessions', 'pairing_response.json');
            fs.writeFileSync(resFile, JSON.stringify({ code: formatted, created_at: Date.now() }));
            if (fs.existsSync(reqFile)) {
              try { fs.unlinkSync(reqFile); } catch {}
            }

            await dbSaveBotInstance({
              id: 'inst-core',
              pairing_code: formatted,
              pairing_requested_phone: null,
            });
          } catch (err) {
            console.error('[Worker] Gagal generate pairing code:', err);
            if (fs.existsSync(reqFile)) {
              try { fs.unlinkSync(reqFile); } catch {}
            }
            await dbSaveBotInstance({
              id: 'inst-core',
              pairing_code: null,
              pairing_requested_phone: null,
            });
          } finally {
            this.isRequestingPairing = false;
          }
        }
      } catch {
        // Ignored
      }
    }, 1000);
  }

  public getRateLimit(): RateLimitConfig {
    return this.rateLimit;
  }

  public toggleFeature(id: string) {
    this.features = this.features.map((f) => {
      if (f.id === id) {
        const next = !f.is_enabled;
        this.addLog({
          feature_key: f.feature_key,
          feature_name: f.name,
          command: `[SYS] Modul ${f.name} diubah menjadi ${next ? 'AKTIF' : 'NONAKTIF'}`,
          sender_masked: 'System Admin',
          status: 'success',
          execution_time_ms: 5,
          detail: `Status fitur diubah di papan modul.`,
        });
        return { ...f, is_enabled: next };
      }
      return f;
    });
    this.saveConfig();
    return this.features;
  }

  public updateFeature(id: string, updates: Partial<FeatureConfig>) {
    this.features = this.features.map((f) => (f.id === id ? { ...f, ...updates } : f));
    this.saveConfig();
    return this.features;
  }

  public updateRateLimit(updates: Partial<RateLimitConfig>) {
    this.rateLimit = { ...this.rateLimit, ...updates };
    this.saveConfig();
    return this.rateLimit;
  }

  public clearLogs() {
    this.logs = [];
    this.saveLogs();
  }

  public addLog(item: Omit<ActivityLog, 'id' | 'created_at'>) {
    const log: ActivityLog = {
      ...item,
      id: 'log-' + Date.now() + '-' + Math.floor(Math.random() * 1000),
      created_at: new Date().toISOString(),
    };
    this.logs = [log, ...this.logs.slice(0, 99)];
    this.saveLogs();
    dbInsertActivityLog(log).catch(() => {});
  }

  // Request official WhatsApp 8-digit pairing code
  public async getPairingCode(phoneNumber: string): Promise<string> {
    const cleanPhone = phoneNumber.replace(/\D/g, '');
    if (!cleanPhone || cleanPhone.length < 9) {
      throw new Error('Nomor WhatsApp harus menyertakan kode negara (contoh: 6281234567890)');
    }

    // Jika belum ada socket atau status terputus, mulai bot
    if (!this.sock) {
      await this.startBot();
    }

    // Tunggu socket siap
    let retries = 0;
    while ((!this.sock || !this.sock.authState?.creds) && retries < 20) {
      await new Promise((r) => setTimeout(r, 400));
      retries++;
    }

    if (this.sock && !this.sock.authState?.creds?.registered) {
      await new Promise((r) => setTimeout(r, 1500));
      const code = await this.sock.requestPairingCode(cleanPhone);
      const formatted = code?.match(/.{1,4}/g)?.join('-') || code;
      return formatted;
    }

    if (this.sock?.authState?.creds?.registered) {
      throw new Error('Perangkat WhatsApp sudah terdaftar / terhubung!');
    }

    throw new Error('Soket Baileys belum siap, silakan coba beberapa saat lagi.');
  }

  public isBusyConnecting(): boolean {
    return this.isConnecting;
  }

  // Start real Baileys connection
  public async startBot(targetPhoneNumber?: string) {
    if (this.sock && this.status === 'connected') {
      return this.getStatus();
    }
    if (this.isConnecting) {
      return this.getStatus();
    }

    this.isConnecting = true;
    this.status = 'connecting';
    this.qrRaw = null;
    this.qrDataUrl = null;

    try {
      if (!fs.existsSync(this.authDir)) {
        fs.mkdirSync(this.authDir, { recursive: true });
      }

      await this.syncFeaturesFromDb();

      const { state, saveCreds } = await initMultiFileAuthState(this.authDir);

      let version: [number, number, number] = [2, 3000, 1043857760];
      try {
        const v = await fetchLatestBaileysVersion();
        if (v && v.version) {
          version = v.version;
          console.log(`[Baileys] Memakai WhatsApp Web Protocol: v${version.join('.')} (Latest: ${v.isLatest})`);
        }
      } catch (e) {
        console.warn('[Baileys] Menggunakan fallback versi WhatsApp Web v2.3000:', e);
      }

      this.sock = makeWASocket({
        version,
        auth: state,
        printQRInTerminal: false,
        logger: pino({ level: 'silent' }),
        browser: Browsers.macOS('Chrome'),
        syncFullHistory: false,
        markOnlineOnConnect: false,
        connectTimeoutMs: 60000,
        defaultQueryTimeoutMs: 60000,
        keepAliveIntervalMs: 25000,
      });

      this.sock.ev.on('creds.update', saveCreds);

      // Mulai listener permintaan pairing code dari web dashboard
      this.startPairingRequestListener();

      // Jika pengguna memilih metode Pairing Code (nomor HP), jangan cetak QR
      if (targetPhoneNumber && !state.creds.registered) {
        const cleanPhone = targetPhoneNumber.replace(/\D/g, '');
        setTimeout(async () => {
          try {
            if (this.sock && !this.sock.authState?.creds?.registered) {
              console.log(`\n⏳ Mengirim permintaan 8-Digit Pairing Code ke WhatsApp untuk: +${cleanPhone}...`);
              const code = await this.sock.requestPairingCode(cleanPhone);
              const formatted = code?.match(/.{1,4}/g)?.join('-') || code;
              console.log('\n╔════════════════════════════════════════════════════════════╗');
              console.log('║               KODE TAUTAN RESMI WHATSAPP                   ║');
              console.log('╠════════════════════════════════════════════════════════════╣');
              console.log(`║                  👉   ${formatted}   👈                  ║`);
              console.log('╚════════════════════════════════════════════════════════════╝\n');
              console.log('📋 CARA MENGHUBUNGKAN:');
              console.log(`   1. Buka WhatsApp di HP Anda (+${cleanPhone})`);
              console.log('   2. Masuk ke: Titik Tiga (atau Pengaturan) > Perangkat Tertaut');
              console.log('   3. Ketuk tombol "Tautkan Perangkat"');
              console.log('   4. Di bawah jendela scan kamera, ketuk "Tautkan dengan nomor telepon saja"');
              console.log(`   5. Masukkan 8 karakter kode ini: ${formatted}\n`);
            }
          } catch (pairErr) {
            console.error('Gagal meminta pairing code:', pairErr);
          }
        }, 2500);
      }

      this.sock.ev.on('connection.update', async (update: { connection?: string; lastDisconnect?: { error?: unknown }; qr?: string }) => {
        const { connection, lastDisconnect, qr } = update;

        if (qr && !targetPhoneNumber) {
          this.isConnecting = false;
          this.qrRaw = qr;
          try {
            this.qrDataUrl = await QRCode.toDataURL(qr, { margin: 1, scale: 8 });
            // Cetak QR Code di terminal untuk scan kamera WhatsApp HP secara langsung
            const terminalQr = await QRCode.toString(qr, { type: 'terminal', small: true });
            console.log('\n╔══════════════════════════════════════════════════════════════╗');
            console.log('║       SCAN QR CODE BERIKUT DENGAN WHATSAPP HP ANDA:          ║');
            console.log('║  (Buka WA di HP > Titik Tiga / Pengaturan > Perangkat        ║');
            console.log('║   Tertaut > Tautkan Perangkat > Arahkan Kamera ke Layar)     ║');
            console.log('╚══════════════════════════════════════════════════════════════╝\n');
            console.log(terminalQr);
            console.log('⏳ Menunggu scan WhatsApp dari kamera HP...\n');

            // Sinkronkan ke Supabase Database agar Dashboard langsung menampilkan QR Code secara live!
            dbSaveBotInstance({
              id: 'inst-core',
              status: 'disconnected',
              qr_raw: this.qrRaw,
              qr_data_url: this.qrDataUrl,
            }).catch(() => {});
          } catch (e) {
            console.error('Failed to generate QR DataURL:', e);
          }
          this.status = 'disconnected'; // Waiting for scan
          this.saveState();
        }

        if (connection === 'open') {
          if (this.pairingListenerInterval) {
            clearInterval(this.pairingListenerInterval);
            this.pairingListenerInterval = null;
          }
          this.isConnecting = false;
          this.status = 'connected';
          this.connectedAt = new Date().toISOString();
          this.qrRaw = null;
          this.qrDataUrl = null;

          const rawId = this.sock?.user?.id || '';
          const cleanNum = rawId.split(':')[0] || rawId.split('@')[0];
          // Mask phone number for privacy §7
          const masked = cleanNum.length > 7
            ? '+' + cleanNum.slice(0, 5) + '-***-' + cleanNum.slice(-4)
            : cleanNum;

          this.nomorWa = masked;
          this.pushName = this.sock?.user?.name || 'Verand Bot';
          this.saveState();

          console.log('\n🎉 ==============================================================');
          console.log(`✅ BERHASIL TERHUBUNG KE WHATSAPP: ${cleanNum} (${this.pushName})`);
          console.log('🚀 Status: ONLINE 🟢');
          console.log('💡 Semua fitur aktif: /menu, /dl, /sticker, /tomedia, /ai');
          console.log('🌐 Tersinkronisasi dengan Database Supabase & Dashboard');
          console.log('==============================================================\n');

          dbSaveBotInstance({
            id: 'inst-core',
            nomor_wa: masked,
            push_name: this.pushName,
            status: 'connected',
            connected_at: this.connectedAt,
            qr_raw: null,
            qr_data_url: null,
          }).catch(() => {});

          this.addLog({
            feature_key: 'system',
            feature_name: 'Koneksi Baileys',
            command: `[SYS] Device Connected (${masked})`,
            sender_masked: 'System Core',
            status: 'success',
            execution_time_ms: 100,
            detail: 'Koneksi WhatsApp Web Multi-Device aktif & socket persisten terhubung.',
          });

          // Mulai background watcher peringatan gempa BMKG jika diaktifkan
          this.startBmkgEarthquakeWatcher();
        }

        if (connection === 'close') {
          this.isConnecting = false;
          if (this.bmkgWatcherInterval) {
            clearInterval(this.bmkgWatcherInterval);
            this.bmkgWatcherInterval = null;
          }
          const statusCode = (lastDisconnect?.error as { output?: { statusCode?: number } })?.output?.statusCode;
          const isLoggedOut = statusCode === DisconnectReason.loggedOut;

          this.status = 'disconnected';
          this.nomorWa = null;
          this.connectedAt = null;
          this.qrRaw = null;
          this.qrDataUrl = null;
          this.saveState();

          dbSaveBotInstance({
            id: 'inst-core',
            status: 'disconnected',
            qr_raw: null,
            qr_data_url: null,
          }).catch(() => {});

          if (isLoggedOut) {
            try {
              if (fs.existsSync(this.authDir)) {
                fs.rmSync(this.authDir, { recursive: true, force: true });
                fs.mkdirSync(this.authDir, { recursive: true });
              }
            } catch (clearErr) {
              console.error('Failed to clear expired auth session:', clearErr);
            }
          }

          this.addLog({
            feature_key: 'system',
            feature_name: 'Koneksi Baileys',
            command: `[SYS] Connection Closed (Code: ${statusCode || 'unknown'})`,
            sender_masked: 'System Core',
            status: 'failed',
            execution_time_ms: 20,
            detail: isLoggedOut
              ? 'Sesi WhatsApp di-logout dari perangkat. Sesi lama telah dibersihkan agar dapat scan QR baru.'
              : 'Socket terputus, mencoba rekoneksi otomatis...',
          });

          if (!isLoggedOut) {
            setTimeout(() => this.startBot(), 3000);
          }
        }
      });

      // Handle Real Incoming Messages
      this.sock.ev.on('messages.upsert', async ({ messages, type }: { messages: WAMessage[]; type: string }) => {
        if (type !== 'notify') return;

        for (const msg of messages) {
          if (!msg.message) continue;
          if (msg.key.remoteJid === 'status@broadcast') continue;

          const text =
            msg.message?.conversation ||
            msg.message?.extendedTextMessage?.text ||
            msg.message?.imageMessage?.caption ||
            msg.message?.videoMessage?.caption ||
            '';
          const trimmed = text.trim();
          const isCmd =
            trimmed.startsWith('/') ||
            trimmed.startsWith('!') ||
            trimmed.startsWith('.') ||
            trimmed.toLowerCase() === 'menu' ||
            trimmed.toLowerCase() === 'help' ||
            trimmed.toLowerCase() === 'faq';

          // Abaikan pesan biasa yang dikirim oleh diri sendiri, KECUALI jika itu perintah bot
          if (msg.key.fromMe && !isCmd) continue;

          await this.handleIncomingMessage(msg);
        }
      });

      return this.getStatus();
    } catch (err) {
      this.isConnecting = false;
      this.status = 'error';
      console.error('Failed to start Baileys:', err);
      return this.getStatus();
    }
  }

  /**
   * Execute media download and deliver payload (video, audio, or slides) to WhatsApp
   */
  private async executeMediaDownload(
    targetUrl: string,
    remoteJid: string,
    msg: WAMessage,
    cleanText: string,
    maskedSender: string,
    options: {
      isAudioOnly?: boolean;
      slideIndices?: number[];
      resolution?: VideoResolution;
    } = {}
  ): Promise<void> {
    if (!this.sock) return;
    const startTime = Date.now();

    // Send wait reaction
    try {
      await this.sock.sendMessage(remoteJid, {
        react: { text: '⏳', key: msg.key },
      });
    } catch {}

    try {
      const result = await downloadMediaFromUrl(targetUrl, options);

      if (!result.success) {
        try {
          await this.sock.sendMessage(remoteJid, {
            react: { text: '❌', key: msg.key },
          });
        } catch {}

        const failMsg = `❌ *Gagal Mengunduh Media*\n\n${result.error || 'Media tidak dapat diakses atau dibatasi.'}`;
        await this.sock.sendMessage(remoteJid, { text: failMsg }, { quoted: msg });

        this.addLog({
          feature_key: 'downloader',
          feature_name: 'Media Downloader',
          command: cleanText,
          sender_masked: maskedSender,
          status: 'failed',
          execution_time_ms: Date.now() - startTime,
          detail: `Downloader failed: ${result.error}`,
        });
        return;
      }

      // Send media according to media type
      if (result.type === 'video') {
        if (result.buffer) {
          // Large video (> 55MB) sent as document MP4 to prevent WhatsApp stream drop/rejection
          const isLarge = result.buffer.length > 55 * 1024 * 1024;
          if (isLarge) {
            const rawTitle = (result.title || 'video').replace(/[/\\?%*:|"<>]/g, '_').slice(0, 50);
            const fileName = `${rawTitle}_${result.resolution || 'video'}.mp4`;
            await this.sock.sendMessage(
              remoteJid,
              {
                document: result.buffer,
                mimetype: 'video/mp4',
                fileName,
                caption: `${result.caption}\n\n📁 _Dikirim sebagai dokumen MP4 karena ukuran file besar (> 55 MB) agar kualitas Full HD terjaga._`,
              },
              { quoted: msg }
            );
          } else {
            await this.sock.sendMessage(
              remoteJid,
              {
                video: result.buffer,
                mimetype: 'video/mp4',
                caption: result.caption,
              },
              { quoted: msg }
            );
          }
        } else if (result.mediaUrl) {
          await this.sock.sendMessage(
            remoteJid,
            {
              video: { url: result.mediaUrl },
              mimetype: 'video/mp4',
              caption: result.caption,
            },
            { quoted: msg }
          );
        }
      } else if (result.type === 'audio') {
        if (result.buffer) {
          await this.sock.sendMessage(
            remoteJid,
            {
              audio: result.buffer,
              mimetype: 'audio/mp4',
              ptt: false,
            },
            { quoted: msg }
          );
        } else if (result.mediaUrl) {
          await this.sock.sendMessage(
            remoteJid,
            {
              audio: { url: result.mediaUrl },
              mimetype: 'audio/mp4',
              ptt: false,
            },
            { quoted: msg }
          );
        }
      } else if (result.type === 'images' && result.images && result.images.length > 0) {
        const totalImgs = result.images.length;
        const totalSlides = result.totalSlides || totalImgs;
        const selectedIndices = result.selectedSlideIndices || result.images.map((_, i) => i + 1);

        for (let i = 0; i < totalImgs; i++) {
          const isFirst = i === 0;
          const imgUrl = result.images[i];
          const slideNum = selectedIndices[i] || i + 1;

          let slideCaption = '';
          if (totalImgs === 1) {
            slideCaption = result.caption || `📸 Slide ${slideNum} dari ${totalSlides}`;
          } else if (isFirst) {
            slideCaption = `${result.caption}\n\n🖼️ *[1/${totalImgs}] Slide ${slideNum} dari ${totalSlides}*`;
          } else {
            slideCaption = `🖼️ *[${i + 1}/${totalImgs}] Slide ${slideNum} dari ${totalSlides}*`;
          }

          // Safely download buffer to avoid CDN 403 Forbidden
          const imgBuffer = await downloadMediaBuffer(imgUrl, 20 * 1024 * 1024);
          const mediaContent = imgBuffer ? { image: imgBuffer } : { image: { url: imgUrl } };

          await this.sock.sendMessage(
            remoteJid,
            {
              ...mediaContent,
              caption: slideCaption,
            },
            { quoted: isFirst ? msg : undefined }
          );

          if (i < totalImgs - 1) {
            await new Promise((r) => setTimeout(r, 650));
          }
        }
      }

      // Success reaction
      try {
        await this.sock.sendMessage(remoteJid, {
          react: { text: '✅', key: msg.key },
        });
      } catch {}

      this.mediaDownloadedToday++;
      this.commandsCountToday++;
      this.addLog({
        feature_key: 'downloader',
        feature_name: 'Media Downloader',
        command: cleanText,
        sender_masked: maskedSender,
        status: 'success',
        execution_time_ms: Date.now() - startTime,
        detail: `Berhasil mengunduh ${result.platform} (${result.type}${result.resolution ? ' - ' + result.resolution + 'p' : ''})`,
      });
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : 'Gagal mengirim media.';
      console.error('[BOT DOWNLOADER ERROR]', err);
      try {
        await this.sock.sendMessage(remoteJid, {
          react: { text: '❌', key: msg.key },
        });
      } catch {}

      await this.sock.sendMessage(
        remoteJid,
        {
          text: `❌ Terjadi kesalahan saat memproses unduhan: ${errorMsg}`,
        },
        { quoted: msg }
      );

      this.addLog({
        feature_key: 'downloader',
        feature_name: 'Media Downloader',
        command: cleanText,
        sender_masked: maskedSender,
        status: 'failed',
        execution_time_ms: Date.now() - startTime,
        detail: `Error sending media: ${errorMsg}`,
      });
    }
  }

  // Real WhatsApp message handler
  private async handleIncomingMessage(msg: WAMessage) {
    if (!this.sock || !msg || !msg.key) return;

    const remoteJid = msg.key.remoteJid;
    if (!remoteJid || remoteJid === 'status@broadcast') return;

    const senderRaw = (msg.key.participant || remoteJid).split('@')[0];
    const maskedSender =
      senderRaw.length > 7
        ? senderRaw.slice(0, 5) + '***' + senderRaw.slice(-3)
        : senderRaw;

    // Extract text
    const text =
      msg.message?.conversation ||
      msg.message?.extendedTextMessage?.text ||
      msg.message?.imageMessage?.caption ||
      msg.message?.videoMessage?.caption ||
      '';

    const cleanText = text.trim();
    const lower = cleanText.toLowerCase();
    const prefix = this.rateLimit.command_prefix || '!';

    // Sync konfigurasi fitur dari Supabase berkala (setiap 15 detik)
    if (Date.now() - this.lastFeatureSync > 15000) {
      this.lastFeatureSync = Date.now();
      await this.syncFeaturesFromDb();
    }

    // 1. Rate Limiter check (§8 Anti-Abuse)
    const now = Date.now();
    const lastCmd = this.userLastCommandMap.get(remoteJid) || 0;
    const cooldownMs = this.rateLimit.cooldown_seconds * 1000;

    if (now - lastCmd < cooldownMs) {
      const waitSec = ((cooldownMs - (now - lastCmd)) / 1000).toFixed(1);
      this.addLog({
        feature_key: 'anti_abuse',
        feature_name: 'Rate Limiter',
        command: cleanText || '(media)',
        sender_masked: maskedSender,
        status: 'rate_limited',
        execution_time_ms: 5,
        detail: `Ditolak oleh middleware rate-limit. Sisa cooldown: ${waitSec}s.`,
      });
      return;
    }

    this.userLastCommandMap.set(remoteJid, now);
    this.commandsCountToday++;

    // Check for pending YouTube resolution selection reply
    const pendingKey = `${remoteJid}:${senderRaw}`;
    const pendingYt = this.pendingYouTubeMap.get(pendingKey);
    if (pendingYt) {
      const isExpired = Date.now() - pendingYt.createdAt > 3 * 60 * 1000;
      if (isExpired) {
        this.pendingYouTubeMap.delete(pendingKey);
      } else {
        const choice = cleanText.trim().toLowerCase();
        let selectedRes: VideoResolution | null = null;
        let isAudioOnly = false;
        let isCancelled = false;

        if (choice === '1' || choice === '480' || choice === '480p') {
          selectedRes = '480';
        } else if (choice === '2' || choice === '720' || choice === '720p') {
          selectedRes = '720';
        } else if (choice === '3' || choice === '1080' || choice === '1080p') {
          selectedRes = '1080';
        } else if (choice === '4' || choice === 'mp3' || choice === 'audio') {
          isAudioOnly = true;
        } else if (choice === 'batal' || choice === 'cancel') {
          isCancelled = true;
        }

        if (isCancelled) {
          this.pendingYouTubeMap.delete(pendingKey);
          await this.sock.sendMessage(
            remoteJid,
            { text: '❌ Pilihan unduhan YouTube telah dibatalkan.' },
            { quoted: msg }
          );
          return;
        } else if (selectedRes || isAudioOnly) {
          this.pendingYouTubeMap.delete(pendingKey);
          await this.executeMediaDownload(
            pendingYt.url,
            remoteJid,
            msg,
            cleanText,
            maskedSender,
            {
              isAudioOnly,
              resolution: selectedRes || undefined,
            }
          );
          return;
        } else {
          // If the message is a new command, clear the pending session
          if (
            cleanText.startsWith(prefix) ||
            cleanText.startsWith('!') ||
            cleanText.startsWith('/') ||
            cleanText.startsWith('.')
          ) {
            this.pendingYouTubeMap.delete(pendingKey);
          }
        }
      }
    }

    // 2. Sticker Maker (§5.1)
    const stickerFeat = this.features.find((f) => f.feature_key === 'sticker_maker');
    const isStickerCmd =
      stickerFeat &&
      stickerFeat.is_enabled &&
      (lower.startsWith(stickerFeat.command_trigger) ||
        lower.startsWith(`${prefix}s`) ||
        lower.startsWith(`${prefix}sticker`) ||
        lower.startsWith('!s') ||
        lower.startsWith('/s') ||
        lower.startsWith('.s') ||
        lower.startsWith('!sticker') ||
        lower.startsWith('/sticker') ||
        lower.startsWith('.sticker') ||
        stickerFeat.aliases.some((a) => lower.startsWith(a)));

    if (isStickerCmd && stickerFeat) {
      const startTime = Date.now();
      try {
        const quotedMsg = msg.message?.extendedTextMessage?.contextInfo?.quotedMessage;
        const targetMsg = quotedMsg ? { message: quotedMsg, key: msg.key } : msg;

        const isImg = Boolean(targetMsg.message?.imageMessage);
        const isVid = Boolean(targetMsg.message?.videoMessage);

        if (!isImg && !isVid) {
          await this.sock.sendMessage(
            remoteJid,
            { text: `⚠️ Kirim gambar dengan caption \`${prefix}s\` atau balas (reply) gambar dengan \`${prefix}s\` untuk dijadikan stiker.` },
            { quoted: msg }
          );
          return;
        }

        // Download media from WhatsApp
        const mediaBuffer = await downloadMediaMessage(targetMsg as WAMessage, 'buffer', {});

        // Process WebP 512x512 with Sharp
        const webpBuffer = await sharp(mediaBuffer)
          .resize(512, 512, {
            fit: 'contain',
            background: { r: 0, g: 0, b: 0, alpha: 0 },
          })
          .webp({ quality: 80 })
          .toBuffer();

        // Inject EXIF Pack and Author Name (§5.1 & §10)
        const packName = stickerFeat.extra_settings.pack_name || 'Verand Pack';
        const authorName = stickerFeat.extra_settings.author_name || 'Verand.Bot';
        const finalSticker = await addExifToWebp(webpBuffer, packName, authorName);

        // Send Sticker back
        await this.sock.sendMessage(
          remoteJid,
          { sticker: finalSticker },
          { quoted: msg }
        );

        this.stickersCountToday++;
        const elapsed = Date.now() - startTime;

        this.addLog({
          feature_key: 'sticker_maker',
          feature_name: 'Stiker Maker',
          command: cleanText || `${prefix}sticker`,
          sender_masked: maskedSender,
          status: 'success',
          execution_time_ms: elapsed,
          detail: `Stiker WebP 512x512 [${packName} / ${authorName}] dikirim dalam ${elapsed}ms.`,
        });
        return;
      } catch (err) {
        console.error('Sticker Maker Error:', err);
        await this.sock.sendMessage(
          remoteJid,
          { text: '❌ Terjadi kesalahan saat memproses stiker.' },
          { quoted: msg }
        );
        this.addLog({
          feature_key: 'sticker_maker',
          feature_name: 'Stiker Maker',
          command: cleanText,
          sender_masked: maskedSender,
          status: 'failed',
          execution_time_ms: Date.now() - startTime,
          detail: (err as Error)?.message || 'Error processing sticker',
        });
        return;
      }
    }

    // 3. Sticker to Media (§5.1)
    const toMediaFeat = this.features.find((f) => f.feature_key === 'sticker_to_media');
    const isToMediaCmd =
      toMediaFeat &&
      toMediaFeat.is_enabled &&
      (lower.startsWith(toMediaFeat.command_trigger) ||
        lower.startsWith(`${prefix}toimg`) ||
        lower.startsWith(`${prefix}tomedia`) ||
        lower.startsWith('!toimg') ||
        lower.startsWith('/toimg') ||
        lower.startsWith('.toimg') ||
        lower.startsWith('!tomedia') ||
        lower.startsWith('/tomedia') ||
        lower.startsWith('.tomedia') ||
        toMediaFeat.aliases.some((a) => lower.startsWith(a)));

    if (isToMediaCmd && toMediaFeat) {
      const startTime = Date.now();
      try {
        const quotedMsg = msg.message?.extendedTextMessage?.contextInfo?.quotedMessage;
        if (!quotedMsg?.stickerMessage) {
          await this.sock.sendMessage(
            remoteJid,
            { text: `⚠️ Balas (reply) stiker dengan perintah \`${prefix}toimg\` atau \`${prefix}tomedia\`.` },
            { quoted: msg }
          );
          return;
        }

        const stickerBuf = await downloadMediaMessage(
          { message: quotedMsg, key: msg.key } as WAMessage,
          'buffer',
          {}
        );

        // Convert WebP back to PNG via Sharp
        const pngBuf = await sharp(stickerBuf).png().toBuffer();

        await this.sock.sendMessage(
          remoteJid,
          { image: pngBuf, caption: '🖼️ Stiker berhasil dikonversi ke gambar PNG.' },
          { quoted: msg }
        );

        const elapsed = Date.now() - startTime;
        this.addLog({
          feature_key: 'sticker_to_media',
          feature_name: 'Stiker to Media',
          command: cleanText,
          sender_masked: maskedSender,
          status: 'success',
          execution_time_ms: elapsed,
          detail: `Stiker dikonversi ke PNG transparan dalam ${elapsed}ms.`,
        });
        return;
      } catch (err) {
        console.error('Sticker to Media Error:', err);
        await this.sock.sendMessage(
          remoteJid,
          { text: '❌ Gagal mengonversi stiker ke gambar.' },
          { quoted: msg }
        );
        return;
      }
    }

    // 4. Menu Command
    if (
      lower === `${prefix}menu` ||
      lower === `${prefix}help` ||
      lower === 'menu' ||
      lower === 'help' ||
      lower === '!menu' ||
      lower === '/menu' ||
      lower === '.menu' ||
      lower === '!help' ||
      lower === '/help' ||
      lower === '.help'
    ) {
      const menuText = generateMenuText(prefix, this.features);

      await this.sock.sendMessage(remoteJid, { text: menuText }, { quoted: msg });

      this.addLog({
        feature_key: 'system',
        feature_name: 'Bot Menu',
        command: cleanText,
        sender_masked: maskedSender,
        status: 'success',
        execution_time_ms: 25,
        detail: 'Daftar menu command dikirimkan ke pengguna.',
      });
      return;
    }

    // 5. AI Chat (§5.2)
    const aiFeat = this.features.find((f) => f.feature_key === 'ai_chat');
    const isAiCmd =
      aiFeat &&
      aiFeat.is_enabled &&
      (lower.startsWith(aiFeat.command_trigger) ||
        lower.startsWith(`${prefix}ai`) ||
        lower.startsWith('!ai') ||
        lower.startsWith('/ai') ||
        lower.startsWith('.ai') ||
        aiFeat.aliases.some((a) => lower.startsWith(a)));

    if (isAiCmd && aiFeat) {
      const prompt = cleanText.replace(/^[!/.]?(ai|ask|tanya)\s*/i, '').trim();
      const reply = `🤖 *Verand AI*: Halo! Terima kasih atas pesanmu: "${prompt || '...'}"\n\nSistem Verand.Bot beroperasi normal dan siap melayani. Ada hal lain yang bisa dibantu?`;

      await this.sock.sendMessage(remoteJid, { text: reply }, { quoted: msg });

      this.addLog({
        feature_key: 'ai_chat',
        feature_name: 'AI Chat Assistant',
        command: cleanText,
        sender_masked: maskedSender,
        status: 'success',
        execution_time_ms: 120,
        detail: 'AI response sent to user.',
      });
      return;
    }

    // 6. Media Downloader (§5.1)
    const dlFeat = this.features.find((f) => f.feature_key === 'downloader');

    // Check all common prefixes and triggers dynamically
    const activePrefixes = Array.from(new Set([prefix, '!', '/', '.']));
    const dlKeywords = [
      'dl', 'download',
      'yt', 'youtube', 'ytmp4', 'ytv',
      'ytmp3', 'ytaudio', 'yta',
      'tt', 'tiktok',
      'ig', 'instagram', 'reel', 'reels',
      'fb', 'facebook',
      'tw', 'twitter', 'x'
    ];

    const isCommandTriggered =
      activePrefixes.some((pfx) =>
        dlKeywords.some(
          (kw) =>
            lower.startsWith(`${pfx}${kw} `) ||
            lower === `${pfx}${kw}` ||
            lower.startsWith(`${pfx}${kw}\n`)
        )
      ) ||
      (dlFeat?.command_trigger ? lower.startsWith(dlFeat.command_trigger) : false) ||
      Boolean(
        dlFeat?.aliases &&
          dlFeat.aliases.some((a) => {
            const raw = a.replace(/^[!/.]/, '');
            return activePrefixes.some(
              (pfx) =>
                lower.startsWith(`${pfx}${raw} `) ||
                lower === `${pfx}${raw}` ||
                lower.startsWith(`${pfx}${raw}\n`)
            );
          })
      );

    // In private chats, allow pasting supported social media URLs directly
    const directUrlMatch = cleanText.match(/https?:\/\/[^\s]+/i);
    const isDirectSocialUrl =
      !remoteJid.endsWith('@g.us') &&
      Boolean(directUrlMatch && detectPlatform(directUrlMatch[0]) !== 'unknown');

    const isDlCmd = dlFeat && dlFeat.is_enabled && (isCommandTriggered || isDirectSocialUrl);

    if (isDlCmd && dlFeat) {
      const parsedReq = parseSlideRequest(cleanText);
      if (!parsedReq) {
        const helpText =
          `📥 *Media Downloader Verand.Bot*\n\n` +
          `Sertakan link media yang ingin diunduh!\n` +
          `*Contoh Unduh Semua:* ${prefix}dl https://vt.tiktok.com/xxxxxx/\n` +
          `*Contoh Unduh Per Slide:* ${prefix}dl <url> 2 (atau: slide 2, slide 1-3, slide 1,3, all)\n\n` +
          `*Perintah Cepat:*\n` +
          `• *${prefix}tt <url> [slide]* : Unduh video/audio/slide TikTok tanpa watermark\n` +
          `• *${prefix}ig <url> [slide]* : Unduh video Reels / carousel foto Instagram\n` +
          `• *${prefix}yt <url> [480|720|1080]* : Unduh video YouTube (pilihan 480p, 720p, 1080p)\n` +
          `• *${prefix}ytmp3 <url>* : Unduh audio YouTube (MP3)\n` +
          `• *${prefix}fb <url>* : Unduh video Facebook HD/SD\n` +
          `• *${prefix}twitter <url>* : Unduh video Twitter/X\n\n` +
          `_Tips:_ Anda juga bisa langsung menempelkan tautan YouTube / TikTok / Instagram langsung di chat pribadi bot!`;

        await this.sock.sendMessage(remoteJid, { text: helpText }, { quoted: msg });
        return;
      }

      const targetUrl = parsedReq.url;
      const slideIndices = parsedReq.slideIndices;
      const explicitResolution = parsedReq.resolution;
      const textWithoutUrl = cleanText.replace(targetUrl, '').trim().toLowerCase();
      const isAudioOnly =
        textWithoutUrl.includes('ytmp3') ||
        textWithoutUrl.includes('ytaudio') ||
        textWithoutUrl.includes('yta') ||
        textWithoutUrl.includes('--audio') ||
        textWithoutUrl.includes('-a') ||
        textWithoutUrl.includes('audio') ||
        textWithoutUrl.includes('mp3');

      const isYouTube = detectPlatform(targetUrl) === 'youtube';

      // If YouTube video mode (not audio only) and user hasn't explicitly specified resolution:
      if (isYouTube && !isAudioOnly && !explicitResolution) {
        const ytInfo = await getYouTubeInfo(targetUrl);
        const title = ytInfo?.title || 'YouTube Video';
        const author = ytInfo?.author || 'YouTube Creator';
        const durationText = ytInfo?.duration ? `⏱️ *Durasi:* ${ytInfo.duration}\n` : '';
        const thumbnail = ytInfo?.thumbnail || '';

        const selectionText =
          `🎬 *PILIH RESOLUSI YOUTUBE*\n\n` +
          `📌 *Judul:* ${title.slice(0, 100)}\n` +
          `👤 *Channel:* ${author}\n` +
          durationText +
          `\n` +
          `Silakan balas (reply) pesan ini atau ketik pilihan Anda:\n` +
          `1️⃣ *480p* (Hemat Kuota / Cepat) ➔ balas *1* atau *480*\n` +
          `2️⃣ *720p* (HD - Standar Rekomendasi) ➔ balas *2* atau *720*\n` +
          `3️⃣ *1080p* (Full HD Jernih) ➔ balas *3* atau *1080*\n` +
          `🎵 *Audio MP3* (Hanya Suara) ➔ balas *mp3* atau *audio*\n\n` +
          `_Ketik *batal* untuk membatalkan (berlaku 3 menit)._\n` +
          `_Tips: Anda juga bisa langsung: \`${prefix}yt <link> 720\` atau \`${prefix}yt <link> 1080\`_`;

        // Save pending request for this user / chat
        const pendingKey = `${remoteJid}:${senderRaw}`;
        this.pendingYouTubeMap.set(pendingKey, {
          url: targetUrl,
          sender: senderRaw,
          remoteJid,
          title,
          author,
          duration: ytInfo?.duration || '',
          thumbnail,
          createdAt: Date.now(),
        });

        // Try sending with thumbnail image if available
        let sentWithThumbnail = false;
        if (thumbnail && thumbnail.startsWith('http')) {
          try {
            const thumbBuffer = await downloadMediaBuffer(thumbnail, 5 * 1024 * 1024, 7000);
            if (thumbBuffer) {
              await this.sock.sendMessage(
                remoteJid,
                { image: thumbBuffer, caption: selectionText },
                { quoted: msg }
              );
              sentWithThumbnail = true;
            }
          } catch {}
        }

        if (!sentWithThumbnail) {
          await this.sock.sendMessage(
            remoteJid,
            { text: selectionText },
            { quoted: msg }
          );
        }

        this.addLog({
          feature_key: 'downloader',
          feature_name: 'Media Downloader',
          command: cleanText,
          sender_masked: maskedSender,
          status: 'success',
          execution_time_ms: 15,
          detail: 'Menu pilihan resolusi YouTube dikirimkan ke pengguna.',
        });
        return;
      }

      // If resolution is already specified, audio mode, or other platforms, download directly
      await this.executeMediaDownload(targetUrl, remoteJid, msg, cleanText, maskedSender, {
        isAudioOnly,
        slideIndices,
        resolution: explicitResolution || '720',
      });
      return;
    }

    // 7. Auto-Reply & FAQ (§5.2)
    const autoFeat = this.features.find((f) => f.feature_key === 'auto_reply');
    if (autoFeat && autoFeat.is_enabled) {
      const isFaqCmd =
        lower === `${prefix}faq` ||
        lower === `${prefix}info` ||
        lower === '!faq' ||
        lower === '/faq' ||
        lower === '.faq' ||
        lower === '!info' ||
        lower === '/info' ||
        lower === '.info' ||
        lower === 'faq' ||
        lower === 'info' ||
        autoFeat.aliases.some((a) => lower === a);

      if (isFaqCmd) {
        const faqText = generateFaqText(prefix, autoFeat.extra_settings?.auto_replies);
        await this.sock.sendMessage(remoteJid, { text: faqText }, { quoted: msg });
        this.addLog({
          feature_key: 'auto_reply',
          feature_name: 'Auto-Reply & FAQ',
          command: cleanText,
          sender_masked: maskedSender,
          status: 'success',
          execution_time_ms: 20,
          detail: 'FAQ dan panduan bot dikirimkan ke pengguna.',
        });
        return;
      }

      if (autoFeat.extra_settings?.auto_replies) {
        const match = autoFeat.extra_settings.auto_replies.find((r) =>
          lower.includes(r.trigger.toLowerCase())
        );
        if (match) {
          await this.sock.sendMessage(remoteJid, { text: `💬 ${match.response}` }, { quoted: msg });
          this.addLog({
            feature_key: 'auto_reply',
            feature_name: 'Auto-Reply & FAQ',
            command: cleanText,
            sender_masked: maskedSender,
            status: 'success',
            execution_time_ms: 30,
            detail: `Trigger matched: "${match.trigger}"`,
          });
          return;
        }
      }
    }

    // 8. Pantauan BMKG & Bencana Alam
    const bmkgFeat = this.features.find((f) => f.feature_key === 'bmkg_monitor');
    if (bmkgFeat && bmkgFeat.is_enabled) {
      const activePrefixes = Array.from(new Set([prefix, '!', '/', '.']));
      const matchTrigger = (cmds: string[]) =>
        activePrefixes.some((pfx) =>
          cmds.some(
            (c) =>
              lower === `${pfx}${c}` ||
              lower.startsWith(`${pfx}${c} `) ||
              lower.startsWith(`${pfx}${c}\n`)
          )
        ) ||
        cmds.some((c) => lower === c || lower.startsWith(`${c} `));

      // 8.1 Menu BMKG
      if (matchTrigger(['bmkg', 'bencana', 'gempahelp', 'cuacahelp'])) {
        const bmkgMenu = formatBmkgMenuText(prefix);
        await this.sock.sendMessage(remoteJid, { text: bmkgMenu }, { quoted: msg });
        this.addLog({
          feature_key: 'bmkg_monitor',
          feature_name: 'Pantauan BMKG & Bencana',
          command: cleanText,
          sender_masked: maskedSender,
          status: 'success',
          execution_time_ms: 15,
          detail: 'Menu panduan pantauan BMKG & bencana dikirimkan.',
        });
        return;
      }

      // 8.2 Gempa Terkini M 5.0+ / Dirasakan + Shakemap
      if (matchTrigger(['gempa', 'autogempa', 'gempaterkini', 'gempanow'])) {
        const startTime = Date.now();
        try {
          await this.sock.sendMessage(remoteJid, { react: { text: '⏳', key: msg.key } });
        } catch {}

        try {
          const { data: gempa, imageBuffer } = await getLatestEarthquake();
          const caption = formatEarthquakeText(gempa, false);

          if (imageBuffer) {
            await this.sock.sendMessage(
              remoteJid,
              {
                image: imageBuffer,
                caption,
              },
              { quoted: msg }
            );
          } else {
            await this.sock.sendMessage(remoteJid, { text: caption }, { quoted: msg });
          }

          try {
            await this.sock.sendMessage(remoteJid, { react: { text: '✅', key: msg.key } });
          } catch {}

          this.commandsCountToday++;
          this.addLog({
            feature_key: 'bmkg_monitor',
            feature_name: 'Pantauan BMKG & Bencana',
            command: cleanText,
            sender_masked: maskedSender,
            status: 'success',
            execution_time_ms: Date.now() - startTime,
            detail: `Gempa terkini M ${gempa.Magnitude} (${gempa.Wilayah}) dikirim beserta shakemap.`,
          });
        } catch (err: unknown) {
          const errMsg = err instanceof Error ? err.message : 'Gagal mengambil data gempa BMKG.';
          try {
            await this.sock.sendMessage(remoteJid, { react: { text: '❌', key: msg.key } });
          } catch {}
          await this.sock.sendMessage(
            remoteJid,
            { text: `❌ Terjadi kendala saat mengakses server BMKG: ${errMsg}` },
            { quoted: msg }
          );
        }
        return;
      }

      // 8.3 15 Gempa M 5.0+ Terkini
      if (matchTrigger(['gempa5m', 'gempabesar', 'listgempa', 'gempa5'])) {
        const startTime = Date.now();
        try {
          await this.sock.sendMessage(remoteJid, { react: { text: '⏳', key: msg.key } });
        } catch {}

        try {
          const list = await getRecentEarthquakes();
          const txt = formatRecentEarthquakesText(list);
          await this.sock.sendMessage(remoteJid, { text: txt }, { quoted: msg });
          try {
            await this.sock.sendMessage(remoteJid, { react: { text: '✅', key: msg.key } });
          } catch {}

          this.commandsCountToday++;
          this.addLog({
            feature_key: 'bmkg_monitor',
            feature_name: 'Pantauan BMKG & Bencana',
            command: cleanText,
            sender_masked: maskedSender,
            status: 'success',
            execution_time_ms: Date.now() - startTime,
            detail: `Daftar 10 gempa M 5.0+ dikirimkan ke pengguna.`,
          });
        } catch (err: unknown) {
          const errMsg = err instanceof Error ? err.message : 'Gagal mengambil daftar gempa BMKG.';
          await this.sock.sendMessage(remoteJid, { text: `❌ Gagal: ${errMsg}` }, { quoted: msg });
        }
        return;
      }

      // 8.4 Gempa Dirasakan
      if (matchTrigger(['dirasakan', 'gempadirasakan', 'gempammi'])) {
        const startTime = Date.now();
        try {
          await this.sock.sendMessage(remoteJid, { react: { text: '⏳', key: msg.key } });
        } catch {}

        try {
          const list = await getFeltEarthquakes();
          const txt = formatFeltEarthquakesText(list);
          await this.sock.sendMessage(remoteJid, { text: txt }, { quoted: msg });
          try {
            await this.sock.sendMessage(remoteJid, { react: { text: '✅', key: msg.key } });
          } catch {}

          this.commandsCountToday++;
          this.addLog({
            feature_key: 'bmkg_monitor',
            feature_name: 'Pantauan BMKG & Bencana',
            command: cleanText,
            sender_masked: maskedSender,
            status: 'success',
            execution_time_ms: Date.now() - startTime,
            detail: `Daftar 10 gempa dirasakan dikirimkan ke pengguna.`,
          });
        } catch (err: unknown) {
          const errMsg = err instanceof Error ? err.message : 'Gagal mengambil data gempa dirasakan.';
          await this.sock.sendMessage(remoteJid, { text: `❌ Gagal: ${errMsg}` }, { quoted: msg });
        }
        return;
      }

      // 8.5 Prakiraan Cuaca
      if (matchTrigger(['cuaca', 'weather', 'prakiraancuaca'])) {
        const startTime = Date.now();
        let targetLocation = cleanText.replace(/^[!/.]?(cuaca|weather|prakiraancuaca)\s*/i, '').trim();
        if (!targetLocation) {
          targetLocation = bmkgFeat.extra_settings?.default_weather_city || 'Jakarta';
        }

        try {
          await this.sock.sendMessage(remoteJid, { react: { text: '⏳', key: msg.key } });
        } catch {}

        try {
          const forecast = await getWeatherForecast(targetLocation);
          const txt = formatWeatherText(forecast);
          await this.sock.sendMessage(remoteJid, { text: txt }, { quoted: msg });
          try {
            await this.sock.sendMessage(remoteJid, { react: { text: '✅', key: msg.key } });
          } catch {}

          this.commandsCountToday++;
          this.addLog({
            feature_key: 'bmkg_monitor',
            feature_name: 'Pantauan BMKG & Bencana',
            command: cleanText,
            sender_masked: maskedSender,
            status: 'success',
            execution_time_ms: Date.now() - startTime,
            detail: `Prakiraan cuaca ${forecast.locationName} (${forecast.elevation || 0} mdpl, ${forecast.current.condition}, ${forecast.current.tempC}°C) dikirim.`,
          });
        } catch (err: unknown) {
          const errMsg = err instanceof Error ? err.message : 'Gagal mencari ramalan cuaca daerah tersebut.';
          try {
            await this.sock.sendMessage(remoteJid, { react: { text: '❌', key: msg.key } });
          } catch {}
          await this.sock.sendMessage(
            remoteJid,
            { text: `⚠️ ${errMsg}\n\n_Contoh pencarian desa & kecamatan berdasarkan ketinggian (MDPL):_\n• \`${prefix}cuaca Desa Cikole\`\n• \`${prefix}cuaca Lembang 1400mdpl\`\n• \`${prefix}cuaca Dieng\`\n• \`${prefix}cuaca Pangalengan, Bandung\`` },
            { quoted: msg }
          );
        }
        return;
      }

      // 8.6 Citra Satelit Cuaca Himawari-9
      if (matchTrigger(['satelit', 'citrasatelit', 'satelithujan'])) {
        const startTime = Date.now();
        const param = cleanText.replace(/^[!/.]?(satelit|citrasatelit|satelithujan)\s*/i, '').trim().toLowerCase();
        const satType = param.includes('hujan') || lower.includes('satelithujan') ? 'hujan' : param.includes('hotspot') ? 'hotspot' : 'awan';

        try {
          await this.sock.sendMessage(remoteJid, { react: { text: '⏳', key: msg.key } });
        } catch {}

        try {
          const sat = await getSatelliteImage(satType);
          await this.sock.sendMessage(
            remoteJid,
            {
              image: sat.buffer,
              caption: sat.caption,
            },
            { quoted: msg }
          );
          try {
            await this.sock.sendMessage(remoteJid, { react: { text: '✅', key: msg.key } });
          } catch {}

          this.commandsCountToday++;
          this.addLog({
            feature_key: 'bmkg_monitor',
            feature_name: 'Pantauan BMKG & Bencana',
            command: cleanText,
            sender_masked: maskedSender,
            status: 'success',
            execution_time_ms: Date.now() - startTime,
            detail: `Citra satelit Himawari-9 (${satType}) dikirimkan ke pengguna.`,
          });
        } catch (err: unknown) {
          const errMsg = err instanceof Error ? err.message : 'Gagal mengunduh citra satelit BMKG.';
          await this.sock.sendMessage(remoteJid, { text: `❌ ${errMsg}` }, { quoted: msg });
        }
        return;
      }

      // 8.7 Pantauan Hotspot Karhutla
      if (matchTrigger(['hotspot', 'karhutla', 'titikpanas', 'kebakaran'])) {
        const startTime = Date.now();
        try {
          await this.sock.sendMessage(remoteJid, { react: { text: '⏳', key: msg.key } });
        } catch {}

        try {
          const sat = await getSatelliteImage('hotspot');
          await this.sock.sendMessage(
            remoteJid,
            {
              image: sat.buffer,
              caption: sat.caption,
            },
            { quoted: msg }
          );
          try {
            await this.sock.sendMessage(remoteJid, { react: { text: '✅', key: msg.key } });
          } catch {}

          this.commandsCountToday++;
          this.addLog({
            feature_key: 'bmkg_monitor',
            feature_name: 'Pantauan BMKG & Bencana',
            command: cleanText,
            sender_masked: maskedSender,
            status: 'success',
            execution_time_ms: Date.now() - startTime,
            detail: `Peta sebaran titik panas hotspot karhutla BMKG dikirimkan.`,
          });
        } catch (err: unknown) {
          const errMsg = err instanceof Error ? err.message : 'Gagal mengambil peta hotspot BMKG.';
          await this.sock.sendMessage(remoteJid, { text: `❌ ${errMsg}` }, { quoted: msg });
        }
        return;
      }

      // 8.8 Peringatan Cuaca Maritim & Gelombang Tinggi
      if (matchTrigger(['gelombang', 'maritim', 'cuacalaut', 'ombak'])) {
        const startTime = Date.now();
        const regionFilter = cleanText.replace(/^[!/.]?(gelombang|maritim|cuacalaut|ombak)\s*/i, '').trim();

        try {
          await this.sock.sendMessage(remoteJid, { react: { text: '⏳', key: msg.key } });
        } catch {}

        try {
          const maritimeData = await getMaritimeWarnings(regionFilter || undefined);
          const txt = formatMaritimeText(maritimeData);
          await this.sock.sendMessage(remoteJid, { text: txt }, { quoted: msg });
          try {
            await this.sock.sendMessage(remoteJid, { react: { text: '✅', key: msg.key } });
          } catch {}

          this.commandsCountToday++;
          this.addLog({
            feature_key: 'bmkg_monitor',
            feature_name: 'Pantauan BMKG & Bencana',
            command: cleanText,
            sender_masked: maskedSender,
            status: 'success',
            execution_time_ms: Date.now() - startTime,
            detail: `Peringatan dini gelombang maritim BMKG dikirimkan.`,
          });
        } catch (err: unknown) {
          const errMsg = err instanceof Error ? err.message : 'Gagal mengambil data maritim BMKG.';
          await this.sock.sendMessage(remoteJid, { text: `❌ ${errMsg}` }, { quoted: msg });
        }
        return;
      }

      // 8.9 Kualitas Udara (PM2.5 & AQI)
      if (matchTrigger(['udara', 'aqi', 'polusi', 'pm25'])) {
        const startTime = Date.now();
        let targetCity = cleanText.replace(/^[!/.]?(udara|aqi|polusi|pm25)\s*/i, '').trim();
        if (!targetCity) targetCity = 'Jakarta';

        try {
          await this.sock.sendMessage(remoteJid, { react: { text: '⏳', key: msg.key } });
        } catch {}

        try {
          const aq = await getAirQuality(targetCity);
          const txt = formatAirQualityText(aq);
          await this.sock.sendMessage(remoteJid, { text: txt }, { quoted: msg });
          try {
            await this.sock.sendMessage(remoteJid, { react: { text: '✅', key: msg.key } });
          } catch {}

          this.commandsCountToday++;
          this.addLog({
            feature_key: 'bmkg_monitor',
            feature_name: 'Pantauan BMKG & Bencana',
            command: cleanText,
            sender_masked: maskedSender,
            status: 'success',
            execution_time_ms: Date.now() - startTime,
            detail: `Data kualitas udara ${aq.location} (AQI ${aq.aqi} - ${aq.status}) dikirimkan.`,
          });
        } catch (err: unknown) {
          const errMsg = err instanceof Error ? err.message : 'Gagal memeriksa kualitas udara.';
          await this.sock.sendMessage(remoteJid, { text: `⚠️ ${errMsg}` }, { quoted: msg });
        }
        return;
      }
    }
  }

  // Background watcher peringatan gempa BMKG
  private startBmkgEarthquakeWatcher() {
    if (this.bmkgWatcherInterval) clearInterval(this.bmkgWatcherInterval);
    this.bmkgWatcherInterval = setInterval(async () => {
      try {
        const bmkgFeat = this.features.find((f) => f.feature_key === 'bmkg_monitor');
        if (!bmkgFeat || !bmkgFeat.is_enabled || !bmkgFeat.extra_settings?.bmkg_auto_alert) {
          return;
        }

        const minMag = Number(bmkgFeat.extra_settings.bmkg_min_magnitude) || 5.0;
        const recipients = bmkgFeat.extra_settings.bmkg_alert_recipients || [];
        if (recipients.length === 0 || !this.sock) return;

        const { data: gempa, imageBuffer } = await getLatestEarthquake();
        const eventId = `${gempa.DateTime}_${gempa.Magnitude}_${gempa.Coordinates}`;

        if (!this.lastKnownEarthquakeId) {
          this.lastKnownEarthquakeId = eventId;
          return;
        }

        if (eventId !== this.lastKnownEarthquakeId) {
          this.lastKnownEarthquakeId = eventId;
          const magNum = parseFloat(gempa.Magnitude);

          if (magNum >= minMag) {
            const alertText = formatEarthquakeText(gempa, true);
            for (const recipient of recipients) {
              const cleanJid = recipient.includes('@') ? recipient : `${recipient}@s.whatsapp.net`;
              try {
                if (imageBuffer) {
                  await this.sock.sendMessage(cleanJid, {
                    image: imageBuffer,
                    caption: alertText,
                  });
                } else {
                  await this.sock.sendMessage(cleanJid, { text: alertText });
                }
              } catch (e) {
                console.warn(`[BMKG Auto-Alert] Gagal mengirim ke ${cleanJid}:`, e);
              }
            }

            this.addLog({
              feature_key: 'bmkg_monitor',
              feature_name: 'Pantauan BMKG & Bencana',
              command: '[AUTO-ALERT] Gempa Bumi M ' + gempa.Magnitude,
              sender_masked: 'BMKG TEWS Broadcast',
              status: 'success',
              execution_time_ms: 100,
              detail: `Peringatan gempa otomatis dikirim ke ${recipients.length} penerima: ${gempa.Wilayah}`,
            });
          }
        }
      } catch {
        // Silently catch poll errors
      }
    }, 60000);
  }

  // Disconnect & logout session
  public async disconnect() {
    if (this.bmkgWatcherInterval) {
      clearInterval(this.bmkgWatcherInterval);
      this.bmkgWatcherInterval = null;
    }
    if (this.sock) {
      try {
        await this.sock.logout();
      } catch {
        // ignore
      }
      this.sock = null;
    }
    this.isConnecting = false;
    this.status = 'disconnected';
    this.nomorWa = null;
    this.pushName = null;
    this.qrRaw = null;
    this.qrDataUrl = null;
    this.connectedAt = null;

    // Clean session files
    try {
      if (fs.existsSync(this.authDir)) {
        fs.rmSync(this.authDir, { recursive: true, force: true });
        fs.mkdirSync(this.authDir, { recursive: true });
      }
    } catch (e) {
      console.error('Error clearing session dir:', e);
    }

    this.addLog({
      feature_key: 'system',
      feature_name: 'Koneksi Baileys',
      command: '[SYS] Sesi WhatsApp Dihapus / Disconnected',
      sender_masked: 'System Core',
      status: 'success',
      execution_time_ms: 40,
      detail: 'Sesi Baileys di-logout dan kredensial dibersihkan.',
    });

    return this.getStatus();
  }
}

// Global singleton pattern to survive Next.js HMR in dev mode
const globalForBot = globalThis as unknown as {
  whatsappBotManager?: BotManager;
};

if (globalForBot.whatsappBotManager) {
  // Hot-patch existing live instance with newly compiled prototype and methods
  // so live WhatsApp socket immediately executes updated code without needing reconnect
  Object.setPrototypeOf(globalForBot.whatsappBotManager, BotManager.prototype);
  const target = globalForBot.whatsappBotManager as unknown as Record<string, unknown>;
  const source = BotManager.prototype as unknown as Record<string, unknown>;
  for (const name of Object.getOwnPropertyNames(BotManager.prototype)) {
    if (name !== 'constructor') {
      target[name] = source[name];
    }
  }
}

export const botManager = globalForBot.whatsappBotManager || new BotManager();

if (process.env.NODE_ENV !== 'production') {
  globalForBot.whatsappBotManager = botManager;
}
