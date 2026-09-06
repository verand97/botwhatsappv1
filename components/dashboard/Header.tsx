'use client';

import React from 'react';
import Link from 'next/link';
import { useBot } from '@/lib/store/botStore';
import {
  Cpu,
  Wifi,
  WifiOff,
  Radio,
  Terminal,
  Zap,
  BatteryCharging,
  ShieldCheck,
} from 'lucide-react';

interface HeaderProps {
  onOpenSimulator?: () => void;
  simulatorOpen?: boolean;
}

export default function Header({ onOpenSimulator, simulatorOpen }: HeaderProps) {
  const { botInstance, features, rateLimit } = useBot();
  const activeFeaturesCount = features.filter((f) => f.is_enabled).length;

  return (
    <header className="sticky top-0 z-40 w-full border-b border-panel-750 bg-panel-950/90 backdrop-blur-md px-4 lg:px-8 py-3">
      <div className="flex items-center justify-between gap-4">
        {/* Left: Brand & Breadcrumb */}
        <div className="flex items-center gap-3">
          <Link
            href="/dashboard"
            className="flex items-center gap-2.5 text-white hover:opacity-90 transition-opacity"
          >
            <div className="relative flex items-center justify-center w-9 h-9 rounded-lg bg-panel-800 border border-panel-700 text-circuit-400">
              <Cpu className="w-5 h-5" />
              <span className="absolute -top-1 -right-1 flex h-2.5 w-2.5">
                {botInstance.status === 'connected' && (
                  <>
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-live-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-live-400"></span>
                  </>
                )}
              </span>
            </div>
            <div className="flex flex-col">
              <span className="font-display font-bold text-base tracking-wide text-white flex items-center gap-1.5">
                VERAND<span className="text-circuit-500">.BOT</span>
                <span className="text-[10px] font-mono font-medium px-1.5 py-0.5 rounded bg-panel-800 text-gray-400 border border-panel-700">
                  v1.2-core
                </span>
              </span>
              <span className="text-xs text-gray-400 hidden sm:inline">
                Control Room Bot WhatsApp
              </span>
            </div>
          </Link>
        </div>

        {/* Center: System Status Indicator */}
        <div className="hidden md:flex items-center gap-3">
          {/* Connection Status Pill */}
          <div
            className={`flex items-center gap-2 px-3 py-1.5 rounded-full border text-xs font-mono transition-all ${
              botInstance.status === 'connected'
                ? 'bg-live-400/10 border-live-400/30 text-live-400 glow-live'
                : botInstance.status === 'connecting'
                ? 'bg-module-amber/10 border-module-amber/30 text-module-amber'
                : 'bg-panel-800 border-panel-700 text-offline-500'
            }`}
          >
            {botInstance.status === 'connected' ? (
              <>
                <Radio className="w-3.5 h-3.5 animate-pulse text-live-400" />
                <span className="font-semibold tracking-wider">ONLINE</span>
                <span className="text-gray-400">|</span>
                <span className="text-gray-300">{botInstance.nomor_wa}</span>
                {botInstance.battery_level && (
                  <span className="hidden lg:flex items-center gap-1 text-[11px] text-gray-400 ml-1">
                    <BatteryCharging className="w-3 h-3 text-live-400" />
                    {botInstance.battery_level}%
                  </span>
                )}
              </>
            ) : botInstance.status === 'connecting' ? (
              <>
                <div className="w-2.5 h-2.5 rounded-full bg-module-amber animate-ping" />
                <span>MENGHUBUNGKAN...</span>
              </>
            ) : (
              <>
                <WifiOff className="w-3.5 h-3.5 text-offline-500" />
                <span>OFFLINE (Belum Terhubung)</span>
              </>
            )}
          </div>

          {/* Active Modules Pill */}
          <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-panel-800 border border-panel-700 text-xs font-mono text-gray-300">
            <Zap className="w-3.5 h-3.5 text-circuit-400" />
            <span>{activeFeaturesCount}/{features.length} Modul Aktif</span>
          </div>

          {/* Rate Limiter Active Pill */}
          <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-panel-800 border border-panel-700 text-xs font-mono text-gray-400">
            <ShieldCheck className="w-3.5 h-3.5 text-live-400" />
            <span>Anti-Abuse: {rateLimit.cooldown_seconds}s</span>
          </div>
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-2.5">
          {/* Quick Connect / Disconnect button */}
          <Link
            href="/dashboard/koneksi"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-panel-800 hover:bg-panel-750 text-gray-200 border border-panel-700 hover:border-panel-600 text-xs font-medium transition-colors"
          >
            {botInstance.status === 'connected' ? (
              <>
                <Wifi className="w-3.5 h-3.5 text-live-400" />
                <span className="hidden sm:inline">Status Koneksi</span>
              </>
            ) : (
              <>
                <Wifi className="w-3.5 h-3.5 text-circuit-400 animate-pulse" />
                <span className="text-circuit-400 font-semibold">Scan QR</span>
              </>
            )}
          </Link>

          {/* Interactive Chat Simulator Drawer Trigger */}
          <button
            onClick={onOpenSimulator}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-mono font-medium transition-all shadow-sm ${
              simulatorOpen
                ? 'bg-circuit-500 text-white shadow-circuit-500/25 glow-circuit'
                : 'bg-panel-800 hover:bg-circuit-500/20 text-circuit-400 border border-circuit-500/30'
            }`}
          >
            <Terminal className="w-3.5 h-3.5" />
            <span className="font-semibold">Simulator Chat</span>
          </button>
        </div>
      </div>
    </header>
  );
}
