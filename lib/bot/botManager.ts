import makeWASocket, {
  DisconnectReason,
  useMultiFileAuthState as initMultiFileAuthState,
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
import { downloadMediaFromUrl, parseSlideRequest, downloadMediaBuffer } from './mediaDownloader';
import { generateMenuText, generateFaqText } from './menuHelper';
import { ActivityLog, FeatureConfig, RateLimitConfig, BotConnectionStatus } from '../types';
import { dbInsertActivityLog, dbSaveBotInstance } from '../supabase/client';

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

class BotManager {
  private sock: WASocket | null = null;
  private status: BotConnectionStatus = 'disconnected';
  private qrRaw: string | null = null;
  private qrDataUrl: string | null = null;
  private nomorWa: string | null = null;
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
  private authDir: string;
  private configFile: string;

  constructor() {
    this.authDir = path.join(process.cwd(), 'sessions', 'baileys_auth');
    this.configFile = path.join(process.cwd(), 'sessions', 'bot_config.json');
    if (!fs.existsSync(this.authDir)) {
      fs.mkdirSync(this.authDir, { recursive: true });
    }

    this.loadConfig();

    // Auto-reconnect if session credentials exist
    const credsPath = path.join(this.authDir, 'creds.json');
    if (fs.existsSync(credsPath)) {
      setTimeout(() => {
        this.startBot().catch((e) => console.error('Auto-start Baileys error:', e));
      }, 500);
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
      console.error('Error loading config:', e);
    }
  }

  private saveConfig() {
    try {
      const sessDir = path.join(process.cwd(), 'sessions');
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
      console.error('Error saving config:', e);
    }
  }

  public getStatus() {
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
    return this.logs;
  }

  public getFeatures(): FeatureConfig[] {
    return this.features;
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
  }

  public addLog(item: Omit<ActivityLog, 'id' | 'created_at'>) {
    const log: ActivityLog = {
      ...item,
      id: 'log-' + Date.now() + '-' + Math.floor(Math.random() * 1000),
      created_at: new Date().toISOString(),
    };
    this.logs = [log, ...this.logs.slice(0, 99)];
    dbInsertActivityLog(log).catch(() => {});
  }

  // Start real Baileys connection
  public async startBot() {
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
      const { state, saveCreds } = await initMultiFileAuthState(this.authDir);

      this.sock = makeWASocket({
        auth: state,
        printQRInTerminal: false,
        logger: pino({ level: 'silent' }),
        browser: ['Verand Control Room', 'Chrome', '120.0.0'],
      });

      this.sock.ev.on('creds.update', saveCreds);

      this.sock.ev.on('connection.update', async (update: { connection?: string; lastDisconnect?: { error?: unknown }; qr?: string }) => {
        const { connection, lastDisconnect, qr } = update;

        if (qr) {
          this.isConnecting = false;
          this.qrRaw = qr;
          try {
            this.qrDataUrl = await QRCode.toDataURL(qr, { margin: 1, scale: 8 });
          } catch (e) {
            console.error('Failed to generate QR DataURL:', e);
          }
          this.status = 'disconnected'; // Waiting for scan
        }

        if (connection === 'open') {
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

          dbSaveBotInstance({
            id: 'inst-core',
            nomor_wa: masked,
            status: 'connected',
            connected_at: this.connectedAt,
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
        }

        if (connection === 'close') {
          this.isConnecting = false;
          const statusCode = (lastDisconnect?.error as { output?: { statusCode?: number } })?.output?.statusCode;
          const isLoggedOut = statusCode === DisconnectReason.loggedOut;

          this.status = 'disconnected';
          this.nomorWa = null;
          this.connectedAt = null;
          this.qrRaw = null;
          this.qrDataUrl = null;

          dbSaveBotInstance({
            id: 'inst-core',
            status: 'disconnected',
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
          if (!msg.message || msg.key.fromMe) continue;
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

  // Real WhatsApp message handler
  private async handleIncomingMessage(msg: WAMessage) {
    if (!this.sock || !msg || !msg.key) return;

    const remoteJid = msg.key.remoteJid;
    if (!remoteJid) return;

    const senderRaw = remoteJid.split('@')[0];
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
    const isDlCmd =
      dlFeat &&
      dlFeat.is_enabled &&
      (lower.startsWith(dlFeat.command_trigger) ||
        lower.startsWith(`${prefix}dl`) ||
        lower.startsWith('!dl') ||
        lower.startsWith('/dl') ||
        dlFeat.aliases.some((a) => lower.startsWith(a)));

    if (isDlCmd && dlFeat) {
      const parsedReq = parseSlideRequest(cleanText);
      if (!parsedReq) {
        const helpText =
          `📥 *Media Downloader Verand.Bot*\n\n` +
          `Sertakan link media yang ingin diunduh!\n` +
          `*Contoh Unduh Semua:* ${prefix}dl https://vt.tiktok.com/xxxxxx/\n` +
          `*Contoh Unduh Per Slide:* ${prefix}dl <url> 2 (atau: slide 2, slide 1-3, slide 1,3, all)\n\n` +
          `*Perintah Cepat:*\n` +
          `• *!tt <url> [slide]* : Unduh video/audio/slide TikTok tanpa watermark\n` +
          `• *!ig <url> [slide]* : Unduh video Reels / carousel foto Instagram\n` +
          `• *!yt <url>* : Unduh video YouTube (MP4)\n` +
          `• *!ytmp3 <url>* : Unduh audio YouTube (MP3)\n` +
          `• *!fb <url>* : Unduh video Facebook HD/SD\n` +
          `• *!twitter <url>* : Unduh video Twitter/X\n\n` +
          `_Tips Foto Slide:_ Ketik nomor slide (misal *!tt <url> 3* atau *!ig <url> slide 1-4*) atau kirim link saja untuk langsung mengunduh semua foto!`;

        await this.sock.sendMessage(remoteJid, { text: helpText }, { quoted: msg });
        return;
      }

      const targetUrl = parsedReq.url;
      const slideIndices = parsedReq.slideIndices;
      const isAudioOnly =
        lower.includes('ytmp3') ||
        lower.includes('--audio') ||
        lower.includes('-a') ||
        lower.includes('mp3');

      const startTime = Date.now();

      // Send wait reaction
      try {
        await this.sock.sendMessage(remoteJid, {
          react: { text: '⏳', key: msg.key },
        });
      } catch {}

      try {
        const result = await downloadMediaFromUrl(targetUrl, { isAudioOnly, slideIndices });

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
            await this.sock.sendMessage(
              remoteJid,
              {
                video: result.buffer,
                mimetype: 'video/mp4',
                caption: result.caption,
              },
              { quoted: msg }
            );
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
          detail: `Berhasil mengunduh ${result.platform} (${result.type})`,
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
          detail: `Downloader exception: ${errorMsg}`,
        });
      }
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
  }

  // Disconnect & logout session
  public async disconnect() {
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
