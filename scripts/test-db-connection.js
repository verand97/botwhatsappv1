const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

// Auto-load .env.local dan .env jika dijalankan via node biasa
function loadEnv() {
  const files = ['.env.local', '.env'];
  for (const file of files) {
    const fullPath = path.join(__dirname, '..', file);
    if (fs.existsSync(fullPath)) {
      const content = fs.readFileSync(fullPath, 'utf8');
      for (const line of content.split(/\r?\n/)) {
        const trimmed = line.trim();
        if (!trimmed || trimmed.startsWith('#')) continue;
        const eqIdx = trimmed.indexOf('=');
        if (eqIdx !== -1) {
          const key = trimmed.slice(0, eqIdx).trim();
          let val = trimmed.slice(eqIdx + 1).trim();
          // Hapus tanda kutip jika ada
          if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
            val = val.slice(1, -1);
          }
          if (!process.env[key]) {
            process.env[key] = val;
          }
        }
      }
    }
  }
}

loadEnv();

async function testConnection() {
  console.log('=== UJI KONEKSI DATABASE VERAND.BOT ===\n');

  let supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (supabaseUrl) {
    // Bersihkan jika pengguna menyertakan /rest/v1 atau trailing slash
    supabaseUrl = supabaseUrl.replace(/\/rest\/v1\/?$/, '').replace(/\/+$/, '');
  }

  if (!supabaseUrl || !supabaseKey) {
    console.log('⚠️ Variabel lingkungan Supabase belum diatur di sistem lokal.');
    console.log('Pastikan variabel berikut telah diisi di Vercel atau file .env.local:');
    console.log(' • NEXT_PUBLIC_SUPABASE_URL');
    console.log(' • NEXT_PUBLIC_SUPABASE_ANON_KEY');
    console.log('\nPetunjuk: Baca panduan lengkap di VERCEL_DEPLOYMENT_GUIDE.md');
    return;
  }

  try {
    console.log(`Menghubungkan ke Supabase: ${supabaseUrl.slice(0, 30)}...`);
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Test query bot_instances
    const { data: instances, error: errInst } = await supabase.from('bot_instances').select('*').limit(1);
    if (errInst) {
      console.error('❌ Gagal membaca tabel bot_instances:', errInst.message);
      console.log('💡 Pastikan skrip "schema.sql" sudah dijalankan di Supabase SQL Editor.');
      return;
    }

    console.log('✅ Tabel bot_instances terhubung!');

    // Test query feature_configs
    const { data: features, error: errFeat } = await supabase.from('feature_configs').select('*').limit(1);
    if (errFeat) {
      console.warn('⚠️ Tabel feature_configs belum ada:', errFeat.message);
    } else {
      console.log('✅ Tabel feature_configs terhubung!');
    }

    // Test query activity_logs
    const { data: logs, error: errLogs } = await supabase.from('activity_logs').select('*').limit(1);
    if (errLogs) {
      console.warn('⚠️ Tabel activity_logs belum ada:', errLogs.message);
    } else {
      console.log('✅ Tabel activity_logs terhubung!');
    }

    console.log('\n🎉 SEMUA KONEKSI DATABASE VALID & SIAP DIGUNAKAN DI VERCEL!');
  } catch (e) {
    console.error('❌ Terjadi kesalahan saat menguji koneksi:', e.message);
  }
}

testConnection();
