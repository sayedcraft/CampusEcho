"use client";

import { useState, useMemo } from "react";
import { MessageCircle, Send, Loader2, AlertTriangle, Sparkles } from "lucide-react";

const STATUS_BADGE = {
  Open:          "bg-red-500/20 text-red-300 border-red-500/40",
  "In Progress": "bg-amber-500/20 text-amber-300 border-amber-500/40",
  Resolved:      "bg-emerald-500/20 text-emerald-300 border-emerald-500/40",
};

const SAMPLE_QUESTIONS = [
  { emoji: "📽️", text: "CSE Lab 302 er projector ki thik hoise?" },
  { emoji: "🚌", text: "Chawkbazar bus problem er update ki?" },
  { emoji: "💧", text: "Library te drinking water kokhon pabo?" },
];

export default function AskCampusAI({ issues = [], language = "en" }) {
  const [question, setQuestion] = useState("");
  const [loading,  setLoading]  = useState(false);
  const [result,   setResult]   = useState(null);
  const [error,    setError]    = useState("");

  // Build a lookup map for referenced issue details
  const issueMap = useMemo(() => Object.fromEntries(issues.map((i) => [i.id, i])), [issues]);

  const ask = async (q) => {
    const trimmed = (q ?? question).trim();
    if (!trimmed) return;
    setQuestion(trimmed);
    setLoading(true);
    setError("");
    setResult(null);

    try {
      const res  = await fetch("/api/ai-assistant", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mode: "ask_campus_ai", payload: { question: trimmed, issues } }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || `HTTP ${res.status}`);
      setResult(data.result);
    } catch (err) {
      setError(err.message || "AI Q&A failed — please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleChip = (chip) => { setQuestion(chip.text); ask(chip.text); };

  return (
    <section
      aria-label="Ask CampusEcho AI"
      className="mb-8 rounded-2xl overflow-hidden border border-violet-500/20"
      style={{ background: "linear-gradient(135deg, rgba(139,92,246,0.07) 0%, rgba(99,102,241,0.05) 50%, rgba(15,23,42,0.95) 100%)" }}
    >
      {/* Header */}
      <div className="px-5 sm:px-6 pt-5 pb-4 border-b border-violet-500/15">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-600 to-indigo-600 flex items-center justify-center shadow-lg shadow-violet-500/30 shrink-0">
            <MessageCircle className="w-5 h-5 text-white" />
          </div>
          <div>
            <h2 className="text-base font-bold text-white">
            💬 {language === "bn" ? "ক্যাম্পাসইকো AI-কে জিজ্ঞাসা করুন" : "Ask CampusEcho AI"}{" "}
              <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-violet-500/20 text-violet-300 border border-violet-500/30 ml-1">
                {language === "bn" ? "সরাসরি ক্যাম্পাস আপডেট" : "Live Campus Q&A"}
              </span>
            </h2>
          </div>
        </div>
      </div>

      {/* Body */}
      <div className="px-5 sm:px-6 py-5 space-y-4">

        {/* Sample chips */}
        <div>
          <p className="text-xs text-slate-600 font-semibold uppercase tracking-wider mb-2.5">{language === "bn" ? "নমুনা প্রশ্ন" : "Try a question"}</p>
          <div className="flex flex-wrap gap-2">
            {SAMPLE_QUESTIONS.map((chip) => (
              <button key={chip.text} onClick={() => handleChip(chip)} disabled={loading}
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-700/80 hover:bg-violet-500/15 border border-slate-600 hover:border-violet-500/40 text-sm text-slate-300 hover:text-violet-200 font-medium transition-all duration-150 hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-50">
                <span>{chip.emoji}</span>
                <span className="text-xs">{chip.text}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Input */}
        <div className="flex gap-2">
          <input
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && !loading && ask(question)}
            placeholder={language === "bn" ? "আপনার প্রশ্ন লিখুন…" : "Ask about a campus issue…"}
            dir="auto"
            className="flex-1 rounded-xl bg-slate-900/70 border border-slate-700 text-slate-200 placeholder:text-slate-600 text-sm px-4 py-2.5 focus:outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500/25 transition-all"
          />
          <button onClick={() => ask(question)} disabled={loading || !question.trim()}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 disabled:from-slate-700 disabled:to-slate-700 disabled:text-slate-500 disabled:cursor-not-allowed text-white font-semibold text-sm transition-all duration-200 shadow-lg shadow-violet-500/20 whitespace-nowrap">
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
            {loading ? (language === "bn" ? "ভাবছি…" : "Thinking…") : (language === "bn" ? "জিজ্ঞাসা" : "Ask")}
          </button>
        </div>

        {/* Error */}
        {error && (
          <div className="flex items-center gap-2 text-xs text-red-400 bg-red-500/8 border border-red-500/20 rounded-lg px-3 py-2">
            <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
            {error}
          </div>
        )}

        {/* Result */}
        {result && !loading && (
          <div className="rounded-xl bg-slate-800/70 border border-violet-500/20 overflow-hidden">

            {/* AI badge */}
            <div className="flex items-center gap-2 px-4 py-2.5 bg-violet-500/10 border-b border-violet-500/15">
              <Sparkles className="w-3.5 h-3.5 text-violet-400" />
              <span className="text-xs font-bold text-violet-400 uppercase tracking-wide">
                {language === "bn" ? "ক্যাম্পাসইকো AI-এর উত্তর" : "CampusEcho AI answer"}
              </span>
            </div>

            <div className="p-4 space-y-3">
              {/* English answer */}
              <p dir={language === "bn" ? "auto" : undefined} className="text-sm text-slate-200 leading-relaxed">
                {language === "bn" ? result.answerBn || result.answer : result.answer}
              </p>

              {/* Referenced issues */}
              {result.referencedIssues?.length > 0 && (
                <div className="pt-2 border-t border-slate-700/50">
                  <p className="text-xs text-slate-600 font-semibold mb-2 uppercase tracking-wide">
                    {language === "bn" ? "📎 সংশ্লিষ্ট সমস্যা" : "📎 Referenced issues"}
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {result.referencedIssues.map((ref) => {
                      const full = issueMap[ref.id];
                      return (
                        <div key={ref.id}
                          className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-900/70 border border-slate-700/60 text-xs">
                          <span className="text-slate-500 font-mono">{ref.id}</span>
                          {full && <span className="text-slate-400 truncate max-w-[140px]">{full.title?.split(" ").slice(0, 4).join(" ")}…</span>}
                          <span className={`px-1.5 py-0.5 rounded text-xs font-semibold border ${STATUS_BADGE[ref.status ?? full?.status] ?? STATUS_BADGE.Open}`}>
                            {language === "bn"
                              ? ({ Open: "খোলা", "In Progress": "চলমান", Resolved: "সমাধান" }[ref.status ?? full?.status] ?? "খোলা")
                              : ref.status ?? full?.status ?? "Open"}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
