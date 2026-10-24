"use client";

import { Megaphone, RotateCcw, Plus } from "lucide-react";

export default function Navbar({ user, language = "en", onLanguageChange, onOpenAuth, onResetDemo }) {
  const currentRole = user?.role ?? null;

  const handleReportClick = () =>
    document.getElementById("report-form")?.scrollIntoView({ behavior: "smooth", block: "start" });

  return (
    <>
      {/* ── Main nav bar ── */}
      <header className="sticky top-0 z-50 border-b border-slate-200/60 bg-white/80 shadow-sm backdrop-blur-md">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 gap-3">

            {/* Brand */}
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-9 h-9 shrink-0 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center shadow-lg shadow-indigo-500/30">
                <Megaphone className="w-5 h-5 text-white" />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-lg font-bold text-white tracking-tight leading-none">CampusEcho</span>
                </div>
              </div>
            </div>

            {/* Right controls */}
            <div className="flex items-center gap-2 sm:gap-3 shrink-0">
              <div role="group" aria-label="Language" className="flex items-center rounded-xl border border-slate-200 bg-slate-100 p-1">
                {[
                  { id: "en", label: "EN" },
                  { id: "bn", label: "বাংলা" },
                ].map((item) => (
                  <button key={item.id} onClick={() => onLanguageChange?.(item.id)}
                    aria-pressed={language === item.id}
                    className={`rounded-lg px-2.5 py-1 text-xs font-semibold transition-colors ${
                      language === item.id ? "bg-white text-indigo-700 shadow-sm" : "text-slate-600 hover:text-slate-900"
                    }`}>
                    {item.label}
                  </button>
                ))}
              </div>

              {user && (
                <div className="hidden lg:block max-w-44 text-right">
                  <p className="truncate text-xs font-semibold text-slate-200">{user.name}</p>
                  <p className="truncate text-[11px] text-slate-500">
                    {user.role === "student" ? user.department : user.designation}
                    {" · "}
                    <span className="font-mono text-slate-400">ID: {user.id}</span>
                  </p>
                </div>
              )}

              <button
                onClick={onOpenAuth}
                title="Switch account or log in with an IIUC account"
                className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-semibold text-slate-700 transition-all hover:border-indigo-300 hover:bg-indigo-50 hover:text-indigo-700 sm:px-3"
              >
                {language === "bn" ? "অ্যাকাউন্ট" : user ? "Switch account" : "Login"}
              </button>

              {/* Reset Demo */}
              <button
                onClick={onResetDemo}
                title="Reset to seed data"
                className="hidden items-center gap-1.5 rounded-lg border border-transparent px-3 py-1.5 text-xs font-medium text-slate-600 transition-all duration-200 hover:border-slate-200 hover:bg-slate-50 hover:text-slate-900 sm:flex"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                Reset Demo
              </button>

              {/* Report Issue CTA — hidden in authority mode */}
              {currentRole !== "authority" && (
                <button
                  onClick={currentRole === "student" ? handleReportClick : onOpenAuth}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white text-sm font-semibold shadow-lg shadow-indigo-500/25 transition-all duration-200 hover:shadow-indigo-500/40 hover:-translate-y-0.5 active:translate-y-0 whitespace-nowrap"
                >
                  <Plus className="w-4 h-4 shrink-0" />
                  <span>{currentRole === "student" ? "+ Report Issue" : "Login to Report"}</span>
                </button>
              )}
            </div>
          </div>
        </div>

        {user && (
          <div className="border-t border-slate-200 px-4 pb-2 text-center md:hidden">
            <p className="truncate text-xs font-semibold text-slate-200">{user.name}</p>
            <p className="truncate text-[11px] text-slate-500">
              {user.role === "student" ? user.department : user.designation}
              {" · "}
              <span className="font-mono text-slate-400">ID: {user.id}</span>
            </p>
          </div>
        )}

        {/* ── Authority Banner ── */}
        {currentRole === "authority" && (
          <div className="w-full bg-gradient-to-r from-amber-600/20 via-amber-500/15 to-amber-600/20 border-t border-amber-500/30 px-4 py-2">
            <p className="text-xs text-amber-300 text-center font-medium">
              🛡️ {user.name} · {user.id} · {user.designation}
            </p>
          </div>
        )}
      </header>

    </>
  );
}
