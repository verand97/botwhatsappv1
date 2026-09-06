'use client';

import React, { useState } from 'react';
import { FeatureConfig } from '@/lib/types';
import { useBot } from '@/lib/store/botStore';
import {
  Sticker,
  Image as ImageIcon,
  Download,
  MessageSquareReply,
  Users,
  Bot,
  Volume2,
  Gamepad2,
  ChevronDown,
  ChevronUp,
  Settings2,
  Check,
  Zap,
} from 'lucide-react';

const ICON_MAP: Record<string, React.ElementType> = {
  sticker_maker: Sticker,
  sticker_to_media: ImageIcon,
  downloader: Download,
  auto_reply: MessageSquareReply,
  group_tools: Users,
  ai_chat: Bot,
  tts_converter: Volume2,
  text_games: Gamepad2,
};

interface ModuleCardProps {
  feature: FeatureConfig;
}

export default function ModuleCard({ feature }: ModuleCardProps) {
  const { toggleFeature, updateFeatureTrigger, updateFeatureSettings } = useBot();
  const [expanded, setExpanded] = useState(false);
  const [triggerInput, setTriggerInput] = useState(feature.command_trigger);
  const [packName, setPackName] = useState(feature.extra_settings.pack_name || '');
  const [authorName, setAuthorName] = useState(feature.extra_settings.author_name || '');
  const [saveToast, setSaveToast] = useState(false);

  const IconComponent = ICON_MAP[feature.feature_key] || Zap;

  const handleSaveSettings = (e: React.FormEvent) => {
    e.preventDefault();
    updateFeatureTrigger(feature.id, triggerInput);
    updateFeatureSettings(feature.id, {
      pack_name: packName,
      author_name: authorName,
    });
    setSaveToast(true);
    setTimeout(() => setSaveToast(false), 2000);
  };

  return (
    <div
      className={`relative rounded-xl border transition-all duration-300 overflow-hidden bg-panel-800 ${
        feature.is_enabled
          ? 'border-circuit-500/50 shadow-lg shadow-circuit-500/10'
          : 'border-panel-700/70 opacity-85 hover:opacity-100 hover:border-panel-600'
      }`}
    >
      {/* Decorative Circuit Board Background Accents */}
      <div className="absolute top-0 right-0 w-24 h-24 bg-linear-to-bl from-circuit-500/5 to-transparent pointer-events-none" />

      {/* SVG Circuit Energy Line (Signature Element §3.3) */}
      {/* Draws a glowing animated circuit conduit between the toggle switch and the module chip */}
      <svg
        className="absolute inset-0 w-full h-24 pointer-events-none overflow-visible"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          d="M 40 32 L 90 32 L 110 52 L 200 52"
          fill="none"
          stroke={feature.is_enabled ? '#4C8FE0' : '#29303a'}
          strokeWidth="1.5"
          className={feature.is_enabled ? 'animate-energy-flow' : ''}
          strokeOpacity={feature.is_enabled ? 0.85 : 0.3}
        />
        {/* PCB Solder Pad dots */}
        <circle
          cx="40"
          cy="32"
          r="2.5"
          fill={feature.is_enabled ? '#4C8FE0' : '#374151'}
          className={feature.is_enabled ? 'shadow-sm shadow-circuit-500' : ''}
        />
        <circle
          cx="110"
          cy="52"
          r="2"
          fill={feature.is_enabled ? '#6aa5ed' : '#374151'}
        />
      </svg>

      {/* Card Header & Controls */}
      <div className="relative p-5 z-10">
        <div className="flex items-start justify-between gap-4">
          {/* Module Icon / Chip */}
          <div className="flex items-center gap-3.5">
            <div
              className={`relative flex items-center justify-center w-12 h-12 rounded-xl border transition-all duration-300 ${
                feature.is_enabled
                  ? 'bg-circuit-500/15 border-circuit-500 text-circuit-400 shadow-md shadow-circuit-500/30'
                  : 'bg-panel-900 border-panel-700 text-gray-500'
              }`}
            >
              <IconComponent className="w-6 h-6 transition-transform duration-300 group-hover:scale-110" />
              {feature.is_enabled && (
                <span className="absolute -bottom-1 -right-1 w-2.5 h-2.5 rounded-full bg-live-400 ring-2 ring-panel-800" />
              )}
            </div>

            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-display font-semibold text-base text-white tracking-tight">
                  {feature.name}
                </h3>
                {feature.is_beta && (
                  <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-module-amber/20 text-module-amber border border-module-amber/30">
                    BETA
                  </span>
                )}
              </div>
              <span className="text-xs font-mono text-gray-400 flex items-center gap-1.5 mt-0.5">
                Trigger:
                <code className="text-circuit-400 bg-panel-900 px-1.5 py-0.5 rounded border border-panel-750 font-bold">
                  {feature.command_trigger}
                </code>
              </span>
            </div>
          </div>

          {/* Toggle Switch (Hardware style) */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => toggleFeature(feature.id)}
              type="button"
              role="switch"
              aria-checked={feature.is_enabled}
              className={`relative inline-flex h-6 w-12 shrink-0 cursor-pointer rounded-full border-2 transition-colors duration-200 ease-in-out focus:outline-none focus-visible:ring-2 focus-visible:ring-circuit-500 ${
                feature.is_enabled
                  ? 'bg-circuit-500 border-circuit-400 shadow-md shadow-circuit-500/30'
                  : 'bg-panel-900 border-panel-700'
              }`}
            >
              <span className="sr-only">Toggle {feature.name}</span>
              <span
                className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out ${
                  feature.is_enabled ? 'translate-x-6' : 'translate-x-0 bg-gray-400'
                }`}
              />
            </button>
          </div>
        </div>

        {/* Tagline / Description */}
        <p className="mt-3 text-xs text-gray-300 leading-relaxed min-h-8.5">
          {feature.tagline}
        </p>

        {/* Aliases & Quick Tags */}
        <div className="mt-3 flex items-center justify-between pt-3 border-t border-panel-750 text-xs">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-[11px] text-gray-400 font-mono">Alias:</span>
            {feature.aliases.map((alias) => (
              <span
                key={alias}
                className="text-[11px] font-mono px-1.5 py-0.2 rounded bg-panel-900 text-gray-400 border border-panel-750"
              >
                {alias}
              </span>
            ))}
          </div>

          <button
            onClick={() => setExpanded(!expanded)}
            className="flex items-center gap-1 text-xs text-circuit-400 hover:text-circuit-300 font-medium py-1 px-2 rounded hover:bg-panel-750 transition-colors"
          >
            <Settings2 className="w-3.5 h-3.5" />
            <span>{expanded ? 'Tutup' : 'Konfigurasi'}</span>
            {expanded ? (
              <ChevronUp className="w-3 h-3" />
            ) : (
              <ChevronDown className="w-3 h-3" />
            )}
          </button>
        </div>
      </div>

      {/* Expandable Module Specific Settings (§5) */}
      {expanded && (
        <div className="px-5 pb-5 pt-2 border-t border-panel-750 bg-panel-900/90 z-20 relative animate-fadeIn">
          <form onSubmit={handleSaveSettings} className="space-y-3.5 text-xs">
            {/* Command Trigger Customizer */}
            <div>
              <label className="block text-gray-400 font-mono text-[11px] mb-1">
                Custom Command Trigger
              </label>
              <input
                type="text"
                value={triggerInput}
                onChange={(e) => setTriggerInput(e.target.value)}
                placeholder="mis. !s atau !stiker"
                className="w-full px-3 py-1.5 rounded-lg bg-panel-800 border border-panel-700 text-white font-mono focus:border-circuit-500 focus:outline-none"
              />
            </div>

            {/* Sticker Maker Specific Settings (§5.1) */}
            {feature.feature_key === 'sticker_maker' && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-gray-400 font-mono text-[11px] mb-1">
                    Nama Pack Stiker (EXIF)
                  </label>
                  <input
                    type="text"
                    value={packName}
                    onChange={(e) => setPackName(e.target.value)}
                    placeholder="Verand Pack"
                    className="w-full px-3 py-1.5 rounded-lg bg-panel-800 border border-panel-700 text-white focus:border-circuit-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-gray-400 font-mono text-[11px] mb-1">
                    Author / Pembuat (EXIF)
                  </label>
                  <input
                    type="text"
                    value={authorName}
                    onChange={(e) => setAuthorName(e.target.value)}
                    placeholder="Made with Verand.Bot"
                    className="w-full px-3 py-1.5 rounded-lg bg-panel-800 border border-panel-700 text-white focus:border-circuit-500 focus:outline-none"
                  />
                </div>
              </div>
            )}

            {/* Downloader Supported Platforms info */}
            {feature.feature_key === 'downloader' && (
              <div className="p-2.5 rounded bg-panel-800 border border-panel-700 text-gray-300 text-[11px]">
                💡 <span className="font-semibold text-white">Platform Didukung:</span> TikTok (No WM), Instagram Reels, YouTube Video/Audio. Bot otomatis mengompresi bila melebihi batas WhatsApp.
              </div>
            )}

            {/* AI Chat Prompt Info */}
            {feature.feature_key === 'ai_chat' && (
              <div>
                <label className="block text-gray-400 font-mono text-[11px] mb-1">
                  System Persona Prompt
                </label>
                <input
                  type="text"
                  defaultValue={feature.extra_settings.ai_system_prompt}
                  className="w-full px-3 py-1.5 rounded-lg bg-panel-800 border border-panel-700 text-white focus:border-circuit-500 focus:outline-none"
                />
              </div>
            )}

            {/* Save Button */}
            <div className="flex items-center justify-between pt-1">
              <span className="text-[11px] text-gray-400 font-mono">
                {saveToast ? (
                  <span className="text-live-400 flex items-center gap-1 font-semibold">
                    <Check className="w-3.5 h-3.5" /> Konfigurasi tersimpan!
                  </span>
                ) : (
                  'Terapkan langsung ke Baileys worker'
                )}
              </span>
              <button
                type="submit"
                className="px-3 py-1.5 rounded-lg bg-circuit-500 hover:bg-circuit-400 text-white font-medium text-xs transition-colors shadow-sm"
              >
                Simpan Konfigurasi
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
