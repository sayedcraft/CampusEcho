"use client";

import { Megaphone, Cpu, RotateCcw, Plus } from "lucide-react";

export default function Navbar({ onResetDemo }) {
  const handleReportClick = () => {
    document.getElementById("report-form")?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <header className="sticky top-0 z-50 bg-slate-900/95 backdrop-blur-md border-b border-slate-700/50 shadow-xl shadow-black/20">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-3">

          {/* ── Brand ── */}
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-9 h-9 shrink-0 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center shadow-lg shadow-indigo-500/30">
              <Megaphone className="w-5 h-5 text-white" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-lg font-bold text-white tracking-tight leading-none">
                  CampusEcho
                </span>
                <span className="hidden sm:inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 leading-none whitespace-nowrap">
                  IIUC Kumira Campus Edition
                </span>
              </div>
              <p className="text-xs text-slate-500 hidden sm:block mt-0.5 truncate">
                Every campus problem deserves to be heard.
              </p>
            </div>
          </div>

          {/* ── Right Controls ── */}
          <div className="flex items-center gap-2 sm:gap-3 shrink-0">

            {/* AI Status Pill */}
            <div className="hidden lg:flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-medium whitespace-nowrap">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse shrink-0" />
              <Cpu className="w-3 h-3 shrink-0" />
              Open-Weight AI: Ollama / Gemma
            </div>

            {/* Reset Demo */}
            <button
              onClick={onResetDemo}
              title="Reset to seed data"
              className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-slate-400 hover:text-slate-200 hover:bg-slate-800 border border-transparent hover:border-slate-700 transition-all duration-200"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              Reset Demo Data
            </button>

            {/* Report Issue CTA */}
            <button
              onClick={handleReportClick}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white text-sm font-semibold shadow-lg shadow-indigo-500/25 transition-all duration-200 hover:shadow-indigo-500/40 hover:-translate-y-0.5 active:translate-y-0 whitespace-nowrap"
            >
              <Plus className="w-4 h-4 shrink-0" />
              <span>+ Report Issue</span>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}
