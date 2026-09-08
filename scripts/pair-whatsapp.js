/**
 * Script Resmi Penautan WhatsApp via Pairing Code & QR Terminal
 * Jalankan: node scripts/pair-whatsapp.js <nomor_wa>
 * Contoh: node scripts/pair-whatsapp.js 6285196092326
 */

const fs = require('fs');
const path = require('path');
const pino = require('pino');
const QRCode = require('qrcode');
const {
  default: makeWASocket,
  DisconnectReason,
  useMultiFileAuthState,
} = require('@whiskeysockets/baileys');
const { createClient } = require('@supabase/supabase-js');

// 1. Muat environment variables dari .env.local
function loadEnv() {
  const envPath = path.join(__dirname, '..', '.env.local');
  if (fs.existsSync(envPath)) {
    const content = fs.readFileSync(envPath, 'utf8');
    for (const line of content.split(/\r?\n/)) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) continue;
      const eqIdx = trimmed.indexOf('=');
      if (eqIdx !== -1) {
        const key = trimmed.slice(0, eqIdx).trim();
        let val = trimmed.slice(eqIdx + 1).trim();
        if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
          val = val.slice(1, -1);
        }
        if (!process.env[key]) process.env[key] = val;
      }
    }
  }
}
loadEnv();

// 2. Setup Supabase Client
let supabase = null;
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  ? process.env.NEXT_PUBLIC_SUPABASE_URL.replace(/\/rest\/v1\/?$/, '').replace(/\/+$/, '')
  : '';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
if (supabaseUrl && supabaseKey) {
  supabase = createClient(supabaseUrl, supabaseKey);
}

// 3. Ambil nomor telepon dari CLI argument
let phoneNumber = process.argv[2] || process.env.BOT_OWNER_NUMBER || '';
phoneNumber = phoneNumber.replace(/\D/g, '');

if (!phoneNumber || phoneNumber.length < 9) {
  console.log('\n❌ NOMOR TELEPON DIPERLUKAN!');
  console.log('Gunakan format nomor internasional (tanpa tanda +), contoh:');
  console.log('👉 node scripts/pair-whatsapp.js 6285196092326\n');
  process.exit(1);
}

const authDir = path.join(__dirname, '..', 'sessions', 'baileys_auth');

// Hapus sesi lama yang tidak lengkap jika belum terdaftar secara sah
const credsPath = path.join(authDir, 'creds.json');
if (fs.existsSync(credsPath)) {
  try {
    const creds = JSON.parse(fs.readFileSync(credsPath, 'utf8'));
    if (!creds.registered) {
      console.log('🧹 Membersihkan sisa kredensial sesi sebelumnya yang belum tuntas...');
      fs.rmSync(authDir, { recursive: true, force: true });
    }
  } catch {
    fs.rmSync(authDir, { recursive: true, force: true });
  }
}

if (!fs.existsSync(authDir)) {
  fs.mkdirSync(authDir, { recursive: true });
}

let pairingRequested = false;

async function connectToWhatsApp() {
  console.log('\n=============================================================');
  console.log('🤖 VERAND.BOT — TAUTKAN WHATSAPP (PAIRING CODE & QR TERMINAL)');
  console.log('=============================================================');
  console.log(`📱 Nomor WhatsApp Target : +${phoneNumber}`);
  console.log('⏳ Menghubungkan soket Baileys ke server WhatsApp...\n');

  const { state, saveCreds } = await useMultiFileAuthState(authDir);

  const sock = makeWASocket({
    auth: state,
    printQRInTerminal: false,
    logger: pino({ level: 'silent' }),
    // Gunakan user-agent browser standar agar tidak ditolak oleh WhatsApp (503)
    browser: ['Ubuntu', 'Chrome', '20.0.04'],
  });

  sock.ev.on('creds.update', saveCreds);

  sock.ev.on('connection.update', async (update) => {
    const { connection, lastDisconnect, qr } = update;

    // Saat server WhatsApp siap menerima otentikasi (ditandai dengan munculnya QR / auth handshake)
    if (qr && !sock.authState.creds.registered && !pairingRequested) {
      pairingRequested = true;

      try {
        console.log('📡 Meminta Pairing Code 8-Digit resmi dari server WhatsApp...');
        // Tunggu jeda singkat agar soket handshake mantap
        await new Promise((resolve) => setTimeout(resolve, 1500));

        const code = await sock.requestPairingCode(phoneNumber);
        const formatted = code?.match(/.{1,4}/g)?.join('-') || code;

        console.log('\n╔════════════════════════════════════════════════════════════╗');
        console.log('║               KODE TAUTAN RESMI WHATSAPP                   ║');
        console.log('╠════════════════════════════════════════════════════════════╣');
        console.log(`║                  👉   ${formatted}   👈                  ║`);
        console.log('╚════════════════════════════════════════════════════════════╝\n');
        console.log('📋 CARA MEMASUKKAN DI HP ANDA:');
        console.log(' 1. Buka aplikasi WhatsApp di HP Anda.');
        console.log(' 2. Ketuk ikon Titik Tiga (Pengaturan) > "Perangkat Tertaut".');
        console.log(' 3. Ketuk tombol "Tautkan Perangkat".');
        console.log(' 4. Di bawah layar kamera scanner, ketuk: "Tautkan dengan nomor telepon saja".');
        console.log(` 5. Masukkan 8 digit kode di atas: ${formatted}\n`);
        console.log('─────────────────────────────────────────────────────────────');
        console.log('💡 ATAU SCAN QR CODE BERIKUT DENGAN KAMERA WHATSAPP ANDA:');
        try {
          const qrString = await QRCode.toString(qr, { type: 'terminal', small: true });
          console.log(qrString);
        } catch {
          // fallback
        }
        console.log('⏳ Menunggu konfirmasi dari HP Anda (berlaku ±60 detik)...\n');
      } catch (err) {
        console.warn('⚠️ Gagal meminta pairing code, silakan gunakan QR Code di atas:', err.message);
        try {
          const qrString = await QRCode.toString(qr, { type: 'terminal', small: true });
          console.log(qrString);
        } catch {
          // fallback
        }
      }
    }

    if (connection === 'open') {
      console.log('\n🎉 =========================================================');
      console.log('✅ WHATSAPP BERHASIL TERTAUT & AKTIF 100%!');
      console.log('=========================================================');

      const rawId = sock?.user?.id || '';
      const cleanNum = rawId.split(':')[0] || rawId.split('@')[0];
      const masked = cleanNum.length > 7
        ? '+' + cleanNum.slice(0, 5) + '-***-' + cleanNum.slice(-4)
        : cleanNum;

      console.log(`📞 Nomor Bot Aktif : ${masked}`);
      console.log(`👤 Nama Akun       : ${sock?.user?.name || 'Verand Bot'}`);

      // Sinkronkan ke Supabase Database
      if (supabase) {
        console.log('🔄 Menyinkronkan status ke Supabase Database...');
        try {
          await supabase.from('bot_instances').upsert({
            id: 'inst-core',
            nomor_wa: masked,
            status: 'connected',
            created_at: new Date().toISOString(),
          });
          console.log('🌐 Status Dashboard Vercel Anda sekarang TERHUBUNG (ONLINE 🟢)!');
        } catch (e) {
          console.warn('⚠️ Update Supabase info:', e.message);
        }
      }

      console.log('\n⚡ Bot sekarang sedang berjalan aktif melayani perintah WhatsApp.');
      console.log('💡 Coba kirim pesan "/menu" dari nomor WhatsApp lain ke nomor ini!');
      console.log('💡 Tekan Ctrl + C di terminal jika ingin menghentikan bot.');
    }

    if (connection === 'close') {
      const statusCode = lastDisconnect?.error?.output?.statusCode;
      const isLoggedOut = statusCode === DisconnectReason.loggedOut;

      console.log(`\n⚠️ Koneksi Baileys tertutup (Status: ${statusCode || 'unknown'}).`);

      if (isLoggedOut) {
        console.log('❌ Sesi WhatsApp telah di-logout. Menghapus data sesi lokal...');
        if (fs.existsSync(authDir)) {
          fs.rmSync(authDir, { recursive: true, force: true });
        }
        if (supabase) {
          await supabase.from('bot_instances').upsert({
            id: 'inst-core',
            status: 'disconnected',
          });
        }
        process.exit(0);
      } else {
        console.log('🔄 Menyambungkan ulang ke server WhatsApp...');
        pairingRequested = false;
        setTimeout(connectToWhatsApp, 3000);
      }
    }
  });

  // Handler pesan sederhana agar bot bisa langsung membalas /menu
  sock.ev.on('messages.upsert', async ({ messages, type }) => {
    if (type !== 'notify') return;
    for (const msg of messages) {
      if (!msg.message || msg.key.fromMe) continue;
      const sender = msg.key.remoteJid;
      const text =
        msg.message.conversation ||
        msg.message.extendedTextMessage?.text ||
        msg.message.imageMessage?.caption ||
        '';

      const trimmed = text.trim().toLowerCase();
      if (trimmed === '/menu' || trimmed === '!menu' || trimmed === '.menu' || trimmed === 'menu') {
        const reply =
          `🤖 *VERAND.BOT AKTIF 🟢*\n\n` +
          `Halo! Bot WhatsApp Anda telah berhasil terhubung.\n` +
          `Dashboard kontrol Anda aktif di Vercel.\n\n` +
          `📌 *Fitur Utama:*\n` +
          `• /dl <link> (TikTok, IG, YT, FB)\n` +
          `• /sticker (Kirim foto dengan caption /sticker)\n` +
          `• /faq (Pusat panduan lengkap)`;
        await sock.sendMessage(sender, { text: reply }, { quoted: msg });
      }
    }
  });
}

connectToWhatsApp();
