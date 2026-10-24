"use client";

import { useState, useRef, useEffect } from "react";
import { Megaphone, Cpu, RotateCcw, Plus, ShieldCheck, GraduationCap, X, Eye, EyeOff } from "lucide-react";

const AUTHORITY_PIN = "iiuc2026";

export default function Navbar({ currentRole, onRoleChange, onResetDemo }) {
  const [showModal,   setShowModal]   = useState(false);
  const [pin,         setPin]         = useState("");
  const [showPin,     setShowPin]     = useState(false);
  const [pinError,    setPinError]    = useState(false);
  const pinRef = useRef(null);

  // Focus PIN input when modal opens
  useEffect(() => {
    if (showModal) {
      setPinError(false);
      setPin("");
      setTimeout(() => pinRef.current?.focus(), 80);
    }
  }, [showModal]);

  const handleReportClick = () =>
    document.getElementById("report-form")?.scrollIntoView({ behavior: "smooth", block: "start" });

  const handleRoleBtnClick = () => {
    if (currentRole === "authority") {
      onRoleChange("student");
    } else {
      setShowModal(true);
    }
  };

  const submitPin = () => {
    if (pin === AUTHORITY_PIN) {
      setShowModal(false);
      onRoleChange("authority");
    } else {
      setPinError(true);
      setPin("");
      pinRef.current?.focus();
    }
  };

  const judgeLogin = () => {
    setShowModal(false);
    onRoleChange("authority");
  };

  return (
    <>
      {/* ── Main nav bar ── */}
      <header className="sticky top-0 z-50 bg-slate-900/95 backdrop-blur-md border-b border-slate-700/50 shadow-xl shadow-black/20">
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
                  <span className="hidden sm:inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 leading-none whitespace-nowrap">
                    IIUC Kumira Campus Edition
                  </span>
                </div>
                <p className="text-xs text-slate-500 hidden sm:block mt-0.5 truncate">
                  Every campus problem deserves to be heard.
                </p>
              </div>
            </div>

            {/* Right controls */}
            <div className="flex items-center gap-2 sm:gap-3 shrink-0">

              {/* AI Status Pill */}
              <div className="hidden lg:flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-medium whitespace-nowrap">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse shrink-0" />
                <Cpu className="w-3 h-3 shrink-0" />
                Open-Weight AI: Ollama / Gemma
              </div>

              {/* Role switcher */}
              <button
                onClick={handleRoleBtnClick}
                title={currentRole === "authority" ? "Switch back to Student Mode" : "Switch to Authority Mode"}
                className={`hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all duration-200 ${
                  currentRole === "authority"
                    ? "bg-amber-500/20 text-amber-300 border-amber-500/40 hover:bg-amber-500/30"
                    : "bg-slate-800 text-slate-400 border-slate-700 hover:text-slate-200 hover:border-slate-600"
                }`}
              >
                {currentRole === "authority"
                  ? <><ShieldCheck className="w-3.5 h-3.5" /> Authority Mode</>
                  : <><GraduationCap className="w-3.5 h-3.5" /> Student Mode</>}
              </button>

              {/* Reset Demo */}
              <button
                onClick={onResetDemo}
                title="Reset to seed data"
                className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-slate-400 hover:text-slate-200 hover:bg-slate-800 border border-transparent hover:border-slate-700 transition-all duration-200"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                Reset Demo
              </button>

              {/* Report Issue CTA — hidden in authority mode */}
              {currentRole === "student" && (
                <button
                  onClick={handleReportClick}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white text-sm font-semibold shadow-lg shadow-indigo-500/25 transition-all duration-200 hover:shadow-indigo-500/40 hover:-translate-y-0.5 active:translate-y-0 whitespace-nowrap"
                >
                  <Plus className="w-4 h-4 shrink-0" />
                  <span>+ Report Issue</span>
                </button>
              )}
            </div>
          </div>
        </div>

        {/* ── Authority Banner ── */}
        {currentRole === "authority" && (
          <div className="w-full bg-gradient-to-r from-amber-600/20 via-amber-500/15 to-amber-600/20 border-t border-amber-500/30 px-4 py-2">
            <p className="text-xs text-amber-300 text-center font-medium">
              🛡️ <strong>Authority Dashboard Active</strong> — Logged in as IIUC Faculty / Facility Coordinator.
              You can now update statuses, post official remarks, and delete reports.
            </p>
          </div>
        )}
      </header>

      {/* ── PIN Modal ── */}
      {showModal && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center p-4"
          style={{ background: "rgba(0,0,0,0.75)", backdropFilter: "blur(4px)" }}
          onClick={(e) => { if (e.target === e.currentTarget) setShowModal(false); }}
        >
          <div className="w-full max-w-sm rounded-2xl bg-slate-800 border border-slate-600 shadow-2xl overflow-hidden">

            {/* Modal header */}
            <div className="px-6 pt-6 pb-4 border-b border-slate-700 flex items-start justify-between">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <ShieldCheck className="w-5 h-5 text-amber-400" />
                  <h2 className="text-base font-bold text-white">Authority Login</h2>
                </div>
                <p className="text-xs text-slate-400">Enter the Authority PIN to access the staff dashboard.</p>
              </div>
              <button onClick={() => setShowModal(false)} className="text-slate-500 hover:text-slate-300 transition-colors ml-3 shrink-0">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal body */}
            <div className="p-6 space-y-4">

              {/* PIN input */}
              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-2 uppercase tracking-wider">Authority PIN</label>
                <div className="relative">
                  <input
                    ref={pinRef}
                    type={showPin ? "text" : "password"}
                    value={pin}
                    onChange={(e) => { setPin(e.target.value); setPinError(false); }}
                    onKeyDown={(e) => e.key === "Enter" && submitPin()}
                    placeholder="Enter PIN..."
                    className={`w-full rounded-xl pr-10 px-4 py-2.5 text-sm bg-slate-900 border text-slate-200 placeholder:text-slate-600 focus:outline-none focus:ring-1 transition-all ${
                      pinError
                        ? "border-red-500/60 focus:border-red-500 focus:ring-red-500/20"
                        : "border-slate-700 focus:border-amber-500 focus:ring-amber-500/20"
                    }`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPin((s) => !s)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
                  >
                    {showPin ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {pinError && (
                  <p className="text-xs text-red-400 mt-1.5">Incorrect PIN. Please try again.</p>
                )}
              </div>

              {/* Submit */}
              <button
                onClick={submitPin}
                className="w-full py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-900 font-bold text-sm transition-all duration-150 active:scale-[0.98]"
              >
                Login as Authority
              </button>

              {/* Divider */}
              <div className="flex items-center gap-3">
                <div className="flex-1 h-px bg-slate-700" />
                <span className="text-xs text-slate-600">or</span>
                <div className="flex-1 h-px bg-slate-700" />
              </div>

              {/* Judge shortcut */}
              <button
                onClick={judgeLogin}
                className="w-full py-2.5 rounded-xl bg-indigo-600/30 hover:bg-indigo-600/50 border border-indigo-500/40 text-indigo-300 font-bold text-sm transition-all duration-150 active:scale-[0.98] flex items-center justify-center gap-2"
              >
                ⚡ 1-Click Judge Demo Login
              </button>

              <p className="text-center text-xs text-slate-600">
                PIN for evaluators: <span className="font-mono text-slate-500">iiuc2026</span>
              </p>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
