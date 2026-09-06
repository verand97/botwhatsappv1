'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useBot } from '@/lib/store/botStore';
import {
  Terminal,
  Send,
  X,
  Bot,
  User,
  Sparkles,
  AlertCircle,
  HelpCircle,
  Clock,
  CheckCheck,
} from 'lucide-react';

interface SimulatorMessage {
  id: string;
  sender: 'user' | 'bot';
  text: string;
  timestamp: string;
  isSticker?: boolean;
}

interface BotSimulatorDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function BotSimulatorDrawer({
  isOpen,
  onClose,
}: BotSimulatorDrawerProps) {
  const {
    executeSimulatedCommand,
    botInstance,
    rateLimit,
    features,
  } = useBot();

  const [inputMessage, setInputMessage] = useState('');
  const [messages, setMessages] = useState<SimulatorMessage[]>([
    {
      id: 'init-1',
      sender: 'bot',
      text: '🤖 Verand.Bot Simulator siap digunakan.\nKetik !menu untuk melihat perintah yang aktif di papan kontrol Verand Bot Anda, atau coba perintah cepat di bawah.',
      timestamp: new Date().toLocaleTimeString('id-ID', {
        hour: '2-digit',
        minute: '2-digit',
      }),
    },
  ]);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
    }
  }, [messages, isOpen]);

  const handleSend = (textToSend?: string) => {
    const text = (textToSend || inputMessage).trim();
    if (!text) return;

    const timeStr = new Date().toLocaleTimeString('id-ID', {
      hour: '2-digit',
      minute: '2-digit',
    });

    // Add user message
    const userMsg: SimulatorMessage = {
      id: 'user-' + Date.now(),
      sender: 'user',
      text: text,
      timestamp: timeStr,
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputMessage('');

    // Small delay to simulate socket trip
    setTimeout(() => {
      const result = executeSimulatedCommand('628129999456', text);
      const botMsg: SimulatorMessage = {
        id: 'bot-' + Date.now(),
        sender: 'bot',
        text: result.response,
        timestamp: new Date().toLocaleTimeString('id-ID', {
          hour: '2-digit',
          minute: '2-digit',
        }),
      };
      setMessages((prev) => [...prev, botMsg]);
    }, 150);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50 w-full max-w-md h-140 flex flex-col rounded-2xl bg-panel-950 border border-panel-700 shadow-2xl shadow-black/80 overflow-hidden animate-slideUp">
      {/* Simulator Top Header */}
      <div className="flex items-center justify-between px-4 py-3 bg-panel-900 border-b border-panel-750">
        <div className="flex items-center gap-2.5">
          <div className="relative w-8 h-8 rounded-lg bg-circuit-500/20 border border-circuit-500/40 flex items-center justify-center text-circuit-400">
            <Bot className="w-4 h-4" />
            <span
              className={`absolute -bottom-0.5 -right-0.5 w-2 h-2 rounded-full ${
                botInstance.status === 'connected' ? 'bg-live-400' : 'bg-offline-500'
              }`}
            />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <h4 className="font-display font-bold text-xs text-white">
                Simulator WhatsApp Live
              </h4>
              <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-panel-800 text-circuit-400 border border-panel-700">
                Sandboxed
              </span>
            </div>
            <p className="text-[10px] text-gray-400 font-mono">
              Prefix: {rateLimit.command_prefix} • Cooldown: {rateLimit.cooldown_seconds}s
            </p>
          </div>
        </div>

        <button
          onClick={onClose}
          className="p-1 rounded-lg hover:bg-panel-800 text-gray-400 hover:text-white transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Quick Command Suggestions Chips */}
      <div className="px-3 py-2 bg-panel-950/90 border-b border-panel-800/80 flex items-center gap-1.5 overflow-x-auto text-[11px] font-mono">
        <span className="text-gray-400 shrink-0">Tes Cepat:</span>
        <button
          onClick={() => handleSend(`${rateLimit.command_prefix}menu`)}
          className="px-2 py-0.5 rounded-full bg-panel-800 hover:bg-panel-750 text-circuit-400 border border-panel-700 shrink-0"
        >
          {rateLimit.command_prefix}menu
        </button>
        <button
          onClick={() => handleSend(`${rateLimit.command_prefix}sticker`)}
          className="px-2 py-0.5 rounded-full bg-panel-800 hover:bg-panel-750 text-live-400 border border-panel-700 shrink-0"
        >
          {rateLimit.command_prefix}sticker
        </button>
        <button
          onClick={() => handleSend(`${rateLimit.command_prefix}tomedia`)}
          className="px-2 py-0.5 rounded-full bg-panel-800 hover:bg-panel-750 text-gray-300 border border-panel-700 shrink-0"
        >
          {rateLimit.command_prefix}tomedia
        </button>
        <button
          onClick={() => handleSend(`${rateLimit.command_prefix}dl https://tiktok.com/@creator/video/1`)}
          className="px-2 py-0.5 rounded-full bg-panel-800 hover:bg-panel-750 text-gray-300 border border-panel-700 shrink-0"
        >
          {rateLimit.command_prefix}dl
        </button>
        <button
          onClick={() => handleSend(`${rateLimit.command_prefix}ai buatkan pantun bot`)}
          className="px-2 py-0.5 rounded-full bg-panel-800 hover:bg-panel-750 text-module-amber border border-panel-700 shrink-0"
        >
          {rateLimit.command_prefix}ai
        </button>
      </div>

      {/* Messages Scroll Area (WhatsApp Dark Style) */}
      <div className="flex-1 p-4 overflow-y-auto space-y-3 bg-[#0d1013] circuit-grid-dense">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex flex-col ${
              msg.sender === 'user' ? 'items-end' : 'items-start'
            }`}
          >
            <div
              className={`max-w-[85%] rounded-2xl px-3.5 py-2.5 text-xs shadow-md ${
                msg.sender === 'user'
                  ? 'bg-circuit-600 text-white rounded-tr-none'
                  : 'bg-panel-800 text-gray-200 border border-panel-700/80 rounded-tl-none'
              }`}
            >
              <p className="whitespace-pre-wrap leading-relaxed font-sans">
                {msg.text}
              </p>
              <div
                className={`mt-1 flex items-center justify-end gap-1 text-[10px] font-mono ${
                  msg.sender === 'user' ? 'text-circuit-200' : 'text-gray-400'
                }`}
              >
                <span>{msg.timestamp}</span>
                {msg.sender === 'user' && (
                  <CheckCheck className="w-3 h-3 text-circuit-300" />
                )}
              </div>
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* Message Input Bar */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleSend();
        }}
        className="p-3 bg-panel-900 border-t border-panel-750 flex items-center gap-2"
      >
        <input
          type="text"
          value={inputMessage}
          onChange={(e) => setInputMessage(e.target.value)}
          placeholder={`Ketik ${rateLimit.command_prefix}sticker atau pesan...`}
          className="flex-1 px-3.5 py-2 rounded-xl bg-panel-800 border border-panel-700 text-white text-xs placeholder-gray-500 focus:border-circuit-500 focus:outline-none font-mono"
        />
        <button
          type="submit"
          className="p-2.5 rounded-xl bg-circuit-500 hover:bg-circuit-400 text-white transition-colors shadow-sm"
        >
          <Send className="w-4 h-4" />
        </button>
      </form>
    </div>
  );
}
