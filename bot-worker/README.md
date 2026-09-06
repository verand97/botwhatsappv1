# Bot WhatsApp Persistent Worker (Baileys Engine)

Direktori ini berisi arsitektur worker Node.js terpisah untuk koneksi socket persisten WhatsApp Multi-Device menggunakan pustaka **`@whiskeysockets/baileys`**.

Sesuai spesifikasi teknis di `botwhatsapp.md` (§2 & §10):
- Worker ini **harus dijalankan pada proses yang menyala 24/7 (VPS / Railway / Fly.io)**, bukan di dalam serverless function (Vercel) yang auto-mati saat tidak ada request HTTP.
- Dashboard Next.js bertindak sebagai panel kontrol jarak jauh (*remote control*) yang berinteraksi via REST API / WebSocket / Supabase Realtime.

---

## Prasyarat Lingkungan Worker
1. Node.js v18+ atau v20+
2. `ffmpeg` terpasang di sistem server (untuk konversi video pendek &rarr; stiker animasi WebP)
3. Pustaka grafis:
   - `sharp` (Resize & format gambar ke WebP 512x512)
   - `node-webpmux` (Injeksi metadata EXIF nama pack stiker dan author)

## Menjalankan Worker
```bash
cd bot-worker
npm install
npm run start
```
