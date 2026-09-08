/**
 * Script Resmi Penautan WhatsApp via Pairing Code 8-Digit
 * Jalankan di terminal: node scripts/pair-whatsapp.js <nomor_wa>
 * Contoh: node scripts/pair-whatsapp.js 6281234567890
 */

const fs = require('fs');
const path = require('path');
const pino = require('pino');
const {
  default: makeWASocket,
  DisconnectReason,
  useMultiFileAuthState,
} = require('@whiskeysockets/baileys');
const { createClient } = require('@supabase/supabase-js');

// 1. Muat kredensial dari .env.local
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

// 3. Ambil argumen nomor telepon
let phoneNumber = process.argv[2];
if (!phoneNumber) {
  // Cek apakah ada di BOT_OWNER_NUMBER
  phoneNumber = process.env.BOT_OWNER_NUMBER || '';
}

phoneNumber = (phoneNumber || '').replace(/\D/g, '');

if (!phoneNumber || phoneNumber.length < 9) {
  console.log('\n❌ NOMOR TELEPON DIPERLUKAN!');
  console.log('Gunakan format internasional tanpa tanda +, contoh:');
  console.log('👉 node scripts/pair-whatsapp.js 6281234567890\n');
  process.exit(1);
}

async function startPairing() {
  console.log('\n=============================================================');
  console.log('🤖 VERAND.BOT — GENERATOR PAIRING CODE RESMI WHATSAPP');
  console.log('=============================================================');
  console.log(`📱 Nomor Target : +${phoneNumber}`);
  console.log('⏳ Menyiapkan soket koneksi Baileys...\n');

  const authDir = path.join(__dirname, '..', 'sessions', 'baileys_auth');
  if (!fs.existsSync(authDir)) {
    fs.mkdirSync(authDir, { recursive: true });
  }

  const { state, saveCreds } = await useMultiFileAuthState(authDir);

  const sock = makeWASocket({
    auth: state,
    printQRInTerminal: false,
    logger: pino({ level: 'silent' }),
    browser: ['Verand Bot', 'Chrome', '120.0.0'],
  });

  sock.ev.on('creds.update', saveCreds);

  // Jika belum terdaftar, minta pairing code resmi dari WhatsApp
  if (!sock.authState.creds.registered) {
    setTimeout(async () => {
      try {
        console.log('📡 Menghubungkan ke server WhatsApp untuk meminta kode resmi...');
        const code = await sock.requestPairingCode(phoneNumber);
        const formatted = code?.match(/.{1,4}/g)?.join('-') || code;

        console.log('\n╔════════════════════════════════════════════════════════════╗');
        console.log('║               KODE TAUTAN RESMI WHATSAPP                   ║');
        console.log('╠════════════════════════════════════════════════════════════╣');
        console.log(`║                  👉   ${formatted}   👈                  ║`);
        console.log('╚════════════════════════════════════════════════════════════╝\n');
        console.log('📋 PANDUAN MEMASUKKAN KODE DI HP:');
        console.log(' 1. Buka aplikasi WhatsApp di HP Anda.');
        console.log(' 2. Ketuk ikon Titik Tiga (atau Pengaturan) > "Perangkat Tertaut".');
        console.log(' 3. Ketuk tombol "Tautkan Perangkat".');
        console.log(' 4. Di bagian bawah layar scan QR, ketuk "Tautkan dengan nomor telepon saja".');
        console.log(` 5. Masukkan 8 karakter kode di atas: ${formatted}\n`);
        console.log('⏳ Menunggu otorisasi dari HP Anda (berlaku ±60 detik)...\n');
      } catch (err) {
        console.error('❌ Gagal meminta pairing code dari WhatsApp:', err.message);
        console.log('💡 Pastikan nomor telepon sudah benar dan memiliki awalan kode negara (misal 628...)');
      }
    }, 3000);
  } else {
    console.log('ℹ️ Akun sudah memiliki sesi auth yang tersimpan.');
  }

  sock.ev.on('connection.update', async (update) => {
    const { connection, lastDisconnect } = update;

    if (connection === 'open') {
      console.log('\n🎉 =========================================================');
      console.log('✅ WHATSAPP BERHASIL TERTAUT & TERKONEKSI SEMPURNA!');
      console.log('=========================================================');

      const rawId = sock?.user?.id || '';
      const cleanNum = rawId.split(':')[0] || rawId.split('@')[0];
      const masked = cleanNum.length > 7
        ? '+' + cleanNum.slice(0, 5) + '-***-' + cleanNum.slice(-4)
        : cleanNum;

      console.log(`📞 Nomor Terhubung : ${masked}`);
      console.log(`👤 Nama Profil     : ${sock?.user?.name || 'Verand Bot'}`);

      // Simpan ke Supabase agar Dashboard Vercel otomatis TERHUBUNG
      if (supabase) {
        console.log('🔄 Menyinkronkan status ke Supabase Database...');
        try {
          await supabase.from('bot_instances').upsert({
            id: 'inst-core',
            nomor_wa: masked,
            status: 'connected',
            created_at: new Date().toISOString(),
          });
          console.log('🌐 Sukses! Buka dashboard Vercel Anda, status sudah TERHUBUNG!');
        } catch (e) {
          console.warn('⚠️ Gagal update Supabase:', e.message);
        }
      }

      console.log('\n💡 Biarkan proses ini tetap menyala agar bot terus melayani pesan.');
    }

    if (connection === 'close') {
      const statusCode = lastDisconnect?.error?.output?.statusCode;
      const isLoggedOut = statusCode === DisconnectReason.loggedOut;

      console.log(`\n⚠️ Koneksi terputus (Status: ${statusCode || 'unknown'}).`);

      if (isLoggedOut) {
        console.log('❌ Sesi telah dikeluarkan dari WhatsApp (Logged Out).');
        if (supabase) {
          await supabase.from('bot_instances').upsert({
            id: 'inst-core',
            status: 'disconnected',
          });
        }
        process.exit(0);
      } else {
        console.log('🔄 Mencoba menghubungkan ulang...');
        startPairing();
      }
    }
  });
}

startPairing();
