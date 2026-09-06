'use client';

import React from 'react';
import { useBot } from '@/lib/store/botStore';
import { BarChart3, TrendingUp, Zap, Sparkles, Clock, ShieldCheck } from 'lucide-react';

export default function StatChart() {
  const { stats, features, logs } = useBot();

  const maxCount = Math.max(...stats.map((s) => s.commands_count), 500);

  // Calculate totals
  const totalCommands = stats.reduce((acc, curr) => acc + curr.commands_count, 0);
  const totalStickers = stats.reduce((acc, curr) => acc + curr.stickers_created, 0);
  const totalDownloads = stats.reduce((acc, curr) => acc + curr.media_downloaded, 0);
  const totalAi = stats.reduce((acc, curr) => acc + curr.ai_chats, 0);

  return (
    <div className="space-y-6">
      {/* 4 Metric Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Commands */}
        <div className="p-4 rounded-xl bg-panel-900 border border-panel-750">
          <div className="flex items-center justify-between text-gray-400 text-xs font-mono">
            <span>Total Perintah 7-Hari</span>
            <Zap className="w-4 h-4 text-circuit-400" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="font-display text-2xl font-bold text-white tracking-tight">
              {totalCommands.toLocaleString('id-ID')}
            </span>
            <span className="text-xs text-live-400 font-mono font-medium flex items-center">
              <TrendingUp className="w-3 h-3 mr-0.5" /> +18.4%
            </span>
          </div>
          <span className="text-[11px] text-gray-400 mt-1 block">
            Rata-rata 304 respons per hari
          </span>
        </div>

        {/* Stickers Generated */}
        <div className="p-4 rounded-xl bg-panel-900 border border-panel-750">
          <div className="flex items-center justify-between text-gray-400 text-xs font-mono">
            <span>Stiker Dibuat (WebP)</span>
            <Sparkles className="w-4 h-4 text-live-400" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="font-display text-2xl font-bold text-white tracking-tight">
              {totalStickers.toLocaleString('id-ID')}
            </span>
            <span className="text-xs text-live-400 font-mono font-medium">
              60.2% traffic
            </span>
          </div>
          <span className="text-[11px] text-gray-400 mt-1 block">
            Rata-rata waktu render 210ms
          </span>
        </div>

        {/* Media Downloader */}
        <div className="p-4 rounded-xl bg-panel-900 border border-panel-750">
          <div className="flex items-center justify-between text-gray-400 text-xs font-mono">
            <span>Media Diunduh</span>
            <BarChart3 className="w-4 h-4 text-module-amber" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="font-display text-2xl font-bold text-white tracking-tight">
              {totalDownloads.toLocaleString('id-ID')}
            </span>
            <span className="text-xs text-module-amber font-mono font-medium">
              TikTok &amp; IG
            </span>
          </div>
          <span className="text-[11px] text-gray-400 mt-1 block">
            Hemat kuota via smart compression
          </span>
        </div>

        {/* Anti-Abuse Efficiency */}
        <div className="p-4 rounded-xl bg-panel-900 border border-panel-750">
          <div className="flex items-center justify-between text-gray-400 text-xs font-mono">
            <span>Anti-Abuse Block</span>
            <ShieldCheck className="w-4 h-4 text-circuit-400" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="font-display text-2xl font-bold text-white tracking-tight">
              99.8%
            </span>
            <span className="text-xs text-live-400 font-mono font-medium">
              Banned Risk: Nol
            </span>
          </div>
          <span className="text-[11px] text-gray-400 mt-1 block">
            Cooldown 3s efektif menahan flood
          </span>
        </div>
      </div>

      {/* Main Weekly Command Chart (Precision Bar + Indicator) */}
      <div className="p-6 rounded-2xl bg-panel-900 border border-panel-750 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h3 className="font-display font-bold text-base text-white">
              Aktivitas Command Harian (Minggu Ini)
            </h3>
            <p className="text-xs text-gray-400">
              Volume pemrosesan pesan masuk Baileys worker per hari
            </p>
          </div>

          <div className="flex items-center gap-4 text-xs font-mono">
            <div className="flex items-center gap-1.5 text-gray-300">
              <span className="w-3 h-3 rounded bg-circuit-500 inline-block" />
              <span>Stiker Maker</span>
            </div>
            <div className="flex items-center gap-1.5 text-gray-300">
              <span className="w-3 h-3 rounded bg-live-400 inline-block" />
              <span>Downloader &amp; AI</span>
            </div>
          </div>
        </div>

        {/* Bar Visualization */}
        <div className="h-56 flex items-end justify-between gap-3 pt-6 border-b border-panel-750 px-2">
          {stats.map((item) => {
            const heightPercent = Math.round((item.commands_count / maxCount) * 100);
            const stickerRatio = Math.round(
              (item.stickers_created / item.commands_count) * 100
            );

            return (
              <div
                key={item.date}
                className="flex-1 flex flex-col items-center gap-2 group h-full justify-end"
              >
                {/* Tooltip on Hover */}
                <div className="opacity-0 group-hover:opacity-100 transition-opacity absolute -translate-y-24 bg-panel-950 border border-panel-700 px-2.5 py-1.5 rounded-lg text-[11px] font-mono text-white shadow-xl pointer-events-none z-30">
                  <div className="font-bold text-circuit-400">{item.date}</div>
                  <div>Total: {item.commands_count} cmds</div>
                  <div>Stiker: {item.stickers_created}</div>
                  <div>Media: {item.media_downloaded}</div>
                </div>

                {/* Stacked Bar */}
                <div
                  className="w-full max-w-12 rounded-t-lg overflow-hidden bg-panel-800 transition-all duration-300 group-hover:brightness-110 flex flex-col justify-end"
                  style={{ height: `${heightPercent}%` }}
                >
                  {/* Top: AI & Downloader */}
                  <div
                    className="w-full bg-live-400/80 transition-all"
                    style={{ height: `${100 - stickerRatio}%` }}
                  />
                  {/* Bottom: Sticker Maker */}
                  <div
                    className="w-full bg-circuit-500 transition-all"
                    style={{ height: `${stickerRatio}%` }}
                  />
                </div>

                {/* Date Label */}
                <span className="text-[11px] font-mono text-gray-400 group-hover:text-white transition-colors">
                  {item.date}
                </span>
              </div>
            );
          })}
        </div>

        {/* Feature Distribution Progress Row */}
        <div className="pt-2">
          <div className="flex items-center justify-between text-xs text-gray-300 mb-2">
            <span className="font-mono text-gray-400">Komposisi Pemakaian Fitur:</span>
            <span className="font-mono text-circuit-400">Stiker (60%) • Downloader (24%) • AI Chat (16%)</span>
          </div>
          <div className="w-full h-2.5 rounded-full bg-panel-800 overflow-hidden flex">
            <div className="bg-circuit-500 h-full" style={{ width: '60%' }} />
            <div className="bg-live-400 h-full" style={{ width: '24%' }} />
            <div className="bg-module-amber h-full" style={{ width: '16%' }} />
          </div>
        </div>
      </div>
    </div>
  );
}
