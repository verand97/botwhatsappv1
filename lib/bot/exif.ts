import webpmux from 'node-webpmux';

/**
 * Injeksi metadata EXIF (Pack Name & Author) ke file stiker WebP
 * Mengikuti standar format WhatsApp WebP EXIF.
 */
export async function addExifToWebp(
  webpBuffer: Buffer,
  packName: string = 'Kendali Pack',
  author: string = 'Kendali.Bot'
): Promise<Buffer> {
  try {
    const img = new webpmux.Image();
    await img.load(webpBuffer);

    const json = {
      'sticker-pack-id': 'com.kendali.bot.' + Date.now(),
      'sticker-pack-name': packName,
      'sticker-pack-publisher': author,
      'emojis': ['🤖', '✨', '⚡'],
    };

    const exifAttr = Buffer.from([
      0x49, 0x49, 0x2a, 0x00, 0x08, 0x00, 0x00, 0x00, 0x01, 0x00, 0x41, 0x57,
      0x07, 0x00, 0x00, 0x00, 0x00, 0x00, 0x16, 0x00, 0x00, 0x00,
    ]);

    const jsonBuffer = Buffer.from(JSON.stringify(json), 'utf-8');
    const exif = Buffer.concat([exifAttr, jsonBuffer]);
    exif.writeUIntLE(jsonBuffer.length, 14, 4);

    img.exif = exif;
    return await img.save(null);
  } catch (err) {
    console.error('[EXIF ERROR] Gagal menambahkan metadata EXIF:', err);
    return webpBuffer; // Fallback jika gagal injeksi
  }
}
