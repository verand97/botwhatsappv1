/**
 * Handler Media Downloader (§5.1)
 * Unduh TikTok (No-WM), YouTube (MP4/MP3), Facebook, Twitter, Instagram
 */

import { WASocket, proto } from '@whiskeysockets/baileys';
import { downloadMediaFromUrl } from '../../lib/bot/mediaDownloader';

export async function handleDownloader(sock: WASocket, msg: proto.IWebMessageInfo) {
  const remoteJid = msg.key.remoteJid;
  if (!remoteJid) return;

  const text =
    msg.message?.conversation ||
    msg.message?.extendedTextMessage?.text ||
    msg.message?.imageMessage?.caption ||
    '';

  const urlMatch = text.match(/https?:\/\/[^\s]+/i);
  if (!urlMatch) {
    await sock.sendMessage(
      remoteJid,
      {
        text:
          '📥 *Media Downloader — Verand.Bot*\n\n' +
          'Sertakan link media yang ingin diunduh!\n' +
          'Contoh:\n*!dl https://vt.tiktok.com/xxxxxx/*\n\n' +
          'Format yang didukung: *TikTok*, *YouTube*, *Instagram*, *Facebook*, *Twitter/X*',
      },
      { quoted: msg }
    );
    return;
  }

  const url = urlMatch[0];
  const lower = text.toLowerCase();
  const isAudioOnly =
    lower.includes('ytmp3') ||
    lower.includes('audio') ||
    lower.includes('mp3') ||
    lower.includes('--audio');

  try {
    // Send wait reaction if supported
    await sock.sendMessage(remoteJid, { react: { text: '⏳', key: msg.key } }).catch(() => {});

    const result = await downloadMediaFromUrl(url, { isAudioOnly });

    if (!result.success) {
      await sock.sendMessage(
        remoteJid,
        {
          text: `❌ *Gagal Mengunduh Media*\n\n${result.error || 'Terjadi kesalahan saat memproses tautan.'}`,
        },
        { quoted: msg }
      );
      return;
    }

    if (result.type === 'video') {
      if (result.buffer) {
        await sock.sendMessage(
          remoteJid,
          {
            video: result.buffer,
            mimetype: 'video/mp4',
            caption: result.caption,
          },
          { quoted: msg }
        );
      } else if (result.mediaUrl) {
        await sock.sendMessage(
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
        await sock.sendMessage(
          remoteJid,
          {
            audio: result.buffer,
            mimetype: 'audio/mp4',
            ptt: false,
          },
          { quoted: msg }
        );
      } else if (result.mediaUrl) {
        await sock.sendMessage(
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
      await sock.sendMessage(
        remoteJid,
        {
          image: { url: result.images[0] },
          caption: result.caption,
        },
        { quoted: msg }
      );
      for (let i = 1; i < Math.min(result.images.length, 10); i++) {
        await sock.sendMessage(remoteJid, { image: { url: result.images[i] } });
      }
    }

    await sock.sendMessage(remoteJid, { react: { text: '✅', key: msg.key } }).catch(() => {});
    console.log(`[DOWNLOADER SUKSES] ${result.platform.toUpperCase()} dikirim ke ${remoteJid.slice(0, 6)}***`);
  } catch (error) {
    console.error('[DOWNLOADER ERROR]', error);
    await sock.sendMessage(
      remoteJid,
      {
        text: '❌ Terjadi kesalahan saat mengunduh media. Coba beberapa saat lagi.',
      },
      { quoted: msg }
    );
  }
}
