import { FeatureConfig, RateLimitConfig } from './types';

export const DEFAULT_FEATURES: FeatureConfig[] = [
  {
    id: 'feat-sticker-maker',
    feature_key: 'sticker_maker',
    name: 'Stiker Maker',
    tagline: 'Konversi otomatis foto/video pendek ke stiker WhatsApp WebP 512x512 + custom EXIF pack',
    category: 'core',
    is_enabled: true,
    command_trigger: '!sticker',
    aliases: ['!s', '!stiker', '!swm', '/sticker', '/s'],
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
    aliases: ['!toimg', '!togif', '/tomedia', '/toimg'],
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
    aliases: ['!tt', '!ig', '!yt', '!ytmp3', '!fb', '!tiktok', '!youtube', '!instagram', '!twitter', '/dl', '/tt', '/ig', '/yt'],
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
    aliases: ['!auto', '!info', '/faq', '/info'],
    extra_settings: {
      auto_replies: [
        { trigger: 'halo', response: 'Halo! Verand Bot aktif 24/7. Ketik /menu untuk melihat fitur.' },
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
    aliases: ['!tanya', '!ask', '/ai', '/tanya'],
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
    aliases: ['!welcome', '/group'],
    extra_settings: {
      anti_link: true,
      welcome_message: 'Selamat datang di grup!',
    },
  },
];

export const DEFAULT_RATE_LIMIT: RateLimitConfig = {
  cooldown_seconds: 3,
  command_prefix: '/',
  max_per_minute: 20,
  anti_spam_active: true,
  blacklisted_senders: [],
  whitelist_groups_only: false,
  whitelisted_groups: [],
};
