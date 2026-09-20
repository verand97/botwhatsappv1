/**
 * BMKG (Badan Meteorologi, Klimatologi, dan Geofisika) & Disaster Monitoring Service
 * Menyediakan integrasi lengkap data resmi BMKG Indonesia:
 * - Gempa Bumi Terkini (M >= 5.0 & Gempa Dirasakan) + Shakemap
 * - Daftar 15 Gempa M 5.0+ Terkini & Gempa Dirasakan
 * - Prakiraan Cuaca Kota-kota se-Indonesia & Global
 * - Citra Satelit Cuaca Himawari-9 (IR Enhanced & Potensi Hujan)
 * - Pantauan Titik Panas (Hotspot) & Bahaya Karhutla
 * - Peringatan Dini Cuaca Maritim & Gelombang Tinggi
 * - Kualitas Udara (PM2.5 / PM10 / AQI)
 */

export interface EarthquakeData {
  Tanggal: string;
  Jam: string;
  DateTime: string;
  Coordinates: string;
  Lintang: string;
  Bujur: string;
  Magnitude: string;
  Kedalaman: string;
  Wilayah: string;
  Potensi: string;
  Dirasakan?: string;
  Shakemap?: string;
  shakemapUrl?: string;
}

export interface WeatherSlot {
  time: string;
  localDatetime: string;
  condition: string;
  tempC: number;
  humidity: number;
  windSpeedKmh: number;
  windDir: string;
  visibilityText?: string;
  weatherCode?: number;
}

export interface LocationSearchResult {
  name: string;
  village?: string; // Nama Desa / Kelurahan
  district?: string; // Kecamatan
  admin1?: string; // Provinsi
  admin2?: string; // Kabupaten / Kota
  admin3?: string; // Kecamatan (jika ada)
  latitude: number;
  longitude: number;
  elevation: number; // MDPL (meter di atas permukaan laut)
  elevationCategory: string; // Dataran Rendah / Sedang / Tinggi / Pegunungan
  country?: string;
  type?: 'desa' | 'kecamatan' | 'kota' | 'lainnya';
}

export interface WeatherForecast {
  locationName: string;
  village?: string; // Nama Desa / Kelurahan
  district?: string; // Kecamatan
  regency?: string; // Kabupaten / Kota
  province?: string;
  elevation?: number; // MDPL
  elevationCategory?: string; // Kategori Dataran
  tempSeaLevelDiff?: number; // Selisih suhu thd permukaan laut (0 mdpl)
  seaLevelTempEstimate?: number; // Estimasi suhu di 0 mdpl (°C)
  isCustomElevation?: boolean;
  source: 'BMKG' | 'Open-Meteo (Global/Regional)' | 'BMKG (Elevasi MDPL Disesuaikan)' | 'Open-Meteo High-Resolution (Terkalibrasi DEM)';
  current: WeatherSlot;
  forecasts: WeatherSlot[];
}


export interface MaritimeRegionWarning {
  region: string;
  synoptic: string;
  validFrom: string;
  validUntil: string;
  timezone: string;
  warning: {
    sedang?: string[]; // 1.25 - 2.50 m
    tinggi?: string[]; // 2.50 - 4.0 m
    sangatTinggi?: string[]; // 4.0 - 6.0 m
    ekstrem?: string[]; // > 6.0 m
  };
}

export interface AirQualityData {
  location: string;
  pm25: number;
  pm10: number;
  aqi: number;
  status: 'Baik' | 'Sedang' | 'Tidak Sehat Bagi Kelompok Sensitif' | 'Tidak Sehat' | 'Sangat Tidak Sehat' | 'Berbahaya';
  statusColor: string;
  advisory: string;
}

// Database pemetaan kode ADM4 BMKG untuk kota/kabupaten besar di Indonesia
const BMKG_ADM4_MAP: Record<string, { code: string; label: string }> = {
  jakarta: { code: '31.71.01.1001', label: 'DKI Jakarta (Pusat)' },
  'jakarta pusat': { code: '31.71.01.1001', label: 'Kota Jakarta Pusat' },
  'jakarta selatan': { code: '31.74.01.1001', label: 'Kota Jakarta Selatan' },
  'jakarta barat': { code: '31.73.01.1001', label: 'Kota Jakarta Barat' },
  'jakarta timur': { code: '31.75.01.1001', label: 'Kota Jakarta Timur' },
  'jakarta utara': { code: '31.72.01.1001', label: 'Kota Jakarta Utara' },
  bandung: { code: '32.73.01.1001', label: 'Kota Bandung' },
  surabaya: { code: '35.78.01.1001', label: 'Kota Surabaya' },
  semarang: { code: '33.74.01.1001', label: 'Kota Semarang' },
  yogyakarta: { code: '34.71.01.1001', label: 'Kota Yogyakarta' },
  jogja: { code: '34.71.01.1001', label: 'Kota Yogyakarta' },
  solo: { code: '33.72.01.1001', label: 'Kota Surakarta (Solo)' },
  surakarta: { code: '33.72.01.1001', label: 'Kota Surakarta' },
  denpasar: { code: '51.71.01.1001', label: 'Kota Denpasar' },
  bali: { code: '51.71.01.1001', label: 'Denpasar, Bali' },
  medan: { code: '12.71.01.1001', label: 'Kota Medan' },
  makassar: { code: '73.71.01.1001', label: 'Kota Makassar' },
  malang: { code: '35.73.01.1001', label: 'Kota Malang' },
  batam: { code: '21.71.01.1001', label: 'Kota Batam' },
  palembang: { code: '16.71.01.1001', label: 'Kota Palembang' },
  padang: { code: '13.71.01.1001', label: 'Kota Padang' },
  pekanbaru: { code: '14.71.01.1001', label: 'Kota Pekanbaru' },
  lampung: { code: '18.71.01.1001', label: 'Bandar Lampung' },
  'bandar lampung': { code: '18.71.01.1001', label: 'Kota Bandar Lampung' },
  pontianak: { code: '61.71.01.1001', label: 'Kota Pontianak' },
  banjarmasin: { code: '63.71.01.1001', label: 'Kota Banjarmasin' },
  balikpapan: { code: '64.71.01.1001', label: 'Kota Balikpapan' },
  samarinda: { code: '64.72.01.1001', label: 'Kota Samarinda' },
  manado: { code: '71.71.01.1001', label: 'Kota Manado' },
  mataram: { code: '52.71.01.1001', label: 'Kota Mataram' },
  lombok: { code: '52.71.01.1001', label: 'Mataram (Lombok)' },
  kupang: { code: '53.71.01.1001', label: 'Kota Kupang' },
  ambon: { code: '81.71.01.1001', label: 'Kota Ambon' },
  jayapura: { code: '91.71.01.1001', label: 'Kota Jayapura' },
  aceh: { code: '11.71.01.1001', label: 'Kota Banda Aceh' },
  'banda aceh': { code: '11.71.01.1001', label: 'Kota Banda Aceh' },
  serang: { code: '36.73.01.1001', label: 'Kota Serang' },
  cirebon: { code: '32.74.01.1001', label: 'Kota Cirebon' },
  sukabumi: { code: '32.72.01.1001', label: 'Kota Sukabumi' },
  tasikmalaya: { code: '32.78.01.1001', label: 'Kota Tasikmalaya' },
  bogor: { code: '32.71.01.1001', label: 'Kota Bogor' },
  depok: { code: '32.76.01.1001', label: 'Kota Depok' },
  bekasi: { code: '32.75.01.1001', label: 'Kota Bekasi' },
  tangerang: { code: '36.71.01.1001', label: 'Kota Tangerang' },
  tangsel: { code: '36.74.01.1001', label: 'Kota Tangerang Selatan' },
  'tangerang selatan': { code: '36.74.01.1001', label: 'Kota Tangerang Selatan' },
};

/**
 * Download helper dengan timeout aman
 */
async function fetchWithTimeout(url: string, timeoutMs = 8000): Promise<Response> {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(url, {
      signal: controller.signal,
      headers: {
        'User-Agent': 'VerandBot/1.0 BMKG-Disaster-Monitor (Mozilla/5.0)',
      },
    });
    clearTimeout(id);
    return res;
  } catch (e) {
    clearTimeout(id);
    throw e;
  }
}

/**
 * 1. Ambil Gempa Terkini Real-time (AutoGempa) + Shakemap Image
 */
export async function getLatestEarthquake(): Promise<{
  data: EarthquakeData;
  imageBuffer?: Buffer;
}> {
  const res = await fetchWithTimeout('https://data.bmkg.go.id/DataMKG/TEWS/autogempa.json');
  if (!res.ok) throw new Error(`BMKG returned HTTP ${res.status}`);
  const json = await res.json();
  const gempa = json?.Infogempa?.gempa;
  if (!gempa) throw new Error('Format data gempa BMKG tidak valid.');

  const result: EarthquakeData = {
    ...gempa,
    shakemapUrl: gempa.Shakemap
      ? `https://data.bmkg.go.id/DataMKG/TEWS/${gempa.Shakemap}`
      : undefined,
  };

  let imageBuffer: Buffer | undefined;
  if (result.shakemapUrl) {
    try {
      const imgRes = await fetchWithTimeout(result.shakemapUrl, 7000);
      if (imgRes.ok) {
        const arr = await imgRes.arrayBuffer();
        imageBuffer = Buffer.from(arr);
      }
    } catch (err) {
      console.warn('[BMKG] Gagal mengunduh shakemap:', err);
    }
  }

  return { data: result, imageBuffer };
}

/**
 * 2. Ambil 15 Gempa Terkini M 5.0+
 */
export async function getRecentEarthquakes(): Promise<EarthquakeData[]> {
  const res = await fetchWithTimeout('https://data.bmkg.go.id/DataMKG/TEWS/gempaterkini.json');
  if (!res.ok) throw new Error(`BMKG returned HTTP ${res.status}`);
  const json = await res.json();
  return json?.Infogempa?.gempa || [];
}

/**
 * 3. Ambil 15 Gempa Dirasakan Terkini
 */
export async function getFeltEarthquakes(): Promise<EarthquakeData[]> {
  const res = await fetchWithTimeout('https://data.bmkg.go.id/DataMKG/TEWS/gempadirasakan.json');
  if (!res.ok) throw new Error(`BMKG returned HTTP ${res.status}`);
  const json = await res.json();
  return json?.Infogempa?.gempa || [];
}

/**
 * 4. Ambil Prakiraan Cuaca (BMKG adm4 prioritised, Open-Meteo fallback)
 */
/**
 * Kategori Dataran Berdasarkan Ketinggian (MDPL)
 */
export function getElevationCategory(elevation: number): string {
  if (elevation < 400) return 'Dataran Rendah (Pesisir & Lembah)';
  if (elevation < 700) return 'Dataran Sedang (Perbukitan / Kaki Gunung)';
  if (elevation < 1500) return 'Dataran Tinggi (Pegunungan / Perkebunan)';
  return 'Pegunungan Sangat Tinggi (Dataran Alpin)';
}

/**
 * Rumus Braak (Gradien Suhu Vertikal Tropis BMKG):
 * Setiap kenaikan 100 meter di atas permukaan laut (MDPL), suhu udara turun rata-rata 0,6°C.
 * deltaT = -0.6 * ((targetElevation - baseElevation) / 100)
 */
export function calculateBraakTemperature(
  baseTemp: number,
  targetElevation: number,
  baseElevation: number = 0
): number {
  const deltaT = 0.6 * ((targetElevation - baseElevation) / 100);
  return Math.round((baseTemp - deltaT) * 10) / 10;
}

export interface ParsedLocationQuery {
  raw: string;
  village?: string;
  district?: string;
  explicitElevation?: number;
  isPair: boolean;
  cleanQuery: string;
}

/**
 * Parser Cerdas Format Lokasi:
 * Mendukung format:
 * - /cuaca (kecamatan, desa)  => e.g. (Lembang, Cikole)
 * - /cuaca (desa, kecamatan)  => e.g. (Cikole, Lembang)
 * - /cuaca kecamatan, desa    => e.g. Lembang, Cikole
 * - /cuaca desa, kecamatan    => e.g. Cikole, Lembang
 * - /cuaca desa X kec Y
 * - /cuaca kec Y desa X
 * - /cuaca X 1400mdpl
 */
export function parseLocationQuery(input: string): ParsedLocationQuery {
  let raw = (input || '').trim();

  // 1. Ekstrak angka MDPL jika ada (contoh: "Lembang 1400mdpl" atau "(Lembang, Cikole) 1450 mdpl")
  let explicitElevation: number | undefined;
  const mdplMatch = raw.match(/(\d+)\s*(?:mdpl|m(?:eter)?\s*(?:dpl|darat)?)/i);
  if (mdplMatch) {
    explicitElevation = parseInt(mdplMatch[1], 10);
    raw = raw.replace(/(\d+)\s*(?:mdpl|m(?:eter)?\s*(?:dpl|darat)?)/gi, '').trim();
  }

  // 2. Cek kurung siku / kurung biasa: misal "(Lembang, Cikole)" atau "[Lembang, Cikole]"
  let insideParens = false;
  const parenMatch = raw.match(/^\s*[\(\[]([^()\[\]]+)[\)\]]\s*$/);
  if (parenMatch) {
    raw = parenMatch[1].trim();
    insideParens = true;
  }

  // 3. Cek kata kunci eksplisit: "desa <X> kec <Y>" atau "kec <Y> desa <X>"
  const desaKecMatch = raw.match(
    /(?:desa|kelurahan|kel\.?)\s+([^\s,]+(?: [^\s,]+)*?)\s+(?:kecamatan|kec\.?)\s+([^\s,]+(?: [^\s,]+)*)/i
  );
  if (desaKecMatch) {
    const v = desaKecMatch[1].trim();
    const d = desaKecMatch[2].trim();
    return {
      raw: input,
      village: v,
      district: d,
      explicitElevation,
      isPair: true,
      cleanQuery: `${v}, ${d}`,
    };
  }

  const kecDesaMatch = raw.match(
    /(?:kecamatan|kec\.?)\s+([^\s,]+(?: [^\s,]+)*?)\s+(?:desa|kelurahan|kel\.?)\s+([^\s,]+(?: [^\s,]+)*)/i
  );
  if (kecDesaMatch) {
    const d = kecDesaMatch[1].trim();
    const v = kecDesaMatch[2].trim();
    return {
      raw: input,
      district: d,
      village: v,
      explicitElevation,
      isPair: true,
      cleanQuery: `${v}, ${d}`,
    };
  }

  // 4. Cek pemisah koma / garis miring: misal "Lembang, Cikole" atau "Cikole, Lembang"
  const commaParts = raw.split(/[,/]+/).map((s) => s.trim()).filter(Boolean);
  if (commaParts.length >= 2) {
    const cleanP0 = commaParts[0]
      .replace(/^(?:desa|kelurahan|kecamatan|kec\.?|kabupaten|kab\.?)\s+/i, '')
      .trim();
    const cleanP1 = commaParts[1]
      .replace(/^(?:desa|kelurahan|kecamatan|kec\.?|kabupaten|kab\.?)\s+/i, '')
      .trim();

    const p0HasDesa = /^(?:desa|kelurahan)\b/i.test(commaParts[0]);
    const p0HasKec = /^(?:kecamatan|kec\.?)\b/i.test(commaParts[0]);
    const p1HasDesa = /^(?:desa|kelurahan)\b/i.test(commaParts[1]);
    const p1HasKec = /^(?:kecamatan|kec\.?)\b/i.test(commaParts[1]);

    let district: string | undefined;
    let village: string | undefined;

    if (p0HasDesa || p1HasKec) {
      village = cleanP0;
      district = cleanP1;
    } else if (p0HasKec || p1HasDesa) {
      district = cleanP0;
      village = cleanP1;
    } else if (insideParens) {
      // Format resmi sesuai permintaan: /cuaca (kecamatan, desa)
      district = cleanP0;
      village = cleanP1;
    } else {
      // Format standar tanpa kurung: <desa>, <kecamatan/kota> (contoh: Cikole, Lembang)
      village = cleanP0;
      district = cleanP1;
    }

    return {
      raw: input,
      district,
      village,
      explicitElevation,
      isPair: true,
      cleanQuery: `${village || cleanP1}, ${district || cleanP0}`,
    };
  }

  // 5. Query tunggal (misal "Dieng" atau "Lembang" atau "Desa Cikole")
  const singleClean = raw.replace(/^(?:desa|kelurahan|kecamatan|kec\.?|kabupaten|kab\.?)\s+/i, '').trim();
  const isDesaExplicit = /^(?:desa|kelurahan)\b/i.test(raw);
  const isKecExplicit = /^(?:kecamatan|kec\.?)\b/i.test(raw);

  return {
    raw: input,
    village: isDesaExplicit ? singleClean : undefined,
    district: isKecExplicit ? singleClean : undefined,
    explicitElevation,
    isPair: false,
    cleanQuery: singleClean,
  };
}

/**
 * Pencarian Cerdas Lokasi Desa, Kelurahan, Kecamatan, dan Kota se-Indonesia
 * Menyediakan koordinat latitude, longitude, dan ketinggian (MDPL)
 * Memisahkan Desa dan Kecamatan secara akurat
 */
export async function searchIndonesianLocations(
  query: string,
  limit: number = 6,
  preParsed?: ParsedLocationQuery
): Promise<LocationSearchResult[]> {
  if (!query || !query.trim()) return [];

  const parsed = preParsed || parseLocationQuery(query);

  // Jika input berupa pasangan (Kecamatan + Desa atau Desa + Kecamatan)
  if (parsed.isPair) {
    const rawParts = parsed.cleanQuery.split(/[,/]+/).map((s) => s.trim());
    const p0 = rawParts[0] || '';
    const p1 = rawParts[1] || '';
    const vCandidate = parsed.village || p1;
    const dCandidate = parsed.district || p0;

    // 1. Coba pencarian via Nominatim OpenStreetMap untuk pasangan desa & kecamatan
    try {
      const nominatimUrl = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(
        `${vCandidate}, ${dCandidate}`
      )}&format=json&addressdetails=1&countrycodes=id&limit=3`;
      const nomRes = await fetchWithTimeout(nominatimUrl, 5000);
      if (nomRes.ok) {
        const nomData = await nomRes.json();
        if (Array.isArray(nomData) && nomData.length > 0) {
          const item = nomData[0];
          const lat = parseFloat(item.lat);
          const lon = parseFloat(item.lon);
          const addr = item.address || {};
          const county = addr.county || addr.city || addr.municipality;
          const state = addr.state || 'Indonesia';

          // Pertahankan nama desa dan kecamatan yang telah diparse dengan tepat
          const finalVillage = parsed.village || vCandidate;
          const finalDistrict = parsed.district || dCandidate;

          // Ambil elevasi presisi tinggi DEM
          let elev = 0;
          try {
            const eleRes = await fetchWithTimeout(
              `https://api.open-meteo.com/v1/elevation?latitude=${lat}&longitude=${lon}`,
              4000
            );
            if (eleRes.ok) {
              const eleData = await eleRes.json();
              if (Array.isArray(eleData?.elevation) && eleData.elevation.length > 0) {
                elev = Math.round(eleData.elevation[0]);
              }
            }
          } catch {}

          return [
            {
              name: `Desa ${finalVillage}`,
              village: finalVillage,
              district: finalDistrict,
              admin1: state,
              admin2: county ? String(county) : undefined,
              admin3: finalDistrict,
              latitude: lat,
              longitude: lon,
              elevation: elev,
              elevationCategory: getElevationCategory(elev),
              country: 'Indonesia',
              type: 'desa',
            },
          ];
        }
      }
    } catch {
      // Nominatim fallback ke Open-Meteo cross-matching
    }

    // 2. Pencarian silang (cross-matching) via Open-Meteo Geocoding
    try {
      const [vRes, dRes] = await Promise.allSettled([
        fetchWithTimeout(
          `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(
            vCandidate
          )}&count=10&language=id&countryCode=id`,
          5000
        ).then((r) => (r.ok ? r.json() : null)),
        fetchWithTimeout(
          `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(
            dCandidate
          )}&count=10&language=id&countryCode=id`,
          5000
        ).then((r) => (r.ok ? r.json() : null)),
      ]);

      const vList: Record<string, unknown>[] =
        vRes.status === 'fulfilled' && vRes.value?.results ? vRes.value.results : [];
      const dList: Record<string, unknown>[] =
        dRes.status === 'fulfilled' && dRes.value?.results ? dRes.value.results : [];

      if (vList.length > 0 && dList.length > 0) {
        let bestMatch: Record<string, unknown> | null = null;
        let matchedDistrictInfo: Record<string, unknown> | null = null;
        let minDistanceKm = 9999;

        for (const vItem of vList) {
          const vLat = Number(vItem.latitude) || 0;
          const vLon = Number(vItem.longitude) || 0;
          const vAdmin2 = String(vItem.admin2 || '').toLowerCase();

          for (const dItem of dList) {
            const dLat = Number(dItem.latitude) || 0;
            const dLon = Number(dItem.longitude) || 0;
            const dAdmin2 = String(dItem.admin2 || '').toLowerCase();

            // Hitung jarak geografis perkiraan (km)
            const distKm = Math.hypot(
              (vLat - dLat) * 111,
              (vLon - dLon) * 111 * Math.cos((dLat * Math.PI) / 180)
            );

            const isSameRegency = vAdmin2 && dAdmin2 && (vAdmin2.includes(dAdmin2) || dAdmin2.includes(vAdmin2));

            if ((isSameRegency || distKm < 35) && distKm < minDistanceKm) {
              minDistanceKm = distKm;
              bestMatch = vItem;
              matchedDistrictInfo = dItem;
            }
          }
        }

        if (bestMatch) {
          const elev = Math.round(Number(bestMatch.elevation) || 0);
          return [
            {
              name: `Desa ${bestMatch.name || vCandidate}`,
              village: String(bestMatch.name || vCandidate),
              district: String(matchedDistrictInfo?.name || dCandidate),
              admin1: String(bestMatch.admin1 || matchedDistrictInfo?.admin1 || 'Indonesia'),
              admin2: String(bestMatch.admin2 || matchedDistrictInfo?.admin2 || ''),
              admin3: String(matchedDistrictInfo?.name || dCandidate),
              latitude: Number(bestMatch.latitude) || 0,
              longitude: Number(bestMatch.longitude) || 0,
              elevation: elev,
              elevationCategory: getElevationCategory(elev),
              country: 'Indonesia',
              type: 'desa',
            },
          ];
        }
      }

      // Jika hanya daftar desa yang ditemukan
      if (vList.length > 0) {
        const first = vList[0];
        const elev = Math.round(Number(first.elevation) || 0);
        return [
          {
            name: `Desa ${first.name || vCandidate}`,
            village: String(first.name || vCandidate),
            district: dCandidate,
            admin1: first.admin1 ? String(first.admin1) : undefined,
            admin2: first.admin2 ? String(first.admin2) : undefined,
            admin3: dCandidate,
            latitude: Number(first.latitude) || 0,
            longitude: Number(first.longitude) || 0,
            elevation: elev,
            elevationCategory: getElevationCategory(elev),
            country: 'Indonesia',
            type: 'desa',
          },
        ];
      }
    } catch (err) {
      console.warn('[searchIndonesianLocations cross-match error]:', err);
    }
  }

  // 3. Pencarian lokasi tunggal
  const primaryName = parsed.cleanQuery || query.trim();

  try {
    const url = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(
      primaryName
    )}&count=15&language=id&countryCode=id`;
    const res = await fetchWithTimeout(url, 6000);
    if (!res.ok) return [];
    const data = await res.json();
    const list: Record<string, unknown>[] = data?.results || [];

    return list.slice(0, limit).map((r) => {
      const elevation = Math.round(Number(r.elevation) || 0);
      const rName = String(r.name || primaryName);

      const isExplicitDesa = Boolean(parsed.village);
      const isExplicitKec = Boolean(parsed.district);

      let isDesa = false;
      let isKec = false;

      if (isExplicitDesa) {
        isDesa = true;
      } else if (isExplicitKec) {
        isKec = true;
      } else if (
        r.feature_code === 'PPLA3' ||
        String(r.admin3 || '').toLowerCase().includes(rName.toLowerCase())
      ) {
        isKec = true;
      } else if (r.feature_code === 'PPLA2' || r.feature_code === 'PPLA') {
        isDesa = false;
        isKec = false;
      } else {
        isDesa = true;
      }

      return {
        name: rName,
        village: isDesa ? rName : undefined,
        district: isKec ? rName : undefined,
        admin1: r.admin1 ? String(r.admin1) : undefined,
        admin2: r.admin2 ? String(r.admin2) : undefined,
        admin3: r.admin3 ? String(r.admin3) : undefined,
        latitude: Number(r.latitude) || 0,
        longitude: Number(r.longitude) || 0,
        elevation,
        elevationCategory: getElevationCategory(elevation),
        country: r.country ? String(r.country) : 'Indonesia',
        type: isDesa ? 'desa' : isKec ? 'kecamatan' : 'kota',
      };
    });
  } catch (err) {
    console.warn('[searchIndonesianLocations] error:', err);
    return [];
  }
}

/**
 * 4. Ambil Prakiraan Cuaca Berdasarkan Elevasi (MDPL) Desa & Kecamatan
 * Memisahkan Desa dan Kecamatan secara akurat, mengambil cuaca riil non-dummy
 */
export async function getWeatherForecast(
  query: string,
  customElevation?: number
): Promise<WeatherForecast> {
  const parsed = parseLocationQuery(query);
  const explicitElevation = customElevation !== undefined ? customElevation : parsed.explicitElevation;

  const cleanSingle = parsed.cleanQuery.toLowerCase();

  // 1. Cek apakah cocok dengan database adm4 BMKG kota/kabupaten besar (jika bukan pencarian spesifik desa/pasangan)
  const matchedBmkg = !parsed.isPair ? BMKG_ADM4_MAP[cleanSingle] : undefined;

  if (matchedBmkg && explicitElevation === undefined) {
    try {
      const bmkgUrl = `https://api.bmkg.go.id/publik/prakiraan-cuaca?adm4=${matchedBmkg.code}`;
      const res = await fetchWithTimeout(bmkgUrl, 6000);
      if (res.ok) {
        const d = await res.json();
        const lokasi = d.lokasi;
        const cuacaList = d.data?.[0]?.cuaca;

        if (Array.isArray(cuacaList) && cuacaList.length > 0) {
          const flatSlots: Record<string, unknown>[] = [];
          for (const item of cuacaList) {
            if (Array.isArray(item)) {
              flatSlots.push(...(item as Record<string, unknown>[]));
            } else if (item && typeof item === 'object') {
              flatSlots.push(item as Record<string, unknown>);
            }
          }

          if (flatSlots.length > 0) {
            let stationElevation = 0;
            if (lokasi?.lat && lokasi?.lon) {
              try {
                const eleRes = await fetchWithTimeout(
                  `https://api.open-meteo.com/v1/elevation?latitude=${lokasi.lat}&longitude=${lokasi.lon}`,
                  4000
                );
                if (eleRes.ok) {
                  const eleData = await eleRes.json();
                  if (Array.isArray(eleData?.elevation) && eleData.elevation.length > 0) {
                    stationElevation = Math.round(eleData.elevation[0]);
                  }
                }
              } catch {}
            }

            const currentSlot = flatSlots[0];
            const current: WeatherSlot = {
              time: String(currentSlot.utc_datetime || currentSlot.datetime || ''),
              localDatetime: String(currentSlot.local_datetime || currentSlot.datetime || ''),
              condition: String(currentSlot.weather_desc || 'Berawan'),
              tempC: Math.round(Number(currentSlot.t) || 28),
              humidity: Math.round(Number(currentSlot.hu) || 75),
              windSpeedKmh: Math.round(Number(currentSlot.ws) || 10),
              windDir: String(currentSlot.wd || 'Var'),
              visibilityText: currentSlot.vs_text ? String(currentSlot.vs_text) : undefined,
              weatherCode: Number(currentSlot.weather) || 3,
            };

            const forecasts: WeatherSlot[] = flatSlots.slice(1, 6).map((s) => ({
              time: String(s.utc_datetime || s.datetime || ''),
              localDatetime: String(s.local_datetime || s.datetime || ''),
              condition: String(s.weather_desc || 'Berawan'),
              tempC: Math.round(Number(s.t) || 28),
              humidity: Math.round(Number(s.hu) || 75),
              windSpeedKmh: Math.round(Number(s.ws) || 10),
              windDir: String(s.wd || 'Var'),
              visibilityText: s.vs_text ? String(s.vs_text) : undefined,
              weatherCode: Number(s.weather) || 3,
            }));

            const elevDiff = Math.round(-0.6 * (stationElevation / 100) * 10) / 10;

            return {
              locationName: `${lokasi?.desa ? lokasi.desa + ', ' : ''}${lokasi?.kecamatan ? 'Kec. ' + lokasi.kecamatan : lokasi?.kotkab || matchedBmkg.label}`,
              village: lokasi?.desa,
              district: lokasi?.kecamatan,
              regency: lokasi?.kotkab,
              province: lokasi?.provinsi || 'Indonesia',
              elevation: stationElevation,
              elevationCategory: getElevationCategory(stationElevation),
              tempSeaLevelDiff: elevDiff,
              source: 'BMKG',
              current,
              forecasts,
            };
          }
        }
      }
    } catch (err) {
      console.warn('[BMKG Weather] Fallback to Geocoding & High-Resolution DEM:', err);
    }
  }

  // 2. Pencarian Desa & Kecamatan via Geocoding Indonesia
  const searchResults = await searchIndonesianLocations(query, 4, parsed);
  const loc = searchResults[0];

  if (!loc) {
    throw new Error(
      `Lokasi "${query}" tidak ditemukan.\n` +
      `💡 Format yang didukung:\n` +
      ` • /cuaca (kecamatan, desa) ➔ contoh: /cuaca (Lembang, Cikole)\n` +
      ` • /cuaca <desa>, <kecamatan> ➔ contoh: /cuaca Cikole, Lembang\n` +
      ` • /cuaca <desa> <angka>mdpl ➔ contoh: /cuaca Cikole 1400mdpl`
    );
  }

  const { latitude, longitude, name, admin1, admin2, country } = loc;
  const effectiveElevation =
    explicitElevation !== undefined ? explicitElevation : (loc.elevation || 0);

  // Ambil cuaca presisi resolusi tinggi secara live dengan &elevation=${effectiveElevation}
  // Model prakiraan secara otomatis menyesuaikan temperatur dan tekanan adiabatik vertikal sesuai MDPL desa
  const wUrl = `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&elevation=${effectiveElevation}&current=temperature_2m,relative_humidity_2m,apparent_temperature,precipitation,weather_code,wind_speed_10m,wind_direction_10m&hourly=temperature_2m,relative_humidity_2m,weather_code&timezone=auto`;

  const wRes = await fetchWithTimeout(wUrl, 7000);
  if (!wRes.ok) throw new Error('Gagal mengambil data cuaca riil dari server.');
  const wData = await wRes.json();

  const currentW = wData.current;
  const desc = getWeatherDescription(currentW.weather_code);

  const current: WeatherSlot = {
    time: currentW.time,
    localDatetime: currentW.time.replace('T', ' '),
    condition: desc,
    tempC: Math.round(currentW.temperature_2m),
    humidity: Math.round(currentW.relative_humidity_2m),
    windSpeedKmh: Math.round(currentW.wind_speed_10m),
    windDir: `${Math.round(currentW.wind_direction_10m)}°`,
    weatherCode: currentW.weather_code,
  };

  const hourlyTimes: string[] = wData.hourly?.time || [];
  const hourlyTemps: number[] = wData.hourly?.temperature_2m || [];
  const hourlyCodes: number[] = wData.hourly?.weather_code || [];
  const hourlyHum: number[] = wData.hourly?.relative_humidity_2m || [];

  const nowIdx = hourlyTimes.findIndex((t) => t >= currentW.time);
  const start = nowIdx >= 0 ? nowIdx + 2 : 1;
  const forecasts: WeatherSlot[] = [];

  for (let i = start; i < Math.min(start + 12, hourlyTimes.length); i += 3) {
    forecasts.push({
      time: hourlyTimes[i],
      localDatetime: hourlyTimes[i].replace('T', ' '),
      condition: getWeatherDescription(hourlyCodes[i]),
      tempC: Math.round(hourlyTemps[i]),
      humidity: Math.round(hourlyHum[i]),
      windSpeedKmh: Math.round(currentW.wind_speed_10m),
      windDir: '',
      weatherCode: hourlyCodes[i],
    });
  }

  // Selisih penurunan suhu terhadap ketinggian permukaan laut (0 mdpl) menurut Hukum Braak (0.6°C / 100m)
  const tempSeaLevelDiff = Math.round(-0.6 * (effectiveElevation / 100) * 10) / 10;
  const seaLevelTempEstimate = Math.round((current.tempC - tempSeaLevelDiff) * 10) / 10;

  const village = loc.village || (loc.type === 'desa' ? loc.name.replace(/^Desa\s+/i, '') : undefined);
  const district = loc.district || (loc.type === 'kecamatan' ? loc.name.replace(/^Kec\.?\s+/i, '') : undefined);

  let locationDisplayName = '';
  if (village && district) {
    locationDisplayName = `Desa ${village}, Kec. ${district}`;
  } else if (village) {
    locationDisplayName = `Desa ${village}`;
  } else if (district) {
    locationDisplayName = `Kec. ${district}`;
  } else {
    locationDisplayName = name;
  }

  return {
    locationName: locationDisplayName,
    village,
    district,
    regency: admin2,
    province: admin1 || country || 'Indonesia',
    elevation: effectiveElevation,
    elevationCategory: getElevationCategory(effectiveElevation),
    tempSeaLevelDiff,
    seaLevelTempEstimate,
    isCustomElevation: explicitElevation !== undefined && explicitElevation !== loc.elevation,
    source: 'Open-Meteo High-Resolution (Terkalibrasi DEM)',
    current,
    forecasts,
  };
}


/**
 * 5. Peringatan Dini Cuaca Maritim & Gelombang Laut BMKG
 */
export async function getMaritimeWarnings(filterRegion?: string): Promise<{
  regions: MaritimeRegionWarning[];
  summary: string;
}> {
  const res = await fetchWithTimeout('https://peta-maritim.bmkg.go.id/api/warning');
  if (!res.ok) throw new Error(`BMKG Maritim HTTP ${res.status}`);
  const json = await res.json();

  const regions: MaritimeRegionWarning[] = [];
  const entries = Object.entries(json as Record<string, { data?: Record<string, unknown> }>);
  for (const [key, val] of entries) {
    if (val?.data) {
      const d = val.data;
      const warningObj = (d.warning || {}) as Record<string, string[]>;
      regions.push({
        region: String(d.region || key),
        synoptic: String(d.synoptic || ''),
        validFrom: String(d.valid_from || ''),
        validUntil: String(d.valid_until || ''),
        timezone: String(d.time_zone || 'WIB'),
        warning: {
          sedang: warningObj.sedang || [],
          tinggi: warningObj.tinggi || [],
          sangatTinggi: warningObj.sangat_tinggi || [],
          ekstrem: warningObj.ekstrem || [],
        },
      });
    }
  }

  let filtered = regions;
  if (filterRegion) {
    const fLower = filterRegion.toLowerCase();
    filtered = regions.filter((r) => r.region.toLowerCase().includes(fLower));
  }

  const summary = `Terdeteksi ${regions.length} wilayah maritim di Indonesia dalam pemantauan BMKG.`;
  return { regions: filtered, summary };
}

/**
 * 6. Citra Satelit Cuaca Himawari-9 & Hotspot BMKG
 */
export async function getSatelliteImage(type: 'awan' | 'hujan' | 'hotspot'): Promise<{
  buffer: Buffer;
  caption: string;
  url: string;
}> {
  let url = '';
  let caption = '';

  if (type === 'awan') {
    url = 'https://inderaja.bmkg.go.id/IMAGE/HIMA/H08_EH_Indonesia.png';
    caption =
      '🛰️ *Citra Satelit Himawari-9 — Enhanced Infrared (IR) BMKG*\n' +
      'Menampilkan sebaran awan konvektif tebal dan potensi badai aktif di seluruh wilayah Indonesia.';
  } else if (type === 'hujan') {
    url = 'https://inderaja.bmkg.go.id/IMAGE/HIMA/H08_RP_Indonesia.png';
    caption =
      '🌧️ *Citra Satelit Potensi Hujan (Rain Potential) BMKG*\n' +
      'Peta sebaran intensitas curah hujan terkini (ringan, sedang, hingga lebat/ekstrem) se-Indonesia.';
  } else {
    url = 'https://inderaja.bmkg.go.id/IMAGE/HOTSPOT/Hotspot_Indonesia.png';
    caption =
      '🔥 *Peta Titik Panas (Hotspot) & Karhutla BMKG*\n' +
      'Pemantauan sebaran titik panas potensi kebakaran hutan dan lahan di wilayah Indonesia.';
  }

  const res = await fetchWithTimeout(url, 10000);
  if (!res.ok) throw new Error(`Gagal mengunduh citra satelit BMKG (${res.status})`);
  const arr = await res.arrayBuffer();
  return {
    buffer: Buffer.from(arr),
    caption,
    url,
  };
}

/**
 * 7. Kualitas Udara (PM2.5 / PM10 / AQI)
 */
export async function getAirQuality(query: string): Promise<AirQualityData> {
  const geoUrl = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(
    query
  )}&count=1&language=id`;
  const geoRes = await fetchWithTimeout(geoUrl, 5000);
  if (!geoRes.ok) throw new Error(`Gagal mencari koordinat "${query}"`);
  const geoData = await geoRes.json();
  const loc = geoData?.results?.[0];
  if (!loc) throw new Error(`Lokasi "${query}" tidak ditemukan.`);

  const { latitude, longitude, name, admin1 } = loc;
  const aqiUrl = `https://air-quality-api.open-meteo.com/v1/air-quality?latitude=${latitude}&longitude=${longitude}&current=pm10,pm2_5,european_aqi,us_aqi`;
  const aqiRes = await fetchWithTimeout(aqiUrl, 6000);
  if (!aqiRes.ok) throw new Error('Gagal mengambil data kualitas udara');
  const aqiData = await aqiRes.json();

  const pm25 = Math.round(Number(aqiData.current?.pm2_5) || 0);
  const pm10 = Math.round(Number(aqiData.current?.pm10) || 0);
  const aqi = Math.round(Number(aqiData.current?.us_aqi) || pm25 * 2);

  let status: AirQualityData['status'] = 'Baik';
  let statusColor = '🟢';
  let advisory = 'Kualitas udara sangat baik. Aman untuk beraktivitas luar ruangan.';

  if (aqi <= 50) {
    status = 'Baik';
    statusColor = '🟢';
    advisory = 'Kualitas udara sangat baik dan bersih. Aman untuk semua kalangan.';
  } else if (aqi <= 100) {
    status = 'Sedang';
    statusColor = '🟡';
    advisory = 'Kualitas udara dapat diterima. Kelompok sangat sensitif disarankan mengurangi aktivitas luar berat.';
  } else if (aqi <= 150) {
    status = 'Tidak Sehat Bagi Kelompok Sensitif';
    statusColor = '🟠';
    advisory = 'Orang dengan gangguan pernapasan/asma dan anak-anak sebaiknya membatasi aktivitas di luar.';
  } else if (aqi <= 200) {
    status = 'Tidak Sehat';
    statusColor = '🔴';
    advisory = 'Semua orang mulai merasakan dampaknya. Kenakan masker saat bepergian ke luar.';
  } else if (aqi <= 300) {
    status = 'Sangat Tidak Sehat';
    statusColor = '🟣';
    advisory = 'Peringatan kesehatan kondisi darurat. Hindari keluar rumah jika tidak mendesak.';
  } else {
    status = 'Berbahaya';
    statusColor = '🟤';
    advisory = 'Kondisi udara berbahaya bagi kesehatan seluruh populasi!';
  }

  return {
    location: `${name}${admin1 ? `, ${admin1}` : ''}`,
    pm25,
    pm10,
    aqi,
    status,
    statusColor,
    advisory,
  };
}

// ----------------------------------------------------
// Formatter Pesan WhatsApp
// ----------------------------------------------------

export function formatEarthquakeText(gempa: EarthquakeData, isAlert = false): string {
  const header = isAlert
    ? '🚨 *[PERINGATAN DINI GEMPABUMI BMKG]* 🚨\n_Pemberitahuan Otomatis Deteksi Gempa Baru_'
    : '🌍 *PEMBERITAHUAN GEMPABUMI TERKINI — BMKG*';

  const tsunamiNotice =
    gempa.Potensi.toLowerCase().includes('tidak berpotensi tsunami')
      ? '🟢 ' + gempa.Potensi
      : '⚠️ *' + gempa.Potensi + '*';

  const dirasakanSection = gempa.Dirasakan
    ? `\n📊 *Skala Dampak MMI:*\n${gempa.Dirasakan}\n`
    : '';

  return (
    `${header}\n` +
    `━━━━━━━━━━━━━━━━━━━━━\n` +
    `📅 *Waktu:* ${gempa.Tanggal} | ${gempa.Jam}\n` +
    `💥 *Kekuatan (Magnitude):* *${gempa.Magnitude} SR*\n` +
    `📏 *Kedalaman:* ${gempa.Kedalaman}\n` +
    `📍 *Koordinat:* ${gempa.Lintang} - ${gempa.Bujur}\n` +
    `📍 *Pusat Gempa:* ${gempa.Wilayah}\n` +
    `━━━━━━━━━━━━━━━━━━━━━\n` +
    `🌊 *Status Tsunami:* ${tsunamiNotice}\n` +
    dirasakanSection +
    `━━━━━━━━━━━━━━━━━━━━━\n` +
    `ℹ️ _Sumber resmi: BMKG Indonesia (Badan Meteorologi, Klimatologi, dan Geofisika)_`
  );
}

export function formatRecentEarthquakesText(list: EarthquakeData[]): string {
  if (!list || list.length === 0) {
    return 'ℹ️ Tidak ada data gempa M 5.0+ dalam catatan terbaru BMKG.';
  }

  const items = list.slice(0, 10).map((g, idx) => {
    return (
      `*${idx + 1}. Magnitudo ${g.Magnitude}* (${g.Tanggal} ${g.Jam})\n` +
      `   📍 ${g.Wilayah}\n` +
      `   📏 Kedalaman: ${g.Kedalaman} | ${g.Potensi}`
    );
  });

  return (
    `🌍 *DAFTAR 10 GEMPABUMI M 5.0+ TERKINI — BMKG*\n` +
    `━━━━━━━━━━━━━━━━━━━━━\n\n` +
    items.join('\n\n') +
    `\n\n━━━━━━━━━━━━━━━━━━━━━\n` +
    `Ketik \`!gempa\` untuk melihat shakemap gempa paling baru.`
  );
}

export function formatFeltEarthquakesText(list: EarthquakeData[]): string {
  if (!list || list.length === 0) {
    return 'ℹ️ Tidak ada data gempa dirasakan dalam catatan terbaru BMKG.';
  }

  const items = list.slice(0, 10).map((g, idx) => {
    return (
      `*${idx + 1}. Mag ${g.Magnitude}* (${g.Tanggal} ${g.Jam})\n` +
      `   📍 ${g.Wilayah} (Kedalaman: ${g.Kedalaman})\n` +
      `   📊 Dirasakan: _${g.Dirasakan || '-'}_`
    );
  });

  return (
    `💥 *DAFTAR 10 GEMPA DIRASAKAN TERBARU — BMKG*\n` +
    `━━━━━━━━━━━━━━━━━━━━━\n\n` +
    items.join('\n\n') +
    `\n\n━━━━━━━━━━━━━━━━━━━━━\n` +
    `Ketik \`!gempa\` untuk informasi gempa terkini dengan peta shakemap.`
  );
}

export function formatWeatherText(w: WeatherForecast): string {
  const icon = getWeatherIcon(w.current.condition);
  const elevation = w.elevation || 0;
  const elevFormatted = elevation.toLocaleString('id-ID');
  const cat = w.elevationCategory || getElevationCategory(elevation);

  const forecastRows = w.forecasts.slice(0, 4).map((f) => {
    const timeStr = f.localDatetime.split(' ')[1]?.slice(0, 5) || f.time.slice(11, 16);
    return ` • *${timeStr} WIB/Lokal:* ${f.condition} (${f.tempC}°C, 💧${f.humidity}%)`;
  });

  const diffText =
    w.tempSeaLevelDiff && Math.abs(w.tempSeaLevelDiff) > 0.3
      ? `📉 *Efek Suhu MDPL:* Lebih sejuk ~${Math.abs(w.tempSeaLevelDiff).toFixed(1)}°C dibanding pesisir pantai (0 mdpl)\n`
      : '';

  // Pemisahan tegas antara Desa dan Kecamatan
  let wilayahSection = '';
  if (w.village && w.district) {
    wilayahSection =
      `🏡 *Desa/Kelurahan:* *${w.village}*\n` +
      `🏢 *Kecamatan:* *Kec. ${w.district}*\n` +
      (w.regency ? `🏛️ *Kabupaten/Kota:* ${w.regency}\n` : '') +
      `🗺️ *Provinsi:* ${w.province || 'Indonesia'}\n`;
  } else if (w.village) {
    wilayahSection =
      `🏡 *Desa/Kelurahan:* *${w.village}*\n` +
      (w.district ? `🏢 *Kecamatan:* Kec. ${w.district}\n` : '') +
      (w.regency ? `🏛️ *Kabupaten/Kota:* ${w.regency}\n` : '') +
      `🗺️ *Provinsi:* ${w.province || 'Indonesia'}\n`;
  } else if (w.district) {
    wilayahSection =
      `🏢 *Kecamatan:* *Kec. ${w.district}* (Pusat Kecamatan)\n` +
      (w.regency ? `🏛️ *Kabupaten/Kota:* ${w.regency}\n` : '') +
      `🗺️ *Provinsi:* ${w.province || 'Indonesia'}\n`;
  } else {
    wilayahSection =
      `📍 *Lokasi:* *${w.locationName}*\n` +
      (w.regency ? `🏛️ *Kabupaten/Kota:* ${w.regency}\n` : '') +
      `🗺️ *Provinsi:* ${w.province || 'Indonesia'}\n`;
  }

  // Tips informatif jika hanya mencari nama kecamatan saja
  const districtOnlyTip =
    !w.village && w.district
      ? `\n💡 _Catatan: Setiap desa di Kec. ${w.district} memiliki ketinggian (MDPL) dan suhu yang berbeda (ada dataran rendah / sedang / tinggi)._\n` +
        `💡 _Untuk cek cuaca desa spesifik di kecamatan ini, ketik:_ \`/cuaca (${w.district}, <nama desa>)\`\n`
      : '';

  const customElevationNotice = w.isCustomElevation
    ? ` ⚠️ _(MDPL manual)_\n`
    : '\n';

  return (
    `⛅ *PRAKIRAAN CUACA RESMI BERDASARKAN ELEVASI (MDPL)*\n` +
    `━━━━━━━━━━━━━━━━━━━━━\n` +
    wilayahSection +
    `⛰️ *Ketinggian:* *${elevFormatted} mdpl* (${cat})${customElevationNotice}` +
    diffText +
    `📡 *Sumber Data:* ${w.source}\n` +
    `━━━━━━━━━━━━━━━━━━━━━\n` +
    `${icon} *Kondisi Saat Ini:* *${w.current.condition}*\n` +
    `🌡️ *Suhu Udara:* *${w.current.tempC}°C* (Disesuaikan elevasi riil ${elevFormatted} mdpl)\n` +
    `💧 *Kelembapan:* ${w.current.humidity}%\n` +
    `💨 *Angin:* ${w.current.windSpeedKmh} km/jam (${w.current.windDir})\n` +
    (w.current.visibilityText ? `👁️ *Jarak Pandang:* ${w.current.visibilityText}\n` : '') +
    `━━━━━━━━━━━━━━━━━━━━━\n` +
    `🕒 *Prakiraan Tiap Waktu (Sesuai Suhu MDPL):*\n` +
    forecastRows.join('\n') +
    `\n━━━━━━━━━━━━━━━━━━━━━\n` +
    districtOnlyTip +
    `💡 _Hukum Braak: Suhu udara rata-rata turun ±0.6°C setiap naik 100 meter (MDPL)._\n` +
    `💡 _Format Pencarian Desa Presisi:_\n` +
    ` • \`/cuaca (Kecamatan, Desa)\` ➔ contoh: \`/cuaca (Lembang, Cikole)\`\n` +
    ` • \`/cuaca <Desa>, <Kecamatan>\` ➔ contoh: \`/cuaca Cikole, Lembang\`\n` +
    ` • \`/cuaca <Desa> <angka>mdpl\` ➔ contoh: \`/cuaca Cikole 1400mdpl\``
  );
}

export function formatMaritimeText(data: { regions: MaritimeRegionWarning[] }): string {
  const tinggiList: { region: string; waters: string[] }[] = [];
  const sangatTinggiList: { region: string; waters: string[] }[] = [];
  const sedangList: { region: string; waters: string[] }[] = [];

  for (const r of data.regions) {
    if (r.warning.ekstrem && r.warning.ekstrem.length > 0) {
      sangatTinggiList.push({ region: r.region, waters: r.warning.ekstrem });
    }
    if (r.warning.sangatTinggi && r.warning.sangatTinggi.length > 0) {
      sangatTinggiList.push({ region: r.region, waters: r.warning.sangatTinggi });
    }
    if (r.warning.tinggi && r.warning.tinggi.length > 0) {
      tinggiList.push({ region: r.region, waters: r.warning.tinggi });
    }
    if (r.warning.sedang && r.warning.sedang.length > 0) {
      sedangList.push({ region: r.region, waters: r.warning.sedang });
    }
  }

  let body = '';

  if (sangatTinggiList.length > 0) {
    body += `🚨 *GELOMBANG SANGAT TINGGI (4.0 - 6.0 m)*\n`;
    for (const item of sangatTinggiList.slice(0, 4)) {
      body += ` • *${item.region}:* ${item.waters.slice(0, 3).join(', ')}\n`;
    }
    body += '\n';
  }

  if (tinggiList.length > 0) {
    body += `⚠️ *GELOMBANG TINGGI (2.5 - 4.0 m)*\n`;
    for (const item of tinggiList.slice(0, 5)) {
      body += ` • *${item.region}:* ${item.waters.slice(0, 3).join(', ')}\n`;
    }
    body += '\n';
  }

  if (sedangList.length > 0) {
    body += `🌊 *GELOMBANG SEDANG (1.25 - 2.50 m)*\n`;
    for (const item of sedangList.slice(0, 4)) {
      body += ` • *${item.region}:* ${item.waters.slice(0, 2).join(', ')}\n`;
    }
  }

  return (
    `🌊 *PERINGATAN DINI CUACA MARITIM & GELOMBANG BMKG*\n` +
    `Status: AKTIF | Sumber: Peta Maritim BMKG\n` +
    `━━━━━━━━━━━━━━━━━━━━━\n\n` +
    body +
    `\n━━━━━━━━━━━━━━━━━━━━━\n` +
    `⚠️ *Himbauan Keselamatan BMKG:*\n` +
    `• Perahu Nelayan: Waspada angin >15 knot, gelombang >1.25 m\n` +
    `• Kapal Tongkang: Waspada angin >16 knot, gelombang >1.5 m\n` +
    `• Kapal Ferry: Waspada angin >21 knot, gelombang >2.5 m\n` +
    `• Kapal Kargo/Besar: Waspada gelombang >4.0 m`
  );
}

export function formatAirQualityText(aq: AirQualityData): string {
  return (
    `🍃 *KUALITAS UDARA & PM2.5*\n` +
    `📍 *Lokasi:* ${aq.location}\n` +
    `━━━━━━━━━━━━━━━━━━━━━\n` +
    `${aq.statusColor} *Indeks Kualitas Udara (AQI):* *${aq.aqi}*\n` +
    `🏷️ *Status:* *${aq.status}*\n` +
    `🔬 *Partikulat PM2.5:* ${aq.pm25} µg/m³\n` +
    `🔬 *Partikulat PM10:* ${aq.pm10} µg/m³\n` +
    `━━━━━━━━━━━━━━━━━━━━━\n` +
    `💡 *Saran Kesehatan:*\n${aq.advisory}\n` +
    `━━━━━━━━━━━━━━━━━━━━━\n` +
    `⚡ _Data diperbarui secara real-time via sensor stasiun pemantau._`
  );
}

export function formatBmkgMenuText(prefix: string): string {
  return (
    `🌋 *PUSAT PANTAUAN BMKG & BENCANA ALAM*\n` +
    `Status: LIVE ONLINE 🟢 | Prefix: [ ${prefix} ]\n` +
    `━━━━━━━━━━━━━━━━━━━━━\n\n` +
    `🌍 *1. GEMPABUMI*\n` +
    `• \`${prefix}gempa\` : Gempa bumi terkini M >= 5.0 + Peta Shakemap BMKG\n` +
    `• \`${prefix}gempa5m\` : Daftar 10 gempa bumi M 5.0+ terbaru\n` +
    `• \`${prefix}dirasakan\` : Daftar 10 gempa yang dirasakan masyarakat\n\n` +
    `⛅ *2. CUACA & KUALITAS UDARA*\n` +
    `• \`${prefix}cuaca (kecamatan, desa)\` : Cek ramalan cuaca presisi desa (contoh: \`${prefix}cuaca (Lembang, Cikole)\`)\n` +
    `• \`${prefix}cuaca <desa/kecamatan>\` : Cek cuaca desa/kecamatan (contoh: \`${prefix}cuaca Cikole, Lembang\`, \`${prefix}cuaca Dieng\`)\n` +
    `• \`${prefix}udara <kota>\` : Cek indeks polusi & partikulat PM2.5/AQI\n\n` +
    `🛰️ *3. CITRA SATELIT & DETEKSI BENCANA*\n` +
    `• \`${prefix}satelit\` : Citra Satelit Himawari-9 Awan & Badai\n` +
    `• \`${prefix}satelit hujan\` : Peta Satelit Potensi Curah Hujan BMKG\n` +
    `• \`${prefix}hotspot\` : Peta Titik Panas & Potensi Karhutla\n\n` +
    `🌊 *4. CUACA LAUT & MARITIM*\n` +
    `• \`${prefix}gelombang\` : Peringatan dini gelombang tinggi perairan Indonesia\n` +
    `• \`${prefix}maritim\` : Info cuaca maritim & keselamatan berlayar\n\n` +
    `━━━━━━━━━━━━━━━━━━━━━\n` +
    `⚡ _Data resmi langsung dari server BMKG & sensor presisi elevasi DEM._`
  );
}

function getWeatherDescription(code: number): string {
  switch (code) {
    case 0:
      return 'Cerah';
    case 1:
      return 'Cerah Berawan';
    case 2:
      return 'Sebagian Berawan';
    case 3:
      return 'Berawan';
    case 45:
    case 48:
      return 'Berkabut';
    case 51:
    case 53:
    case 55:
      return 'Gerimis';
    case 61:
      return 'Hujan Ringan';
    case 63:
      return 'Hujan Sedang';
    case 65:
      return 'Hujan Lebat';
    case 80:
    case 81:
    case 82:
      return 'Hujan Deras / Showers';
    case 95:
      return 'Badai Petir';
    case 96:
    case 99:
      return 'Badai Petir Lebat';
    default:
      return 'Berawan';
  }
}

function getWeatherIcon(condition: string): string {
  const c = condition.toLowerCase();
  if (c.includes('petir') || c.includes('badai')) return '⛈️';
  if (c.includes('deras') || c.includes('lebat')) return '🌧️';
  if (c.includes('hujan') || c.includes('gerimis')) return '🌦️';
  if (c.includes('kabut')) return '🌫️';
  if (c.includes('cerah berawan') || c.includes('sebagian')) return '⛅';
  if (c.includes('cerah')) return '☀️';
  return '☁️';
}
