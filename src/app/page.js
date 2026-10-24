"use client";

import { useState, useMemo, useCallback, useEffect } from "react";
import Navbar      from "@/components/Navbar";
import CampusPulse          from "@/components/CampusPulse";
import AICampusIntelligence from "@/components/AICampusIntelligence";
import IssueForm            from "@/components/IssueForm";
import FilterBar            from "@/components/FilterBar";
import IssueCard            from "@/components/IssueCard";
import seedIssues           from "@/data/seedIssues";

// Deep-clone seed data once so resets always get a fresh copy
const SEED = seedIssues.map((i) => ({ ...i }));

// ── Persistence helpers ───────────────────────────────────────────────────────

const LS_ISSUES = "campusecho_issues_v2";
const LS_ROLE   = "campusecho_role";

function loadIssues() {
  try {
    const raw = localStorage.getItem(LS_ISSUES);
    if (raw) return JSON.parse(raw);
  } catch {}
  return SEED.map((i) => ({ ...i }));
}

function loadRole() {
  try { return localStorage.getItem(LS_ROLE) || "student"; } catch { return "student"; }
}

// ── Filter logic ──────────────────────────────────────────────────────────────

function applyFilters(issues, { category, status, search }) {
  const q = search?.trim().toLowerCase() ?? "";
  return issues.filter((issue) => {
    if (category && category !== "All" && issue.category !== category) return false;
    if (status   && status   !== "All" && issue.status   !== status)   return false;
    if (q) {
      const hay = [
        issue.title, issue.summary, issue.summaryBn,
        issue.location, issue.category,
        ...(issue.keywords ?? []),
      ].join(" ").toLowerCase();
      if (!hay.includes(q)) return false;
    }
    return true;
  });
}

// ── Page ─────────────────────────────────────────────────────────────────────

export default function HomePage() {
  // Issues state — initialised from localStorage on client
  const [issues, setIssues] = useState(() => SEED.map((i) => ({ ...i })));
  const [role,   setRole]   = useState("student");
  const [hydrated, setHydrated] = useState(false);

  // Hydrate from localStorage after mount (avoids SSR mismatch)
  useEffect(() => {
    setIssues(loadIssues());
    setRole(loadRole());
    setHydrated(true);
  }, []);

  // Persist issues to localStorage on every change (after hydration)
  useEffect(() => {
    if (!hydrated) return;
    try { localStorage.setItem(LS_ISSUES, JSON.stringify(issues)); } catch {}
  }, [issues, hydrated]);

  // Persist role
  useEffect(() => {
    if (!hydrated) return;
    try { localStorage.setItem(LS_ROLE, role); } catch {}
  }, [role, hydrated]);

  // Filters state
  const [filters, setFilters] = useState({ category: "All", status: "All", search: "" });

  // Filtered feed
  const filtered = useMemo(() => applyFilters(issues, filters), [issues, filters]);

  // ── Handlers ─────────────────────────────────────────────────────────────

  /** Submit new issue or upvote existing */
  const handleSubmit = useCallback((payload) => {
    if (payload.__upvote) {
      setIssues((prev) =>
        prev.map((i) => i.id === payload.id ? { ...i, similarCount: (i.similarCount ?? 0) + 1 } : i)
      );
      return;
    }
    setIssues((prev) => [payload, ...prev]);
  }, []);

  /** Student +1 upvote button on card */
  const handleUpvote = useCallback((id) => {
    setIssues((prev) =>
      prev.map((i) => i.id === id ? { ...i, similarCount: (i.similarCount ?? 0) + 1 } : i)
    );
  }, []);

  /** Authority — status change */
  const handleStatusChange = useCallback((id, newStatus) => {
    setIssues((prev) =>
      prev.map((i) => i.id === id ? { ...i, status: newStatus } : i)
    );
  }, []);

  /** Authority — save official remark */
  const handleAuthorityNote = useCallback((id, note, updatedBy) => {
    setIssues((prev) =>
      prev.map((i) => i.id === id ? { ...i, authorityNote: note, updatedBy } : i)
    );
  }, []);

  /** Authority — delete report */
  const handleDelete = useCallback((id) => {
    setIssues((prev) => prev.filter((i) => i.id !== id));
  }, []);

  /** Reset all data + role */
  const handleReset = useCallback(() => {
    const fresh = SEED.map((i) => ({ ...i }));
    setIssues(fresh);
    setRole("student");
    setFilters({ category: "All", status: "All", search: "" });
    try {
      localStorage.removeItem(LS_ISSUES);
      localStorage.removeItem(LS_ROLE);
    } catch {}
  }, []);

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen flex flex-col bg-slate-900">
      <Navbar currentRole={role} onRoleChange={setRole} onResetDemo={handleReset} />

      <main className="flex-1 w-full max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

        {/* ── Hero ── */}
        <div className="mb-8 text-center sm:text-left">
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white leading-tight mb-2">
            Campus Issues,{" "}
            <span className="bg-gradient-to-r from-indigo-400 to-violet-400 bg-clip-text text-transparent">
              Heard &amp; Tracked
            </span>
          </h1>
          <p className="text-slate-400 text-sm sm:text-base max-w-2xl">
            Report any IIUC Kumira campus problem — in any language. Our open-weight AI
            extracts structured data, detects duplicates, and routes each issue to the right office.
          </p>
        </div>

        {/* ── Campus Pulse (tracks ALL issues, not just filtered) ── */}
        <CampusPulse issues={issues} />

        {/* ── AI Intelligence Center ── */}
        <AICampusIntelligence issues={issues} />

        {/* ── Two-column layout ── */}
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_400px] gap-6 lg:gap-8 items-start">

          {/* Left: Issue feed */}
          <section aria-label="Issue feed" className="order-2 lg:order-1">
            <div className="flex items-center justify-between mb-1">
              <div className="flex items-center gap-2">
                <div className="w-1 h-5 rounded-full bg-gradient-to-b from-indigo-500 to-violet-500" />
                <h2 className="text-xs font-semibold text-slate-500 uppercase tracking-widest">
                  Issue Feed
                  {role === "authority" && (
                    <span className="ml-2 text-amber-500">· Authority View</span>
                  )}
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
                    currentRole={role}
                    onUpvote={handleUpvote}
                    onStatusChange={handleStatusChange}
                    onAuthorityNote={handleAuthorityNote}
                    onDelete={handleDelete}
                  />
                ))}
              </div>
            )}
          </section>

          {/* Right: Report form / authority panel (sticky on desktop) */}
          <aside className="order-1 lg:order-2 lg:sticky lg:top-24 lg:self-start">
            <IssueForm
              existingIssues={issues}
              onSubmit={handleSubmit}
              currentRole={role}
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
            <span className="text-blue-400">Gemma cloud fallback</span> · Open-weight AI
          </p>
        </div>
      </footer>
    </div>
  );
}
