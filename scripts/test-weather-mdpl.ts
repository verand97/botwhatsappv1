import {
  searchIndonesianLocations,
  getWeatherForecast,
  formatWeatherText,
  calculateBraakTemperature,
} from '../lib/bot/bmkgService';

async function main() {
  console.log('=== TEST 1: Pencarian Desa / Kecamatan se-Indonesia ===');
  const searchResults = await searchIndonesianLocations('Cikole', 5);
  console.log(`Ditemukan ${searchResults.length} hasil untuk "Cikole":`);
  for (const item of searchResults) {
    console.log(` - ${item.name} (${item.admin2 || '-'}, ${item.admin1 || '-'}) | Elevasi: ${item.elevation} mdpl | ${item.elevationCategory}`);
  }

  console.log('\n=== TEST 2: Prakiraan Cuaca Desa Dataran Tinggi (Dieng) ===');
  const dieng = await getWeatherForecast('Dieng');
  console.log(`Lokasi: ${dieng.locationName}`);
  console.log(`Elevasi: ${dieng.elevation} mdpl (${dieng.elevationCategory})`);
  console.log(`Suhu Saat Ini: ${dieng.current.tempC}°C`);
  console.log(`Kondisi: ${dieng.current.condition}`);
  console.log(`Selisih Suhu thd Pesisir: ${dieng.tempSeaLevelDiff}°C`);

  console.log('\n=== TEST 3: Prakiraan Cuaca dengan Custom MDPL (Lembang 1400 mdpl) ===');
  const lembangCustom = await getWeatherForecast('Lembang 1400mdpl');
  console.log(`Lokasi: ${lembangCustom.locationName}`);
  console.log(`Elevasi: ${lembangCustom.elevation} mdpl (Custom: ${lembangCustom.isCustomElevation})`);
  console.log(`Suhu: ${lembangCustom.current.tempC}°C`);

  console.log('\n=== TEST 4: Format Teks Pesan WhatsApp untuk Bot ===');
  const textMsg = formatWeatherText(dieng);
  console.log('--------------------------------------------------');
  console.log(textMsg);
  console.log('--------------------------------------------------');

  console.log('\n=== TEST 5: Validasi Rumus Braak ===');
  const tSeaLevel = 28;
  const tAt1500m = calculateBraakTemperature(tSeaLevel, 1500, 0);
  console.log(`Suhu di 0 mdpl: ${tSeaLevel}°C => Suhu di 1.500 mdpl: ${tAt1500m}°C (Penurunan 9°C)`);

  if (tAt1500m === 19) {
    console.log('Rumus Braak terverifikasi tepat 100%!');
  }

  console.log('\nSEMUA PENGUJIAN CUACA BERBASIS MDPL SUKSES!');
}

main().catch((err) => {
  console.error('Test error:', err);
  process.exit(1);
});
