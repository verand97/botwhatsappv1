'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useBot } from '@/lib/store/botStore';
import {
  LayoutDashboard,
  QrCode,
  Sliders,
  ScrollText,
  BarChart3,
  ShieldAlert,
  Server,
  ExternalLink,
  ChevronRight,
  Sparkles,
} from 'lucide-react';

export default function Sidebar() {
  const pathname = usePathname();
  const { botInstance, features, logs } = useBot();
  const activeCount = features.filter((f) => f.is_enabled).length;

  const navItems = [
    {
      href: '/dashboard',
      label: 'Ringkasan Sistem',
      icon: LayoutDashboard,
      badge: null,
    },
    {
      href: '/dashboard/koneksi',
      label: 'Koneksi Bot (QR)',
      icon: QrCode,
      badge:
        botInstance.status === 'connected' ? (
          <span className="w-2 h-2 rounded-full bg-live-400"></span>
        ) : (
          <span className="text-[10px] px-1.5 py-0.5 rounded bg-alert-500/20 text-alert-500 font-mono">
            OFF
          </span>
        ),
    },
    {
      href: '/dashboard/fitur',
      label: 'Papan Modul Fitur',
      icon: Sliders,
      badge: (
        <span className="text-[10px] px-1.5 py-0.5 rounded bg-circuit-500/20 text-circuit-400 font-mono font-medium">
          {activeCount} Aktif
        </span>
      ),
    },
    {
      href: '/dashboard/log',
      label: 'Log Real-time',
      icon: ScrollText,
      badge: (
        <span className="text-[10px] px-1.5 py-0.5 rounded bg-panel-750 text-gray-400 font-mono">
          {logs.length}
        </span>
      ),
    },
    {
      href: '/dashboard/statistik',
      label: 'Statistik Penggunaan',
      icon: BarChart3,
      badge: null,
    },
    {
      href: '/dashboard/pengaturan',
      label: 'Anti-Abuse & Setting',
      icon: ShieldAlert,
      badge: null,
    },
  ];

  return (
    <aside className="w-64 shrink-0 hidden md:flex flex-col justify-between border-r border-panel-750 bg-panel-900 min-h-[calc(100vh-57px)] p-4">
      <div className="space-y-6">
        {/* Navigation Group */}
        <div>
          <div className="px-3 mb-2 text-[11px] font-mono uppercase tracking-wider text-gray-400">
            Pusat Kendali
          </div>
          <nav className="space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center justify-between px-3 py-2.5 rounded-lg text-xs font-medium transition-all ${
                    isActive
                      ? 'bg-circuit-500/15 text-circuit-400 border border-circuit-500/30 font-semibold'
                      : 'text-gray-300 hover:bg-panel-800 hover:text-white'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <Icon
                      className={`w-4 h-4 ${
                        isActive ? 'text-circuit-400' : 'text-gray-400'
                      }`}
                    />
                    <span>{item.label}</span>
                  </div>
                  {item.badge}
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Bot Worker Engine status card (§2) */}
        <div className="p-3.5 rounded-xl bg-panel-800/80 border border-panel-700/80 space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5 text-xs font-mono text-gray-300 font-medium">
              <Server className="w-3.5 h-3.5 text-circuit-400" />
              <span>Baileys Worker</span>
            </div>
            <span
              className={`w-2 h-2 rounded-full ${
                botInstance.status === 'connected'
                  ? 'bg-live-400 animate-pulse'
                  : 'bg-offline-500'
              }`}
            />
          </div>
          <p className="text-[11px] text-gray-400 leading-relaxed">
            Persistent socket terisolasi di proses terpisah (VPS/Railway).
          </p>
          <div className="pt-1 border-t border-panel-700/50 flex items-center justify-between text-[10px] font-mono text-gray-400">
            <span>Engine: @whiskeysockets/baileys</span>
          </div>
        </div>
      </div>

      {/* Bottom links */}
      <div className="pt-4 border-t border-panel-750 space-y-2">
        <Link
          href="/"
          className="flex items-center justify-between px-3 py-2 rounded-lg text-xs text-gray-400 hover:text-white hover:bg-panel-800 transition-colors"
        >
          <div className="flex items-center gap-2">
            <ExternalLink className="w-3.5 h-3.5" />
            <span>Landing Page</span>
          </div>
          <ChevronRight className="w-3.5 h-3.5 text-gray-400" />
        </Link>
        <div className="px-3 text-[10px] font-mono text-gray-400">
          Kendali Control Room &copy; 2026
        </div>
      </div>
    </aside>
  );
}
