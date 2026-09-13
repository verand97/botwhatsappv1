import { FeatureConfig } from '../types';

/**
 * Generate a concise, beautifully formatted menu text for WhatsApp
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
    enabledMap.set('bmkg_monitor', {} as FeatureConfig);
  }

  const items: string[] = [];

  // 1. Media Downloader
  if (enabledMap.has('downloader')) {
    items.push(
      `📥 *Media Downloader*\n` +
      `• \`${prefix}dl <link>\` : Unduh video/audio/slide (TikTok, IG, YT, FB, X)\n` +
      `• \`${prefix}dl <link> 2\` : Unduh slide ke-2 saja\n` +
      `• \`${prefix}dl <link> 1-3\` : Unduh slide rentang 1 sampai 3\n` +
      `_Shortcut:_ \`${prefix}tt\`, \`${prefix}ig\`, \`${prefix}yt\`, \`${prefix}ytmp3\`, \`${prefix}fb\`, \`${prefix}twitter\``
    );
  }

  // 2. Sticker Maker
  if (enabledMap.has('sticker_maker')) {
    items.push(
      `🎨 *Stiker Maker*\n` +
      `• \`${prefix}sticker\` : Kirim/balas foto/video (maks 10d) jadi stiker`
    );
  }

  // 3. Sticker to Media
  if (enabledMap.has('sticker_to_media')) {
    items.push(
      `🔄 *Stiker to Media*\n` +
      `• \`${prefix}tomedia\` : Balas stiker untuk diubah ke gambar PNG`
    );
  }

  // 4. AI Chat Assistant
  if (enabledMap.has('ai_chat')) {
    items.push(
      `🤖 *AI Assistant*\n` +
      `• \`${prefix}ai <teks>\` : Tanya jawab cerdas dengan AI Gemini`
    );
  }

  // 5. Pantauan BMKG & Bencana
  if (enabledMap.has('bmkg_monitor')) {
    items.push(
      `🌋 *Pantauan BMKG & Bencana*\n` +
      `• \`${prefix}gempa\` : Gempa terkini M 5.0+ / dirasakan + Peta Shakemap\n` +
      `• \`${prefix}cuaca <kota>\` : Prakiraan cuaca (contoh: \`${prefix}cuaca bandung\`)\n` +
      `• \`${prefix}satelit\` : Citra Satelit Cuaca Himawari-9 & Hujan\n` +
      `• \`${prefix}gelombang\` : Peringatan dini gelombang maritim laut\n` +
      `• \`${prefix}bmkg\` : Lihat seluruh fitur pantauan BMKG & bencana`
    );
  }

  // 6. Auto-Reply & FAQ
  if (enabledMap.has('auto_reply')) {
    items.push(
      `ℹ️ *Bantuan & FAQ*\n` +
      `• \`${prefix}faq\` : Lihat panduan & pertanyaan umum`
    );
  }

  return (
    `⚙️ *VERAND.BOT — PUSAT KONTROL*\n` +
    `Status: ONLINE 🟢 | Prefix: [ ${prefix} ]\n` +
    `━━━━━━━━━━━━━━━━━━━━━\n\n` +
    items.join('\n\n') +
    `\n\n━━━━━━━━━━━━━━━━━━━━━\n` +
    `💡 _Contoh: \`${prefix}dl https://vt.tiktok.com/xxxx/ 2\`_\n` +
    `⚡ _Powered by Verand.Bot_`
  );
}

/**
 * Generate in-depth comprehensive guide & FAQ text for WhatsApp (/faq)
 */
export function generateFaqText(
  prefix: string,
  autoReplies?: Array<{ trigger: string; response: string }>
): string {
  const autoRepliesList =
    autoReplies && autoReplies.length > 0
      ? `\n━━━━━━━━━━━━━━━━━━━━━\n💬 *KATA KUNCI OTOMATIS:*\n` +
        autoReplies.map((r) => ` • *${r.trigger}* : ${r.response}`).join('\n')
      : '';

  return (
    `📖 *PANDUAN LENGKAP & FAQ — VERAND.BOT*\n` +
    `Status: ONLINE 🟢 | Prefix: [ ${prefix} ]\n` +
    `━━━━━━━━━━━━━━━━━━━━━\n\n` +
    `📥 *1. PANDUAN MEDIA DOWNLOADER*\n` +
    `• *Fungsi:* Mengunduh video (tanpa watermark), audio MP3, dan foto album/slides dari TikTok, Instagram, YouTube, Facebook, dan Twitter/X.\n` +
    `• *Format:* \`${prefix}dl <link> [opsi slide]\`\n` +
    `• *Cara Unduh Foto Slide (TikTok & Instagram):*\n` +
    `  ▫️ *Semua Slide:* \`${prefix}dl <link>\` (atau \`${prefix}dl <link> all\`)\n` +
    `  ▫️ *Slide Tertentu:* \`${prefix}dl <link> 2\` (hanya slide ke-2)\n` +
    `  ▫️ *Rentang Slide:* \`${prefix}dl <link> slide 1-3\` (slide 1 s/d 3)\n` +
    `  ▫️ *Beberapa Slide:* \`${prefix}dl <link> slide 1,3,5\`\n` +
    `• *Shortcut / Perintah Pintas:*\n` +
    `  ▫️ \`${prefix}tt <link> [slide]\` ➔ TikTok Video / Audio / Slide\n` +
    `  ▫️ \`${prefix}ig <link> [slide]\` ➔ Instagram Reels / Foto / Carousel\n` +
    `  ▫️ \`${prefix}yt <link>\` ➔ YouTube Video (MP4)\n` +
    `  ▫️ \`${prefix}ytmp3 <link>\` ➔ YouTube Audio (MP3)\n` +
    `  ▫️ \`${prefix}fb <link>\` ➔ Facebook Video HD\n` +
    `  ▫️ \`${prefix}twitter <link>\` ➔ Twitter/X Video\n\n` +
    `─────────────────────\n\n` +
    `🎨 *2. PANDUAN STIKER MAKER*\n` +
    `• *Fungsi:* Mengonversi gambar atau video pendek ke stiker WhatsApp WebP 512x512.\n` +
    `• *Cara Pakai:*\n` +
    `  1. Kirim gambar/video (maks. 10 detik) dengan caption \`${prefix}sticker\` atau \`${prefix}s\`.\n` +
    `  2. Atau balas (reply) foto/video yang ada dengan ketik \`${prefix}sticker\`.\n\n` +
    `─────────────────────\n\n` +
    `🔄 *3. PANDUAN STIKER TO MEDIA*\n` +
    `• *Fungsi:* Mengembalikan stiker WhatsApp menjadi file gambar PNG transparan berkualitas asli.\n` +
    `• *Cara Pakai:* Balas (reply) stiker di obrolan dengan perintah \`${prefix}tomedia\` atau \`${prefix}toimg\`.\n\n` +
    `─────────────────────\n\n` +
    `🤖 *4. PANDUAN AI ASSISTANT*\n` +
    `• *Fungsi:* Tanya jawab interaktif, pencarian ide, dan asisten berbasis AI Gemini.\n` +
    `• *Cara Pakai:* Ketik \`${prefix}ai <pertanyaan>\` atau \`${prefix}tanya <pertanyaan>\`.\n` +
    `• *Contoh:* \`${prefix}ai buatkan ide konten video untuk promosi produk\`\n\n` +
    `─────────────────────\n\n` +
    `🌋 *5. PANDUAN PANTAUAN BMKG & BENCANA ALAM*\n` +
    `• *Fungsi:* Menghubungkan langsung dengan server BMKG Indonesia untuk pemantauan cuaca, gempa bumi, citra satelit, maritim, dan karhutla.\n` +
    `• *Perintah Lengkap:*\n` +
    `  ▫️ \`${prefix}gempa\` ➔ Gempa bumi terkini M 5.0+ / dirasakan lengkap dengan peta guncangan (Shakemap)\n` +
    `  ▫️ \`${prefix}gempa5m\` ➔ Daftar 10 gempa bumi terbaru berkekuatan M 5.0 ke atas\n` +
    `  ▫️ \`${prefix}dirasakan\` ➔ 10 gempa bumi yang dirasakan masyarakat + skala MMI\n` +
    `  ▫️ \`${prefix}cuaca <nama kota>\` ➔ Prakiraan cuaca (suhu, hujan, kelembapan, angin, UV)\n` +
    `  ▫️ \`${prefix}satelit\` ➔ Citra Satelit Himawari-9 Enhanced IR (awan konvektif & badai)\n` +
    `  ▫️ \`${prefix}satelit hujan\` ➔ Peta Satelit Potensi Hujan BMKG\n` +
    `  ▫️ \`${prefix}hotspot\` ➔ Peta Titik Panas & Pantauan Bahaya Karhutla\n` +
    `  ▫️ \`${prefix}gelombang\` ➔ Peringatan dini gelombang maritim laut Indonesia\n` +
    `  ▫️ \`${prefix}udara <kota>\` ➔ Indeks Kualitas Udara (AQI) & partikulat PM2.5\n\n` +
    `─────────────────────\n\n` +
    `❓ *6. PERTANYAAN UMUM (FAQ)*\n` +
    `• *Q: Mengapa bot tidak merespon?*\n` +
    `  *A:* Pastikan menyertakan prefix aktif (\`${prefix}\`) di awal pesan, contoh: \`${prefix}menu\` atau \`${prefix}dl <link>\`.\n\n` +
    `• *Q: Apakah video TikTok ada watermark-nya?*\n` +
    `  *A:* Tidak, semua video TikTok diunduh bersih tanpa watermark.\n\n` +
    `• *Q: Dari mana data cuaca & bencana diambil?*\n` +
    `  *A:* Semua data gempa, cuaca, citra satelit, dan maritim bersumber langsung dari server resmi BMKG (Badan Meteorologi, Klimatologi, dan Geofisika Indonesia).\n\n` +
    `• *Q: Apakah foto slide yang diunduh terpotong?*\n` +
    `  *A:* Tidak, seluruh foto diunduh dengan resolusi penuh dari server resmi.` +
    autoRepliesList +
    `\n\n━━━━━━━━━━━━━━━━━━━━━\n` +
    `Ketik \`${prefix}menu\` untuk membuka menu ringkas.`
  );
}
