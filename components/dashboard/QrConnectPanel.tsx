'use client';

import React, { useState, useEffect } from 'react';
import { useBot } from '@/lib/store/botStore';
import confetti from 'canvas-confetti';
import {
  QrCode,
  Smartphone,
  CheckCircle2,
  AlertTriangle,
  RotateCw,
  LogOut,
  Sparkles,
  KeyRound,
  ShieldCheck,
  Zap,
} from 'lucide-react';

export default function QrConnectPanel() {
  const { botInstance, connectBot, disconnectBot, setConnecting } = useBot();
  const [pairingMethod, setPairingMethod] = useState<'qr' | 'code'>('qr');
  const [phoneNumberInput, setPhoneNumberInput] = useState('6281234567890');
  const [pairingCodeGenerated, setPairingCodeGenerated] = useState<string | null>(null);
  const [countdown, setCountdown] = useState(45);

  // Countdown timer for QR refresh
  useEffect(() => {
    if (botInstance.status === 'connected') return;
    const interval = setInterval(() => {
      setCountdown((prev) => (prev <= 1 ? 45 : prev - 1));
    }, 1000);
    return () => clearInterval(interval);
  }, [botInstance.status]);

  const handleSimulateSuccess = () => {
    setConnecting();
    setTimeout(() => {
      connectBot('+62 812-***-9081');
      // Trigger festive celebration confetti (§3.4)
      try {
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.6 },
          colors: ['#3ECF8E', '#4C8FE0', '#DDA24C', '#ffffff'],
        });
      } catch (err) {
        // Confetti fallback
      }
    }, 1200);
  };

  const handleGeneratePairingCode = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanNum = phoneNumberInput.replace(/\D/g, '');
    if (!cleanNum) return;
    const code = Math.random().toString(36).substring(2, 6).toUpperCase() + '-' +
                 Math.random().toString(36).substring(2, 6).toUpperCase();
    setPairingCodeGenerated(code);
  };

  return (
    <div className="w-full max-w-4xl mx-auto space-y-8">
      {/* Top Banner & Status Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-2xl bg-panel-900 border border-panel-750">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="font-display text-xl font-bold text-white tracking-tight">
              Koneksi Socket WhatsApp Multi-Device
            </h2>
            <span
              className={`px-2 py-0.5 rounded-full text-xs font-mono font-semibold flex items-center gap-1.5 ${
                botInstance.status === 'connected'
                  ? 'bg-live-400/20 text-live-400 border border-live-400/30 glow-live'
                  : botInstance.status === 'connecting'
                  ? 'bg-module-amber/20 text-module-amber border border-module-amber/30'
                  : 'bg-panel-800 text-offline-500 border border-panel-700'
              }`}
            >
              <span
                className={`w-2 h-2 rounded-full ${
                  botInstance.status === 'connected'
                    ? 'bg-live-400 animate-pulse'
                    : botInstance.status === 'connecting'
                    ? 'bg-module-amber animate-ping'
                    : 'bg-offline-500'
                }`}
              />
              {botInstance.status === 'connected'
                ? 'TERHUBUNG'
                : botInstance.status === 'connecting'
                ? 'MENGHUBUNGKAN...'
                : 'OFFLINE / MENUNGGU SCAN'}
            </span>
          </div>
          <p className="text-xs text-gray-400 mt-1">
            Protokol Baileys Multi-Device persisten. Nomor Anda berfungsi sebagai mesin utama bot.
          </p>
        </div>

        {/* Action button if already connected */}
        {botInstance.status === 'connected' && (
          <button
            onClick={disconnectBot}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-alert-500/10 hover:bg-alert-500/20 text-alert-500 border border-alert-500/30 text-xs font-semibold transition-colors"
          >
            <LogOut className="w-4 h-4" />
            <span>Putuskan Sesi WhatsApp</span>
          </button>
        )}
      </div>

      {/* Main Connection Visual Board */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left / Center: Interactive QR & Pulsing Radar Stage */}
        <div className="lg:col-span-7 flex flex-col items-center justify-center p-8 rounded-2xl bg-panel-900 border border-panel-750 relative overflow-hidden">
          {/* Method Selector Tabs */}
          <div className="flex items-center p-1 rounded-xl bg-panel-800 border border-panel-700 mb-8 text-xs font-medium">
            <button
              onClick={() => setPairingMethod('qr')}
              className={`flex items-center gap-2 px-4 py-1.5 rounded-lg transition-all ${
                pairingMethod === 'qr'
                  ? 'bg-circuit-500 text-white shadow-sm'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              <QrCode className="w-3.5 h-3.5" />
              <span>Scan QR Code</span>
            </button>
            <button
              onClick={() => setPairingMethod('code')}
              className={`flex items-center gap-2 px-4 py-1.5 rounded-lg transition-all ${
                pairingMethod === 'code'
                  ? 'bg-circuit-500 text-white shadow-sm'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              <KeyRound className="w-3.5 h-3.5" />
              <span>Pairing Code (8-Digit)</span>
            </button>
          </div>

          {/* QR Method Container */}
          {pairingMethod === 'qr' ? (
            <div className="relative flex flex-col items-center justify-center">
              {/* Pulsing Sonar Ring Stage (Signature Element §3.3 & §3.4) */}
              <div className="relative flex items-center justify-center w-72 h-72">
                {botInstance.status !== 'connected' && (
                  <>
                    <div className="absolute inset-0 rounded-full border border-circuit-500/20 animate-sonar pointer-events-none" />
                    <div
                      className="absolute inset-4 rounded-full border border-circuit-500/30 animate-sonar pointer-events-none"
                      style={{ animationDelay: '0.8s' }}
                    />
                    <div
                      className="absolute inset-8 rounded-full border border-circuit-500/40 animate-sonar pointer-events-none"
                      style={{ animationDelay: '1.6s' }}
                    />
                  </>
                )}

                {/* Outer Ring Border */}
                <div
                  className={`relative w-64 h-64 rounded-3xl p-3 flex flex-col items-center justify-center transition-all duration-500 ${
                    botInstance.status === 'connected'
                      ? 'border-2 border-live-400 bg-live-400/5 glow-live'
                      : 'border-2 border-dashed border-circuit-500/60 bg-panel-800/90 glow-circuit'
                  }`}
                >
                  {botInstance.status === 'connected' ? (
                    <div className="flex flex-col items-center text-center p-4 animate-scaleUp">
                      <div className="w-16 h-16 rounded-full bg-live-400/20 border border-live-400 flex items-center justify-center text-live-400 mb-3 glow-live">
                        <CheckCircle2 className="w-9 h-9" />
                      </div>
                      <h4 className="font-display font-bold text-lg text-white">
                        Terkoneksi Sempurna!
                      </h4>
                      <p className="font-mono text-sm text-live-400 mt-1 font-semibold">
                        {botInstance.nomor_wa}
                      </p>
                      <p className="text-[11px] text-gray-400 mt-2 max-w-[200px]">
                        Socket Baileys aktif 24/7. Modul siap merespon perintah pesan masuk.
                      </p>
                    </div>
                  ) : (
                    /* Mock QR Vector Matrix */
                    <div className="relative w-full h-full bg-white rounded-2xl p-4 flex flex-col items-center justify-center shadow-inner">
                      {/* Stylized QR Code Pattern */}
                      <svg
                        viewBox="0 0 100 100"
                        className="w-48 h-48 text-panel-950"
                        fill="currentColor"
                      >
                        {/* QR Corners */}
                        <rect x="5" y="5" width="25" height="25" rx="3" fill="black" />
                        <rect x="9" y="9" width="17" height="17" rx="2" fill="white" />
                        <rect x="13" y="13" width="9" height="9" rx="1" fill="black" />

                        <rect x="70" y="5" width="25" height="25" rx="3" fill="black" />
                        <rect x="74" y="9" width="17" height="17" rx="2" fill="white" />
                        <rect x="78" y="13" width="9" height="9" rx="1" fill="black" />

                        <rect x="5" y="70" width="25" height="25" rx="3" fill="black" />
                        <rect x="9" y="74" width="17" height="17" rx="2" fill="white" />
                        <rect x="13" y="78" width="9" height="9" rx="1" fill="black" />

                        {/* Random Tech QR Blocks */}
                        <rect x="35" y="10" width="5" height="15" fill="black" />
                        <rect x="45" y="8" width="8" height="6" fill="black" />
                        <rect x="58" y="12" width="6" height="12" fill="black" />
                        <rect x="12" y="35" width="12" height="6" fill="black" />
                        <rect x="8" y="48" width="16" height="5" fill="black" />
                        <rect x="10" y="58" width="12" height="6" fill="black" />
                        <rect x="35" y="35" width="30" height="30" rx="4" fill="#4C8FE0" />
                        <rect x="42" y="42" width="16" height="16" rx="2" fill="white" />
                        <rect x="46" y="46" width="8" height="8" rx="1" fill="#111417" />
                        <rect x="72" y="38" width="10" height="12" fill="black" />
                        <rect x="85" y="42" width="8" height="18" fill="black" />
                        <rect x="35" y="72" width="14" height="6" fill="black" />
                        <rect x="54" y="78" width="12" height="14" fill="black" />
                        <rect x="72" y="72" width="22" height="8" fill="black" />
                        <rect x="80" y="84" width="14" height="10" fill="black" />
                      </svg>

                      {/* Refresh overlay on low countdown */}
                      <div className="absolute bottom-1.5 right-2 bg-panel-950/85 backdrop-blur-sm px-2 py-0.5 rounded text-[10px] font-mono text-circuit-400 border border-panel-750 flex items-center gap-1">
                        <RotateCw className="w-2.5 h-2.5 animate-spin" />
                        <span>{countdown}s</span>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Instant Simulator Scan Button */}
              {botInstance.status !== 'connected' && (
                <div className="mt-6 flex flex-col items-center gap-2">
                  <button
                    onClick={handleSimulateSuccess}
                    className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-circuit-500 hover:bg-circuit-400 text-white font-semibold text-xs transition-all shadow-md shadow-circuit-500/25 glow-circuit"
                  >
                    <Sparkles className="w-4 h-4" />
                    <span>Simulasi Scan QR Sukses (Satu Klik)</span>
                  </button>
                  <span className="text-[11px] text-gray-400">
                    Gunakan tombol di atas untuk mencoba langsung interaksi tanpa HP fisik.
                  </span>
                </div>
              )}
            </div>
          ) : (
            /* Pairing Code Method Container */
            <div className="w-full max-w-sm flex flex-col items-center">
              <form onSubmit={handleGeneratePairingCode} className="w-full space-y-4">
                <div>
                  <label className="block text-xs font-mono text-gray-400 mb-1">
                    Nomor WhatsApp (dengan kode negara)
                  </label>
                  <input
                    type="text"
                    value={phoneNumberInput}
                    onChange={(e) => setPhoneNumberInput(e.target.value)}
                    placeholder="mis. 6281234567890"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-panel-800 border border-panel-700 text-white font-mono text-sm focus:border-circuit-500 focus:outline-none"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full py-2.5 rounded-xl bg-circuit-500 hover:bg-circuit-400 text-white font-semibold text-xs transition-colors flex items-center justify-center gap-2"
                >
                  <KeyRound className="w-4 h-4" />
                  <span>Dapatkan 8-Digit Pairing Code</span>
                </button>
              </form>

              {pairingCodeGenerated && (
                <div className="mt-6 p-4 rounded-xl bg-panel-800 border border-circuit-500/40 text-center w-full animate-fadeIn">
                  <span className="text-xs text-gray-400">Kode Tertaut WhatsApp Anda:</span>
                  <div className="my-2 font-mono text-2xl font-bold tracking-widest text-circuit-400 bg-panel-950 py-2 rounded-lg border border-panel-700">
                    {pairingCodeGenerated}
                  </div>
                  <p className="text-[11px] text-gray-400">
                    Masukkan kode ini di HP: WhatsApp &gt; Perangkat Tertaut &gt; Tautkan dengan nomor telepon.
                  </p>
                  <button
                    onClick={handleSimulateSuccess}
                    className="mt-3 text-xs text-live-400 hover:underline font-medium"
                  >
                    Simulasikan Pairing Berhasil &rarr;
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Right: Step-by-Step Instructions & Security Info (§1, §8) */}
        <div className="lg:col-span-5 space-y-4">
          {/* Instructions Card */}
          <div className="p-6 rounded-2xl bg-panel-900 border border-panel-750 space-y-4">
            <h3 className="font-display font-semibold text-base text-white flex items-center gap-2">
              <Smartphone className="w-4 h-4 text-circuit-400" />
              <span>Langkah Menghubungkan</span>
            </h3>

            <ol className="space-y-3.5 text-xs text-gray-300">
              <li className="flex items-start gap-3">
                <span className="flex items-center justify-center w-5 h-5 rounded-full bg-panel-800 border border-panel-700 text-circuit-400 font-mono text-xs font-bold shrink-0 mt-0.5">
                  1
                </span>
                <span>Buka aplikasi WhatsApp di telepon pintar Anda.</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="flex items-center justify-center w-5 h-5 rounded-full bg-panel-800 border border-panel-700 text-circuit-400 font-mono text-xs font-bold shrink-0 mt-0.5">
                  2
                </span>
                <span>
                  Buka menu <strong className="text-white">Pengaturan / Titik Tiga</strong> &gt; pilih{' '}
                  <strong className="text-white">Perangkat Tertaut (Linked Devices)</strong>.
                </span>
              </li>
              <li className="flex items-start gap-3">
                <span className="flex items-center justify-center w-5 h-5 rounded-full bg-panel-800 border border-panel-700 text-circuit-400 font-mono text-xs font-bold shrink-0 mt-0.5">
                  3
                </span>
                <span>
                  Ketuk <strong className="text-white">Tautkan Perangkat</strong>, lalu arahkan kamera HP ke kode QR di samping.
                </span>
              </li>
            </ol>
          </div>

          {/* Security & Ethics Alert Box (§1, §8) */}
          <div className="p-5 rounded-2xl bg-panel-900 border border-panel-750 space-y-3">
            <div className="flex items-center gap-2 text-module-amber text-xs font-semibold">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>Etika Teknis &amp; Pencegahan Banned (§8)</span>
            </div>
            <p className="text-[11px] text-gray-400 leading-relaxed">
              Bot ini dirancang untuk penggunaan personal dan komunitas kecil yang wajar. Hindari spam masif atau broadcast ke kontak asing agar nomor WhatsApp Anda tetap terlindungi dari sanksi pemblokiran. Sistem kami menerapkan <strong>Rate Limiting 3–5 detik</strong> secara default.
            </p>
            <div className="pt-2 border-t border-panel-750 flex items-center justify-between text-[11px] text-gray-400 font-mono">
              <span className="flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5 text-live-400" />
                Auth Session Enkripsi AES
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
