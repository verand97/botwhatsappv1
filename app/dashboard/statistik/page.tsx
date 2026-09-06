'use client';

import React from 'react';
import StatChart from '@/components/dashboard/StatChart';
import { BarChart3, Activity, Cpu, Database } from 'lucide-react';

export default function StatistikPage() {
  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div>
        <div className="flex items-center gap-2 text-xs font-mono text-circuit-400 uppercase tracking-wider mb-1">
          <BarChart3 className="w-3.5 h-3.5" />
          <span>Analitik Performa &amp; Metrik §4.5</span>
        </div>
        <h1 className="font-display font-bold text-2xl sm:text-3xl text-white tracking-tight">
          Statistik Penggunaan Bot
        </h1>
        <p className="text-xs sm:text-sm text-gray-400 mt-1 max-w-2xl">
          Pantau volume command per hari, waktu render stiker WebP 512x512, dan efisiensi pencegahan banned nomor WhatsApp.
        </p>
      </div>

      {/* Main Stat Charts Component */}
      <StatChart />

      {/* Worker Performance & Latency Benchmarks Card */}
      <div className="p-6 rounded-2xl bg-panel-900 border border-panel-750 space-y-4">
        <div className="flex items-center gap-2">
          <Activity className="w-4 h-4 text-live-400" />
          <h3 className="font-display font-semibold text-base text-white">
            Tolok Ukur Latensi Handler Bot (Benchmark §5 &amp; §10)
          </h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs font-mono">
          <div className="p-4 rounded-xl bg-panel-800 border border-panel-700/70 space-y-1.5">
            <span className="text-gray-400 text-[11px]">Gambar &rarr; WebP 512x512 (sharp)</span>
            <div className="text-xl font-bold text-live-400">~210 ms</div>
            <p className="text-[11px] text-gray-400 font-sans">
              Resize bilinear + EXIF inject metadata via <code className="text-circuit-400">node-webpmux</code>
            </p>
          </div>

          <div className="p-4 rounded-xl bg-panel-800 border border-panel-700/70 space-y-1.5">
            <span className="text-gray-400 text-[11px]">Video Pendek &rarr; Animasi (ffmpeg)</span>
            <div className="text-xl font-bold text-circuit-400">~1.420 ms</div>
            <p className="text-[11px] text-gray-400 font-sans">
              Kompresi 15 fps limit &lt;500KB sesuai spesifikasi resmi WhatsApp
            </p>
          </div>

          <div className="p-4 rounded-xl bg-panel-800 border border-panel-700/70 space-y-1.5">
            <span className="text-gray-400 text-[11px]">Media Downloader (TikTok/IG)</span>
            <div className="text-xl font-bold text-module-amber">~1.150 ms</div>
            <p className="text-[11px] text-gray-400 font-sans">
              Ekstraksi stream MP4 HD tanpa watermark dengan streaming pipe
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
