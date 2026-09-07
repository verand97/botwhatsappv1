/**
 * Media Downloader Service for Verand.Bot
 * Supports TikTok (no-watermark video/audio/slides), YouTube (MP4/MP3),
 * Facebook, Twitter/X, and Instagram.
 */

// eslint-disable-next-line @typescript-eslint/no-require-imports
const ruhend = require('ruhend-scraper');
// eslint-disable-next-line @typescript-eslint/no-require-imports
const btch = require('btch-downloader');
// eslint-disable-next-line @typescript-eslint/no-require-imports
const { Downloader: tiktokDl } = require('@tobyg74/tiktok-api-dl');
// eslint-disable-next-line @typescript-eslint/no-require-imports
const dylux = require('api-dylux');

export type MediaPlatform = 'tiktok' | 'youtube' | 'instagram' | 'facebook' | 'twitter' | 'unknown';
export type MediaType = 'video' | 'audio' | 'images' | 'text';

export interface MediaDownloadResult {
  success: boolean;
  platform: MediaPlatform;
  type: MediaType;
  title?: string;
  author?: string;
  thumbnail?: string;
  mediaUrl?: string;
  audioUrl?: string;
  images?: string[];
  buffer?: Buffer;
  caption?: string;
  error?: string;
  executionTimeMs?: number;
}

/**
 * Detect social media platform from URL
 */
export function detectPlatform(url: string): MediaPlatform {
  const lower = url.toLowerCase();
  if (lower.includes('tiktok.com') || lower.includes('vt.tiktok.com') || lower.includes('vm.tiktok.com')) {
    return 'tiktok';
  }
  if (lower.includes('youtube.com') || lower.includes('youtu.be') || lower.includes('m.youtube.com')) {
    return 'youtube';
  }
  if (lower.includes('instagram.com') || lower.includes('instagr.am')) {
    return 'instagram';
  }
  if (lower.includes('facebook.com') || lower.includes('fb.watch') || lower.includes('fb.com')) {
    return 'facebook';
  }
  if (lower.includes('twitter.com') || lower.includes('x.com')) {
    return 'twitter';
  }
  return 'unknown';
}

/**
 * Safely fetch a media file into a Buffer with size & timeout limits
 */
export async function downloadMediaBuffer(
  mediaUrl: string,
  maxBytes: number = 45 * 1024 * 1024,
  timeoutMs: number = 25000
): Promise<Buffer | null> {
  if (!mediaUrl || !mediaUrl.startsWith('http')) return null;

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), timeoutMs);

    const response = await fetch(mediaUrl, {
      signal: controller.signal,
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
        Accept: '*/*',
        Referer: 'https://www.google.com/',
      },
    });

    clearTimeout(timeout);

    if (!response.ok && response.status !== 206) {
      console.warn(`[Buffer Downloader] HTTP ${response.status} from ${mediaUrl.slice(0, 60)}...`);
      return null;
    }

    const contentLength = response.headers.get('content-length');
    if (contentLength && parseInt(contentLength, 10) > maxBytes) {
      console.warn(`[Buffer Downloader] Content length ${contentLength} exceeds ${maxBytes}`);
      return null;
    }

    const arrayBuf = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuf);
    return buffer.length > 0 ? buffer : null;
  } catch (err) {
    console.warn('[Buffer Downloader] Fetch error:', (err as Error).message);
    return null;
  }
}

/**
 * TikTok media downloader with 4 fallback providers
 */
async function extractTikTok(url: string, isAudioOnly: boolean = false): Promise<MediaDownloadResult> {
  let title = 'TikTok Video';
  let author = 'TikTok Creator';
  let videoUrl = '';
  let audioUrl = '';
  const images: string[] = [];

  // Provider 1: ruhend-scraper.ttdl
  try {
    const res = await ruhend.ttdl(url);
    if (res && (res.video || res.video_hd || res.music)) {
      title = res.title || title;
      author = res.author || res.username || author;
      videoUrl = res.video_hd || res.video || '';
      audioUrl = res.music || '';
    }
  } catch (e) {
    console.warn('[TikTok DL] Ruhend scraper error, trying fallback:', (e as Error).message);
  }

  // Provider 2: @tobyg74/tiktok-api-dl
  if (!videoUrl && !images.length) {
    try {
      const res = await tiktokDl(url, { version: 'v1' });
      if (res && res.status === 'success' && res.result) {
        title = res.result.desc || title;
        author = res.result.author?.nickname || res.result.author?.username || author;
        audioUrl = res.result.music?.playUrl?.[0] || audioUrl;

        if (res.result.type === 'image' && Array.isArray(res.result.images) && res.result.images.length > 0) {
          images.push(...res.result.images);
        } else if (res.result.video?.playAddr?.[0]) {
          videoUrl = res.result.video.playAddr[0];
        }
      }
    } catch (e) {
      console.warn('[TikTok DL] TobyG74 v1 error, trying v2:', (e as Error).message);
      try {
        const res2 = await tiktokDl(url, { version: 'v2' });
        if (res2 && res2.status === 'success' && res2.result) {
          videoUrl = res2.result.video || '';
          audioUrl = res2.result.music || '';
        }
      } catch {
        // Continue to next provider
      }
    }
  }

  // Provider 3: api-dylux.tiktok
  if (!videoUrl && !images.length) {
    try {
      const res = await dylux.tiktok(url);
      if (res && res.result) {
        title = res.result.title || title;
        author = res.result.author?.nickname || author;
        videoUrl = res.result.play || res.result.wmplay || '';
        audioUrl = res.result.music || audioUrl;
      }
    } catch (e) {
      console.warn('[TikTok DL] Dylux error:', (e as Error).message);
    }
  }

  // Provider 4: btch-downloader.ttdl
  if (!videoUrl && !images.length) {
    try {
      const res = await btch.ttdl(url);
      if (res && res.status && (res.video?.[0] || res.audio?.[0])) {
        title = res.title || title;
        videoUrl = res.video?.[0] || '';
        audioUrl = res.audio?.[0] || audioUrl;
      }
    } catch (e) {
      console.warn('[TikTok DL] Btch error:', (e as Error).message);
    }
  }

  // If TikTok photos/slides
  if (images.length > 0) {
    return {
      success: true,
      platform: 'tiktok',
      type: 'images',
      title,
      author,
      images,
      caption: `📸 *TikTok Slides/Photos*\n📌 *Judul:* ${title.slice(0, 100)}\n👤 *Kreator:* @${author}\n🖼️ *Total:* ${images.length} foto\n\n⚡ _Powered by Verand.Bot_`,
    };
  }

  if (isAudioOnly && audioUrl) {
    const buffer = await downloadMediaBuffer(audioUrl, 25 * 1024 * 1024);
    return {
      success: true,
      platform: 'tiktok',
      type: 'audio',
      title,
      author,
      mediaUrl: audioUrl,
      buffer: buffer || undefined,
      caption: `🎵 *TikTok Audio MP3*\n📌 *Judul:* ${title.slice(0, 100)}\n👤 *Kreator:* @${author}\n\n⚡ _Powered by Verand.Bot_`,
    };
  }

  if (videoUrl) {
    const buffer = await downloadMediaBuffer(videoUrl, 45 * 1024 * 1024);
    return {
      success: true,
      platform: 'tiktok',
      type: 'video',
      title,
      author,
      mediaUrl: videoUrl,
      audioUrl: audioUrl || undefined,
      buffer: buffer || undefined,
      caption: `🎬 *TikTok No-Watermark*\n📌 *Judul:* ${title.slice(0, 120)}\n👤 *Kreator:* @${author}\n\n⚡ _Powered by Verand.Bot_`,
    };
  }

  return {
    success: false,
    platform: 'tiktok',
    type: 'video',
    error: 'Gagal mengekstrak media TikTok. Pastikan video bersifat publik dan tautan valid.',
  };
}

/**
 * YouTube media downloader (MP4 video or MP3 audio)
 */
async function extractYouTube(url: string, isAudioOnly: boolean = false): Promise<MediaDownloadResult> {
  try {
    const res = await btch.youtube(url);
    if (res && res.status && (res.mp4 || res.mp3)) {
      const title = res.title || 'YouTube Media';
      const author = res.author || 'YouTube Creator';
      const thumbnail = res.thumbnail || '';
      const videoUrl = res.mp4 || '';
      const audioUrl = res.mp3 || '';

      if (isAudioOnly && audioUrl) {
        const buffer = await downloadMediaBuffer(audioUrl, 30 * 1024 * 1024);
        return {
          success: true,
          platform: 'youtube',
          type: 'audio',
          title,
          author,
          thumbnail,
          mediaUrl: audioUrl,
          buffer: buffer || undefined,
          caption: `🎵 *YouTube Audio MP3*\n📌 *Judul:* ${title.slice(0, 120)}\n👤 *Channel:* ${author}\n\n⚡ _Powered by Verand.Bot_`,
        };
      }

      const chosenUrl = videoUrl || audioUrl;
      const chosenType: MediaType = videoUrl ? 'video' : 'audio';
      const buffer = await downloadMediaBuffer(chosenUrl, 45 * 1024 * 1024);

      return {
        success: true,
        platform: 'youtube',
        type: chosenType,
        title,
        author,
        thumbnail,
        mediaUrl: chosenUrl,
        audioUrl: audioUrl || undefined,
        buffer: buffer || undefined,
        caption: `🎬 *YouTube ${chosenType === 'video' ? 'Video MP4' : 'Audio MP3'}*\n📌 *Judul:* ${title.slice(0, 120)}\n👤 *Channel:* ${author}\n\n⚡ _Powered by Verand.Bot_`,
      };
    }
  } catch (e) {
    console.warn('[YouTube DL] Btch error:', (e as Error).message);
  }

  // Fallback: search metadata if download link is unavailable
  try {
    const yts = await ruhend.ytsearch(url);
    const video = yts?.video?.[0];
    if (video) {
      return {
        success: false,
        platform: 'youtube',
        type: 'video',
        title: video.title,
        author: video.authorName,
        thumbnail: video.thumbnail,
        error: `Video YouTube "${video.title}" ditemukan (${video.durationH}), tetapi link download langsung sedang diproses ulang oleh server. Coba beberapa saat lagi atau gunakan resolusi lebih rendah.`,
      };
    }
  } catch {
    // Continue
  }

  return {
    success: false,
    platform: 'youtube',
    type: 'video',
    error: 'Gagal mengunduh video YouTube. Pastikan URL valid dan video tidak dibatasi usia/negara.',
  };
}

/**
 * Facebook media downloader (HD / SD video)
 */
async function extractFacebook(url: string): Promise<MediaDownloadResult> {
  let videoUrl = '';
  let title = 'Facebook Video';

  // Provider 1: ruhend-scraper.fbdl
  try {
    const res = await ruhend.fbdl(url);
    if (Array.isArray(res) && res.length > 0 && res[0]) {
      videoUrl = res[0];
    }
  } catch (e) {
    console.warn('[Facebook DL] Ruhend error:', (e as Error).message);
  }

  // Provider 2: btch-downloader.fbdown
  if (!videoUrl) {
    try {
      const res = await btch.fbdown(url);
      if (res && res.status) {
        videoUrl = res.HD || res.Normal_video || '';
      }
    } catch (e) {
      console.warn('[Facebook DL] Btch error:', (e as Error).message);
    }
  }

  if (videoUrl) {
    const buffer = await downloadMediaBuffer(videoUrl, 45 * 1024 * 1024);
    return {
      success: true,
      platform: 'facebook',
      type: 'video',
      title,
      mediaUrl: videoUrl,
      buffer: buffer || undefined,
      caption: `🎬 *Facebook Video HD*\n📌 *Judul:* ${title}\n\n⚡ _Powered by Verand.Bot_`,
    };
  }

  return {
    success: false,
    platform: 'facebook',
    type: 'video',
    error: 'Gagal mengunduh video Facebook. Pastikan video bersifat Publik dan link mengarah langsung ke video/reel.',
  };
}

/**
 * Twitter / X media downloader
 */
async function extractTwitter(url: string): Promise<MediaDownloadResult> {
  try {
    const res = await btch.twitter(url);
    if (res && res.status && res.url) {
      let targetUrl = '';
      if (Array.isArray(res.url)) {
        // pick highest quality
        const last = res.url[res.url.length - 1];
        targetUrl = typeof last === 'string' ? last : last?.hd || last?.sd || last?.url || '';
      } else if (typeof res.url === 'string') {
        targetUrl = res.url;
      }

      if (targetUrl) {
        const buffer = await downloadMediaBuffer(targetUrl, 40 * 1024 * 1024);
        return {
          success: true,
          platform: 'twitter',
          type: 'video',
          title: res.title || 'Twitter Video',
          mediaUrl: targetUrl,
          buffer: buffer || undefined,
          caption: `🎬 *Twitter / X Video*\n📌 *Keterangan:* ${(res.title || 'Media X').slice(0, 100)}\n\n⚡ _Powered by Verand.Bot_`,
        };
      }
    }
  } catch (e) {
    console.warn('[Twitter DL] Btch error:', (e as Error).message);
  }

  return {
    success: false,
    platform: 'twitter',
    type: 'video',
    error: 'Gagal mengunduh media dari Twitter/X. Pastikan postingan berisi video/GIF dan akun tidak digembok.',
  };
}

/**
 * Instagram media downloader with multi-tier handling
 */
async function extractInstagram(url: string): Promise<MediaDownloadResult> {
  // Provider 1: instagram-url-direct
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { instagramGetUrl } = require('instagram-url-direct');
    const res = await instagramGetUrl(url);
    if (res && res.url_list && res.url_list.length > 0) {
      const mediaUrl = res.url_list[0];
      const isVideo = mediaUrl.includes('.mp4') || !mediaUrl.includes('.jpg');
      const buffer = await downloadMediaBuffer(mediaUrl, 45 * 1024 * 1024);
      return {
        success: true,
        platform: 'instagram',
        type: isVideo ? 'video' : 'images',
        title: res.post_info?.caption || 'Instagram Media',
        author: res.post_info?.owner_username || 'Instagram User',
        mediaUrl,
        buffer: buffer || undefined,
        caption: `🎬 *Instagram ${isVideo ? 'Reel/Video' : 'Photo'}*\n👤 *Akun:* @${res.post_info?.owner_username || 'user'}\n📌 *Caption:* ${(res.post_info?.caption || '').slice(0, 120)}\n\n⚡ _Powered by Verand.Bot_`,
      };
    }
  } catch (e) {
    console.warn('[Instagram DL] Direct error:', (e as Error).message);
  }

  // Provider 2: btch.igdl
  try {
    const res = await btch.igdl(url);
    if (res && res.status && Array.isArray(res.result) && res.result.length > 0) {
      const first = res.result.find((item: any) => item?.url && item.url.startsWith('http'));
      if (first) {
        const isVideo = first.url.includes('.mp4');
        const buffer = await downloadMediaBuffer(first.url, 45 * 1024 * 1024);
        return {
          success: true,
          platform: 'instagram',
          type: isVideo ? 'video' : 'images',
          title: 'Instagram Media',
          mediaUrl: first.url,
          buffer: buffer || undefined,
          caption: `🎬 *Instagram Media*\n\n⚡ _Powered by Verand.Bot_`,
        };
      }
    }
  } catch (e) {
    console.warn('[Instagram DL] Btch igdl error:', (e as Error).message);
  }

  // Provider 3: ruhend.igdl
  try {
    const res = await ruhend.igdl(url);
    if (Array.isArray(res) && res.length > 0 && typeof res[0] === 'string' && res[0].startsWith('http')) {
      const mediaUrl = res[0];
      const buffer = await downloadMediaBuffer(mediaUrl, 45 * 1024 * 1024);
      return {
        success: true,
        platform: 'instagram',
        type: 'video',
        title: 'Instagram Reel',
        mediaUrl,
        buffer: buffer || undefined,
        caption: `🎬 *Instagram Reel*\n\n⚡ _Powered by Verand.Bot_`,
      };
    }
  } catch (e) {
    console.warn('[Instagram DL] Ruhend igdl error:', (e as Error).message);
  }

  return {
    success: false,
    platform: 'instagram',
    type: 'video',
    error:
      '⚠️ Media Instagram ini tidak dapat diakses (Instagram Login Wall / Akun Privat). Pastikan link bersifat publik, atau gunakan video dari TikTok / YouTube / Facebook yang dapat diunduh tanpa kendala.',
  };
}

/**
 * Main coordinator function to download media from any supported platform
 */
export async function downloadMediaFromUrl(
  inputUrl: string,
  options: { isAudioOnly?: boolean } = {}
): Promise<MediaDownloadResult> {
  const startTime = Date.now();

  // Extract raw URL from potential surrounding text or parameters
  const urlMatch = inputUrl.match(/https?:\/\/[^\s]+/i);
  if (!urlMatch) {
    return {
      success: false,
      platform: 'unknown',
      type: 'text',
      error: 'Tautan URL tidak valid. Sertakan tautan yang diawali dengan http:// atau https://',
      executionTimeMs: Date.now() - startTime,
    };
  }

  const cleanUrl = urlMatch[0];
  const platform = detectPlatform(cleanUrl);

  let result: MediaDownloadResult;

  switch (platform) {
    case 'tiktok':
      result = await extractTikTok(cleanUrl, options.isAudioOnly);
      break;
    case 'youtube':
      result = await extractYouTube(cleanUrl, options.isAudioOnly);
      break;
    case 'facebook':
      result = await extractFacebook(cleanUrl);
      break;
    case 'twitter':
      result = await extractTwitter(cleanUrl);
      break;
    case 'instagram':
      result = await extractInstagram(cleanUrl);
      break;
    default:
      // Try TikTok as default fallback if platform unknown, otherwise prompt user
      result = {
        success: false,
        platform: 'unknown',
        type: 'text',
        error:
          'Platform belum didukung. Verand.Bot saat ini mendukung: *TikTok*, *YouTube*, *Instagram*, *Facebook*, dan *Twitter/X*.',
      };
      break;
  }

  result.executionTimeMs = Date.now() - startTime;
  return result;
}
