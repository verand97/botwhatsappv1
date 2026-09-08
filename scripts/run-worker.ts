import { botManager } from '../lib/bot/botManager';
import fs from 'fs';
import path from 'path';

async function main() {
  console.log('=============================================================');
  console.log('🤖 VERAND.BOT — WORKER RESMI 24/7 (ALL FEATURES ACTIVE)');
  console.log('=============================================================');

  const args = process.argv.slice(2);
  const isReset = args.includes('--reset') || args.includes('-r');
  const phoneNumber = args.find((a) => !a.startsWith('-'));

  if (isReset) {
    console.log('🧹 Membersihkan sesi lama (--reset)...');
    const authDir = path.join(process.cwd(), 'sessions', 'baileys_auth');
    if (fs.existsSync(authDir)) {
      try {
        fs.rmSync(authDir, { recursive: true, force: true });
        console.log('✅ Sesi lama dibersihkan. Memulai sesi baru...');
      } catch (err) {
        console.warn('Gagal membersihkan folder sesi:', err);
      }
    }
  }

  console.log('⏳ Memulai engine Baileys dan menghubungkan ke WhatsApp...\n');

  try {
    const status = await botManager.startBot();

    if (phoneNumber && status.status !== 'connected') {
      console.log(`📱 Meminta Pairing Code 8-Digit untuk nomor: +${phoneNumber}...`);
      try {
        const code = await botManager.getPairingCode(phoneNumber);
        console.log('\n╔════════════════════════════════════════════════════════════╗');
        console.log('║               KODE TAUTAN RESMI WHATSAPP                   ║');
        console.log('╠════════════════════════════════════════════════════════════╣');
        console.log(`║                  👉   ${code}   👈                  ║`);
        console.log('╚════════════════════════════════════════════════════════════╝\n');
        console.log('📋 CARA MENGHUBUNGKAN:');
        console.log(`   1. Buka WhatsApp di HP Anda (+${phoneNumber})`);
        console.log('   2. Masuk ke: Titik Tiga (atau Pengaturan) > Perangkat Tertaut');
        console.log('   3. Ketuk tombol "Tautkan Perangkat"');
        console.log('   4. Di bawah jendela scan kamera, ketuk "Tautkan dengan nomor telepon saja"');
        console.log(`   5. Masukkan 8 karakter kode ini: ${code}\n`);
        console.log('💡 CARA ALTERNATIF LEBIH CEPAT (1 DETIK):');
        console.log('   Cukup arahkan kamera WhatsApp Anda ke QR CODE yang muncul di atas!');
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : String(err);
        console.log('ℹ️ Status pairing:', msg);
      }
    } else if (!phoneNumber && status.status !== 'connected') {
      console.log('💡 PETUNJUK PENAUTAN PERANGKAT:');
      console.log('   1. CARA PALING CEPAT (1 DETIK TANPA KETIK KODE):');
      console.log('      • Arahkan kamera WhatsApp HP Anda ke QR CODE di atas.');
      console.log('        (Buka WA > Titik Tiga > Perangkat Tertaut > Tautkan Perangkat)\n');
      console.log('   2. CARA MENGGUNAKAN KODE 8-DIGIT:');
      console.log('      • Jalankan ulang perintah dengan nomor HP Anda, contoh:');
      console.log('        npm run worker -- 6285196092326\n');
    }

    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('✅ DAFTAR FITUR LENGKAP SIAP DIGUNAKAN:');
    console.log('   • /menu atau !menu  : Menampilkan Pusat Kontrol Lengkap');
    console.log('   • /faq atau !faq    : Pusat Panduan & Bantuan');
    console.log('   • /dl <link> [slide]: Downloader TikTok (Foto/Video/Audio), IG, YT, FB, X');
    console.log('   • /sticker atau /s  : Konversi Foto/Video ke Stiker WebP');
    console.log('   • /tomedia          : Ubah Stiker ke Gambar PNG');
    console.log('   • /ai <teks>        : Asisten AI Gemini');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('🌐 Tersinkronisasi dengan Database Supabase & Dashboard Vercel.');
    console.log('💡 Anda dapat mengirim pesan dari HP sendiri (chat diri sendiri) ataupun nomor lain!');
    console.log('💡 Tekan Ctrl + C jika ingin menghentikan worker.\n');
  } catch (err) {
    console.error('❌ Gagal menjalankan worker:', err);
  }
}

main();
