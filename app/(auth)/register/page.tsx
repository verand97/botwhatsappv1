'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Cpu, ArrowRight, Lock, Mail, User, ShieldCheck } from 'lucide-react';

export default function RegisterPage() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleRegister = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setTimeout(() => {
      router.push('/dashboard');
    }, 600);
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
            Buat Akun Kendali.Bot
          </h1>
          <p className="text-xs text-gray-400">
            Daftar untuk mengelola dan memonitor bot WhatsApp pribadi Anda
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleRegister} className="space-y-4 text-xs">
          <div>
            <label className="block font-mono text-gray-400 mb-1">
              Nama Lengkap
            </label>
            <div className="relative">
              <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="mis. Budi Santoso"
                className="w-full pl-10 pr-3.5 py-2.5 rounded-xl bg-panel-800 border border-panel-700 text-white font-sans placeholder-gray-500 focus:border-circuit-500 focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block font-mono text-gray-400 mb-1">
              Alamat Email
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
            <label className="block font-mono text-gray-400 mb-1">
              Kata Sandi
            </label>
            <div className="relative">
              <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Minimal 8 karakter"
                className="w-full pl-10 pr-3.5 py-2.5 rounded-xl bg-panel-800 border border-panel-700 text-white font-mono placeholder-gray-500 focus:border-circuit-500 focus:outline-none"
              />
            </div>
          </div>

          <div className="p-3 rounded-xl bg-panel-800 border border-panel-700 text-[11px] text-gray-400 leading-relaxed flex items-start gap-2">
            <ShieldCheck className="w-4 h-4 text-live-400 shrink-0 mt-0.5" />
            <span>Dengan mendaftar, Anda menyetujui penggunaan bot secara bertanggung jawab sesuai kebijakan anti-spam WhatsApp.</span>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 rounded-xl bg-circuit-500 hover:bg-circuit-400 text-white font-bold text-xs transition-all shadow-md shadow-circuit-500/25 flex items-center justify-center gap-2"
          >
            <span>{loading ? 'Memproses Akun...' : 'Daftar Sekarang'}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        {/* Login Link */}
        <div className="text-center text-xs text-gray-400">
          Sudah memiliki akun?{' '}
          <Link href="/login" className="text-circuit-400 font-semibold hover:underline">
            Masuk di sini
          </Link>
        </div>
      </div>
    </div>
  );
}
