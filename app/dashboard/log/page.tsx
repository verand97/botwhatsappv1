'use client';

import React, { useState, useEffect } from 'react';
import { useBot } from '@/lib/store/botStore';
import ActivityLogRow from '@/components/dashboard/ActivityLogRow';
import {
  ScrollText,
  Filter,
  Trash2,
  Download,
  Play,
  Pause,
  Terminal,
  Search,
  CheckCircle2,
  Clock,
  XCircle,
} from 'lucide-react';

export default function ActivityLogPage() {
  const { logs, clearLogs, addLog, features } = useBot();
  const [filterStatus, setFilterStatus] = useState<'all' | 'success' | 'rate_limited' | 'failed'>('all');
  const [filterFeature, setFilterFeature] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [isLiveStream, setIsLiveStream] = useState(true);

  // Simulated occasional traffic when live stream is active
  useEffect(() => {
    if (!isLiveStream) return;
    const interval = setInterval(() => {
      // 20% chance to simulate a random incoming request every 8 seconds
      if (Math.random() < 0.25) {
        const randomSenders = ['62813***891', '62857***223', '62878***440', '62812***772'];
        const randomSender = randomSenders[Math.floor(Math.random() * randomSenders.length)];
        const sampleCommands = [
          { feat: 'sticker_maker', cmd: '!s (gambar masuk 512x512)', name: 'Stiker Maker' },
          { feat: 'downloader', cmd: '!dl https://vt.tiktok.com/ZS.../', name: 'Media Downloader' },
          { feat: 'ai_chat', cmd: '!ai rekomendasi film sci-fi', name: 'AI Chat' },
          { feat: 'auto_reply', cmd: 'halo kak apakah bot aktif?', name: 'Auto-Reply' },
        ];
        const picked = sampleCommands[Math.floor(Math.random() * sampleCommands.length)];

        addLog({
          feature_key: picked.feat,
          feature_name: picked.name,
          command: picked.cmd,
          sender_masked: randomSender,
          status: 'success',
          execution_time_ms: Math.floor(Math.random() * 400) + 120,
          detail: 'Incoming socket message processed successfully.',
        });
      }
    }, 8000);

    return () => clearInterval(interval);
  }, [isLiveStream, addLog]);

  const filteredLogs = logs.filter((log) => {
    const matchesStatus = filterStatus === 'all' || log.status === filterStatus;
    const matchesFeature = filterFeature === 'all' || log.feature_key === filterFeature;
    const matchesSearch =
      log.command.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.sender_masked.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.feature_name.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesStatus && matchesFeature && matchesSearch;
  });

  const handleExportJSON = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(logs, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `kendali_logs_${new Date().toISOString().slice(0, 10)}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  return (
    <div className="space-y-6">
      {/* Title & Live Status Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-mono text-circuit-400 uppercase tracking-wider mb-1">
            <ScrollText className="w-3.5 h-3.5" />
            <span>Audit Trail &amp; Debug Stream §4.4</span>
          </div>
          <h1 className="font-display font-bold text-2xl sm:text-3xl text-white tracking-tight">
            Log Aktivitas Real-time
          </h1>
          <p className="text-xs sm:text-sm text-gray-400 mt-1 max-w-2xl">
            Pantau eksekusi perintah masuk dari WhatsApp. Seluruh nomor pengirim disamarkan otomatis (<code className="text-circuit-400 font-mono">62812***456</code>) sesuai prinsip privasi data §7.
          </p>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2.5">
          <button
            onClick={() => setIsLiveStream(!isLiveStream)}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-mono font-medium transition-all ${
              isLiveStream
                ? 'bg-live-400/20 text-live-400 border border-live-400/40 glow-live'
                : 'bg-panel-900 text-gray-400 border border-panel-750'
            }`}
          >
            {isLiveStream ? (
              <>
                <Pause className="w-3.5 h-3.5" />
                <span>Live Feed Aktif</span>
              </>
            ) : (
              <>
                <Play className="w-3.5 h-3.5" />
                <span>Jeda Feed</span>
              </>
            )}
          </button>

          <button
            onClick={handleExportJSON}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-panel-900 hover:bg-panel-800 text-gray-300 border border-panel-750 text-xs font-medium transition-colors"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Ekspor JSON</span>
          </button>

          <button
            onClick={clearLogs}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-panel-900 hover:bg-alert-500/20 text-gray-400 hover:text-alert-500 border border-panel-750 text-xs font-medium transition-colors"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Bersihkan</span>
          </button>
        </div>
      </div>

      {/* Filters Strip */}
      <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3 p-3 rounded-2xl bg-panel-900 border border-panel-750">
        {/* Status Filter Tabs */}
        <div className="flex items-center gap-1.5 text-xs overflow-x-auto">
          <button
            onClick={() => setFilterStatus('all')}
            className={`px-3 py-1.5 rounded-lg transition-colors font-mono ${
              filterStatus === 'all'
                ? 'bg-panel-800 text-white border border-panel-700 font-semibold'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            Semua ({logs.length})
          </button>
          <button
            onClick={() => setFilterStatus('success')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-colors font-mono ${
              filterStatus === 'success'
                ? 'bg-live-400/20 text-live-400 border border-live-400/40 font-semibold'
                : 'text-gray-400 hover:text-live-400'
            }`}
          >
            <CheckCircle2 className="w-3 h-3" />
            Sukses ({logs.filter((l) => l.status === 'success').length})
          </button>
          <button
            onClick={() => setFilterStatus('rate_limited')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-colors font-mono ${
              filterStatus === 'rate_limited'
                ? 'bg-module-amber/20 text-module-amber border border-module-amber/40 font-semibold'
                : 'text-gray-400 hover:text-module-amber'
            }`}
          >
            <Clock className="w-3 h-3" />
            Rate-Limited ({logs.filter((l) => l.status === 'rate_limited').length})
          </button>
          <button
            onClick={() => setFilterStatus('failed')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-colors font-mono ${
              filterStatus === 'failed'
                ? 'bg-alert-500/20 text-alert-500 border border-alert-500/40 font-semibold'
                : 'text-gray-400 hover:text-alert-500'
            }`}
          >
            <XCircle className="w-3 h-3" />
            Gagal ({logs.filter((l) => l.status === 'failed').length})
          </button>
        </div>

        {/* Feature Selector & Search Box */}
        <div className="flex items-center gap-2">
          <select
            value={filterFeature}
            onChange={(e) => setFilterFeature(e.target.value)}
            className="px-3 py-1.5 rounded-xl bg-panel-800 border border-panel-700 text-xs text-white focus:outline-none font-mono"
          >
            <option value="all">Semua Fitur</option>
            {features.map((f) => (
              <option key={f.feature_key} value={f.feature_key}>
                {f.name}
              </option>
            ))}
          </select>

          <div className="relative flex-1 sm:w-56">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari command / pengirim..."
              className="w-full pl-8 pr-3 py-1.5 rounded-xl bg-panel-800 border border-panel-700 text-xs text-white placeholder-gray-400 focus:border-circuit-500 focus:outline-none font-mono"
            />
          </div>
        </div>
      </div>

      {/* Log Feed Rows Container */}
      <div className="p-4 rounded-2xl bg-panel-900 border border-panel-750 space-y-2">
        {filteredLogs.length > 0 ? (
          filteredLogs.map((log) => <ActivityLogRow key={log.id} log={log} />)
        ) : (
          <div className="p-12 text-center text-gray-400 font-mono text-xs">
            Tidak ada rekaman log yang sesuai kriteria filter.
          </div>
        )}
      </div>
    </div>
  );
}
