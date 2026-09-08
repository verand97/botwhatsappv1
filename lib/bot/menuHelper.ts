import { FeatureConfig } from '../types';

/**
 * Generate a comprehensive, beautifully formatted menu text for WhatsApp
 */
export function generateMenuText(prefix: string, features?: FeatureConfig[]): string {
  const enabledMap = new Map<string, FeatureConfig>();
  if (features && features.length > 0) {
    for (const f of features) {
      if (f.is_enabled) enabledMap.set(f.feature_key, f);
    }
  } else {
    // Default show all core modules if features not passed
    enabledMap.set('downloader', {} as FeatureConfig);
    enabledMap.set('sticker_maker', {} as FeatureConfig);
    enabledMap.set('sticker_to_media', {} as FeatureConfig);
    enabledMap.set('ai_chat', {} as FeatureConfig);
    enabledMap.set('auto_reply', {} as FeatureConfig);
  }

  const sections: string[] = [];

  // 1. Media Downloader
  if (enabledMap.has('downloader')) {
    sections.push(
      `📥 *1. MEDIA DOWNLOADER*\n` +
      `📌 *Format:* \`${prefix}dl <link> [opsi slide]\`\n` +
      `💡 *Kegunaan:* Unduh video tanpa watermark, audio MP3, serta foto slide/album carousel dari TikTok, Instagram, YouTube, Facebook, dan Twitter/X.\n\n` +
      `🖼️ *Panduan Unduh Foto Slide (TikTok & Instagram):*\n` +
      ` • *Unduh Semua Gambar:* \`${prefix}dl <link>\` (atau \`${prefix}dl <link> all\`)\n` +
      ` • *Unduh 1 Slide Saja:* \`${prefix}dl <link> 2\` (hanya slide ke-2)\n` +
      ` • *Unduh Rentang Slide:* \`${prefix}dl <link> slide 1-3\` (mengambil slide 1 s/d 3)\n` +
      ` • *Unduh Beberapa Slide:* \`${prefix}dl <link> slide 1,3,5\`\n\n` +
      `⚡ *Perintah Cepat / Shortcut:*\n` +
      ` • \`${prefix}tt <link> [slide]\` : TikTok Video / Audio / Slide\n` +
      ` • \`${prefix}ig <link> [slide]\` : Instagram Reels / Foto / Carousel\n` +
      ` • \`${prefix}yt <link>\` : YouTube Video (MP4)\n` +
      ` • \`${prefix}ytmp3 <link>\` : YouTube Audio (MP3)\n` +
      ` • \`${prefix}fb <link>\` : Facebook Video HD/SD\n` +
      ` • \`${prefix}twitter <link>\` : Twitter/X Video`
    );
  }

  // 2. Sticker Maker
  if (enabledMap.has('sticker_maker')) {
    sections.push(
      `🎨 *2. STIKER MAKER*\n` +
      `📌 *Format:* \`${prefix}sticker\` atau \`${prefix}s\`\n` +
      `💡 *Kegunaan:* Mengonversi gambar, foto, atau video pendek (maks 10 detik) menjadi stiker WhatsApp WebP 512x512.\n` +
      `👉 *Cara Pakai:* Kirim gambar dengan caption \`${prefix}sticker\`, atau balas (reply) media yang sudah dikirim dengan ketik \`${prefix}sticker\`.`
    );
  }

  // 3. Sticker to Media
  if (enabledMap.has('sticker_to_media')) {
    sections.push(
      `🔄 *3. STIKER TO MEDIA*\n` +
      `📌 *Format:* \`${prefix}tomedia\` atau \`${prefix}toimg\`\n` +
      `💡 *Kegunaan:* Mengubah kembali stiker WhatsApp menjadi file gambar PNG transparan berkualitas tinggi.\n` +
      `👉 *Cara Pakai:* Balas (reply) stiker yang ada di chat dengan perintah \`${prefix}tomedia\`.`
    );
  }

  // 4. AI Chat Assistant
  if (enabledMap.has('ai_chat')) {
    sections.push(
      `🤖 *4. AI CHAT ASSISTANT*\n` +
      `📌 *Format:* \`${prefix}ai <pertanyaan>\` atau \`${prefix}tanya <pertanyaan>\`\n` +
      `💡 *Kegunaan:* Tanya jawab cerdas seputar pengetahuan, tips, koding, dan percakapan interaktif berbasis AI Gemini.\n` +
      `👉 *Contoh:* \`${prefix}ai rekomendasi ide konten tiktok menarik\``
    );
  }

  // 5. Auto-Reply & FAQ
  if (enabledMap.has('auto_reply')) {
    sections.push(
      `ℹ️ *5. AUTO-REPLY & FAQ*\n` +
      `📌 *Format:* \`${prefix}faq\` atau \`${prefix}info\`\n` +
      `💡 *Kegunaan:* Menampilkan pusat bantuan, panduan dasar, dan jawaban untuk pertanyaan yang sering diajukan.\n` +
      `👉 *Cara Pakai:* Cukup ketik \`${prefix}faq\` untuk melihat bantuan lengkap.`
    );
  }

  return (
    `⚙️ *VERAND.BOT — PUSAT KONTROL*\n` +
    `Status: ONLINE 🟢 | Prefix: [ ${prefix} ]\n` +
    `━━━━━━━━━━━━━━━━━━━━━\n\n` +
    `📋 *DAFTAR FITUR & PANDUAN PENGGUNAAN:*\n\n` +
    sections.join('\n\n─────────────────────\n\n') +
    `\n\n━━━━━━━━━━━━━━━━━━━━━\n` +
    `💡 *Tips:* Ketik perintah langsung beserta link tanpa menuliskan tanda kurung \`<>\`.\n` +
    `⚡ _Powered by Verand.Bot Multi-Device_`
  );
}

/**
 * Generate FAQ text for WhatsApp
 */
export function generateFaqText(
  prefix: string,
  autoReplies?: Array<{ trigger: string; response: string }>
): string {
  const autoRepliesList =
    autoReplies && autoReplies.length > 0
      ? `\n*Kata Kunci Otomatis:*\n` +
        autoReplies.map((r) => ` • *${r.trigger}* : ${r.response}`).join('\n') +
        `\n`
      : '';

  return (
    `ℹ️ *INFORMASI & FAQ — VERAND.BOT*\n` +
    `━━━━━━━━━━━━━━━━━━━━━\n\n` +
    `Verand.Bot adalah asisten WhatsApp otomatis untuk membuat stiker, mengunduh media dari media sosial, dan chat AI.\n\n` +
    `❓ *1. Bagaimana cara download video/foto slide?*\n` +
    ` • Unduh semua foto/video: \`${prefix}dl <link>\`\n` +
    ` • Unduh slide tertentu: \`${prefix}dl <link> 2\` (slide 2) atau \`${prefix}dl <link> slide 1-3\`\n\n` +
    `❓ *2. Bagaimana cara membuat stiker?*\n` +
    ` • Kirim foto/video dengan caption \`${prefix}sticker\`, atau reply gambar dengan \`${prefix}sticker\`.\n\n` +
    `❓ *3. Bagaimana mengubah stiker kembali ke foto?*\n` +
    ` • Balas (reply) stiker tersebut dengan perintah \`${prefix}tomedia\`.\n\n` +
    `❓ *4. Mengapa bot tidak merespon?*\n` +
    ` • Pastikan menyertakan prefix aktif \`${prefix}\` di awal perintah (contoh: \`${prefix}menu\`).\n` +
    autoRepliesList +
    `\n━━━━━━━━━━━━━━━━━━━━━\n` +
    `Ketik \`${prefix}menu\` untuk membuka menu lengkap.`
  );
}
