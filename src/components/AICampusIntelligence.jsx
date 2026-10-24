"use client";

import { useState } from "react";
import { Sparkles, Brain, Loader2, AlertTriangle, ChevronRight, RefreshCw, MapPin, Building2, Zap } from "lucide-react";

// ── Style helpers ─────────────────────────────────────────────────────────────

const URGENCY_COLORS = {
  High:   "bg-red-500/20 text-red-300 border-red-500/30",
  Medium: "bg-amber-500/20 text-amber-300 border-amber-500/30",
  Low:    "bg-emerald-500/20 text-emerald-300 border-emerald-500/30",
};

// ── Animated thinking dots ────────────────────────────────────────────────────

function ThinkingDots() {
  return (
    <span className="inline-flex items-center gap-1 ml-1">
      {[0, 1, 2].map((i) => (
        <span
          key={i}
          className="w-1.5 h-1.5 rounded-full bg-indigo-400"
          style={{ animation: `pulse 1.4s ease-in-out ${i * 0.2}s infinite` }}
        />
      ))}
    </span>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

export default function AICampusIntelligence({ issues = [], language = "en" }) {
  const [loading, setLoading]   = useState(false);
  const [result,  setResult]    = useState(null);
  const [error,   setError]     = useState(null);
  const [provider, setProvider] = useState("");

  const openIssues = issues.filter((i) => i.status !== "Resolved");

  const runDiagnosis = async () => {
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const res = await fetch("/api/ai-assistant", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mode: "executive_briefing",
          payload: { issues: openIssues },
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || `HTTP ${res.status}`);
      setResult(data.result);
      setProvider(data.meta?.provider ?? "");
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <section
      aria-label="AI Campus Intelligence"
      className="mb-8 rounded-2xl overflow-hidden border border-indigo-500/20 relative"
      style={{
        background: "linear-gradient(135deg, rgba(99,102,241,0.08) 0%, rgba(139,92,246,0.06) 50%, rgba(15,23,42,0.95) 100%)",
      }}
    >
      {/* Glow effect */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute -top-12 -left-12 w-48 h-48 bg-indigo-600/10 rounded-full blur-3xl" />
        <div className="absolute -bottom-12 -right-12 w-48 h-48 bg-violet-600/10 rounded-full blur-3xl" />
      </div>

      {/* Header */}
      <div className="relative px-5 sm:px-6 pt-5 pb-4 border-b border-indigo-500/15">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-600 to-violet-600 flex items-center justify-center shadow-lg shadow-indigo-500/30 shrink-0">
              <Brain className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                🧠 {language === "bn" ? "ক্যাম্পাসইকো AI ইন্টেলিজেন্স" : "CampusEcho AI Intelligence"}
                <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                  Open-Weight LLM
                </span>
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                {language === "bn"
                  ? `${openIssues.length}টি সক্রিয় সমস্যা · Ollama / Gemma`
                  : <>Ollama <span className="text-indigo-400">{`qwen2.5:3b`}</span> · Gemma · {openIssues.length} active</>}
              </p>
            </div>
          </div>

          <button
            onClick={runDiagnosis}
            disabled={loading || openIssues.length === 0}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 disabled:from-slate-700 disabled:to-slate-700 disabled:text-slate-500 disabled:cursor-not-allowed text-white font-semibold text-sm shadow-lg shadow-indigo-500/20 transition-all duration-200 hover:-translate-y-0.5 active:translate-y-0 disabled:translate-y-0 disabled:shadow-none whitespace-nowrap"
          >
            {loading ? (
              <><Loader2 className="w-4 h-4 animate-spin" /> {language === "bn" ? "বিশ্লেষণ চলছে" : "Analyzing"}<ThinkingDots /></>
            ) : result ? (
              <><RefreshCw className="w-4 h-4" /> {language === "bn" ? "আবার বিশ্লেষণ" : "Re-run"}</>
            ) : (
              <><Sparkles className="w-4 h-4" /> ✨ {language === "bn" ? "AI বিশ্লেষণ" : "Run AI diagnosis"}</>
            )}
          </button>
        </div>
      </div>

      {/* Body */}
      <div className="relative px-5 sm:px-6 py-5">

        {/* Idle state */}
        {!loading && !result && !error && (
          <div className="text-center py-6">
            <div className="w-16 h-16 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center mx-auto mb-4">
              <Brain className="w-8 h-8 text-indigo-400/60" />
            </div>
            <p className="text-sm text-slate-500">
              {language === "bn" ? "ক্যাম্পাসের বর্তমান সমস্যাগুলোর AI বিশ্লেষণ চালান।" : "Run an AI briefing on current campus issues."}
            </p>
          </div>
        )}

        {/* Loading animation */}
        {loading && (
          <div className="text-center py-8">
            <div className="flex items-center justify-center gap-3 mb-4">
              {[0, 1, 2, 3, 4].map((i) => (
                <div
                  key={i}
                  className="w-2.5 h-2.5 rounded-full bg-indigo-500"
                  style={{ animation: `bounce 1.2s ease-in-out ${i * 0.1}s infinite alternate` }}
                />
              ))}
            </div>
            <p className="text-sm text-indigo-300 font-medium">
            {language === "bn" ? `${openIssues.length}টি রিপোর্ট বিশ্লেষণ চলছে…` : `Analyzing ${openIssues.length} campus reports…`}
            </p>
          </div>
        )}

        {/* Error */}
        {error && !loading && (
          <div className="rounded-xl bg-red-500/8 border border-red-500/25 p-4 flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-semibold text-red-300 mb-1">Analysis failed</p>
              <p className="text-xs text-red-400/80 mb-2">{error}</p>
              <button onClick={runDiagnosis} className="text-xs text-red-400 hover:text-red-300 underline underline-offset-2">Retry</button>
            </div>
          </div>
        )}

        {/* Results */}
        {result && !loading && (
          <div className="space-y-5 animate-in fade-in duration-500">

            {/* Provider badge */}
            {provider && (
              <div className="flex justify-end">
                <span className="text-xs px-2 py-0.5 rounded-full bg-slate-800 text-slate-500 border border-slate-700">
                  <Zap className="w-3 h-3 inline mr-1 text-indigo-400" />
                  {provider}
                </span>
              </div>
            )}

            {/* Executive Headline */}
            <div className="rounded-xl bg-gradient-to-r from-indigo-500/10 to-violet-500/10 border border-indigo-500/20 p-4">
              <p className="text-xs font-bold text-indigo-400 uppercase tracking-widest mb-2">
                {language === "bn" ? "📊 সারসংক্ষেপ" : "📊 Summary"}
              </p>
              <p dir={language === "bn" ? "auto" : undefined} className="text-base font-semibold text-slate-100 leading-relaxed">
                {language === "bn" ? result.headlineBn || result.headline : result.headline}
              </p>
            </div>

            {/* Critical Hotspot Cards */}
            {result.criticalHotspots?.length > 0 && (
              <div>
                <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-3 flex items-center gap-2">
                  {language === "bn" ? "🔥 ঝুঁকিপূর্ণ এলাকা" : "🔥 Hotspots"}
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {result.criticalHotspots.map((h, idx) => (
                    <div key={idx} className="rounded-xl bg-slate-800/60 border border-slate-700/50 p-4 hover:border-indigo-500/30 transition-colors">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-bold text-violet-400">{h.area}</span>
                        <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-red-500/15 text-red-400 border border-red-500/20">
                          {language === "bn" ? `${h.issueCount}টি` : `${h.issueCount} issue${h.issueCount !== 1 ? "s" : ""}`}
                        </span>
                      </div>
                      {language === "en" && <>
                        <p className="text-xs text-slate-400 leading-relaxed mb-2">
                          <span className="text-slate-500 font-semibold">Root cause: </span>{h.rootCause}
                        </p>
                        <div className="flex items-start gap-1.5">
                          <ChevronRight className="w-3 h-3 text-indigo-400 shrink-0 mt-0.5" />
                          <p className="text-xs text-indigo-300 leading-relaxed">{h.recommendedAction}</p>
                        </div>
                      </>}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Priority Office Dispatch */}
            {result.priorityOrder?.length > 0 && (
              <div>
                <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-3">
                  {language === "bn" ? "📬 অগ্রাধিকার অফিস" : "📬 Priority offices"}
                </p>
                <div className="space-y-2">
                  {result.priorityOrder.map((item, idx) => (
                    <div key={idx} className="flex flex-wrap items-center gap-3 rounded-xl bg-slate-800/50 border border-slate-700/40 px-4 py-3">
                      <span className="w-5 h-5 rounded-full bg-indigo-500/20 text-indigo-300 text-xs font-bold flex items-center justify-center shrink-0">{idx + 1}</span>
                      <Building2 className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                      <span className="text-sm font-semibold text-slate-200 flex-1">{item.office}</span>
                      <span className={`px-2 py-0.5 rounded-full text-xs font-bold border ${URGENCY_COLORS[item.urgency] ?? URGENCY_COLORS.Medium}`}>
                        {language === "bn" ? ({ High: "জরুরি", Medium: "মাঝারি", Low: "কম" }[item.urgency] ?? item.urgency) : item.urgency}
                      </span>
                      {language === "en" && <p className="w-full text-xs text-slate-500 pl-8">{item.reason}</p>}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* CSS keyframes via style tag */}
      <style>{`
        @keyframes bounce { from { transform: translateY(0); } to { transform: translateY(-8px); } }
        @keyframes pulse  { 0%,100% { opacity: 0.3; } 50% { opacity: 1; } }
        .animate-in { animation: fadeIn 0.4s ease; }
        .fade-in    { animation: fadeIn 0.4s ease; }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: none; } }
      `}</style>
    </section>
  );
}
