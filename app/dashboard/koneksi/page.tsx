'use client';

import React from 'react';
import QrConnectPanel from '@/components/dashboard/QrConnectPanel';
import { QrCode, Shield, Server, HardDrive } from 'lucide-react';

export default function KoneksiPage() {
  return (
    <div className="space-y-6">
      {/* Header Info */}
      <div>
        <div className="flex items-center gap-2 text-xs font-mono text-circuit-400 uppercase tracking-wider mb-1">
          <QrCode className="w-3.5 h-3.5" />
          <span>Multi-Device Gateway §4.2</span>
        </div>
        <h1 className="font-display font-bold text-2xl sm:text-3xl text-white tracking-tight">
          Koneksi WhatsApp &amp; Sesi Baileys
        </h1>
        <p className="text-xs sm:text-sm text-gray-400 mt-1 max-w-3xl">
          Tautkan nomor WhatsApp Anda ke engine bot Baileys. Setelah terhubung, bot akan menyala di background dan memproses pesan masuk sesuai modul yang Anda aktifkan.
        </p>
      </div>

      {/* Main Qr Panel */}
      <QrConnectPanel />

      {/* Architecture Spec Info Box (§2 & §10) */}
      <div className="p-6 rounded-2xl bg-panel-900 border border-panel-750">
        <div className="flex items-center gap-2 mb-3">
          <Server className="w-4 h-4 text-circuit-400" />
          <h3 className="font-display font-semibold text-sm text-white">
            Catatan Arsitektur Baileys Persistent Socket (§2)
          </h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs text-gray-300">
          <div className="p-3.5 rounded-xl bg-panel-800 border border-panel-700/80 space-y-1">
            <span className="font-mono text-[11px] text-circuit-400 font-semibold block">
              1. Persistent Process
            </span>
            <p className="text-[11px] text-gray-400 leading-relaxed">
              Bot berjalan pada worker Node.js 24/7 (VPS/Railway), bukan di serverless function yang mudah mati saat idle.
            </p>
          </div>
          <div className="p-3.5 rounded-xl bg-panel-800 border border-panel-700/80 space-y-1">
            <span className="font-mono text-[11px] text-live-400 font-semibold block">
              2. Kredensial Terenkripsi
            </span>
            <p className="text-[11px] text-gray-400 leading-relaxed">
              Auth state Baileys (multi-device keys) disimpan terenkripsi di Supabase, menjaga keamanan privasi nomor Anda.
            </p>
          </div>
          <div className="p-3.5 rounded-xl bg-panel-800 border border-panel-700/80 space-y-1">
            <span className="font-mono text-[11px] text-module-amber font-semibold block">
              3. Rate Limiter Default
            </span>
            <p className="text-[11px] text-gray-400 leading-relaxed">
              Setiap pesan masuk diverifikasi melalui middleware rate limiter untuk mencegah nomor Anda terdeteksi bot spam.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
