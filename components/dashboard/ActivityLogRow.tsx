'use client';

import React, { useState } from 'react';
import { ActivityLog } from '@/lib/types';
import {
  CheckCircle2,
  Clock,
  ShieldAlert,
  XCircle,
  ChevronRight,
  Info,
  Terminal,
} from 'lucide-react';

interface ActivityLogRowProps {
  log: ActivityLog;
}

export default function ActivityLogRow({ log }: ActivityLogRowProps) {
  const [showDetail, setShowDetail] = useState(false);

  const formattedTime = new Date(log.created_at).toLocaleTimeString('id-ID', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });

  return (
    <>
      <div
        onClick={() => setShowDetail(!showDetail)}
        className="group flex items-center justify-between gap-3 px-4 py-3 rounded-xl bg-panel-850 hover:bg-panel-800 border border-panel-750/70 hover:border-panel-700 transition-all duration-200 cursor-pointer text-xs font-mono"
      >
        {/* Left: Status Icon & Feature Badge */}
        <div className="flex items-center gap-3 min-w-0">
          {log.status === 'success' && (
            <div className="w-5 h-5 rounded-full bg-live-400/15 border border-live-400/30 flex items-center justify-center text-live-400 shrink-0">
              <CheckCircle2 className="w-3.5 h-3.5" />
            </div>
          )}
          {log.status === 'rate_limited' && (
            <div className="w-5 h-5 rounded-full bg-module-amber/15 border border-module-amber/30 flex items-center justify-center text-module-amber shrink-0">
              <Clock className="w-3.5 h-3.5" />
            </div>
          )}
          {log.status === 'failed' && (
            <div className="w-5 h-5 rounded-full bg-alert-500/15 border border-alert-500/30 flex items-center justify-center text-alert-500 shrink-0">
              <XCircle className="w-3.5 h-3.5" />
            </div>
          )}

          <div className="flex items-center gap-2 truncate">
            <span className="px-2 py-0.5 rounded bg-panel-950 text-gray-400 border border-panel-750 text-[11px] shrink-0">
              {log.feature_name}
            </span>
            <span className="text-white font-semibold truncate group-hover:text-circuit-400 transition-colors">
              {log.command}
            </span>
          </div>
        </div>

        {/* Right: Sender (Masked §7) + Latency + Timestamp */}
        <div className="flex items-center gap-3 shrink-0 text-gray-400 text-[11px]">
          <span className="hidden sm:inline px-1.5 py-0.5 rounded bg-panel-900 border border-panel-750 text-gray-300">
            {log.sender_masked}
          </span>
          <span className="hidden md:inline text-gray-400">
            {log.execution_time_ms}ms
          </span>
          <span className="text-gray-400 font-mono">
            {formattedTime}
          </span>
          <ChevronRight
            className={`w-3.5 h-3.5 text-gray-400 group-hover:text-white transition-transform ${
              showDetail ? 'rotate-90 text-circuit-400' : ''
            }`}
          />
        </div>
      </div>

      {/* Expanded Payload / Detail Inspector */}
      {showDetail && (
        <div className="px-5 py-3 -mt-1 mb-2 rounded-b-xl bg-panel-950 border-x border-b border-panel-750 text-xs font-mono space-y-2 animate-fadeIn">
          <div className="flex items-center justify-between text-[11px] text-gray-400 border-b border-panel-800 pb-1.5">
            <span className="flex items-center gap-1.5 text-circuit-400">
              <Terminal className="w-3 h-3" /> Log Inspector ID: {log.id}
            </span>
            <span>Latency: {log.execution_time_ms} ms</span>
          </div>
          <p className="text-gray-300 leading-relaxed">
            <span className="text-gray-400">Detail: </span>
            {log.detail || 'Operasi selesai sesuai pipeline handler Baileys.'}
          </p>
          <div className="flex items-center gap-4 text-[11px] text-gray-400 pt-1">
            <span>Sender: <strong className="text-gray-300">{log.sender_masked}</strong> (Masked)</span>
            <span>Status: <strong className={log.status === 'success' ? 'text-live-400' : log.status === 'rate_limited' ? 'text-module-amber' : 'text-alert-500'}>{log.status.toUpperCase()}</strong></span>
          </div>
        </div>
      )}
    </>
  );
}
