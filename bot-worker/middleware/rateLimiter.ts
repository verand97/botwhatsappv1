/**
 * Middleware Rate Limiter (§8 Anti-Abuse)
 * Mencegah nomor bot di-banned WhatsApp akibat pesan flood
 */

const userLastCommandMap = new Map<string, number>();

/**
 * Mengecek apakah pengirim diizinkan mengeksekusi perintah.
 * @param sender remoteJid pengirim WhatsApp
 * @param cooldownSec waktu jeda dalam detik (default 3)
 */
export function checkRateLimit(sender: string, cooldownSec: number = 3): boolean {
  const now = Date.now();
  const lastTime = userLastCommandMap.get(sender) || 0;
  const elapsed = (now - lastTime) / 1000;

  if (elapsed < cooldownSec) {
    return false; // Tertolak rate limit
  }

  userLastCommandMap.set(sender, now);
  return true;
}
