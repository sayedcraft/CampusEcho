"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ChevronLeft, ChevronRight, MapPin, ThumbsUp } from "lucide-react";

const STATUS_PROGRESS = {
  Open: { width: "24%", style: "bg-rose-400" },
  "In Progress": { width: "62%", style: "bg-amber-400" },
  Resolved: { width: "100%", style: "bg-emerald-400" },
};

export default function TrendingSlider({ issues = [], currentRole, onUpvote, language = "en" }) {
  const [activeIndex, setActiveIndex] = useState(0);
  const touchStart = useRef(null);
  const slides = useMemo(() => {
    const ranked = [...issues].sort((a, b) => {
      const urgency = { High: 2, Medium: 1, Low: 0 };
      return (urgency[b.urgency] ?? 0) - (urgency[a.urgency] ?? 0)
        || (b.similarCount ?? 0) - (a.similarCount ?? 0);
    });
    const topVotedIds = new Set(
      [...issues]
        .sort((a, b) => (b.similarCount ?? 0) - (a.similarCount ?? 0))
        .slice(0, 2)
        .map((issue) => issue.id),
    );
    return ranked
      .filter((issue) => issue.urgency === "High" || topVotedIds.has(issue.id))
      .slice(0, 5);
  }, [issues]);

  const move = useCallback((direction) => {
    setActiveIndex((index) => (index + direction + slides.length) % slides.length);
  }, [slides.length]);

  useEffect(() => {
    if (slides.length < 2) return undefined;
    const timer = window.setInterval(() => move(1), 6500);
    return () => window.clearInterval(timer);
  }, [move, slides.length]);

  if (slides.length === 0) return null;
  const visibleIndex = activeIndex % slides.length;
  const issue = slides[visibleIndex];
  const status = STATUS_PROGRESS[issue.status] ?? STATUS_PROGRESS.Open;
  const title = language === "bn"
    ? issue.summaryBn || issue.summary || issue.title
    : issue.summary || issue.title;

  return (
    <section aria-label={language === "bn" ? "জরুরি ক্যাম্পাস আপডেট" : "Urgent campus alerts"}
      onTouchStart={(event) => { touchStart.current = event.touches[0]?.clientX ?? null; }}
      onTouchEnd={(event) => {
        const start = touchStart.current;
        const end = event.changedTouches[0]?.clientX;
        if (start !== null && end !== undefined && Math.abs(end - start) > 40) move(end < start ? 1 : -1);
      }}
      className="overflow-hidden rounded-2xl border border-rose-500/20 bg-gradient-to-br from-rose-500/10 via-slate-800 to-indigo-500/10 p-5 shadow-xl shadow-black/15 sm:p-6">
      <div className="mb-4 flex items-center justify-between gap-3">
        <p className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-rose-300">
          <span className="h-2 w-2 animate-pulse rounded-full bg-rose-400" />
          {language === "bn" ? "ক্যাম্পাস সতর্কতা" : "Urgent campus alerts"}
        </p>
        <div className="flex items-center gap-2">
          <span className="text-xs tabular-nums text-slate-500">{visibleIndex + 1} / {slides.length}</span>
          <button onClick={() => move(-1)} aria-label="Previous alert"
            className="rounded-lg border border-slate-700 bg-slate-900/50 p-2 text-slate-300 hover:text-white">
            <ChevronLeft className="h-4 w-4" />
          </button>
          <button onClick={() => move(1)} aria-label="Next alert"
            className="rounded-lg border border-slate-700 bg-slate-900/50 p-2 text-slate-300 hover:text-white">
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>

      <div key={issue.id} className="animate-in fade-in duration-300">
        <div className="mb-4 flex items-start gap-3">
          <span aria-hidden className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-slate-900/70 text-2xl">
            {issue.category === "Transport & Bus" ? "🚌" : issue.category === "Water & Sanitation" ? "💧" : issue.category === "IT & Equipment" ? "💻" : "📍"}
          </span>
          <div className="min-w-0 flex-1">
            <h2 dir={language === "bn" ? "auto" : undefined} className="line-clamp-1 text-base font-semibold text-white sm:text-lg">{title}</h2>
            <div className="mt-2 flex flex-wrap items-center gap-2">
              {issue.location && <span className="inline-flex max-w-full items-center gap-1 rounded-full border border-slate-700/80 bg-slate-900/60 px-2.5 py-1 text-xs text-slate-400">
                <MapPin className="h-3 w-3 shrink-0" /><span className="truncate">{issue.location}</span>
              </span>}
              <span className={`rounded-full border px-2.5 py-1 text-xs ${issue.status === "Resolved" ? "border-emerald-500/30 text-emerald-300" : issue.status === "In Progress" ? "border-amber-500/30 text-amber-300" : "border-rose-500/30 text-rose-300"}`}>{issue.status}</span>
            </div>
          </div>
          {currentRole === "student" && (
            <button onClick={() => onUpvote?.(issue.id)}
              className="inline-flex shrink-0 items-center gap-1.5 rounded-xl border border-indigo-500/25 bg-indigo-500/10 px-3 py-2 text-xs font-semibold text-indigo-200 hover:bg-indigo-500/20">
              <ThumbsUp className="h-3.5 w-3.5" /> +1
            </button>
          )}
        </div>
        <div className="h-1.5 overflow-hidden rounded-full bg-slate-900/80">
          <div className={`h-full rounded-full transition-all duration-700 ${status.style}`} style={{ width: status.width }} />
        </div>
      </div>
    </section>
  );
}
