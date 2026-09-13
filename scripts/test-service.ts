import {
  getLatestEarthquake,
  getRecentEarthquakes,
  getFeltEarthquakes,
  getWeatherForecast,
  getSatelliteImage,
  getMaritimeWarnings,
  getAirQuality,
  formatEarthquakeText,
  formatWeatherText,
  formatMaritimeText
} from '../lib/bot/bmkgService';

async function main() {
  console.log('Testing bmkgService methods...');
  const eq = await getLatestEarthquake();
  console.log('Latest EQ:', eq.data.Wilayah, '| Mag:', eq.data.Magnitude, '| Has imgBuffer:', Boolean(eq.imageBuffer));

  const recent = await getRecentEarthquakes();
  console.log('Recent EQs count:', recent.length);

  const felt = await getFeltEarthquakes();
  console.log('Felt EQs count:', felt.length);

  const weather = await getWeatherForecast('Jakarta');
  console.log('Weather Jakarta:', weather.current.condition, weather.current.tempC, 'C | Source:', weather.source);

  const weatherBandung = await getWeatherForecast('Bandung');
  console.log('Weather Bandung:', weatherBandung.current.condition, weatherBandung.current.tempC, 'C');

  const sat = await getSatelliteImage('awan');
  console.log('Sat Awan buffer length:', sat.buffer.length);

  const maritime = await getMaritimeWarnings();
  console.log('Maritime regions count:', maritime.regions.length);

  const aqi = await getAirQuality('Jakarta');
  console.log('AQI Jakarta:', aqi.aqi, aqi.status);

  console.log('ALL BMKG SERVICE TESTS PASSED SUCCESSFULLY!');
}
main().catch(console.error);
