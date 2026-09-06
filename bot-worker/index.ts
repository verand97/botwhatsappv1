/**
 * Bot Worker Baileys Core Engine
 * Berdasarkan Spesifikasi botwhatsapp.md (§2, §6, §10)
 */

import makeWASocket, {
  DisconnectReason,
  useMultiFileAuthState,
  WASocket,
  proto,
} from '@whiskeysockets/baileys';
import { Boom } from '@hapi/boom';
import { handleStickerMaker } from './handlers/stickerMaker';
import { checkRateLimit } from './middleware/rateLimiter';

export async function startWhatsAppWorker() {
  const { state, saveCreds } = await useMultiFileAuthState('baileys_auth_info');

  const sock: WASocket = makeWASocket({
    auth: state,
    printQRInTerminal: true,
    browser: ['Verand Bot Control', 'Chrome', '1.0.0'],
  });

  sock.ev.on('creds.update', saveCreds);

  // Monitor status koneksi real-time (§4.2)
  sock.ev.on('connection.update', (update: any) => {
    const { connection, lastDisconnect, qr } = update;
    if (qr) {
      console.log('[QR READY] Scan QR code via dashboard atau terminal:', qr);
    }
    if (connection === 'close') {
      const shouldReconnect =
        (lastDisconnect?.error as Boom)?.output?.statusCode !==
        DisconnectReason.loggedOut;
      console.log('[SOCKET] Koneksi terputus. Reconnect?:', shouldReconnect);
      if (shouldReconnect) {
        startWhatsAppWorker();
      }
    } else if (connection === 'open') {
      console.log('[SOCKET] Terhubung sukses ke WhatsApp Multi-Device!');
    }
  });

  // Handler pesan masuk
  sock.ev.on('messages.upsert', async ({ messages, type }: { messages: any[]; type: string }) => {
    if (type !== 'notify') return;

    for (const msg of messages) {
      if (!msg.message || msg.key.fromMe) continue;

      const sender = msg.key.remoteJid || '';
      const text =
        msg.message.conversation ||
        msg.message.extendedTextMessage?.text ||
        msg.message.imageMessage?.caption ||
        '';

      // 1. Verifikasi Rate Limit (§8 Anti-Abuse)
      const allowed = checkRateLimit(sender, 3); // 3 detik jeda default
      if (!allowed) {
        console.warn(`[RATE LIMIT] Pesan dari ${sender.slice(0, 7)}*** tertahan cooldown.`);
        continue;
      }

      // 2. Dispatch Handler Perintah
      if (text.startsWith('!s') || text.startsWith('!sticker')) {
        await handleStickerMaker(sock, msg);
      }
    }
  });
}
