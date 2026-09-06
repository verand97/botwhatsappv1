'use client';

import React from 'react';
import Link from 'next/link';
import { useBot } from '@/lib/store/botStore';
import ActivityLogRow from '@/components/dashboard/ActivityLogRow';
import {
  Cpu,
  Wifi,
  Radio,
  Sliders,
  ScrollText,
  ShieldCheck,
  Zap,
  ArrowRight,
  Sparkles,
  ExternalLink,
  ChevronRight,
  TrendingUp,
} from 'lucide-react';

export default function DashboardOverviewPage() {
  const { botInstance, features, logs, rateLimit, stats } = useBot();
  const activeFeatures = features.filter((f) => f.is_enabled);

  return (
    <div className="space-y-8">
      {/* Welcome & System State Banner */}
      <div className="relative overflow-hidden p-6 sm:p-8 rounded-2xl bg-linear-to-r from-panel-900 via-panel-850 to-panel-900 border border-panel-750">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full text-xs font-mono font-semibold bg-circuit-500/20 text-circuit-400 border border-circuit-500/30 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-circuit-400 animate-ping" />
                SISTEM KONTROL AKTIF
              </span>
              <span className="text-xs text-gray-400 font-mono">
                Instance: {botInstance.id}
              </span>
            </div>
            <h1 className="font-display font-bold text-2xl sm:text-3xl text-white tracking-tight">
              Pusat Kendali Bot WhatsApp
            </h1>
            <p className="text-xs sm:text-sm text-gray-300 max-w-2xl leading-relaxed">
              Pantau status koneksi socket WhatsApp, kelola modul fitur aktif (Stiker Maker, Downloader, AI Chat), dan amati log aktivitas secara real-time.
            </p>
          </div>

          {/* Quick Connect / QR Action */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 shrink-0">
            <Link
              href="/dashboard/koneksi"
              className={`flex items-center justify-center gap-2 px-5 py-3 rounded-xl text-xs font-semibold transition-all shadow-md ${
                botInstance.status === 'connected'
                  ? 'bg-live-400/15 hover:bg-live-400/25 text-live-400 border border-live-400/30'
                  : 'bg-circuit-500 hover:bg-circuit-400 text-white shadow-circuit-500/25 glow-circuit'
              }`}
            >
              <Wifi className="w-4 h-4" />
              <span>
                {botInstance.status === 'connected'
                  ? 'Periksa Koneksi QR'
                  : 'Hubungkan Nomor WA'}
              </span>
            </Link>
            <Link
              href="/dashboard/fitur"
              className="flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-panel-800 hover:bg-panel-750 text-gray-200 border border-panel-700 text-xs font-semibold transition-colors"
            >
              <Sliders className="w-4 h-4 text-circuit-400" />
              <span>Papan Modul</span>
            </Link>
          </div>
        </div>
      </div>

      {/* 3 Overview Quick Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {/* Connection Status Card */}
        <div className="p-5 rounded-2xl bg-panel-900 border border-panel-750 flex flex-col justify-between space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono text-gray-400">STATUS KONEKSI</span>
            <span
              className={`w-2.5 h-2.5 rounded-full ${
                botInstance.status === 'connected'
                  ? 'bg-live-400 animate-pulse'
                  : 'bg-offline-500'
              }`}
            />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-display font-bold text-xl text-white">
                {botInstance.status === 'connected'
                  ? 'Online & Terhubung'
                  : 'Offline (Nonaktif)'}
              </h3>
            </div>
            <p className="font-mono text-xs text-circuit-400 mt-1 font-semibold">
              {botInstance.nomor_wa || 'Belum ada nomor tertaut'}
            </p>
          </div>
          <Link
            href="/dashboard/koneksi"
            className="text-xs text-gray-400 hover:text-white flex items-center justify-between pt-3 border-t border-panel-750/70"
          >
            <span>Buka Scanner QR</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {/* Active Modules Card */}
        <div className="p-5 rounded-2xl bg-panel-900 border border-panel-750 flex flex-col justify-between space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono text-gray-400">PAPAN MODUL</span>
            <Zap className="w-4 h-4 text-circuit-400" />
          </div>
          <div>
            <div className="flex items-baseline gap-2">
              <span className="font-display font-bold text-3xl text-white">
                {activeFeatures.length}
              </span>
              <span className="text-xs text-gray-400 font-mono">
                / {features.length} modul aktif
              </span>
            </div>
            <p className="text-xs text-gray-400 mt-1">
              Stiker Maker, Downloader, AI Chat siap merespon
            </p>
          </div>
          <Link
            href="/dashboard/fitur"
            className="text-xs text-gray-400 hover:text-white flex items-center justify-between pt-3 border-t border-panel-750/70"
          >
            <span>Atur Saklar Modul</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {/* Anti-Abuse Rate Limit Card (§8) */}
        <div className="p-5 rounded-2xl bg-panel-900 border border-panel-750 flex flex-col justify-between space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono text-gray-400">PROTEKSI ANTI-ABUSE</span>
            <ShieldCheck className="w-4 h-4 text-live-400" />
          </div>
          <div>
            <div className="flex items-baseline gap-2">
              <span className="font-display font-bold text-3xl text-white">
                {rateLimit.cooldown_seconds}s
              </span>
              <span className="text-xs text-live-400 font-mono">
                Jeda Cooldown Aktif
              </span>
            </div>
            <p className="text-xs text-gray-400 mt-1">
              Melindungi nomor dari risiko banned massal WhatsApp
            </p>
          </div>
          <Link
            href="/dashboard/pengaturan"
            className="text-xs text-gray-400 hover:text-white flex items-center justify-between pt-3 border-t border-panel-750/70"
          >
            <span>Konfigurasi Anti-Abuse</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>

      {/* Active Modules Strip Showcase */}
      <div className="p-6 rounded-2xl bg-panel-900 border border-panel-750 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sliders className="w-4 h-4 text-circuit-400" />
            <h3 className="font-display font-bold text-base text-white">
              Modul Utama Yang Sedang Berjalan
            </h3>
          </div>
          <Link
            href="/dashboard/fitur"
            className="text-xs text-circuit-400 hover:text-circuit-300 font-medium flex items-center gap-1"
          >
            <span>Kelola Semua ({features.length})</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {features.slice(0, 4).map((feat) => (
            <div
              key={feat.id}
              className={`p-3.5 rounded-xl border flex items-center justify-between gap-3 ${
                feat.is_enabled
                  ? 'bg-panel-800 border-circuit-500/40 text-white'
                  : 'bg-panel-950 border-panel-750 text-gray-400'
              }`}
            >
              <div className="truncate">
                <div className="font-semibold text-xs truncate">{feat.name}</div>
                <div className="text-[11px] font-mono text-circuit-400 mt-0.5">
                  {feat.command_trigger}
                </div>
              </div>
              <span
                className={`w-2 h-2 rounded-full shrink-0 ${
                  feat.is_enabled ? 'bg-live-400 glow-live' : 'bg-offline-500'
                }`}
              />
            </div>
          ))}
        </div>
      </div>

      {/* Real-time Activity Logs Stream Preview */}
      <div className="p-6 rounded-2xl bg-panel-900 border border-panel-750 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ScrollText className="w-4 h-4 text-circuit-400" />
            <h3 className="font-display font-bold text-base text-white">
              Aktivitas Pesan Masuk Terbaru
            </h3>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-panel-800 text-live-400 border border-panel-700 flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-live-400 animate-ping" />
              Real-time Live
            </span>
          </div>
          <Link
            href="/dashboard/log"
            className="text-xs text-circuit-400 hover:text-circuit-300 font-medium flex items-center gap-1"
          >
            <span>Buka Feed Lengkap</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="space-y-2">
          {logs.slice(0, 5).map((log) => (
            <ActivityLogRow key={log.id} log={log} />
          ))}
        </div>
      </div>
    </div>
  );
}
