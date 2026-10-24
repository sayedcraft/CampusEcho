"use client";

import { useState, useMemo, useCallback } from "react";
import Navbar       from "@/components/Navbar";
import CampusPulse  from "@/components/CampusPulse";
import IssueForm    from "@/components/IssueForm";
import FilterBar    from "@/components/FilterBar";
import IssueCard    from "@/components/IssueCard";
import seedIssues   from "@/data/seedIssues";

// Deep-clone seed data so resets always restore the original
const INITIAL_ISSUES = seedIssues.map((i) => ({ ...i }));

// ── Filter logic ──────────────────────────────────────────────────────────────

function applyFilters(issues, { category, status, search }) {
  const q = search?.trim().toLowerCase() ?? "";
  return issues.filter((issue) => {
    if (category && category !== "All" && issue.category !== category) return false;
    if (status   && status   !== "All" && issue.status   !== status)   return false;
    if (q) {
      const haystack = [
        issue.title,
        issue.summary,
        issue.summaryBn,
        issue.location,
        issue.category,
        ...(issue.keywords ?? []),
      ]
        .join(" ")
        .toLowerCase();
      if (!haystack.includes(q)) return false;
    }
    return true;
  });
}

// ── Page ─────────────────────────────────────────────────────────────────────

export default function HomePage() {
  const [issues,  setIssues]  = useState(INITIAL_ISSUES);
  const [filters, setFilters] = useState({ category: "All", status: "All", search: "" });

  // ── Filtered list for IssueCard feed ─────────────────────────────────────
  const filtered = useMemo(() => applyFilters(issues, filters), [issues, filters]);

  // ── Handlers ─────────────────────────────────────────────────────────────

  /** Called by IssueForm when user submits a new issue or upvotes an existing one */
  const handleSubmit = useCallback((payload) => {
    if (payload.__upvote) {
      // Increment similarCount on the target issue
      setIssues((prev) =>
        prev.map((i) =>
          i.id === payload.id ? { ...i, similarCount: (i.similarCount ?? 0) + 1 } : i
        )
      );
      return;
    }
    // Prepend new issue so it appears at the top
    setIssues((prev) => [payload, ...prev]);
  }, []);

  /** Called by IssueCard +1 button */
  const handleUpvote = useCallback((id) => {
    setIssues((prev) =>
      prev.map((i) =>
        i.id === id ? { ...i, similarCount: (i.similarCount ?? 0) + 1 } : i
      )
    );
  }, []);

  /** Called by IssueCard status selector */
  const handleStatusChange = useCallback((id, newStatus) => {
    setIssues((prev) =>
      prev.map((i) => (i.id === id ? { ...i, status: newStatus } : i))
    );
  }, []);

  /** Navbar "Reset Demo Data" */
  const handleReset = useCallback(() => {
    setIssues(INITIAL_ISSUES.map((i) => ({ ...i })));
    setFilters({ category: "All", status: "All", search: "" });
  }, []);

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen flex flex-col bg-slate-900">
      <Navbar onResetDemo={handleReset} />

      <main className="flex-1 w-full max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

        {/* ── Hero blurb ── */}
        <div className="mb-8 text-center sm:text-left">
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white leading-tight mb-2">
            Campus Issues,{" "}
            <span className="bg-gradient-to-r from-indigo-400 to-violet-400 bg-clip-text text-transparent">
              Heard &amp; Tracked
            </span>
          </h1>
          <p className="text-slate-400 text-sm sm:text-base max-w-2xl">
            Report any IIUC Kumira campus problem — in any language. Our open-weight AI
            extracts structured data, detects duplicates, and routes each issue to the
            right office automatically.
          </p>
        </div>

        {/* ── Campus Pulse stats (reactive to all issues, not just filtered) ── */}
        <CampusPulse issues={issues} />

        {/* ── Two-column layout on large screens ── */}
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_400px] gap-6 lg:gap-8 items-start">

          {/* Left: Issue feed ─────────────────────────────────────── */}
          <section aria-label="Issue feed" className="order-2 lg:order-1">
            <div className="flex items-center justify-between mb-1">
              <div className="flex items-center gap-2">
                <div className="w-1 h-5 rounded-full bg-gradient-to-b from-indigo-500 to-violet-500" />
                <h2 className="text-xs font-semibold text-slate-500 uppercase tracking-widest">
                  Issue Feed
                </h2>
              </div>
              <span className="text-xs text-slate-600 tabular-nums">
                {filtered.length} of {issues.length} issue{issues.length !== 1 ? "s" : ""}
              </span>
            </div>

            <FilterBar filters={filters} onChange={setFilters} />

            {filtered.length === 0 ? (
              <div className="rounded-2xl bg-slate-800/40 border border-slate-700/40 p-10 text-center">
                <p className="text-slate-500 text-sm">No issues match the current filters.</p>
                <button
                  onClick={() => setFilters({ category: "All", status: "All", search: "" })}
                  className="mt-3 text-xs text-indigo-400 hover:text-indigo-300 underline underline-offset-2"
                >
                  Clear filters
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                {filtered.map((issue) => (
                  <IssueCard
                    key={issue.id}
                    issue={issue}
                    onUpvote={handleUpvote}
                    onStatusChange={handleStatusChange}
                  />
                ))}
              </div>
            )}
          </section>

          {/* Right: Report form (sticky on desktop) ──────────────── */}
          <aside className="order-1 lg:order-2 lg:sticky lg:top-24 lg:self-start">
            <IssueForm
              existingIssues={issues}
              onSubmit={handleSubmit}
            />
          </aside>
        </div>
      </main>

      {/* ── Footer ── */}
      <footer className="border-t border-slate-800 py-6 mt-8">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-slate-600">
          <p>
            <span className="text-slate-400 font-semibold">CampusEcho</span> — IIUC Kumira
            Campus Edition · Built for the IIUC Hackathon 2026
          </p>
          <p>
            Powered by{" "}
            <span className="text-indigo-400">Ollama / qwen2.5:3b</span> +{" "}
            <span className="text-blue-400">Gemini fallback</span> · Open-weight AI
          </p>
        </div>
      </footer>
    </div>
  );
}
