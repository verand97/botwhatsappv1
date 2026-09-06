'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Cpu, ArrowRight, Lock, Mail, Sparkles, ShieldCheck } from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('demo@kendalibot.local');
  const [password, setPassword] = useState('••••••••••••');
  const [loading, setLoading] = useState(false);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setTimeout(() => {
      router.push('/dashboard');
    }, 600);
  };

  const handleInstantDemo = () => {
    setLoading(true);
    setTimeout(() => {
      router.push('/dashboard');
    }, 400);
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-panel-950 circuit-grid">
      <div className="w-full max-w-md p-8 rounded-3xl bg-panel-900 border border-panel-750 shadow-2xl space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <Link
            href="/"
            className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-panel-800 border border-panel-700 text-circuit-400 mb-2 glow-circuit"
          >
            <Cpu className="w-6 h-6" />
          </Link>
          <h1 className="font-display font-bold text-2xl text-white tracking-tight">
            Masuk ke Pusat Kendali
          </h1>
          <p className="text-xs text-gray-400">
            Akses dashboard visual untuk mengatur bot WhatsApp Anda
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleLogin} className="space-y-4 text-xs">
          <div>
            <label className="block font-mono text-gray-400 mb-1">
              Email Pengguna
            </label>
            <div className="relative">
              <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="nama@email.com"
                className="w-full pl-10 pr-3.5 py-2.5 rounded-xl bg-panel-800 border border-panel-700 text-white font-mono placeholder-gray-500 focus:border-circuit-500 focus:outline-none"
              />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="font-mono text-gray-400">Kata Sandi</label>
              <a href="#" className="text-circuit-400 hover:underline text-[11px]">
                Lupa sandi?
              </a>
            </div>
            <div className="relative">
              <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-10 pr-3.5 py-2.5 rounded-xl bg-panel-800 border border-panel-700 text-white font-mono placeholder-gray-500 focus:border-circuit-500 focus:outline-none"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 rounded-xl bg-circuit-500 hover:bg-circuit-400 text-white font-bold text-xs transition-all shadow-md shadow-circuit-500/25 flex items-center justify-center gap-2"
          >
            <span>{loading ? 'Mengautentikasi...' : 'Masuk Dashboard'}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        {/* Demo Fast Access Button */}
        <div className="pt-2 border-t border-panel-750">
          <button
            type="button"
            onClick={handleInstantDemo}
            className="w-full py-2.5 rounded-xl bg-live-400/15 hover:bg-live-400/25 text-live-400 border border-live-400/30 font-semibold text-xs transition-colors flex items-center justify-center gap-2"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Akses Cepat Mode Demo (Tanpa Akun)</span>
          </button>
        </div>

        {/* Register Link */}
        <div className="text-center text-xs text-gray-400">
          Belum punya akun?{' '}
          <Link href="/register" className="text-circuit-400 font-semibold hover:underline">
            Daftar sekarang
          </Link>
        </div>
      </div>
    </div>
  );
}
