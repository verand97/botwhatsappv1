/**
 * Media Downloader Service for Verand.Bot
 * Supports TikTok (no-watermark video/audio/slides), YouTube (MP4/MP3),
 * Facebook, Twitter/X, and Instagram.
 */

import { execFile } from 'child_process';
import fs from 'fs';
import path from 'path';
import os from 'os';

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
  totalSlides?: number;
  selectedSlideIndices?: number[];
  buffer?: Buffer;
  caption?: string;
  error?: string;
  executionTimeMs?: number;
}

export interface DownloadMediaOptions {
  isAudioOnly?: boolean;
  slideIndices?: number[];
}

export interface ParsedMediaRequest {
  url: string;
  slideIndices?: number[];
  isAllSlides?: boolean;
  rawSlideArg?: string;
}

/**
 * Parse user text for URL and optional slide request parameters
 * Examples:
 *   !dl <url>           -> all slides
 *   !dl <url> 2         -> slide 2
 *   !dl <url> slide 3   -> slide 3
 *   !dl <url> slide 1-4 -> slides 1, 2, 3, 4
 *   !dl <url> slide 1,3 -> slides 1, 3
 *   !dl <url> all       -> all slides
 *   !dl 2 <url>         -> slide 2
 */
export function parseSlideRequest(text: string): ParsedMediaRequest | null {
  const urlMatch = text.match(/https?:\/\/[^\s]+/i);
  if (!urlMatch) return null;

  const url = urlMatch[0];
  const remaining = text
    .replace(url, ' ')
    .replace(/^[!/.]\w+\s*/i, ' ')
    .trim();

  if (!remaining) {
    return { url };
  }

  // Matches slide/slides/halaman/hlm/foto/gambar followed by number(s)/range or 'all'/'semua'
  const slideRegex = /(?:slide|slides|halaman|hlm|foto|gambar)?\s*([0-9\-,]+|all|semua)\b/i;
  const match = remaining.match(slideRegex);

  if (!match) {
    return { url };
  }

  const arg = match[1].toLowerCase();
  if (arg === 'all' || arg === 'semua') {
    return { url, isAllSlides: true, rawSlideArg: arg };
  }

  const indices = new Set<number>();
  const parts = arg.split(',');
  for (const part of parts) {
    const rangeMatch = part.trim().match(/^(\d+)\s*-\s*(\d+)$/);
    if (rangeMatch) {
      const start = parseInt(rangeMatch[1], 10);
      const end = parseInt(rangeMatch[2], 10);
      if (start > 0 && end >= start) {
        const actualEnd = Math.min(end, start + 49);
        for (let i = start; i <= actualEnd; i++) {
          indices.add(i);
        }
      }
    } else {
      const num = parseInt(part.trim(), 10);
      if (!isNaN(num) && num > 0) {
        indices.add(num);
      }
    }
  }

  if (indices.size > 0) {
    return {
      url,
      slideIndices: Array.from(indices).sort((a, b) => a - b),
      rawSlideArg: arg,
    };
  }

  return { url };
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
async function extractTikTok(
  url: string,
  isAudioOnly: boolean = false,
  slideIndices?: number[]
): Promise<MediaDownloadResult> {
  let title = 'TikTok Media';
  let author = 'TikTok Creator';
  let videoUrl = '';
  let audioUrl = '';
  const images: string[] = [];

  // Provider 1: @tobyg74/tiktok-api-dl (v1) - Best for detecting photos/slides & clean data
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
    console.warn('[TikTok DL] TobyG74 v1 error:', (e as Error).message);
  }

  // Provider 2: TikWM direct API - Dedicated slide and video extractor
  if (!images.length && !videoUrl) {
    try {
      const tikwmRes = await fetch(`https://tikwm.com/api/?url=${encodeURIComponent(url)}`, {
        headers: {
          'User-Agent':
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
          Accept: 'application/json',
        },
      });
      if (tikwmRes.ok) {
        const tikwmData = await tikwmRes.json();
        if (tikwmData && tikwmData.code === 0 && tikwmData.data) {
          title = tikwmData.data.title || title;
          author = tikwmData.data.author?.nickname || tikwmData.data.author?.unique_id || author;
          audioUrl = tikwmData.data.music || audioUrl;
          if (Array.isArray(tikwmData.data.images) && tikwmData.data.images.length > 0) {
            images.push(...tikwmData.data.images);
          } else if (tikwmData.data.play || tikwmData.data.wmplay) {
            videoUrl = tikwmData.data.play || tikwmData.data.wmplay;
          }
        }
      }
    } catch (e) {
      console.warn('[TikTok DL] TikWM API error:', (e as Error).message);
    }
  }

  // Provider 3: ruhend-scraper.ttdl
  if (!images.length && !videoUrl) {
    try {
      const res = await ruhend.ttdl(url);
      if (res) {
        title = res.title || title;
        author = res.author || res.username || author;
        if (Array.isArray(res.images) && res.images.length > 0) {
          images.push(...res.images);
        } else if (res.video_hd || res.video) {
          videoUrl = res.video_hd || res.video || '';
        }
        audioUrl = res.music || audioUrl;
      }
    } catch (e) {
      console.warn('[TikTok DL] Ruhend scraper error:', (e as Error).message);
    }
  }

  // Provider 4: @tobyg74/tiktok-api-dl (v2)
  if (!images.length && !videoUrl) {
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

  // Provider 5: api-dylux.tiktok
  if (!images.length && !videoUrl) {
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

  // Provider 6: btch-downloader.ttdl
  if (!images.length && !videoUrl) {
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

  // Handle TikTok photo slides
  if (images.length > 0) {
    const totalSlides = images.length;
    let selectedImages: string[] = images;
    let selectedIndices: number[] = images.map((_, i) => i + 1);

    if (slideIndices && slideIndices.length > 0) {
      const validIndices = slideIndices.filter((idx) => idx >= 1 && idx <= totalSlides);
      if (validIndices.length === 0) {
        return {
          success: false,
          platform: 'tiktok',
          type: 'images',
          totalSlides,
          error: `⚠️ Tautan TikTok ini memiliki total *${totalSlides} slide/foto*. Slide nomor *${slideIndices.join(', ')}* tidak ditemukan (tersedia: 1-${totalSlides}).`,
        };
      }
      selectedIndices = validIndices;
      selectedImages = validIndices.map((idx) => images[idx - 1]);
    }

    let caption = '';
    if (selectedImages.length === 1 && totalSlides > 1) {
      caption = `📸 *TikTok Slide ${selectedIndices[0]} dari ${totalSlides}*\n📌 *Judul:* ${title.slice(0, 100)}\n👤 *Kreator:* @${author}\n\n⚡ _Powered by Verand.Bot_`;
    } else if (selectedImages.length < totalSlides) {
      caption = `📸 *TikTok Slides (${selectedIndices.join(', ')} dari ${totalSlides})*\n📌 *Judul:* ${title.slice(0, 100)}\n👤 *Kreator:* @${author}\n🖼️ *Total Diunduh:* ${selectedImages.length} foto\n\n⚡ _Powered by Verand.Bot_`;
    } else {
      caption = `📸 *TikTok Slides/Photos (Semua: ${totalSlides} foto)*\n📌 *Judul:* ${title.slice(0, 100)}\n👤 *Kreator:* @${author}\n\n⚡ _Powered by Verand.Bot_`;
    }

    return {
      success: true,
      platform: 'tiktok',
      type: 'images',
      title,
      author,
      images: selectedImages,
      totalSlides,
      selectedSlideIndices: selectedIndices,
      caption,
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
    error: 'Gagal mengekstrak media TikTok. Pastikan postingan bersifat publik dan tautan valid.',
  };
}

/**
 * Execute yt-dlp binary with safe parameters and timeout
 */
function runYtDlp(args: string[], timeoutMs: number = 85000): Promise<{ stdout: string; stderr: string }> {
  return new Promise((resolve, reject) => {
    execFile(
      'yt-dlp',
      args,
      {
        timeout: timeoutMs,
        maxBuffer: 25 * 1024 * 1024,
      },
      (err, stdout, stderr) => {
        if (err) {
          return reject(new Error(stderr || err.message));
        }
        resolve({ stdout: stdout || '', stderr: stderr || '' });
      }
    );
  });
}

let isYtDlpAvailableCache: boolean | null = null;
async function checkYtDlpAvailable(): Promise<boolean> {
  if (isYtDlpAvailableCache !== null) return isYtDlpAvailableCache;
  try {
    await runYtDlp(['--version'], 5000);
    isYtDlpAvailableCache = true;
  } catch {
    isYtDlpAvailableCache = false;
  }
  return isYtDlpAvailableCache;
}

/**
 * Direct video downloader via yt-dlp for non-YouTube platforms (Facebook, Twitter/X, Instagram)
 */
async function extractVideoViaYtDlp(
  url: string,
  platform: MediaPlatform,
  defaultTitle: string
): Promise<MediaDownloadResult | null> {
  const hasYtDlp = await checkYtDlpAvailable();
  if (!hasYtDlp) return null;

  const tempDir = path.join(os.tmpdir(), 'verand_media');
  if (!fs.existsSync(tempDir)) {
    fs.mkdirSync(tempDir, { recursive: true });
  }

  const outPath = path.join(tempDir, `${platform}_${Date.now()}_${Math.random().toString(36).slice(2, 7)}.mp4`);

  try {
    const args: string[] = [
      '--no-update',
      '--no-playlist',
      '--js-runtimes', 'node',
      '--no-simulate',
      '--print', 'METADATA:%(title)s|||%(uploader)s|||%(thumbnail)s',
      '-f', 'bestvideo[ext=mp4]+bestaudio[ext=m4a]/best[ext=mp4]/best',
      '--merge-output-format', 'mp4',
      '--max-filesize', '45M',
      '-o', outPath,
      url,
    ];

    const { stdout } = await runYtDlp(args, 65000);

    let title = defaultTitle;
    let author = `${platform} Creator`;
    let thumbnail = '';

    const metaMatch = stdout.match(/METADATA:(.*)/);
    if (metaMatch) {
      const parts = metaMatch[1].split('|||');
      if (parts[0] && parts[0] !== 'NA') title = parts[0].trim();
      if (parts[1] && parts[1] !== 'NA') author = parts[1].trim();
      if (parts[2] && parts[2] !== 'NA') thumbnail = parts[2].trim();
    }

    if (fs.existsSync(outPath)) {
      const fileBuffer = fs.readFileSync(outPath);
      try {
        fs.unlinkSync(outPath);
      } catch {}

      if (fileBuffer.length > 0) {
        const platformName = platform === 'facebook' ? 'Facebook' : platform === 'twitter' ? 'Twitter / X' : 'Instagram';
        return {
          success: true,
          platform,
          type: 'video',
          title,
          author,
          thumbnail,
          buffer: fileBuffer,
          caption: `🎬 *${platformName} Video*\n📌 *Judul:* ${title.slice(0, 120)}\n\n⚡ _Powered by Verand.Bot_`,
        };
      }
    }
    return null;
  } catch {
    if (fs.existsSync(outPath)) {
      try {
        fs.unlinkSync(outPath);
      } catch {}
    }
    return null;
  }
}

/**
 * Native YouTube video & audio extractor using yt-dlp engine with format & size limits
 */
async function extractYouTubeViaYtDlp(
  url: string,
  isAudioOnly: boolean = false
): Promise<MediaDownloadResult | null> {
  const hasYtDlp = await checkYtDlpAvailable();
  if (!hasYtDlp) return null;

  const tempDir = path.join(os.tmpdir(), 'verand_media');
  if (!fs.existsSync(tempDir)) {
    fs.mkdirSync(tempDir, { recursive: true });
  }

  const ext = isAudioOnly ? 'mp3' : 'mp4';
  const outPath = path.join(tempDir, `yt_${Date.now()}_${Math.random().toString(36).slice(2, 7)}.${ext}`);

  try {
    const args: string[] = [
      '--no-update',
      '--no-playlist',
      '--js-runtimes', 'node',
      '--no-simulate',
      '--print', 'METADATA:%(title)s|||%(uploader)s|||%(duration_string)s|||%(thumbnail)s',
    ];

    if (isAudioOnly) {
      args.push(
        '-x',
        '--audio-format', 'mp3',
        '--audio-quality', '128K',
        '--max-filesize', '35M',
        '-o', outPath,
        url
      );
    } else {
      args.push(
        '-f', 'bv*[height<=720][ext=mp4]+ba[ext=m4a]/b[height<=720][ext=mp4]/bv*[height<=720]+ba/b[height<=720]/best',
        '--merge-output-format', 'mp4',
        '--max-filesize', '45M',
        '-o', outPath,
        url
      );
    }

    const { stdout, stderr } = await runYtDlp(args, 85000);

    // Parse metadata from print output
    let title = 'YouTube Media';
    let author = 'YouTube Creator';
    let duration = '';
    let thumbnail = '';

    const metaMatch = stdout.match(/METADATA:(.*)/);
    if (metaMatch) {
      const parts = metaMatch[1].split('|||');
      if (parts[0]) title = parts[0].trim();
      if (parts[1]) author = parts[1].trim();
      if (parts[2]) duration = parts[2].trim();
      if (parts[3]) thumbnail = parts[3].trim();
    }

    // Check if file was created successfully
    if (fs.existsSync(outPath)) {
      const fileBuffer = fs.readFileSync(outPath);
      // Clean up temp file immediately to avoid storage leak
      try {
        fs.unlinkSync(outPath);
      } catch {}

      if (fileBuffer.length > 0) {
        const sizeMb = (fileBuffer.length / (1024 * 1024)).toFixed(1);
        const durationText = duration ? `⏱️ *Durasi:* ${duration}\n` : '';
        const caption = isAudioOnly
          ? `🎵 *YouTube Audio MP3*\n📌 *Judul:* ${title.slice(0, 120)}\n👤 *Channel:* ${author}\n${durationText}💾 *Ukuran:* ${sizeMb} MB\n\n⚡ _Powered by Verand.Bot_`
          : `🎬 *YouTube Video MP4*\n📌 *Judul:* ${title.slice(0, 120)}\n👤 *Channel:* ${author}\n${durationText}💾 *Ukuran:* ${sizeMb} MB\n\n⚡ _Powered by Verand.Bot_`;

        return {
          success: true,
          platform: 'youtube',
          type: isAudioOnly ? 'audio' : 'video',
          title,
          author,
          thumbnail,
          buffer: fileBuffer,
          caption,
        };
      }
    }

    // If file was not created, inspect output for size caps or restrictions
    const combinedOutput = (stdout + ' ' + stderr).toLowerCase();
    if (combinedOutput.includes('file is larger than max-filesize')) {
      return {
        success: false,
        platform: 'youtube',
        type: isAudioOnly ? 'audio' : 'video',
        title,
        author,
        thumbnail,
        error: isAudioOnly
          ? '⚠️ Ukuran file audio melebihi batas WhatsApp (35 MB). Silakan pilih audio dengan durasi lebih pendek.'
          : '⚠️ Ukuran video melebihi batas pengiriman WhatsApp (maks. 45 MB). Silakan unduh versi audio dengan perintah: *!ytmp3 <link>*',
      };
    }

    if (combinedOutput.includes('video unavailable') || combinedOutput.includes('private video')) {
      return {
        success: false,
        platform: 'youtube',
        type: isAudioOnly ? 'audio' : 'video',
        error: '⚠️ Video YouTube tidak dapat diakses (bersifat privat, dihapus, atau dibatasi umur/wilayah).',
      };
    }

    return null;
  } catch (err) {
    const errMsg = ((err as Error).message || '').toLowerCase();
    console.warn('[YouTube yt-dlp] error:', errMsg);

    if (fs.existsSync(outPath)) {
      try {
        fs.unlinkSync(outPath);
      } catch {}
    }

    if (errMsg.includes('file is larger than max-filesize')) {
      return {
        success: false,
        platform: 'youtube',
        type: isAudioOnly ? 'audio' : 'video',
        error: isAudioOnly
          ? '⚠️ Ukuran file audio melebihi batas WhatsApp (35 MB).'
          : '⚠️ Ukuran video melebihi batas pengiriman WhatsApp (maks. 45 MB). Silakan unduh versi audio dengan perintah: *!ytmp3 <link>*',
      };
    }

    if (errMsg.includes('video unavailable') || errMsg.includes('private video')) {
      return {
        success: false,
        platform: 'youtube',
        type: isAudioOnly ? 'audio' : 'video',
        error: '⚠️ Video YouTube tidak dapat diakses (bersifat privat atau dibatasi negara/usia).',
      };
    }

    return null;
  }
}

/**
 * YouTube media downloader (MP4 video or MP3 audio) with multi-tier engine
 */
async function extractYouTube(url: string, isAudioOnly: boolean = false): Promise<MediaDownloadResult> {
  // Normalize YouTube shorts / mobile URLs if needed
  let cleanUrl = url;
  const shortMatch = url.match(/youtube\.com\/shorts\/([a-zA-Z0-9_-]+)/i);
  if (shortMatch) {
    cleanUrl = `https://www.youtube.com/watch?v=${shortMatch[1]}`;
  }

  // Provider 1: yt-dlp native (Best reliability, 100% direct MP4/MP3)
  try {
    const ytDlpRes = await extractYouTubeViaYtDlp(cleanUrl, isAudioOnly);
    if (ytDlpRes) {
      return ytDlpRes;
    }
  } catch (e) {
    console.warn('[YouTube DL] yt-dlp error:', (e as Error).message);
  }

  // Provider 2: btch.youtube (External API Fallback)
  try {
    const res = await btch.youtube(cleanUrl);
    if (res && res.status && (res.mp4 || res.mp3)) {
      const title = res.title || 'YouTube Media';
      const author = res.author || 'YouTube Creator';
      const thumbnail = res.thumbnail || '';
      const videoUrl = res.mp4 || '';
      const audioUrl = res.mp3 || '';

      if (isAudioOnly && audioUrl) {
        const buffer = await downloadMediaBuffer(audioUrl, 35 * 1024 * 1024);
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

      if (buffer || chosenUrl) {
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
    }
  } catch (e) {
    console.warn('[YouTube DL] Btch error:', (e as Error).message);
  }

  // Provider 3: ruhend metadata fallback
  try {
    const yts = await ruhend.ytsearch(cleanUrl);
    const video = yts?.video?.[0];
    if (video) {
      return {
        success: false,
        platform: 'youtube',
        type: isAudioOnly ? 'audio' : 'video',
        title: video.title,
        author: video.authorName,
        thumbnail: video.thumbnail,
        error: `Video YouTube "${video.title}" ditemukan (${video.durationH}), tetapi link unduhan sedang dibatasi oleh YouTube. Coba tautan lain atau gunakan resolusi lebih rendah.`,
      };
    }
  } catch {
    // Continue
  }

  return {
    success: false,
    platform: 'youtube',
    type: isAudioOnly ? 'audio' : 'video',
    error: 'Gagal mengunduh video YouTube. Pastikan URL valid dan video bersifat publik (tidak dibatasi usia/wilayah).',
  };
}

/**
 * Facebook media downloader (HD / SD video) with yt-dlp fallback
 */
async function extractFacebook(url: string): Promise<MediaDownloadResult> {
  let videoUrl = '';
  const title = 'Facebook Video';

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

  // Provider 3: yt-dlp fallback
  try {
    const ytDlpRes = await extractVideoViaYtDlp(url, 'facebook', 'Facebook Video');
    if (ytDlpRes) {
      return ytDlpRes;
    }
  } catch (e) {
    console.warn('[Facebook DL] yt-dlp fallback error:', (e as Error).message);
  }

  return {
    success: false,
    platform: 'facebook',
    type: 'video',
    error: 'Gagal mengunduh video Facebook. Pastikan video bersifat Publik dan link mengarah langsung ke video/reel.',
  };
}

/**
 * Twitter / X media downloader with yt-dlp fallback
 */
async function extractTwitter(url: string): Promise<MediaDownloadResult> {
  // Provider 1: btch.twitter
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

  // Provider 2: yt-dlp fallback
  try {
    const ytDlpRes = await extractVideoViaYtDlp(url, 'twitter', 'Twitter / X Video');
    if (ytDlpRes) {
      return ytDlpRes;
    }
  } catch (e) {
    console.warn('[Twitter DL] yt-dlp fallback error:', (e as Error).message);
  }

  return {
    success: false,
    platform: 'twitter',
    type: 'video',
    error: 'Gagal mengunduh media dari Twitter/X. Pastikan postingan berisi video/GIF dan akun tidak digembok.',
  };
}

/**
 * Instagram media downloader with multi-tier handling (Photos, Carousels, and Reels)
 */
async function extractInstagram(
  url: string,
  slideIndices?: number[]
): Promise<MediaDownloadResult> {
  let title = 'Instagram Media';
  let author = 'Instagram User';
  const images: string[] = [];
  const videos: string[] = [];

  // Provider 1: instagram-url-direct
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { instagramGetUrl } = require('instagram-url-direct');
    const res = await instagramGetUrl(url);
    if (res) {
      title = res.post_info?.caption || title;
      author = res.post_info?.owner_username || author;

      // Check media_details first for rich metadata
      if (Array.isArray(res.media_details) && res.media_details.length > 0) {
        for (const item of res.media_details) {
          if (item && item.url && typeof item.url === 'string') {
            if (item.type === 'video') {
              videos.push(item.url);
            } else {
              images.push(item.url);
            }
          }
        }
      }

      // If media_details was empty or incomplete, inspect url_list
      if (!images.length && !videos.length && Array.isArray(res.url_list) && res.url_list.length > 0) {
        for (const mediaUrl of res.url_list) {
          if (typeof mediaUrl === 'string' && mediaUrl.startsWith('http')) {
            const lower = mediaUrl.toLowerCase();
            if (lower.includes('.mp4') || lower.includes('video_url')) {
              videos.push(mediaUrl);
            } else {
              images.push(mediaUrl);
            }
          }
        }
      }
    }
  } catch (e) {
    console.warn('[Instagram DL] Direct error:', (e as Error).message);
  }

  // Provider 2: btch.igdl
  if (!images.length && !videos.length) {
    try {
      const res = await btch.igdl(url);
      if (res && res.status && Array.isArray(res.result) && res.result.length > 0) {
        for (const item of res.result) {
          const mediaUrl = item?.url;
          if (typeof mediaUrl === 'string' && mediaUrl.startsWith('http')) {
            if (mediaUrl.includes('.mp4')) {
              videos.push(mediaUrl);
            } else {
              images.push(mediaUrl);
            }
          }
        }
      }
    } catch (e) {
      console.warn('[Instagram DL] Btch igdl error:', (e as Error).message);
    }
  }

  // Provider 3: ruhend.igdl
  if (!images.length && !videos.length) {
    try {
      const res = await ruhend.igdl(url);
      if (Array.isArray(res) && res.length > 0) {
        for (const item of res) {
          if (typeof item === 'string' && item.startsWith('http')) {
            if (item.includes('.mp4')) {
              videos.push(item);
            } else {
              images.push(item);
            }
          }
        }
      }
    } catch (e) {
      console.warn('[Instagram DL] Ruhend igdl error:', (e as Error).message);
    }
  }

  // Handle Instagram carousel / photos
  if (images.length > 0) {
    const totalSlides = images.length;
    let selectedImages: string[] = images;
    let selectedIndices: number[] = images.map((_, i) => i + 1);

    if (slideIndices && slideIndices.length > 0) {
      const validIndices = slideIndices.filter((idx) => idx >= 1 && idx <= totalSlides);
      if (validIndices.length === 0) {
        return {
          success: false,
          platform: 'instagram',
          type: 'images',
          totalSlides,
          error: `⚠️ Postingan Instagram ini memiliki total *${totalSlides} slide/foto*. Slide nomor *${slideIndices.join(', ')}* tidak ditemukan (tersedia: 1-${totalSlides}).`,
        };
      }
      selectedIndices = validIndices;
      selectedImages = validIndices.map((idx) => images[idx - 1]);
    }

    let caption = '';
    if (selectedImages.length === 1 && totalSlides > 1) {
      caption = `📸 *Instagram Slide ${selectedIndices[0]} dari ${totalSlides}*\n👤 *Akun:* @${author}\n📌 *Caption:* ${title.slice(0, 100)}\n\n⚡ _Powered by Verand.Bot_`;
    } else if (selectedImages.length < totalSlides) {
      caption = `📸 *Instagram Carousel (${selectedIndices.join(', ')} dari ${totalSlides})*\n👤 *Akun:* @${author}\n📌 *Caption:* ${title.slice(0, 100)}\n🖼️ *Total Diunduh:* ${selectedImages.length} foto\n\n⚡ _Powered by Verand.Bot_`;
    } else if (totalSlides > 1) {
      caption = `📸 *Instagram Carousel (Semua: ${totalSlides} foto)*\n👤 *Akun:* @${author}\n📌 *Caption:* ${title.slice(0, 100)}\n\n⚡ _Powered by Verand.Bot_`;
    } else {
      caption = `📸 *Instagram Photo*\n👤 *Akun:* @${author}\n📌 *Caption:* ${title.slice(0, 100)}\n\n⚡ _Powered by Verand.Bot_`;
    }

    return {
      success: true,
      platform: 'instagram',
      type: 'images',
      title,
      author,
      images: selectedImages,
      totalSlides,
      selectedSlideIndices: selectedIndices,
      caption,
    };
  }

  // Handle Instagram video / reel
  if (videos.length > 0) {
    const videoUrl = videos[0];
    const buffer = await downloadMediaBuffer(videoUrl, 45 * 1024 * 1024);
    return {
      success: true,
      platform: 'instagram',
      type: 'video',
      title,
      author,
      mediaUrl: videoUrl,
      buffer: buffer || undefined,
      caption: `🎬 *Instagram Reel/Video*\n👤 *Akun:* @${author}\n📌 *Caption:* ${title.slice(0, 120)}\n\n⚡ _Powered by Verand.Bot_`,
    };
  }

  // Provider 4: yt-dlp fallback for Instagram reels / video
  try {
    const ytDlpRes = await extractVideoViaYtDlp(url, 'instagram', 'Instagram Reel / Video');
    if (ytDlpRes) {
      return ytDlpRes;
    }
  } catch (e) {
    console.warn('[Instagram DL] yt-dlp fallback error:', (e as Error).message);
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
  options: DownloadMediaOptions = {}
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
      result = await extractTikTok(cleanUrl, options.isAudioOnly, options.slideIndices);
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
      result = await extractInstagram(cleanUrl, options.slideIndices);
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
