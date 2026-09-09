process.env.IS_WORKER = 'true';

import { botManager } from '../lib/bot/botManager';
import fs from 'fs';
import path from 'path';

const lockFilePath = path.join(process.cwd(), 'sessions', 'worker.lock');

function acquireLock(): boolean {
  const sessionsDir = path.join(process.cwd(), 'sessions');
  if (!fs.existsSync(sessionsDir)) {
    fs.mkdirSync(sessionsDir, { recursive: true });
  }

  if (fs.existsSync(lockFilePath)) {
    try {
      const pidStr = fs.readFileSync(lockFilePath, 'utf8').trim();
      const pid = parseInt(pidStr, 10);
      if (!isNaN(pid)) {
        try {
          process.kill(pid, 0); // Jika tidak throw error, berarti proses masih hidup
          console.error(`\n⚠️ Worker sudah berjalan di proses lain (PID: ${pid}).`);
          console.error('WhatsApp hanya mengizinkan 1 koneksi soket aktif.');
          console.error('Hentikan worker sebelumnya (tekan Ctrl+C di terminal terkait), atau hapus sessions/worker.lock jika worker lama mati mendadak.\n');
          return false;
        } catch {
          // Proses lama sudah mati, bersihkan lock usang
          console.log(`[Lock] Membersihkan file lock usang (PID ${pid} sudah tidak aktif).`);
          try {
            fs.unlinkSync(lockFilePath);
          } catch {
            // Ignored
          }
        }
      }
    } catch {
      // Ignored
    }
  }

  try {
    fs.writeFileSync(lockFilePath, String(process.pid), 'utf8');
    return true;
  } catch (err) {
    console.error('Gagal membuat file lock:', err);
    return false;
  }
}

function releaseLock() {
  try {
    if (fs.existsSync(lockFilePath)) {
      const pidStr = fs.readFileSync(lockFilePath, 'utf8').trim();
      if (parseInt(pidStr, 10) === process.pid) {
        fs.unlinkSync(lockFilePath);
      }
    }
  } catch {
    // Ignored
  }
}

process.on('exit', releaseLock);
process.on('SIGINT', () => {
  releaseLock();
  process.exit(0);
});
process.on('SIGTERM', () => {
  releaseLock();
  process.exit(0);
});

async function main() {
  if (!acquireLock()) {
    process.exit(1);
  }

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
    await botManager.startBot(phoneNumber);

    if (!phoneNumber) {
      console.log('💡 PETUNJUK PENAUTAN PERANGKAT:');
      console.log('   1. CARA SCAN QR:');
      console.log('      • Buka WhatsApp di HP > Titik Tiga > Perangkat Tertaut > Tautkan Perangkat');
      console.log('      • Arahkan kamera ke QR Code di atas atau di http://localhost:3000/dashboard/koneksi\n');
      console.log('   2. CARA MENGGUNAKAN 8-DIGIT KODE (BEBAS SCAN KAMERA):');
      console.log('      • Jalankan perintah dengan nomor HP Anda, contoh:');
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
