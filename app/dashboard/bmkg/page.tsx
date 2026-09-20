'use client';

import React, { useState, useEffect } from 'react';
import {
  Activity,
  CloudRain,
  Waves,
  RefreshCw,
  Search,
  Send,
  Radio,
  Wind,
  Droplets,
  Eye,
  ShieldAlert,
  Compass,
  ExternalLink,
  Layers,
  Mountain,
  Sliders,
  Sparkles,
  MapPin,
} from 'lucide-react';

interface GempaData {
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

interface WeatherSlot {
  time: string;
  localDatetime: string;
  condition: string;
  tempC: number;
  humidity: number;
  windSpeedKmh: number;
  windDir: string;
  visibilityText?: string;
}

interface WeatherData {
  locationName: string;
  village?: string;
  district?: string;
  regency?: string;
  province?: string;
  elevation?: number;
  elevationCategory?: string;
  tempSeaLevelDiff?: number;
  seaLevelTempEstimate?: number;
  isCustomElevation?: boolean;
  source: string;
  current: WeatherSlot;
  forecasts: WeatherSlot[];
}

interface LocationSuggestion {
  name: string;
  admin1?: string;
  admin2?: string;
  admin3?: string;
  latitude: number;
  longitude: number;
  elevation: number;
  elevationCategory: string;
  country?: string;
  type?: string;
}

interface MaritimeWarningRegion {
  region: string;
  synoptic: string;
  validFrom: string;
  validUntil: string;
  timezone: string;
  warning: {
    sedang?: string[];
    tinggi?: string[];
    sangatTinggi?: string[];
    ekstrem?: string[];
  };
}

interface AirData {
  location: string;
  pm25: number;
  pm10: number;
  aqi: number;
  status: string;
  statusColor: string;
  advisory: string;
}

export default function BmkgDashboardPage() {
  const [activeTab, setActiveTab] = useState<'gempa' | 'cuaca' | 'satelit' | 'maritim'>('gempa');
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Data states
  const [latestGempa, setLatestGempa] = useState<GempaData | null>(null);
  const [recentGempaList, setRecentGempaList] = useState<GempaData[]>([]);
  const [feltGempaList, setFeltGempaList] = useState<GempaData[]>([]);
  const [weatherData, setWeatherData] = useState<WeatherData | null>(null);
  const [airData, setAirData] = useState<AirData | null>(null);
  const [maritimeList, setMaritimeList] = useState<MaritimeWarningRegion[]>([]);
  const [maritimeFilter, setMaritimeFilter] = useState('');

  // Cuaca search state & Desa/Kecamatan MDPL
  const [cityInput, setCityInput] = useState('Jakarta');
  const [searchingCity, setSearchingCity] = useState(false);
  const [selectedElevation, setSelectedElevation] = useState<number | null>(null);
  const [sliderElevation, setSliderElevation] = useState<number>(0);
  const [suggestions, setSuggestions] = useState<LocationSuggestion[]>([]);
  const [isSearchingSuggestions, setIsSearchingSuggestions] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);

  // Satelit subtab
  const [satelitType, setSatelitType] = useState<'awan' | 'hujan' | 'hotspot'>('awan');

  // Broadcast modal / test send
  const [sendTargetJid, setSendTargetJid] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [sendResultMsg, setSendResultMsg] = useState<{ text: string; isError?: boolean } | null>(null);

  const fetchInitialData = async () => {
    setIsRefreshing(true);
    try {
      // 1. Fetch Summary
      const resSummary = await fetch('/api/bmkg?type=summary&q=' + encodeURIComponent(cityInput));
      const jsonSummary = await resSummary.json();
      if (jsonSummary.success && jsonSummary.data) {
        if (jsonSummary.data.earthquake) setLatestGempa(jsonSummary.data.earthquake);
        if (jsonSummary.data.weather) setWeatherData(jsonSummary.data.weather);
      }

      // 2. Fetch Earthquakes detail
      const resEq = await fetch('/api/bmkg?type=earthquakes');
      const jsonEq = await resEq.json();
      if (jsonEq.success && jsonEq.data) {
        if (jsonEq.data.recent) setRecentGempaList(jsonEq.data.recent);
        if (jsonEq.data.felt) setFeltGempaList(jsonEq.data.felt);
      }

      // 3. Fetch Maritime
      const resMaritime = await fetch('/api/bmkg?type=maritime');
      const jsonMaritime = await resMaritime.json();
      if (jsonMaritime.success && jsonMaritime.data?.regions) {
        setMaritimeList(jsonMaritime.data.regions);
      }

      // 4. Fetch Air
      const resAir = await fetch('/api/bmkg?type=air&q=' + encodeURIComponent(cityInput));
      const jsonAir = await resAir.json();
      if (jsonAir.success && jsonAir.data) {
        setAirData(jsonAir.data);
      }
    } catch (e) {
      console.error('Error fetching BMKG data:', e);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    let isSubscribed = true;

    async function load() {
      try {
        const [resSummary, resEq, resMaritime, resAir] = await Promise.all([
          fetch('/api/bmkg?type=summary&q=Jakarta'),
          fetch('/api/bmkg?type=earthquakes'),
          fetch('/api/bmkg?type=maritime'),
          fetch('/api/bmkg?type=air&q=Jakarta'),
        ]);

        const [jsonSummary, jsonEq, jsonMaritime, jsonAir] = await Promise.all([
          resSummary.json(),
          resEq.json(),
          resMaritime.json(),
          resAir.json(),
        ]);

        if (isSubscribed) {
          if (jsonSummary.success && jsonSummary.data) {
            if (jsonSummary.data.earthquake) setLatestGempa(jsonSummary.data.earthquake);
            if (jsonSummary.data.weather) setWeatherData(jsonSummary.data.weather);
          }
          if (jsonEq.success && jsonEq.data) {
            if (jsonEq.data.recent) setRecentGempaList(jsonEq.data.recent);
            if (jsonEq.data.felt) setFeltGempaList(jsonEq.data.felt);
          }
          if (jsonMaritime.success && jsonMaritime.data?.regions) {
            setMaritimeList(jsonMaritime.data.regions);
          }
          if (jsonAir.success && jsonAir.data) {
            setAirData(jsonAir.data);
          }
          setIsLoading(false);
        }
      } catch (err) {
        console.error('Initial load error:', err);
        if (isSubscribed) setIsLoading(false);
      }
    }

    load();

    return () => {
      isSubscribed = false;
    };
  }, []);

  // Debounce autocomplete pencarian desa dan kecamatan
  useEffect(() => {
    if (!cityInput || cityInput.trim().length < 2) {
      return;
    }
    const timer = setTimeout(async () => {
      setIsSearchingSuggestions(true);
      try {
        const res = await fetch('/api/bmkg?type=search_locations&q=' + encodeURIComponent(cityInput));
        const json = await res.json();
        if (json.success && Array.isArray(json.data)) {
          setSuggestions(json.data);
        }
      } catch (err) {
        console.error('Failed to search locations:', err);
      } finally {
        setIsSearchingSuggestions(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [cityInput]);

  const handleSelectSuggestion = (item: LocationSuggestion) => {
    const formatted = item.name + (item.admin2 ? `, ${item.admin2}` : item.admin1 ? `, ${item.admin1}` : '');
    setCityInput(formatted);
    setShowSuggestions(false);
    setSelectedElevation(item.elevation);
    setSliderElevation(item.elevation);
    handleSearchWeather(item.name, item.elevation);
  };

  const handleSearchWeather = async (target?: string, customElev?: number) => {
    const query = target || cityInput;
    if (!query.trim()) return;
    setSearchingCity(true);
    setShowSuggestions(false);
    const elev = customElev !== undefined ? customElev : selectedElevation;
    try {
      const elevParam = elev !== null && elev !== undefined ? `&elevation=${elev}` : '';
      const [wRes, aRes] = await Promise.all([
        fetch('/api/bmkg?type=weather&q=' + encodeURIComponent(query) + elevParam),
        fetch('/api/bmkg?type=air&q=' + encodeURIComponent(query)),
      ]);
      const wJson = await wRes.json();
      const aJson = await aRes.json();
      if (wJson.success && wJson.data) {
        setWeatherData(wJson.data);
        const actualElev = wJson.data.elevation || 0;
        setSelectedElevation(actualElev);
        setSliderElevation(actualElev);
      }
      if (aJson.success && aJson.data) setAirData(aJson.data);
    } catch (err) {
      console.error('Search error:', err);
    } finally {
      setSearchingCity(false);
    }
  };

  const handleSendToWhatsApp = async (action: 'sendEarthquakeAlert' | 'sendWeatherReport') => {
    if (!sendTargetJid.trim()) {
      setSendResultMsg({ text: 'Masukkan nomor WhatsApp penerima (contoh: 081234567890)', isError: true });
      return;
    }
    setIsSending(true);
    setSendResultMsg(null);
    try {
      const res = await fetch('/api/bmkg', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action,
          targetJid: sendTargetJid,
          city: cityInput,
          elevation: selectedElevation || weatherData?.elevation,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setSendResultMsg({ text: data.message });
      } else {
        setSendResultMsg({ text: data.error || 'Gagal mengirim pesan', isError: true });
      }
    } catch (err: unknown) {
      const errMsg = err instanceof Error ? err.message : 'Koneksi gagal';
      setSendResultMsg({ text: errMsg, isError: true });
    } finally {
      setIsSending(false);
      setTimeout(() => setSendResultMsg(null), 5000);
    }
  };

  const filteredMaritime = maritimeList.filter((m) =>
    maritimeFilter ? m.region.toLowerCase().includes(maritimeFilter.toLowerCase()) : true
  );

  return (
    <div className="space-y-6">
      {/* Header Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-mono text-circuit-400 uppercase tracking-wider mb-1">
            <Radio className="w-3.5 h-3.5 animate-pulse text-live-400" />
            <span>Pusat Komando Bencana &amp; BMKG Feed §Real-time</span>
          </div>
          <h1 className="font-display font-bold text-2xl sm:text-3xl text-white tracking-tight">
            Pusat Pantauan BMKG &amp; Bencana Alam
          </h1>
          <p className="text-xs sm:text-sm text-gray-400 mt-1 max-w-2xl">
            Integrasi langsung dengan server resmi Badan Meteorologi, Klimatologi, dan Geofisika (BMKG Indonesia) untuk memantau gempa bumi, prakiraan cuaca, citra satelit Himawari-9, peringatan maritim, dan karhutla.
          </p>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-panel-900 border border-panel-750 text-xs">
            <span className="w-2 h-2 rounded-full bg-live-400 animate-ping" />
            <span className="font-mono text-gray-300">BMKG API: ONLINE</span>
          </div>
          <button
            onClick={fetchInitialData}
            disabled={isRefreshing}
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-circuit-500/20 text-circuit-300 border border-circuit-500/40 hover:bg-circuit-500/30 text-xs font-medium transition-all"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />
            <span>{isRefreshing ? 'Sinkronisasi...' : 'Segarkan Data'}</span>
          </button>
        </div>
      </div>

      {/* Main Tab Navigation */}
      <div className="flex items-center gap-2 border-b border-panel-750 pb-2 overflow-x-auto">
        <button
          onClick={() => setActiveTab('gempa')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold whitespace-nowrap transition-all ${
            activeTab === 'gempa'
              ? 'bg-circuit-500 text-white shadow-lg shadow-circuit-500/25'
              : 'text-gray-400 hover:text-white hover:bg-panel-800'
          }`}
        >
          <Activity className="w-4 h-4" />
          <span>Gempa Bumi &amp; Tsunami</span>
          {latestGempa && (
            <span className="px-1.5 py-0.5 rounded text-[10px] bg-black/30 text-white font-mono">
              M {latestGempa.Magnitude}
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab('cuaca')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold whitespace-nowrap transition-all ${
            activeTab === 'cuaca'
              ? 'bg-circuit-500 text-white shadow-lg shadow-circuit-500/25'
              : 'text-gray-400 hover:text-white hover:bg-panel-800'
          }`}
        >
          <CloudRain className="w-4 h-4" />
          <span>Cuaca &amp; Kualitas Udara</span>
          {weatherData && (
            <span className="px-1.5 py-0.5 rounded text-[10px] bg-black/30 text-white font-mono">
              {weatherData.current.tempC}°C
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab('satelit')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold whitespace-nowrap transition-all ${
            activeTab === 'satelit'
              ? 'bg-circuit-500 text-white shadow-lg shadow-circuit-500/25'
              : 'text-gray-400 hover:text-white hover:bg-panel-800'
          }`}
        >
          <Layers className="w-4 h-4" />
          <span>Citra Satelit &amp; Karhutla</span>
        </button>

        <button
          onClick={() => setActiveTab('maritim')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold whitespace-nowrap transition-all ${
            activeTab === 'maritim'
              ? 'bg-circuit-500 text-white shadow-lg shadow-circuit-500/25'
              : 'text-gray-400 hover:text-white hover:bg-panel-800'
          }`}
        >
          <Waves className="w-4 h-4" />
          <span>Cuaca Maritim &amp; Gelombang</span>
          <span className="px-1.5 py-0.5 rounded text-[10px] bg-black/30 text-white font-mono">
            {maritimeList.length} Wilayah
          </span>
        </button>
      </div>

      {/* Quick Broadcast Box for WhatsApp testing */}
      <div className="p-4 rounded-xl bg-panel-900 border border-panel-750 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2.5 text-xs text-gray-300">
          <Send className="w-4 h-4 text-circuit-400 shrink-0" />
          <div>
            <span className="font-semibold text-white">Uji Kirim WhatsApp:</span>{' '}
            <span>Kirim infografis data BMKG langsung ke nomor atau grup WhatsApp Anda.</span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <input
            type="text"
            placeholder="Nomor WA (contoh: 081234567890)"
            value={sendTargetJid}
            onChange={(e) => setSendTargetJid(e.target.value)}
            className="px-3 py-1.5 text-xs rounded-lg bg-panel-800 border border-panel-700 text-white placeholder-gray-500 focus:outline-none focus:border-circuit-500 w-52"
          />
          <button
            onClick={() => handleSendToWhatsApp(activeTab === 'cuaca' ? 'sendWeatherReport' : 'sendEarthquakeAlert')}
            disabled={isSending}
            className="px-3 py-1.5 rounded-lg bg-circuit-500 text-white text-xs font-medium hover:bg-circuit-600 disabled:opacity-50 transition-all shrink-0"
          >
            {isSending ? 'Mengirim...' : activeTab === 'cuaca' ? 'Kirim Cuaca' : 'Kirim Shakemap'}
          </button>
        </div>
      </div>

      {sendResultMsg && (
        <div
          className={`p-3 rounded-xl text-xs font-medium ${
            sendResultMsg.isError
              ? 'bg-alert-500/20 text-alert-400 border border-alert-500/40'
              : 'bg-live-400/20 text-live-300 border border-live-400/40'
          }`}
        >
          {sendResultMsg.text}
        </div>
      )}

      {isLoading ? (
        <div className="py-20 text-center space-y-3 bg-panel-900 rounded-2xl border border-panel-750">
          <RefreshCw className="w-8 h-8 text-circuit-400 animate-spin mx-auto" />
          <div className="text-sm font-bold text-white">Menghubungkan ke Server BMKG...</div>
          <p className="text-xs text-gray-400">Mengambil data gempa terkini, infografis Shakemap, radar satelit Himawari-9, dan stasiun cuaca.</p>
        </div>
      ) : (
        <>
          {/* TAB 1: GEMPA BUMI */}
          {activeTab === 'gempa' && (
            <div className="space-y-6">
          {/* Main Hero Card: AutoGempa Terkini */}
          {latestGempa ? (
            <div className="rounded-2xl border border-panel-750 bg-panel-900 p-6 relative overflow-hidden shadow-xl">
              <div className="absolute top-0 right-0 w-80 h-80 bg-linear-to-bl from-alert-500/10 via-transparent to-transparent pointer-events-none" />

              <div className="flex flex-col lg:flex-row items-start justify-between gap-6">
                <div className="flex-1 space-y-4">
                  <div className="flex items-center gap-2">
                    <span className="px-2.5 py-1 rounded-md text-xs font-mono font-bold bg-alert-500/20 text-alert-400 border border-alert-500/30 uppercase flex items-center gap-1.5">
                      <Radio className="w-3.5 h-3.5 animate-pulse" />
                      Gempa Bumi Terkini BMKG (Real-Time)
                    </span>
                    <span className="text-xs text-gray-400 font-mono">
                      {latestGempa.Tanggal} • {latestGempa.Jam}
                    </span>
                  </div>

                  <div>
                    <div className="flex items-baseline gap-3">
                      <span className="text-4xl sm:text-5xl font-black font-display text-white tracking-tight">
                        M {latestGempa.Magnitude}
                      </span>
                      <span className="text-sm font-semibold text-alert-400">Skala Richter (SR)</span>
                    </div>
                    <h2 className="text-lg sm:text-xl font-bold text-gray-100 mt-2">
                      {latestGempa.Wilayah}
                    </h2>
                  </div>

                  {/* Badges Grid */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
                    <div className="p-3 rounded-xl bg-panel-800 border border-panel-700">
                      <div className="text-[11px] text-gray-400 font-mono uppercase">Kedalaman</div>
                      <div className="text-sm font-bold text-white mt-0.5">{latestGempa.Kedalaman}</div>
                    </div>
                    <div className="p-3 rounded-xl bg-panel-800 border border-panel-700">
                      <div className="text-[11px] text-gray-400 font-mono uppercase">Koordinat</div>
                      <div className="text-sm font-bold text-white mt-0.5 font-mono">
                        {latestGempa.Lintang} - {latestGempa.Bujur}
                      </div>
                    </div>
                    <div className="p-3 rounded-xl bg-panel-800 border border-panel-700 col-span-2">
                      <div className="text-[11px] text-gray-400 font-mono uppercase">Potensi Tsunami</div>
                      <div
                        className={`text-sm font-bold mt-0.5 ${
                          latestGempa.Potensi.toLowerCase().includes('tidak')
                            ? 'text-live-400'
                            : 'text-alert-400 animate-pulse'
                        }`}
                      >
                        {latestGempa.Potensi}
                      </div>
                    </div>
                  </div>

                  {/* Impact MMI if available */}
                  {latestGempa.Dirasakan && (
                    <div className="p-3.5 rounded-xl bg-panel-800/80 border border-panel-700">
                      <div className="text-xs font-semibold text-circuit-400 flex items-center gap-1.5 mb-1">
                        <Activity className="w-3.5 h-3.5" />
                        <span>Wilayah &amp; Skala Intensitas MMI yang Merasakan:</span>
                      </div>
                      <div className="text-xs text-gray-200 leading-relaxed font-sans">
                        {latestGempa.Dirasakan}
                      </div>
                    </div>
                  )}

                  <div className="text-[11px] text-gray-500 font-mono">
                    Data bersumber langsung dari TEWS (Tsunami Early Warning System) BMKG Indonesia.
                  </div>
                </div>

                {/* Shakemap Image Preview */}
                {latestGempa.shakemapUrl ? (
                  <div className="w-full lg:w-72 shrink-0 rounded-xl overflow-hidden border border-panel-700 bg-black/40 flex flex-col">
                    <div className="p-2 bg-panel-800 text-[11px] font-mono text-gray-300 border-b border-panel-700 flex items-center justify-between">
                      <span>PETA GUNCANGAN (SHAKEMAP)</span>
                      <span className="text-[10px] text-circuit-400">BMKG RESMI</span>
                    </div>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={latestGempa.shakemapUrl}
                      alt="Shakemap BMKG"
                      className="w-full h-auto object-cover hover:scale-105 transition-transform duration-300"
                    />
                    <a
                      href={latestGempa.shakemapUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-2 text-center text-[11px] text-circuit-400 hover:text-white bg-panel-800 border-t border-panel-700 flex items-center justify-center gap-1"
                    >
                      <ExternalLink className="w-3 h-3" />
                      <span>Buka Resolusi Penuh</span>
                    </a>
                  </div>
                ) : (
                  <div className="w-full lg:w-72 h-48 rounded-xl bg-panel-800 border border-panel-700 flex items-center justify-center text-xs text-gray-500">
                    Peta shakemap belum tersedia
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="p-8 text-center text-gray-400 bg-panel-900 rounded-2xl border border-panel-750">
              Sedang mengambil data gempa terkini dari BMKG...
            </div>
          )}

          {/* Two Columns: Recent M5.0+ and Felt Earthquakes */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* List 1: Gempa M >= 5.0 */}
            <div className="p-5 rounded-2xl bg-panel-900 border border-panel-750 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 font-display font-bold text-base text-white">
                  <ShieldAlert className="w-4 h-4 text-alert-400" />
                  <span>10 Gempa Bumi Terkini M 5.0+</span>
                </div>
                <span className="text-xs text-gray-400 font-mono">15 Terdata</span>
              </div>

              <div className="space-y-2.5 max-h-96 overflow-y-auto pr-1">
                {recentGempaList.slice(0, 10).map((g, idx) => (
                  <div
                    key={idx}
                    className="p-3 rounded-xl bg-panel-800 border border-panel-700 hover:border-circuit-500/50 transition-all"
                  >
                    <div className="flex items-center justify-between text-xs">
                      <span className="px-2 py-0.5 rounded font-mono font-bold bg-alert-500/20 text-alert-400">
                        M {g.Magnitude}
                      </span>
                      <span className="text-gray-400 font-mono text-[11px]">
                        {g.Tanggal} • {g.Jam}
                      </span>
                    </div>
                    <div className="text-xs font-semibold text-white mt-1.5">{g.Wilayah}</div>
                    <div className="text-[11px] text-gray-400 font-mono mt-0.5 flex items-center gap-3">
                      <span>Kedalaman: {g.Kedalaman}</span>
                      <span className="text-live-400">{g.Potensi}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* List 2: Gempa Dirasakan */}
            <div className="p-5 rounded-2xl bg-panel-900 border border-panel-750 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 font-display font-bold text-base text-white">
                  <Activity className="w-4 h-4 text-circuit-400" />
                  <span>10 Gempa Dirasakan Terbaru</span>
                </div>
                <span className="text-xs text-gray-400 font-mono">15 Terdata</span>
              </div>

              <div className="space-y-2.5 max-h-96 overflow-y-auto pr-1">
                {feltGempaList.slice(0, 10).map((g, idx) => (
                  <div
                    key={idx}
                    className="p-3 rounded-xl bg-panel-800 border border-panel-700 hover:border-circuit-500/50 transition-all"
                  >
                    <div className="flex items-center justify-between text-xs">
                      <span className="px-2 py-0.5 rounded font-mono font-bold bg-circuit-500/20 text-circuit-300">
                        M {g.Magnitude}
                      </span>
                      <span className="text-gray-400 font-mono text-[11px]">
                        {g.Tanggal} • {g.Jam}
                      </span>
                    </div>
                    <div className="text-xs font-semibold text-white mt-1.5">{g.Wilayah}</div>
                    {g.Dirasakan && (
                      <div className="text-[11px] text-gray-300 mt-1 italic bg-panel-850 px-2 py-1 rounded">
                        Skala MMI: {g.Dirasakan}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: CUACA & KUALITAS UDARA */}
      {activeTab === 'cuaca' && (
        <div className="space-y-6">
          {/* City & Village Search Bar with Dropdown Suggestions */}
          <div className="p-5 rounded-2xl bg-panel-900 border border-panel-750 space-y-4 relative">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs font-mono text-circuit-400 uppercase font-semibold">
                <Mountain className="w-4 h-4" />
                <span>Pencarian Desa, Kecamatan &amp; Elevasi Suhu (MDPL)</span>
              </div>
              <span className="text-[11px] text-gray-400 font-mono hidden sm:inline">
                Hukum Braak: Suhu turun ~0.6°C / 100 mdpl
              </span>
            </div>

            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 relative">
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Ketik nama desa & kecamatan, contoh: (Lembang, Cikole), Cikole Lembang, Dieng..."
                  value={cityInput}
                  onChange={(e) => {
                    const val = e.target.value;
                    setCityInput(val);
                    if (val.trim().length < 2) {
                      setSuggestions([]);
                    }
                    setShowSuggestions(true);
                  }}
                  onFocus={() => setShowSuggestions(true)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSearchWeather()}
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-panel-800 border border-panel-700 text-white placeholder-gray-500 text-xs sm:text-sm focus:outline-none focus:border-circuit-500"
                />

                {/* Autocomplete Suggestions Dropdown */}
                {showSuggestions && cityInput.trim().length >= 2 && (suggestions.length > 0 || isSearchingSuggestions) && (
                  <div className="absolute top-full left-0 right-0 mt-2 bg-panel-850 border border-panel-700 rounded-xl shadow-2xl overflow-hidden z-40 max-h-72 overflow-y-auto divide-y divide-panel-750 backdrop-blur-md">
                    {isSearchingSuggestions && (
                      <div className="p-3 text-xs text-gray-400 flex items-center gap-2">
                        <RefreshCw className="w-3.5 h-3.5 animate-spin text-circuit-400" />
                        <span>Mencari desa dan data ketinggian MDPL...</span>
                      </div>
                    )}
                    {suggestions.map((item, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => handleSelectSuggestion(item)}
                        className="w-full text-left p-3 hover:bg-panel-750 transition-colors flex items-center justify-between gap-3 text-xs"
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <MapPin className="w-3.5 h-3.5 text-circuit-400 shrink-0" />
                          <div className="truncate">
                            <span className="font-semibold text-white">{item.name}</span>
                            <span className="text-gray-400 text-[11px] ml-1.5">
                              {item.admin2 ? `${item.admin2}, ` : ''}{item.admin1 || item.country}
                            </span>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <span className={`px-2 py-0.5 rounded text-[11px] font-mono font-bold ${
                            item.elevation >= 1500
                              ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30'
                              : item.elevation >= 700
                              ? 'bg-circuit-500/20 text-circuit-300 border border-circuit-500/30'
                              : item.elevation >= 400
                              ? 'bg-live-500/20 text-live-300 border border-live-500/30'
                              : 'bg-panel-700 text-gray-300'
                          }`}>
                            ⛰️ {item.elevation.toLocaleString('id-ID')} mdpl
                          </span>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <button
                onClick={() => handleSearchWeather()}
                disabled={searchingCity}
                className="px-5 py-2.5 rounded-xl bg-circuit-500 text-white text-xs sm:text-sm font-semibold hover:bg-circuit-600 disabled:opacity-50 transition-all flex items-center justify-center gap-2 shrink-0 shadow-lg shadow-circuit-500/20"
              >
                <Search className="w-4 h-4" />
                <span>{searchingCity ? 'Mencari...' : 'Cek Cuaca'}</span>
              </button>
            </div>

            {/* Quick Chips of Famous High & Low Elevation Villages/Kecamatan */}
            <div className="space-y-1.5 pt-1">
              <div className="text-[11px] font-mono text-gray-400 flex items-center justify-between">
                <span>Pilihan Desa &amp; Kecamatan Berdasarkan Ketinggian (MDPL):</span>
                <span className="text-[10px] text-gray-500">Klik untuk langsung periksa suhu</span>
              </div>
              <div className="flex items-center gap-1.5 flex-wrap text-xs">
                {[
                  { name: 'Dieng', reg: 'Wonosobo', mdpl: 2069, icon: '🏔️' },
                  { name: 'Tosari', reg: 'Pasuruan (Bromo)', mdpl: 1707, icon: '🌲' },
                  { name: 'Kintamani', reg: 'Bali', mdpl: 1486, icon: '🌋' },
                  { name: 'Berastagi', reg: 'Karo', mdpl: 1402, icon: '☕' },
                  { name: 'Pangalengan', reg: 'Bandung', mdpl: 1396, icon: '🍵' },
                  { name: 'Lembang', reg: 'Bandung Barat', mdpl: 1252, icon: '🍓' },
                  { name: 'Cisarua', reg: 'Bogor (Puncak)', mdpl: 1001, icon: '🌿' },
                  { name: 'Batu', reg: 'Malang', mdpl: 980, icon: '🍎' },
                  { name: 'Bandung', reg: 'Kota Bandung', mdpl: 708, icon: '🏙️' },
                  { name: 'Jakarta', reg: 'Pusat (Pesisir)', mdpl: 8, icon: '🌊' },
                ].map((item) => (
                  <button
                    key={item.name}
                    onClick={() => {
                      setCityInput(`${item.name}, ${item.reg}`);
                      setSelectedElevation(item.mdpl);
                      setSliderElevation(item.mdpl);
                      handleSearchWeather(item.name, item.mdpl);
                    }}
                    className={`px-2.5 py-1 rounded-lg border text-[11px] font-medium transition-all flex items-center gap-1.5 ${
                      selectedElevation === item.mdpl
                        ? 'bg-circuit-500/20 border-circuit-400 text-white font-bold'
                        : 'bg-panel-800 border-panel-700 text-gray-300 hover:text-white hover:border-circuit-500'
                    }`}
                  >
                    <span>{item.icon}</span>
                    <span>{item.name}</span>
                    <span className="font-mono text-[10px] text-circuit-400 font-semibold">
                      {item.mdpl}m
                    </span>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Weather & Air Quality Display */}
          {weatherData && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Weather Main Card (2 Cols) */}
                <div className="lg:col-span-2 p-6 rounded-2xl bg-panel-900 border border-panel-750 relative overflow-hidden space-y-5 shadow-xl">
                  {/* Background glow based on elevation */}
                  <div className={`absolute top-0 right-0 w-80 h-80 pointer-events-none ${
                    (weatherData.elevation || 0) >= 1500
                      ? 'bg-linear-to-bl from-purple-500/10 via-transparent to-transparent'
                      : (weatherData.elevation || 0) >= 700
                      ? 'bg-linear-to-bl from-circuit-500/10 via-transparent to-transparent'
                      : 'bg-linear-to-bl from-live-500/10 via-transparent to-transparent'
                  }`} />

                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 flex-wrap text-xs font-mono">
                        <span className="text-circuit-400 font-semibold">{weatherData.source}</span>
                        <span className="text-gray-500">•</span>
                        <span className={`px-2 py-0.5 rounded-md font-bold text-[11px] ${
                          (weatherData.elevation || 0) >= 1500
                            ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30'
                            : (weatherData.elevation || 0) >= 700
                            ? 'bg-circuit-500/20 text-circuit-300 border border-circuit-500/30'
                            : (weatherData.elevation || 0) >= 400
                            ? 'bg-live-500/20 text-live-300 border border-live-500/30'
                            : 'bg-panel-800 text-gray-300 border border-panel-700'
                        }`}>
                          ⛰️ {(weatherData.elevation || 0).toLocaleString('id-ID')} MDPL
                        </span>
                        <span className="text-gray-400 text-[11px]">
                          ({weatherData.elevationCategory || 'Dataran Rendah'})
                        </span>
                      </div>

                      <div className="space-y-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          {weatherData.village && (
                            <span className="text-2xl font-bold font-display text-white">
                              Desa {weatherData.village}
                            </span>
                          )}
                          {weatherData.district && (
                            <span className="px-2.5 py-0.5 rounded-lg bg-panel-800 border border-panel-700 text-sm font-semibold text-circuit-300">
                              Kec. {weatherData.district}
                            </span>
                          )}
                          {!weatherData.village && !weatherData.district && (
                            <span className="text-2xl font-bold font-display text-white">
                              {weatherData.locationName}
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-gray-400 font-mono">
                          {weatherData.regency ? `${weatherData.regency}, ` : ''}{weatherData.province}
                        </p>
                      </div>
                    </div>

                    <div className="text-left sm:text-right shrink-0">
                      <div className="text-4xl sm:text-5xl font-black font-display text-white tracking-tight">
                        {weatherData.current.tempC}°C
                      </div>
                      <div className="text-xs font-semibold text-circuit-300 mt-0.5">
                        {weatherData.current.condition}
                      </div>
                      <div className="text-[10px] text-gray-400 font-mono mt-0.5">
                        Suhu riil sesuai elevasi {weatherData.elevation || 0} mdpl
                      </div>
                    </div>
                  </div>

                  {/* Elevation & Lapse Rate Alert Banner */}
                  {weatherData.tempSeaLevelDiff && Math.abs(weatherData.tempSeaLevelDiff) > 0.3 && (
                    <div className="p-3 rounded-xl bg-panel-800/90 border border-circuit-500/30 flex items-start gap-2.5 text-xs text-gray-200">
                      <Mountain className="w-4 h-4 text-circuit-400 shrink-0 mt-0.5" />
                      <div>
                        <span className="font-semibold text-circuit-300">Pengaruh Ketinggian MDPL (Hukum Braak):</span>{' '}
                        <span>
                          Suhu udara di wilayah ini <strong className="text-white">~{Math.abs(weatherData.tempSeaLevelDiff).toFixed(1)}°C lebih dingin</strong> dibandingkan daerah pesisir pantai (0 mdpl) karena penurunan gradien suhu vertikal sebesar 0,6°C per 100 meter.
                        </span>
                      </div>
                    </div>
                  )}

                  {/* Weather Metrics */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-1">
                    <div className="p-3 rounded-xl bg-panel-800 border border-panel-700 flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-circuit-500/10 text-circuit-400">
                        <Droplets className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="text-[11px] text-gray-400">Kelembapan</div>
                        <div className="text-sm font-bold text-white">{weatherData.current.humidity}%</div>
                      </div>
                    </div>

                    <div className="p-3 rounded-xl bg-panel-800 border border-panel-700 flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-circuit-500/10 text-circuit-400">
                        <Wind className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="text-[11px] text-gray-400">Kecepatan Angin</div>
                        <div className="text-sm font-bold text-white">{weatherData.current.windSpeedKmh} km/h</div>
                      </div>
                    </div>

                    <div className="p-3 rounded-xl bg-panel-800 border border-panel-700 flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-circuit-500/10 text-circuit-400">
                        <Compass className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="text-[11px] text-gray-400">Arah Angin</div>
                        <div className="text-sm font-bold text-white">{weatherData.current.windDir}</div>
                      </div>
                    </div>

                    <div className="p-3 rounded-xl bg-panel-800 border border-panel-700 flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-circuit-500/10 text-circuit-400">
                        <Eye className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="text-[11px] text-gray-400">Jarak Pandang</div>
                        <div className="text-sm font-bold text-white">
                          {weatherData.current.visibilityText || '> 10 km'}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Forecast Timeline */}
                  <div className="space-y-2.5 pt-1">
                    <div className="text-xs font-mono uppercase tracking-wider text-gray-400 flex items-center justify-between">
                      <span>Prakiraan Waktu Berikutnya (Sesuai Suhu MDPL)</span>
                      <span className="text-[10px] text-circuit-400 font-mono">Terkalibrasi Ketinggian</span>
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                      {weatherData.forecasts.slice(0, 4).map((f, idx) => {
                        const timeStr = f.localDatetime?.split(' ')[1]?.slice(0, 5) || f.time?.slice(11, 16);
                        return (
                          <div
                            key={idx}
                            className="p-3 rounded-xl bg-panel-800 border border-panel-700 text-center space-y-1 hover:border-circuit-500/40 transition-colors"
                          >
                            <div className="text-[11px] font-mono text-gray-400">{timeStr} WIB</div>
                            <div className="text-lg font-bold text-white">{f.tempC}°C</div>
                            <div className="text-xs text-circuit-300 truncate">{f.condition}</div>
                            <div className="text-[10px] text-gray-500">💧 {f.humidity}%</div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>

                {/* Air Quality Card (1 Col) */}
                <div className="p-6 rounded-2xl bg-panel-900 border border-panel-750 flex flex-col justify-between space-y-4">
                  <div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-mono uppercase tracking-wider text-circuit-400">
                        Kualitas Udara &amp; Polusi
                      </span>
                      <span className="text-xs font-mono text-gray-400">PM2.5 Sensor</span>
                    </div>

                    {airData ? (
                      <div className="mt-4 space-y-4">
                        <div className="text-center p-4 rounded-xl bg-panel-800 border border-panel-700">
                          <div className="text-3xl font-black font-display text-white">{airData.aqi}</div>
                          <div className="text-xs font-mono uppercase text-gray-400 mt-0.5">Air Quality Index (AQI)</div>
                          <div className="mt-2 inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold bg-panel-750 text-white">
                            <span>{airData.statusColor}</span>
                            <span>{airData.status}</span>
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                          <div className="p-3 rounded-xl bg-panel-800 border border-panel-700 text-center">
                            <div className="text-[11px] text-gray-400">PM2.5</div>
                            <div className="text-base font-bold text-white mt-0.5">{airData.pm25} µg/m³</div>
                          </div>
                          <div className="p-3 rounded-xl bg-panel-800 border border-panel-700 text-center">
                            <div className="text-[11px] text-gray-400">PM10</div>
                            <div className="text-base font-bold text-white mt-0.5">{airData.pm10} µg/m³</div>
                          </div>
                        </div>

                        <div className="p-3.5 rounded-xl bg-panel-800/80 border border-panel-700 text-xs text-gray-300 leading-relaxed">
                          <span className="font-semibold text-white">Saran Kesehatan:</span> {airData.advisory}
                        </div>
                      </div>
                    ) : (
                      <div className="py-8 text-center text-xs text-gray-500">
                        Memuat data kualitas udara...
                      </div>
                    )}
                  </div>

                  <div className="text-[11px] text-gray-500 font-mono text-center">
                    Gunakan perintah <code className="text-circuit-400">!cuaca {cityInput}</code> di WhatsApp untuk cek langsung.
                  </div>
                </div>
              </div>

              {/* Interactive Elevation & Hukum Braak Simulation Panel */}
              <div className="p-6 rounded-2xl bg-panel-900 border border-panel-750 space-y-5">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-panel-750 pb-4">
                  <div>
                    <div className="flex items-center gap-2 text-xs font-mono text-circuit-400 uppercase font-semibold">
                      <Sliders className="w-4 h-4" />
                      <span>Simulasi Interaktif: Pengaruh Ketinggian Tempat (MDPL) Terhadap Suhu</span>
                    </div>
                    <p className="text-xs text-gray-400 mt-1">
                      Geser slider untuk melihat bagaimana suhu udara di desa Anda berubah seiring bertambahnya ketinggian di atas permukaan laut.
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="px-3 py-1 rounded-lg bg-panel-800 border border-panel-700 text-xs font-mono font-bold text-circuit-300">
                      T = T₀ - 0.6 × (h / 100)
                    </span>
                  </div>
                </div>

                {/* Slider and Live Calculations */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-center">
                  <div className="lg:col-span-2 space-y-4">
                    <div className="flex items-center justify-between text-xs font-mono">
                      <span className="text-gray-300">Atur Ketinggian Desa / Lereng:</span>
                      <span className="text-base font-bold text-circuit-400">
                        {sliderElevation.toLocaleString('id-ID')} MDPL
                      </span>
                    </div>

                    <input
                      type="range"
                      min={0}
                      max={3000}
                      step={50}
                      value={sliderElevation}
                      onChange={(e) => setSliderElevation(Number(e.target.value))}
                      className="w-full h-2 bg-panel-750 rounded-lg appearance-none cursor-pointer accent-circuit-400"
                    />

                    <div className="flex items-center justify-between text-[11px] font-mono text-gray-500">
                      <span>0 mdpl (Pesisir Pantai)</span>
                      <span>1.000 mdpl (Perbukitan)</span>
                      <span>2.000 mdpl (Pegunungan)</span>
                      <span>3.000 mdpl (Puncak Alpin)</span>
                    </div>

                    <div className="flex items-center gap-3 pt-2">
                      <button
                        onClick={() => handleSearchWeather(cityInput, sliderElevation)}
                        disabled={searchingCity}
                        className="px-4 py-2 rounded-xl bg-circuit-500 text-white text-xs font-semibold hover:bg-circuit-600 transition-all flex items-center gap-1.5 shadow-md shadow-circuit-500/20"
                      >
                        <Sparkles className="w-3.5 h-3.5" />
                        <span>Terapkan Ketinggian {sliderElevation} mdpl</span>
                      </button>

                      <button
                        onClick={() => {
                          const original = weatherData.elevation || 0;
                          setSliderElevation(original);
                          handleSearchWeather(cityInput, original);
                        }}
                        className="px-3 py-2 rounded-xl bg-panel-800 border border-panel-700 text-gray-300 text-xs font-medium hover:text-white hover:border-gray-500 transition-all"
                      >
                        Reset ke Elevasi Alami ({weatherData.elevation || 0} mdpl)
                      </button>
                    </div>
                  </div>

                  {/* Calculated Simulation Summary Card */}
                  {(() => {
                    const baseSeaLevel =
                      weatherData.seaLevelTempEstimate ||
                      weatherData.current.tempC - (weatherData.tempSeaLevelDiff || 0);
                    const diffAtSlider = -0.6 * (sliderElevation / 100);
                    const tempAtSlider = Math.round((baseSeaLevel + diffAtSlider) * 10) / 10;

                    return (
                      <div className="p-4 rounded-xl bg-panel-800 border border-panel-700 space-y-3">
                        <div className="text-xs font-mono uppercase text-gray-400">
                          Hasil Estimasi Suhu Udara:
                        </div>

                        <div className="flex items-baseline justify-between">
                          <span className="text-3xl font-black font-display text-white">
                            {tempAtSlider}°C
                          </span>
                          <span className={`text-xs font-bold ${
                            sliderElevation >= 1500
                              ? 'text-purple-400'
                              : sliderElevation >= 700
                              ? 'text-circuit-400'
                              : 'text-live-400'
                          }`}>
                            {sliderElevation >= 1500
                              ? 'Sangat Dingin / Sejuk'
                              : sliderElevation >= 700
                              ? 'Sejuk & Segar'
                              : 'Normal / Hangat'}
                          </span>
                        </div>

                        <div className="space-y-1.5 text-xs text-gray-300 pt-2 border-t border-panel-700">
                          <div className="flex items-center justify-between">
                            <span className="text-gray-400">Suhu Pesisir (0 mdpl):</span>
                            <span className="font-mono text-white font-semibold">~{baseSeaLevel.toFixed(1)}°C</span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-gray-400">Penurunan Suhu:</span>
                            <span className="font-mono text-alert-400 font-semibold">{diffAtSlider.toFixed(1)}°C</span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-gray-400">Ketinggian Tempat:</span>
                            <span className="font-mono text-circuit-300 font-semibold">{sliderElevation} mdpl</span>
                          </div>
                        </div>
                      </div>
                    );
                  })()}
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 3: CITRA SATELIT & DETEKSI KARHUTLA */}
      {activeTab === 'satelit' && (
        <div className="space-y-6">
          <div className="flex items-center gap-2 border-b border-panel-750 pb-2 overflow-x-auto">
            <button
              onClick={() => setSatelitType('awan')}
              className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
                satelitType === 'awan'
                  ? 'bg-circuit-500 text-white'
                  : 'text-gray-400 hover:text-white hover:bg-panel-800'
              }`}
            >
              🛰️ Satelit Himawari-9 (Awan &amp; Badai IR)
            </button>
            <button
              onClick={() => setSatelitType('hujan')}
              className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
                satelitType === 'hujan'
                  ? 'bg-circuit-500 text-white'
                  : 'text-gray-400 hover:text-white hover:bg-panel-800'
              }`}
            >
              🌧️ Satelit Potensi Hujan (Rain Potential)
            </button>
            <button
              onClick={() => setSatelitType('hotspot')}
              className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
                satelitType === 'hotspot'
                  ? 'bg-circuit-500 text-white'
                  : 'text-gray-400 hover:text-white hover:bg-panel-800'
              }`}
            >
              🔥 Peta Titik Panas &amp; Karhutla (Hotspot)
            </button>
          </div>

          <div className="p-6 rounded-2xl bg-panel-900 border border-panel-750 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <h3 className="font-display font-bold text-lg text-white">
                  {satelitType === 'awan' && 'Citra Satelit Cuaca Himawari-9 — Enhanced Infrared (IR)'}
                  {satelitType === 'hujan' && 'Citra Satelit Potensi Curah Hujan BMKG (Rain Potential)'}
                  {satelitType === 'hotspot' && 'Peta Sebaran Titik Panas (Hotspot) & Potensi Kebakaran Hutan/Lahan'}
                </h3>
                <p className="text-xs text-gray-400">
                  {satelitType === 'awan' && 'Menampilkan suhu puncak awan konvektif dan sebaran awan cumulonimbus pembawa hujan lebat/badai.'}
                  {satelitType === 'hujan' && 'Peta estimasi intensitas curah hujan secara spasial di seluruh gugusan kepulauan Indonesia.'}
                  {satelitType === 'hotspot' && 'Deteksi anomali suhu permukaan bumi dari sensor satelit untuk pencegahan kebakaran hutan.'}
                </p>
              </div>

              <div className="text-[11px] font-mono text-circuit-400 shrink-0">
                Pembaruan: Real-time BMKG Satelit
              </div>
            </div>

            {/* Satellite Image Viewer */}
            <div className="rounded-xl overflow-hidden border border-panel-750 bg-black/60 relative">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={
                  satelitType === 'awan'
                    ? 'https://inderaja.bmkg.go.id/IMAGE/HIMA/H08_EH_Indonesia.png'
                    : satelitType === 'hujan'
                    ? 'https://inderaja.bmkg.go.id/IMAGE/HIMA/H08_RP_Indonesia.png'
                    : 'https://inderaja.bmkg.go.id/IMAGE/HOTSPOT/Hotspot_Indonesia.png'
                }
                alt="Citra Satelit BMKG"
                className="w-full h-auto object-contain max-h-150 mx-auto"
              />
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-gray-400 pt-2 border-t border-panel-800">
              <span>
                💡 Perintah WhatsApp: <code className="text-circuit-400">!satelit</code> atau <code className="text-circuit-400">!satelit hujan</code> atau <code className="text-circuit-400">!hotspot</code>
              </span>
              <a
                href={
                  satelitType === 'awan'
                    ? 'https://inderaja.bmkg.go.id/IMAGE/HIMA/H08_EH_Indonesia.png'
                    : satelitType === 'hujan'
                    ? 'https://inderaja.bmkg.go.id/IMAGE/HIMA/H08_RP_Indonesia.png'
                    : 'https://inderaja.bmkg.go.id/IMAGE/HOTSPOT/Hotspot_Indonesia.png'
                }
                target="_blank"
                rel="noopener noreferrer"
                className="text-circuit-400 hover:text-white flex items-center gap-1 font-medium"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                <span>Buka Gambar Asli Resolusi Tinggi</span>
              </a>
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: CUACA MARITIM & GELOMBANG TINGGI */}
      {activeTab === 'maritim' && (
        <div className="space-y-6">
          <div className="p-5 rounded-2xl bg-panel-900 border border-panel-750 space-y-4">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div>
                <h3 className="font-display font-bold text-lg text-white flex items-center gap-2">
                  <Waves className="w-5 h-5 text-circuit-400" />
                  <span>Peringatan Dini Gelombang Tinggi Perairan Indonesia</span>
                </h3>
                <p className="text-xs text-gray-400 mt-0.5">
                  Data resmi dari Peta Maritim BMKG mencakup 28 area perairan utama di Indonesia.
                </p>
              </div>

              {/* Filter */}
              <input
                type="text"
                placeholder="Cari wilayah (contoh: Jawa, Bali, Maluku, Papua)..."
                value={maritimeFilter}
                onChange={(e) => setMaritimeFilter(e.target.value)}
                className="px-3.5 py-1.5 rounded-xl bg-panel-800 border border-panel-700 text-white placeholder-gray-500 text-xs focus:outline-none focus:border-circuit-500 w-full sm:w-64"
              />
            </div>

            {/* Safety guidelines notice */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px] font-mono text-gray-300 p-3 rounded-xl bg-panel-800 border border-panel-700">
              <div>🚣 Perahu Nelayan: Waspada gelombang &gt; 1.25 m</div>
              <div>🚢 Kapal Tongkang: Waspada gelombang &gt; 1.50 m</div>
              <div>⛴️ Kapal Ferry: Waspada gelombang &gt; 2.50 m</div>
              <div>🚢 Kapal Kargo: Waspada gelombang &gt; 4.00 m</div>
            </div>

            {/* Maritime Regions Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-137.5 overflow-y-auto pr-1">
              {filteredMaritime.map((item, idx) => {
                const hasSangatTinggi = item.warning.sangatTinggi && item.warning.sangatTinggi.length > 0;
                const hasTinggi = item.warning.tinggi && item.warning.tinggi.length > 0;
                const hasSedang = item.warning.sedang && item.warning.sedang.length > 0;

                return (
                  <div
                    key={idx}
                    className="p-4 rounded-xl bg-panel-800 border border-panel-700 space-y-2.5"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-white text-sm">{item.region}</span>
                      <span className="text-[11px] font-mono text-gray-400">
                        {item.validFrom.slice(0, 10)} s/d {item.validUntil.slice(0, 10)}
                      </span>
                    </div>

                    {item.synoptic && (
                      <p className="text-[11px] text-gray-400 leading-relaxed italic line-clamp-2">
                        {item.synoptic}
                      </p>
                    )}

                    {/* Wave warnings categories */}
                    <div className="space-y-1.5 pt-1">
                      {hasSangatTinggi && (
                        <div className="p-2 rounded-lg bg-alert-500/20 text-alert-300 border border-alert-500/30 text-xs">
                          <span className="font-bold">🚨 Sangat Tinggi (4.0 - 6.0 m):</span>{' '}
                          {item.warning.sangatTinggi?.join(', ')}
                        </div>
                      )}

                      {hasTinggi && (
                        <div className="p-2 rounded-lg bg-amber-500/20 text-amber-300 border border-amber-500/30 text-xs">
                          <span className="font-bold">⚠️ Tinggi (2.5 - 4.0 m):</span>{' '}
                          {item.warning.tinggi?.join(', ')}
                        </div>
                      )}

                      {hasSedang && (
                        <div className="p-2 rounded-lg bg-circuit-500/15 text-circuit-300 border border-circuit-500/30 text-xs">
                          <span className="font-bold">🌊 Sedang (1.25 - 2.50 m):</span>{' '}
                          {item.warning.sedang?.slice(0, 3).join(', ')}
                          {(item.warning.sedang?.length || 0) > 3 ? '...' : ''}
                        </div>
                      )}

                      {!hasSangatTinggi && !hasTinggi && !hasSedang && (
                        <div className="text-xs text-live-400 font-mono">
                          🟢 Kondisi perairan relatif tenang (&lt; 1.25 m)
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
        </>
      )}
    </div>
  );
}
