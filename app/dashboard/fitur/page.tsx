'use client';

import React, { useState } from 'react';
import { useBot } from '@/lib/store/botStore';
import ModuleCard from '@/components/dashboard/ModuleCard';
import {
  Sliders,
  Zap,
  Search,
  Filter,
  Sparkles,
  Layers,
  Cpu,
} from 'lucide-react';
import { FeatureCategory } from '@/lib/types';

export default function PapanModulPage() {
  const { features } = useBot();
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const activeCount = features.filter((f) => f.is_enabled).length;

  const filteredFeatures = features.filter((feat) => {
    const matchesCategory =
      selectedCategory === 'all' || feat.category === selectedCategory;
    const matchesSearch =
      feat.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      feat.command_trigger.toLowerCase().includes(searchQuery.toLowerCase()) ||
      feat.tagline.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const categories = [
    { id: 'all', label: 'Semua Modul', count: features.length },
    {
      id: 'core',
      label: 'Fitur Utama (Stiker)',
      count: features.filter((f) => f.category === 'core').length,
    },
    {
      id: 'media',
      label: 'Downloader',
      count: features.filter((f) => f.category === 'media').length,
    },
    {
      id: 'utility',
      label: 'Utilitas & Grup',
      count: features.filter((f) => f.category === 'utility').length,
    },
    {
      id: 'ai_fun',
      label: 'AI & Hiburan',
      count: features.filter((f) => f.category === 'ai_fun').length,
    },
  ];

  return (
    <div className="space-y-8">
      {/* Top Title & Circuit Stats Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-mono text-circuit-400 uppercase tracking-wider mb-1">
            <Cpu className="w-3.5 h-3.5" />
            <span>Papan Sirkuit Modular §3.3 &amp; §4.3</span>
          </div>
          <h1 className="font-display font-bold text-2xl sm:text-3xl text-white tracking-tight">
            Papan Modul Fitur Bot
          </h1>
          <p className="text-xs sm:text-sm text-gray-400 mt-1 max-w-2xl">
            Aktifkan atau nonaktifkan chip fungsionalitas bot Anda secara modular. Setiap saklar yang dinyalakan akan mengalirkan listrik sirkuit ke modul terkait.
          </p>
        </div>

        {/* Modules Counter Pill */}
        <div className="flex items-center gap-3 px-4 py-2.5 rounded-xl bg-panel-900 border border-panel-750 shrink-0">
          <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-circuit-500/20 text-circuit-400">
            <Zap className="w-4 h-4" />
          </div>
          <div>
            <div className="font-display font-bold text-sm text-white">
              {activeCount} / {features.length} Modul Aktif
            </div>
            <div className="text-[11px] text-live-400 font-mono">
              Ready respond to socket
            </div>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 p-2 rounded-2xl bg-panel-900 border border-panel-750">
        {/* Category Tabs */}
        <div className="flex items-center gap-1 overflow-x-auto p-1 text-xs">
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg whitespace-nowrap transition-all ${
                selectedCategory === cat.id
                  ? 'bg-circuit-500 text-white font-medium shadow-sm'
                  : 'text-gray-400 hover:text-white hover:bg-panel-800'
              }`}
            >
              <span>{cat.label}</span>
              <span
                className={`text-[10px] px-1 rounded-full font-mono ${
                  selectedCategory === cat.id
                    ? 'bg-circuit-600 text-white'
                    : 'bg-panel-800 text-gray-400'
                }`}
              >
                {cat.count}
              </span>
            </button>
          ))}
        </div>

        {/* Search input */}
        <div className="relative min-w-55 px-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Cari modul atau trigger..."
            className="w-full pl-9 pr-3 py-1.5 rounded-xl bg-panel-800 border border-panel-700 text-xs text-white placeholder-gray-400 focus:border-circuit-500 focus:outline-none font-mono"
          />
        </div>
      </div>

      {/* Modules Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {filteredFeatures.map((feature) => (
          <ModuleCard key={feature.id} feature={feature} />
        ))}
      </div>

      {filteredFeatures.length === 0 && (
        <div className="p-12 text-center rounded-2xl bg-panel-900 border border-panel-750 text-gray-400 text-xs">
          Tidak ada modul yang cocok dengan pencarian &quot;{searchQuery}&quot;.
        </div>
      )}
    </div>
  );
}
