'use client';

import React, { useState } from 'react';
import { useBot } from '@/lib/store/botStore';
import {
  ShieldAlert,
  Sliders,
  Hash,
  Clock,
  UserX,
  Users,
  Check,
  AlertTriangle,
  Lock,
  FileText,
} from 'lucide-react';

export default function PengaturanPage() {
  const { rateLimit, updateRateLimit } = useBot();
  const [cooldown, setCooldown] = useState(rateLimit.cooldown_seconds);
  const [prefix, setPrefix] = useState(rateLimit.command_prefix);
  const [maxPerMinute, setMaxPerMinute] = useState(rateLimit.max_per_minute);
  const [antiSpam, setAntiSpam] = useState(rateLimit.anti_spam_active);
  const [blacklistInput, setBlacklistInput] = useState(
    rateLimit.blacklisted_senders.join(', ')
  );
  const [savedToast, setSavedToast] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanBlacklist = blacklistInput
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);

    updateRateLimit({
      cooldown_seconds: cooldown,
      command_prefix: prefix,
      max_per_minute: maxPerMinute,
      anti_spam_active: antiSpam,
      blacklisted_senders: cleanBlacklist,
    });

    setSavedToast(true);
    setTimeout(() => setSavedToast(false), 2500);
  };

  return (
    <div className="max-w-4xl space-y-8">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2 text-xs font-mono text-circuit-400 uppercase tracking-wider mb-1">
          <ShieldAlert className="w-3.5 h-3.5" />
          <span>Konfigurasi Keamanan &amp; Anti-Abuse §4.6 &amp; §8</span>
        </div>
        <h1 className="font-display font-bold text-2xl sm:text-3xl text-white tracking-tight">
          Pengaturan Bot &amp; Kepatuhan Wajar
        </h1>
        <p className="text-xs sm:text-sm text-gray-400 mt-1">
          Atur parameter rate limiter, simbol prefix command, serta filter nomor untuk menjaga nomor WhatsApp tetap aman dari risiko banned.
        </p>
      </div>

      {/* Main Settings Form */}
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Card 1: Rate Limiter & Cooldown (§8) */}
        <div className="p-6 rounded-2xl bg-panel-900 border border-panel-750 space-y-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-live-400/10 border border-live-400/30 flex items-center justify-center text-live-400">
                <Clock className="w-4 h-4" />
              </div>
              <div>
                <h3 className="font-display font-semibold text-base text-white">
                  Rate Limiting &amp; Cooldown (§8 Anti-Banned)
                </h3>
                <p className="text-xs text-gray-400">
                  Batasi jeda minimum antar respons bot per pengguna agar terhindar dari deteksi spam WhatsApp.
                </p>
              </div>
            </div>

            <span className="font-mono text-base font-bold text-live-400 px-3 py-1 rounded-lg bg-panel-800 border border-panel-700">
              {cooldown} Detik
            </span>
          </div>

          <div className="space-y-2">
            <div className="flex justify-between text-xs text-gray-400 font-mono">
              <span>1 Detik (Eksperimental)</span>
              <span className="text-live-400 font-bold">3–5 Detik (Rekomendasi Spesifikasi)</span>
              <span>10 Detik (Sangat Ketat)</span>
            </div>
            <input
              type="range"
              min="1"
              max="10"
              step="1"
              value={cooldown}
              onChange={(e) => setCooldown(Number(e.target.value))}
              className="w-full accent-circuit-500 cursor-pointer h-2 bg-panel-800 rounded-lg appearance-none"
            />
          </div>

          <div className="pt-3 border-t border-panel-750 flex items-center justify-between text-xs">
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="antiSpamToggle"
                checked={antiSpam}
                onChange={(e) => setAntiSpam(e.target.checked)}
                className="w-4 h-4 rounded bg-panel-800 border-panel-700 text-circuit-500 focus:ring-0 cursor-pointer"
              />
              <label htmlFor="antiSpamToggle" className="text-gray-300 cursor-pointer">
                Aktifkan pelindung anti-flood burst secara otomatis
              </label>
            </div>
            <span className="text-gray-400 font-mono text-[11px]">
              Maks: {maxPerMinute} cmd/menit
            </span>
          </div>
        </div>

        {/* Card 2: Command Prefix Customizer */}
        <div className="p-6 rounded-2xl bg-panel-900 border border-panel-750 space-y-4">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-circuit-500/10 border border-circuit-500/30 flex items-center justify-center text-circuit-400">
              <Hash className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-display font-semibold text-base text-white">
                Prefix Command Default
              </h3>
              <p className="text-xs text-gray-400">
                Karakter pemicu perintah di awal pesan WhatsApp (contoh: <code className="text-circuit-400">{prefix}sticker</code>)
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {['!', '/', '.', '#'].map((p) => (
              <button
                type="button"
                key={p}
                onClick={() => setPrefix(p)}
                className={`w-12 h-12 rounded-xl font-mono text-lg font-bold border transition-all ${
                  prefix === p
                    ? 'bg-circuit-500 text-white border-circuit-400 shadow-md glow-circuit'
                    : 'bg-panel-800 text-gray-400 border-panel-700 hover:text-white'
                }`}
              >
                {p}
              </button>
            ))}

            <div className="ml-2 flex-1">
              <input
                type="text"
                maxLength={2}
                value={prefix}
                onChange={(e) => setPrefix(e.target.value)}
                placeholder="Custom"
                className="w-24 px-3 py-2.5 rounded-xl bg-panel-800 border border-panel-700 text-white font-mono text-center text-sm focus:border-circuit-500 focus:outline-none"
              />
            </div>
          </div>
        </div>

        {/* Card 3: Access Control & Number Filtering */}
        <div className="p-6 rounded-2xl bg-panel-900 border border-panel-750 space-y-4">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-alert-500/10 border border-alert-500/30 flex items-center justify-center text-alert-500">
              <UserX className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-display font-semibold text-base text-white">
                Daftar Hitam Pengirim (Blacklist)
              </h3>
              <p className="text-xs text-gray-400">
                Nomor yang diblokir dari seluruh interaksi command bot (pisahkan dengan koma).
              </p>
            </div>
          </div>

          <textarea
            rows={2}
            value={blacklistInput}
            onChange={(e) => setBlacklistInput(e.target.value)}
            placeholder="mis. 628991234567, 628771122334"
            className="w-full px-3.5 py-2.5 rounded-xl bg-panel-800 border border-panel-700 text-white font-mono text-xs focus:border-circuit-500 focus:outline-none"
          />
        </div>

        {/* Card 4: Terms of Service & Disclaimer (§8) */}
        <div className="p-6 rounded-2xl bg-panel-900 border border-panel-750 space-y-3">
          <div className="flex items-center gap-2 text-module-amber text-xs font-semibold">
            <AlertTriangle className="w-4 h-4" />
            <span>Kepatuhan Ketentuan Layanan WhatsApp (§1 &amp; §8)</span>
          </div>
          <p className="text-[11px] text-gray-400 leading-relaxed">
            Layanan Verand.Bot menggunakan pustaka open-source Baileys via protokol multi-device. Pengguna bertanggung jawab penuh atas penggunaan bot secara wajar untuk grup personal atau komunitas kecil, bukan broadcast massal/spam. Kami tidak menyimpan riwayat pesan teks pribadi di luar metadata audit.
          </p>
          <div className="flex items-center gap-3 pt-2 text-[11px] text-gray-400 font-mono">
            <span className="flex items-center gap-1">
              <Lock className="w-3.5 h-3.5 text-live-400" />
              Sesi terenkripsi di Supabase
            </span>
            <span>•</span>
            <span className="flex items-center gap-1">
              <FileText className="w-3.5 h-3.5 text-circuit-400" />
              Tersedia ToS Anti-Abuse
            </span>
          </div>
        </div>

        {/* Save Bar */}
        <div className="flex items-center justify-between p-4 rounded-xl bg-panel-900 border border-panel-750">
          <span className="text-xs font-mono text-gray-400">
            {savedToast ? (
              <span className="text-live-400 font-semibold flex items-center gap-1.5">
                <Check className="w-4 h-4" /> Seluruh konfigurasi berhasil diperbarui!
              </span>
            ) : (
              'Perubahan langsung disinkronkan ke middleware rate-limiter bot.'
            )}
          </span>

          <button
            type="submit"
            className="px-6 py-2.5 rounded-xl bg-circuit-500 hover:bg-circuit-400 text-white text-xs font-bold transition-all shadow-md shadow-circuit-500/25 glow-circuit"
          >
            Simpan Perubahan
          </button>
        </div>
      </form>
    </div>
  );
}
