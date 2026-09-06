'use client';

import React, { useState } from 'react';
import Header from '@/components/dashboard/Header';
import Sidebar from '@/components/dashboard/Sidebar';
import BotSimulatorDrawer from '@/components/dashboard/BotSimulatorDrawer';
import { BotProvider } from '@/lib/store/botStore';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [simulatorOpen, setSimulatorOpen] = useState(false);

  return (
    <BotProvider>
      <div className="min-h-screen flex flex-col bg-panel-950 text-gray-200">
        <Header
          onOpenSimulator={() => setSimulatorOpen((prev) => !prev)}
          simulatorOpen={simulatorOpen}
        />
        <div className="flex-1 flex overflow-hidden">
          <Sidebar />
          <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 circuit-grid">
            <div className="max-w-7xl mx-auto">{children}</div>
          </main>
        </div>

        {/* Floating interactive simulator drawer */}
        <BotSimulatorDrawer
          isOpen={simulatorOpen}
          onClose={() => setSimulatorOpen(false)}
        />
      </div>
    </BotProvider>
  );
}
