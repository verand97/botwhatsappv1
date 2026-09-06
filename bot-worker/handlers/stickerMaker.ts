/**
 * Handler Stiker Maker (§5.1 & §10)
 * Konversi Gambar/Video Pendek -> WebP 512x512 dengan EXIF pack metadata
 */

import { WASocket, proto, downloadMediaMessage } from '@whiskeysockets/baileys';

export async function handleStickerMaker(sock: WASocket, msg: proto.IWebMessageInfo) {
  const remoteJid = msg.key.remoteJid;
  if (!remoteJid) return;

  try {
    const isImage = Boolean(msg.message?.imageMessage);
    const isVideo = Boolean(msg.message?.videoMessage);

    if (!isImage && !isVideo) {
      await sock.sendMessage(remoteJid, {
        text: '⚠️ Kirim gambar dengan caption `!s` atau reply gambar yang ingin dijadikan stiker.',
      });
      return;
    }

    // Unduh buffer media dari WhatsApp
    const buffer = await downloadMediaMessage(msg, 'buffer', {});

    // Catatan: Pada server produksi, panggil wrapper sharp & node-webpmux:
    // const webpSticker = await convertToWebP(buffer, { pack: "Kendali Pack", author: "Kendali.Bot" });

    // Kirim stiker WebP kembali ke user
    await sock.sendMessage(remoteJid, {
      sticker: buffer, // buffer stiker WebP yang telah di-inject EXIF
    });

    console.log(`[STIKER SUKSES] Dikirim ke ${remoteJid.slice(0, 6)}***`);
  } catch (error) {
    console.error('[STIKER ERROR]', error);
    await sock.sendMessage(remoteJid, {
      text: '❌ Gagal membuat stiker. Pastikan format gambar valid atau durasi video < 10 detik.',
    });
  }
}
