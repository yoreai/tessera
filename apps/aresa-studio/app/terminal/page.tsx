// ARESA Studio - Terminal Emulator (Demo Mode)

'use client';

import Link from 'next/link';
import { Terminal as TerminalIcon, Info } from 'lucide-react';
import dynamic from 'next/dynamic';

// Dynamic import to avoid SSR issues
const DemoTerminal = dynamic(() => import('@/components/DemoTerminal'), { ssr: false });

export default function TerminalPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 text-white">
      {/* Top Bar */}
      <div className="border-b border-slate-700 bg-slate-900/50 backdrop-blur p-4">
        <div className="flex items-center justify-between max-w-7xl mx-auto">
          <div className="flex items-center gap-4">
            <Link href="/" className="text-2xl font-bold bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent">
              ARESA Studio
            </Link>
            <span className="text-slate-500">/</span>
            <span className="text-slate-300">Terminal</span>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 text-sm text-amber-400 bg-amber-400/10 px-3 py-1.5 rounded-full">
              <Info size={14} />
              <span>Demo Mode</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-slate-400">
              <TerminalIcon size={16} />
              <span>Interactive ARESA CLI</span>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto p-6 h-[calc(100vh-120px)]">
        <div className="bg-slate-900 rounded-lg border border-slate-700 overflow-hidden h-full flex flex-col">
          {/* Terminal header */}
          <div className="flex items-center gap-2 px-4 py-2 bg-slate-800 border-b border-slate-700">
            <div className="flex gap-1.5">
              <div className="w-3 h-3 rounded-full bg-red-500"></div>
              <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
              <div className="w-3 h-3 rounded-full bg-green-500"></div>
            </div>
            <span className="text-slate-400 text-sm ml-2">aresa — bash — 80×24</span>
          </div>
          
          {/* Terminal body */}
          <div className="flex-1 overflow-hidden">
            <DemoTerminal />
          </div>
        </div>
      </div>
    </div>
  );
}
