import React from 'react';
import Link from 'next/link';
import {
  Cpu,
  Wifi,
  Sparkles,
  Sliders,
  ShieldCheck,
  ArrowRight,
  Terminal,
  Zap,
  Sticker,
  Download,
  Bot,
  MessageSquareReply,
  CheckCircle2,
  Lock,
  Server,
  Layers,
  Clock,
} from 'lucide-react';

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-panel-950 text-gray-200 selection:bg-circuit-500/30 selection:text-circuit-400">
      {/* Top Navigation */}
      <header className="sticky top-0 z-50 border-b border-panel-750/70 bg-panel-950/85 backdrop-blur-md px-6 lg:px-12 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-panel-900 border border-panel-700 flex items-center justify-center text-circuit-400 shadow-sm shadow-circuit-500/10">
              <Cpu className="w-5 h-5" />
            </div>
            <div>
              <span className="font-display font-bold text-lg tracking-wide text-white flex items-center gap-1.5">
                VERAND<span className="text-circuit-500">.BOT</span>
              </span>
              <span className="text-[11px] font-mono text-gray-400">
                Control Room Platform
              </span>
            </div>
          </div>

          <div className="hidden md:flex items-center gap-8 text-xs font-medium text-gray-300">
            <a href="#fitur" className="hover:text-circuit-400 transition-colors">
              Papan Modul
            </a>
            <a href="#arsitektur" className="hover:text-circuit-400 transition-colors">
              Arsitektur Baileys
            </a>
            <a href="#anti-abuse" className="hover:text-circuit-400 transition-colors">
              Anti-Banned §8
            </a>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/login"
              className="px-4 py-2 rounded-xl text-xs text-gray-300 hover:text-white transition-colors"
            >
              Masuk
            </Link>
            <Link
              href="/dashboard"
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-circuit-500 hover:bg-circuit-400 text-white font-semibold text-xs transition-all shadow-md shadow-circuit-500/25 glow-circuit"
            >
              <span>Buka Dashboard</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section (§3, §4.1) */}
      <section className="relative pt-16 pb-24 px-6 lg:px-12 overflow-hidden circuit-grid">
        {/* Ambient Gradient Glows */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-150 h-75 bg-circuit-500/15 rounded-full blur-3xl pointer-events-none" />

        <div className="max-w-5xl mx-auto text-center space-y-6 relative z-10">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-panel-900 border border-panel-700 text-xs font-mono text-circuit-400">
            <span className="w-2 h-2 rounded-full bg-live-400 animate-pulse" />
            <span>Panel Kontrol Robot WhatsApp Personal &amp; Komunitas</span>
          </div>

          <h1 className="font-display font-extrabold text-4xl sm:text-6xl text-white tracking-tight leading-[1.1]">
            Kelola Fitur Bot WhatsApp Anda <br />
            <span className="bg-clip-text text-transparent bg-linear-to-r from-circuit-400 via-blue-200 to-circuit-500">
              Secara Visual Tanpa Sentuh Kode.
            </span>
          </h1>

          <p className="max-w-2xl mx-auto text-sm sm:text-base text-gray-300 leading-relaxed font-sans">
            Hubungkan nomor WhatsApp Anda sendiri lewat QR Code, nyalakan modul Stiker Maker otomatis, Downloader video no-watermark, Auto-Reply, dan AI Chat langsung dari dashboard bergaya papan sirkuit presisi.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
            <Link
              href="/dashboard"
              className="w-full sm:w-auto flex items-center justify-center gap-2 px-8 py-3.5 rounded-xl bg-circuit-500 hover:bg-circuit-400 text-white font-bold text-sm transition-all shadow-lg shadow-circuit-500/30 glow-circuit"
            >
              <span>Mulai Kontrol Bot Sekarang</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              href="/dashboard/koneksi"
              className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl bg-panel-900 hover:bg-panel-850 text-gray-200 border border-panel-750 text-sm font-semibold transition-colors"
            >
              <Wifi className="w-4 h-4 text-live-400" />
              <span>Simulasi Scan QR</span>
            </Link>
          </div>

          {/* Key Specs Pills */}
          <div className="pt-8 flex flex-wrap items-center justify-center gap-4 text-xs font-mono text-gray-400">
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-live-400" />
              Stiker WebP 512x512 + Custom EXIF
            </span>
            <span className="hidden sm:inline text-panel-700">•</span>
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-live-400" />
              Rate Limiting 3–5s Anti-Banned
            </span>
            <span className="hidden sm:inline text-panel-700">•</span>
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-live-400" />
              Masking Nomor Privasi (62812***)
            </span>
          </div>
        </div>

        {/* Hero Visual: Signature Circuit Module Board Preview (§3.3) */}
        <div className="max-w-5xl mx-auto mt-14 rounded-2xl bg-panel-900 border border-panel-700 p-4 sm:p-6 shadow-2xl relative overflow-hidden">
          {/* Window Header */}
          <div className="flex items-center justify-between pb-4 mb-5 border-b border-panel-750 text-xs">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-alert-500/80" />
              <div className="w-3 h-3 rounded-full bg-module-amber/80" />
              <div className="w-3 h-3 rounded-full bg-live-400/80" />
              <span className="font-mono text-gray-400 ml-2">verand-control-room.app / dashboard</span>
            </div>
            <span className="font-mono text-live-400 flex items-center gap-1.5 text-[11px]">
              <span className="w-2 h-2 rounded-full bg-live-400 animate-ping" />
              SOCKET BAILEYS: ONLINE (+62 812-***-9081)
            </span>
          </div>

          {/* Mock Interactive Modules Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-left">
            {/* Module 1: Stiker Maker (Active with Energy Line) */}
            <div className="p-4 rounded-xl bg-panel-800 border border-circuit-500/60 relative overflow-hidden shadow-md shadow-circuit-500/10">
              <div className="flex items-center justify-between mb-3">
                <div className="w-10 h-10 rounded-lg bg-circuit-500/20 border border-circuit-500 flex items-center justify-center text-circuit-400">
                  <Sticker className="w-5 h-5" />
                </div>
                <span className="w-10 h-5 rounded-full bg-circuit-500 flex items-center justify-end px-0.5">
                  <span className="w-4 h-4 rounded-full bg-white" />
                </span>
              </div>
              <h4 className="font-display font-semibold text-white text-sm">Stiker Maker</h4>
              <p className="text-xs text-gray-400 mt-1">
                Foto &rarr; WebP 512x512 + Inject EXIF Pack &amp; Author name.
              </p>
              <div className="mt-3 pt-2 border-t border-panel-750 flex items-center justify-between text-[11px] font-mono">
                <span className="text-circuit-400">Trigger: !sticker</span>
                <span className="text-live-400">Aktif</span>
              </div>
            </div>

            {/* Module 2: Downloader */}
            <div className="p-4 rounded-xl bg-panel-800 border border-circuit-500/60 relative overflow-hidden shadow-md shadow-circuit-500/10">
              <div className="flex items-center justify-between mb-3">
                <div className="w-10 h-10 rounded-lg bg-circuit-500/20 border border-circuit-500 flex items-center justify-center text-circuit-400">
                  <Download className="w-5 h-5" />
                </div>
                <span className="w-10 h-5 rounded-full bg-circuit-500 flex items-center justify-end px-0.5">
                  <span className="w-4 h-4 rounded-full bg-white" />
                </span>
              </div>
              <h4 className="font-display font-semibold text-white text-sm">Media Downloader</h4>
              <p className="text-xs text-gray-400 mt-1">
                Unduh video TikTok (No WM), IG Reels, YouTube MP4.
              </p>
              <div className="mt-3 pt-2 border-t border-panel-750 flex items-center justify-between text-[11px] font-mono">
                <span className="text-circuit-400">Trigger: !dl</span>
                <span className="text-live-400">Aktif</span>
              </div>
            </div>

            {/* Module 3: AI Chat */}
            <div className="p-4 rounded-xl bg-panel-800 border border-panel-700 relative overflow-hidden">
              <div className="flex items-center justify-between mb-3">
                <div className="w-10 h-10 rounded-lg bg-panel-900 border border-panel-700 flex items-center justify-center text-module-amber">
                  <Bot className="w-5 h-5" />
                </div>
                <span className="w-10 h-5 rounded-full bg-circuit-500 flex items-center justify-end px-0.5">
                  <span className="w-4 h-4 rounded-full bg-white" />
                </span>
              </div>
              <h4 className="font-display font-semibold text-white text-sm flex items-center gap-1.5">
                AI Assistant
                <span className="text-[9px] font-mono px-1 rounded bg-module-amber/20 text-module-amber">BETA</span>
              </h4>
              <p className="text-xs text-gray-400 mt-1">
                Tanya jawab cerdas langsung di WA via model Gemini LLM.
              </p>
              <div className="mt-3 pt-2 border-t border-panel-750 flex items-center justify-between text-[11px] font-mono">
                <span className="text-circuit-400">Trigger: !ai</span>
                <span className="text-live-400">Aktif</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Grid Section (§5) */}
      <section id="fitur" className="py-20 px-6 lg:px-12 border-t border-panel-750 bg-panel-900/50">
        <div className="max-w-7xl mx-auto space-y-12">
          <div className="text-center space-y-3 max-w-2xl mx-auto">
            <span className="text-xs font-mono text-circuit-400 uppercase tracking-wider">
              Kemampuan Bot Serbaguna §5
            </span>
            <h2 className="font-display font-bold text-3xl sm:text-4xl text-white tracking-tight">
              Modul Fungsionalitas Siap Pakai
            </h2>
            <p className="text-xs sm:text-sm text-gray-400">
              Semua modul dapat dinyalakan atau dimatikan kapan saja secara modular dari papan kendali Anda.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Feat 1 */}
            <div className="p-6 rounded-2xl bg-panel-900 border border-panel-750 space-y-3">
              <div className="w-10 h-10 rounded-xl bg-circuit-500/10 border border-circuit-500/30 flex items-center justify-center text-circuit-400">
                <Sticker className="w-5 h-5" />
              </div>
              <h3 className="font-display font-semibold text-base text-white">
                Stiker Maker &amp; Animasi
              </h3>
              <p className="text-xs text-gray-400 leading-relaxed">
                Resize otomatis ke 512x512, konversi WebP via sharp, kompres video pendek via ffmpeg, serta metadata pack/author via node-webpmux.
              </p>
            </div>

            {/* Feat 2 */}
            <div className="p-6 rounded-2xl bg-panel-900 border border-panel-750 space-y-3">
              <div className="w-10 h-10 rounded-xl bg-circuit-500/10 border border-circuit-500/30 flex items-center justify-center text-circuit-400">
                <Download className="w-5 h-5" />
              </div>
              <h3 className="font-display font-semibold text-base text-white">
                Media Downloader
              </h3>
              <p className="text-xs text-gray-400 leading-relaxed">
                Unduh video TikTok tanpa tanda air, reels Instagram, dan video YouTube langsung melalui perintah chat ringkas.
              </p>
            </div>

            {/* Feat 3 */}
            <div className="p-6 rounded-2xl bg-panel-900 border border-panel-750 space-y-3">
              <div className="w-10 h-10 rounded-xl bg-circuit-500/10 border border-circuit-500/30 flex items-center justify-center text-circuit-400">
                <MessageSquareReply className="w-5 h-5" />
              </div>
              <h3 className="font-display font-semibold text-base text-white">
                Auto-Reply &amp; FAQ Toko
              </h3>
              <p className="text-xs text-gray-400 leading-relaxed">
                Jawab pertanyaan rutin seperti jam operasional, pricelist, dan aturan grup secara otomatis 24 jam nonstop.
              </p>
            </div>

            {/* Feat 4 */}
            <div className="p-6 rounded-2xl bg-panel-900 border border-panel-750 space-y-3">
              <div className="w-10 h-10 rounded-xl bg-circuit-500/10 border border-circuit-500/30 flex items-center justify-center text-circuit-400">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <h3 className="font-display font-semibold text-base text-white">
                Grup Tools &amp; Anti-Link
              </h3>
              <p className="text-xs text-gray-400 leading-relaxed">
                Sambutan member baru otomatis, pencegahan link spam berbahaya di grup, dan utilitas administrasi praktis.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Architecture & Anti-Abuse Section (§2, §8) */}
      <section id="arsitektur" className="py-20 px-6 lg:px-12 border-t border-panel-750">
        <div className="max-w-5xl mx-auto space-y-12">
          <div className="text-center space-y-3 max-w-2xl mx-auto">
            <span className="text-xs font-mono text-circuit-400 uppercase tracking-wider">
              Arsitektur Terpisah &amp; Keamanan Sesi §2
            </span>
            <h2 className="font-display font-bold text-3xl sm:text-4xl text-white tracking-tight">
              Kenapa Dashboard &amp; Bot Worker Dipisah?
            </h2>
            <p className="text-xs sm:text-sm text-gray-400">
              Bot WhatsApp memerlukan koneksi socket persisten yang hidup 24/7, tidak dapat dijalankan di dalam serverless function yang auto-mati.
            </p>
          </div>

          <div className="p-8 rounded-2xl bg-panel-900 border border-panel-750 font-mono text-xs text-gray-300">
            <div className="flex flex-col md:flex-row items-center justify-between gap-6 text-center md:text-left">
              <div className="p-4 rounded-xl bg-panel-800 border border-panel-700 w-full md:w-1/3">
                <div className="text-circuit-400 font-bold mb-1">1. Next.js Dashboard</div>
                <div className="text-[11px] text-gray-400">
                  Antarmuka visual untuk remote control, toggle modul, scanner QR, dan audit log.
                </div>
              </div>

              <div className="text-circuit-400 font-bold">&harr; API / WS &harr;</div>

              <div className="p-4 rounded-xl bg-panel-800 border border-panel-700 w-full md:w-1/3">
                <div className="text-live-400 font-bold mb-1">2. Baileys Worker (Node.js)</div>
                <div className="text-[11px] text-gray-400">
                  Proses 24/7 di VPS/Railway menjaga koneksi WebSocket multi-device tetap hidup.
                </div>
              </div>

              <div className="text-circuit-400 font-bold">&harr; Auth &harr;</div>

              <div className="p-4 rounded-xl bg-panel-800 border border-panel-700 w-full md:w-1/3">
                <div className="text-module-amber font-bold mb-1">3. Supabase Cloud</div>
                <div className="text-[11px] text-gray-400">
                  Penyimpanan sesi kredensial terenkripsi, konfigurasi modul, dan log tersamar.
                </div>
              </div>
            </div>
          </div>

          {/* Ethics Box (§8) */}
          <div id="anti-abuse" className="p-6 rounded-2xl bg-panel-900 border border-circuit-500/30 space-y-3">
            <div className="flex items-center gap-2 text-white font-semibold text-sm">
              <ShieldCheck className="w-5 h-5 text-live-400" />
              <span>Komitmen Privasi &amp; Kepatuhan Anti-Banned (§8)</span>
            </div>
            <p className="text-xs text-gray-300 leading-relaxed">
              Platform Verand.Bot secara ketat membatasi pengiriman pesan dengan <strong>Adaptive Rate Limiting (default 3–5 detik)</strong> dan <strong>masking nomor pengirim</strong> (<code className="text-circuit-400 font-mono">62812***456</code>). Dirancang khusus untuk komunitas kecil dan otomasi personal yang bertanggung jawab.
            </p>
          </div>
        </div>
      </section>

      {/* Footer (§4.1 Disclaimer) */}
      <footer className="py-12 px-6 lg:px-12 border-t border-panel-750 bg-panel-950 text-xs text-gray-400">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Cpu className="w-4 h-4 text-circuit-400" />
            <span className="font-display font-bold text-white">VERAND.BOT</span>
            <span>&copy; 2026. Platform Kontrol Bot WhatsApp.</span>
          </div>

          <p className="text-[11px] max-w-md text-center sm:text-right text-gray-400">
            Layanan pihak ketiga independen. Tidak berafiliasi resmi dengan WhatsApp atau Meta Platforms, Inc. Gunakan sesuai kebijakan dan etika wajar anti-spam.
          </p>
        </div>
      </footer>
    </div>
  );
}
