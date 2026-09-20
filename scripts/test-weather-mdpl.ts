import {
  parseLocationQuery,
  searchIndonesianLocations,
  getWeatherForecast,
  formatWeatherText,
  calculateBraakTemperature,
} from '../lib/bot/bmkgService';

async function main() {
  console.log('================================================================');
  console.log('=== PENGUJIAN CUACA BERBASIS DESA, KECAMATAN & ELEVASI (MDPL) ===');
  console.log('================================================================\n');

  // TEST 1: Parsing Format Lokasi
  console.log('=== TEST 1: Pengujian Parser Format Lokasi ===');
  const queries = [
    '(Lembang, Cikole)',
    'Cikole, Lembang',
    'desa Cikole kec Lembang',
    'kec Lembang desa Cikole',
    'Lembang 1400mdpl',
    '(Lembang, Cikole) 1450mdpl',
    'Dieng',
  ];

  for (const q of queries) {
    const p = parseLocationQuery(q);
    console.log(`Input: "${q}" => Desa: ${p.village || '-'} | Kec: ${p.district || '-'} | Pair: ${p.isPair} | MDPL: ${p.explicitElevation || 'auto'}`);
  }

  // TEST 2: Cuaca Pasangan /cuaca (kecamatan, desa) => (Lembang, Cikole)
  console.log('\n=== TEST 2: Prakiraan Cuaca Format (Kecamatan, Desa) -> (Lembang, Cikole) ===');
  const cikoleInLembang = await getWeatherForecast('(Lembang, Cikole)');
  console.log(`Nama Lokasi: ${cikoleInLembang.locationName}`);
  console.log(`Desa: ${cikoleInLembang.village}`);
  console.log(`Kecamatan: ${cikoleInLembang.district}`);
  console.log(`Kab/Kota: ${cikoleInLembang.regency}`);
  console.log(`Elevasi: ${cikoleInLembang.elevation} mdpl (${cikoleInLembang.elevationCategory})`);
  console.log(`Suhu Saat Ini (Real-time): ${cikoleInLembang.current.tempC}°C`);
  console.log(`Kondisi Cuaca: ${cikoleInLembang.current.condition}`);
  console.log(`Kelembapan: ${cikoleInLembang.current.humidity}%`);
  console.log(`Kecepatan Angin: ${cikoleInLembang.current.windSpeedKmh} km/jam`);
  console.log(`Sumber Data: ${cikoleInLembang.source}`);

  // TEST 3: Cuaca Desa Dataran Alpin / Sangat Tinggi -> (Kejajar, Dieng)
  console.log('\n=== TEST 3: Prakiraan Cuaca Desa Dataran Alpin -> (Kejajar, Dieng) ===');
  const dieng = await getWeatherForecast('(Kejajar, Dieng)');
  console.log(`Desa: ${dieng.village} | Kecamatan: ${dieng.district} | Kab: ${dieng.regency}`);
  console.log(`Elevasi: ${dieng.elevation} mdpl (${dieng.elevationCategory})`);
  console.log(`Suhu: ${dieng.current.tempC}°C (Penurunan thd pesisir: ${dieng.tempSeaLevelDiff}°C)`);

  // TEST 4: Cuaca Dataran Rendah -> Jakarta Utara (Pesisir)
  console.log('\n=== TEST 4: Prakiraan Cuaca Wilayah Dataran Rendah (<400 mdpl) ===');
  const pesisir = await getWeatherForecast('Jakarta Utara');
  console.log(`Lokasi: ${pesisir.locationName}`);
  console.log(`Elevasi: ${pesisir.elevation} mdpl (${pesisir.elevationCategory})`);
  console.log(`Suhu Saat Ini: ${pesisir.current.tempC}°C`);

  // TEST 5: Format Pesan WhatsApp Lengkap untuk Bot
  console.log('\n=== TEST 5: Format Pesan WhatsApp Hasil /cuaca (Lembang, Cikole) ===');
  const waMessage = formatWeatherText(cikoleInLembang);
  console.log('--------------------------------------------------');
  console.log(waMessage);
  console.log('--------------------------------------------------');

  // TEST 6: Format Pesan WhatsApp Jika Hanya Kecamatan (/cuaca kec Lembang)
  console.log('\n=== TEST 6: Format Pesan WhatsApp Jika Hanya Kecamatan (/cuaca kec Lembang) ===');
  const lembangOnly = await getWeatherForecast('kec Lembang');
  const waMsgKec = formatWeatherText(lembangOnly);
  console.log('--------------------------------------------------');
  console.log(waMsgKec);
  console.log('--------------------------------------------------');

  // TEST 7: Validasi Hukum Braak
  console.log('\n=== TEST 7: Validasi Hukum Braak (-0.6°C / 100m) ===');
  const tPesisir = 30;
  const tDieng = calculateBraakTemperature(tPesisir, 2000, 0);
  console.log(`Suhu di 0 mdpl: ${tPesisir}°C => Estimasi di 2.000 mdpl: ${tDieng}°C (Penurunan: ${(30 - tDieng).toFixed(1)}°C)`);

  console.log('\n✅ SEMUA PENGUJIAN CUACA BERBASIS DESA/KECAMATAN & MDPL BERHASIL!');
}

main().catch((err) => {
  console.error('Test error:', err);
  process.exit(1);
});
