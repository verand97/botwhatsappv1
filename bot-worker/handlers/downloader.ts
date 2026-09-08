/**
 * Handler Media Downloader (§5.1)
 * Unduh TikTok (No-WM/Slides/Audio), YouTube (MP4/MP3), Facebook, Twitter, Instagram (Reels/Carousels)
 */

import { WASocket, proto } from '@whiskeysockets/baileys';
import { downloadMediaFromUrl, parseSlideRequest, downloadMediaBuffer } from '../../lib/bot/mediaDownloader';

export async function handleDownloader(sock: WASocket, msg: proto.IWebMessageInfo) {
  const remoteJid = msg.key.remoteJid;
  if (!remoteJid) return;

  const text =
    msg.message?.conversation ||
    msg.message?.extendedTextMessage?.text ||
    msg.message?.imageMessage?.caption ||
    '';

  const parsedReq = parseSlideRequest(text);
  if (!parsedReq) {
    await sock.sendMessage(
      remoteJid,
      {
        text:
          '📥 *Media Downloader — Verand.Bot*\n\n' +
          'Sertakan link media yang ingin diunduh!\n' +
          '*Contoh Unduh Semua:* !dl https://vt.tiktok.com/xxxxxx/\n' +
          '*Contoh Unduh Per Slide:* !dl <url> 2 (atau: slide 2, slide 1-3, slide 1,3, all)\n\n' +
          '*Perintah Cepat:*\n' +
          '• *!tt <url> [slide]* : Unduh video/audio/slide TikTok tanpa watermark\n' +
          '• *!ig <url> [slide]* : Unduh video Reels / carousel foto Instagram\n' +
          '• *!yt <url>* : Unduh video YouTube (MP4)\n' +
          '• *!ytmp3 <url>* : Unduh audio YouTube (MP3)\n' +
          '• *!fb <url>* : Unduh video Facebook HD/SD\n' +
          '• *!twitter <url>* : Unduh video Twitter/X\n\n' +
          '_Tips Foto Slide:_ Ketik nomor slide (misal *!tt <url> 3* atau *!ig <url> slide 1-4*) atau kirim link saja untuk langsung mengunduh semua foto!',
      },
      { quoted: msg }
    );
    return;
  }

  const url = parsedReq.url;
  const slideIndices = parsedReq.slideIndices;
  const lower = text.toLowerCase();
  const isAudioOnly =
    lower.includes('ytmp3') ||
    lower.includes('audio') ||
    lower.includes('mp3') ||
    lower.includes('--audio');

  try {
    // Send wait reaction if supported
    await sock.sendMessage(remoteJid, { react: { text: '⏳', key: msg.key } }).catch(() => {});

    const result = await downloadMediaFromUrl(url, { isAudioOnly, slideIndices });

    if (!result.success) {
      await sock.sendMessage(remoteJid, { react: { text: '❌', key: msg.key } }).catch(() => {});
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

        await sock.sendMessage(
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

    await sock.sendMessage(remoteJid, { react: { text: '✅', key: msg.key } }).catch(() => {});
    console.log(`[DOWNLOADER SUKSES] ${result.platform.toUpperCase()} (${result.type}) dikirim ke ${remoteJid.slice(0, 6)}***`);
  } catch (error) {
    console.error('[DOWNLOADER ERROR]', error);
    await sock.sendMessage(remoteJid, { react: { text: '❌', key: msg.key } }).catch(() => {});
    await sock.sendMessage(
      remoteJid,
      {
        text: '❌ Terjadi kesalahan saat mengunduh media. Coba beberapa saat lagi.',
      },
      { quoted: msg }
    );
  }
}
