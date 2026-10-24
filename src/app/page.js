"use client";

import { useState, useMemo, useCallback, useEffect } from "react";
import Navbar      from "@/components/Navbar";
import CampusPulse          from "@/components/CampusPulse";
import AICampusIntelligence from "@/components/AICampusIntelligence";
import AskCampusAI         from "@/components/AskCampusAI";
import IssueForm            from "@/components/IssueForm";
import FilterBar            from "@/components/FilterBar";
import IssueCard            from "@/components/IssueCard";
import AuthModal            from "@/components/AuthModal";
import TrendingSlider       from "@/components/TrendingSlider";
import seedIssues           from "@/data/seedIssues";

// Deep-clone seed data once so resets always get a fresh copy
const SEED = seedIssues.map((i) => ({ ...i }));

// ── Persistence helpers ───────────────────────────────────────────────────────

const LS_ISSUES = "campusecho_issues_v2";
const LS_USER   = "campusecho_iiuc_user";
const ZONES = [
  { id: "cse", name: "CSE Building", icon: "💻", match: /CSE Building|CSE Lab/i },
  { id: "library", name: "Central Library", icon: "📚", match: /Central Library/i },
  { id: "bus", name: "Kumira Bus Stand", icon: "🚌", match: /Kumira Bus Point|Bus Stand|Chawkbazar/i },
  { id: "academic2", name: "Academic Building 2", icon: "🏫", match: /Academic Building 2/i },
  { id: "mosque", name: "Mosque & Hall", icon: "🕌", match: /Mosque|Dormitory|Hall/i },
  { id: "admin", name: "Admin Office", icon: "🏢", match: /Controller of Examinations|Registrar|Accounts|Admin Office|Student Affairs/i },
];

function loadIssues() {
  try {
    const raw = localStorage.getItem(LS_ISSUES);
    if (raw) return JSON.parse(raw);
  } catch (error) {
    console.warn("[CampusEcho] Could not load saved issues:", error);
  }
  return SEED.map((i) => ({ ...i }));
}

function loadUser() {
  try {
    const raw = localStorage.getItem(LS_USER);
    if (!raw) return null;
    const user = JSON.parse(raw);
    if (
      !user ||
      !["student", "authority"].includes(user.role) ||
      typeof user.id !== "string" ||
      typeof user.name !== "string"
    ) return null;
    return user;
  } catch (error) {
    console.warn("[CampusEcho] Could not load saved IIUC account:", error);
    return null;
  }
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
  const [user,   setUser]   = useState(null);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [hydrated, setHydrated] = useState(false);
  const [language, setLanguage] = useState("en");
  const [activeTab, setActiveTab] = useState("feed");
  const [zoneFilter, setZoneFilter] = useState(null);

  // Hydrate from localStorage after mount (avoids SSR mismatch)
  useEffect(() => {
    // This one-time hydration must initialize state only after the browser can read localStorage.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setIssues(loadIssues());
    setUser(loadUser());
    setHydrated(true);
  }, []);

  // Persist issues to localStorage on every change (after hydration)
  useEffect(() => {
    if (!hydrated) return;
    try { localStorage.setItem(LS_ISSUES, JSON.stringify(issues)); } catch (error) {
      console.warn("[CampusEcho] Could not save issues:", error);
    }
  }, [issues, hydrated]);

  // Persist the active IIUC account
  useEffect(() => {
    if (!hydrated) return;
    try {
      if (user) localStorage.setItem(LS_USER, JSON.stringify(user));
      else localStorage.removeItem(LS_USER);
    } catch (error) {
      console.warn("[CampusEcho] Could not save IIUC account:", error);
    }
  }, [user, hydrated]);

  // Filters state
  const [filters, setFilters] = useState({ category: "All", status: "All", search: "" });
  const role = user?.role ?? null;

  // Filtered feed
  const filtered = useMemo(() => {
    const matchingFilters = applyFilters(issues, filters);
    if (!zoneFilter) return matchingFilters;
    const zone = ZONES.find((item) => item.id === zoneFilter);
    return zone ? matchingFilters.filter((issue) => zone.match.test(issue.location ?? "")) : matchingFilters;
  }, [issues, filters, zoneFilter]);

  // ── Handlers ─────────────────────────────────────────────────────────────

  /** Submit new issue or upvote existing */
  const handleSubmit = useCallback((payload) => {
    if (payload.__upvote) {
      if (role !== "student") return;
      setIssues((prev) =>
        prev.map((i) => i.id === payload.id ? { ...i, similarCount: (i.similarCount ?? 0) + 1 } : i)
      );
      return;
    }
    if (role !== "student") return;
    setIssues((prev) => [payload, ...prev]);
  }, [role]);

  /** Student +1 upvote button on card */
  const handleUpvote = useCallback((id) => {
    if (role !== "student") return;
    setIssues((prev) =>
      prev.map((i) => i.id === id ? { ...i, similarCount: (i.similarCount ?? 0) + 1 } : i)
    );
  }, [role]);

  /** Authority — status change */
  const handleStatusChange = useCallback((id, newStatus) => {
    if (role !== "authority" || !user) return;
    setIssues((prev) =>
      prev.map((i) => i.id === id ? {
        ...i,
        status: newStatus,
        updatedBy: `${user.name} (${user.id})`,
      } : i)
    );
  }, [role, user]);

  /** Authority — save official remark */
  const handleAuthorityNote = useCallback((id, note) => {
    if (role !== "authority" || !user) return;
    setIssues((prev) =>
      prev.map((i) => i.id === id ? {
        ...i,
        authorityNote: note,
        updatedBy: `${user.name} (${user.id})`,
      } : i)
    );
  }, [role, user]);

  /** Authority — delete report */
  const handleDelete = useCallback((id) => {
    if (role !== "authority") return;
    setIssues((prev) => prev.filter((i) => i.id !== id));
  }, [role]);

  /** Reset all issue data while keeping the current account signed in. */
  const handleReset = useCallback(() => {
    const fresh = SEED.map((i) => ({ ...i }));
    setIssues(fresh);
    setFilters({ category: "All", status: "All", search: "" });
    setZoneFilter(null);
    try {
      localStorage.setItem(LS_ISSUES, JSON.stringify(fresh));
    } catch (error) {
      console.warn("[CampusEcho] Could not reset saved issues:", error);
    }
  }, []);

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen flex flex-col bg-slate-900">
      <Navbar
        user={user}
        language={language}
        onLanguageChange={setLanguage}
        onOpenAuth={() => setShowAuthModal(true)}
        onResetDemo={handleReset}
      />

      <main className="flex-1 w-full max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <CampusPulse issues={issues} language={language} />

        <nav aria-label="Main sections" className="my-8 flex justify-center">
          <div className="inline-flex max-w-full overflow-x-auto rounded-2xl border border-slate-700/70 bg-slate-800/70 p-1.5 shadow-lg shadow-black/10">
            {[
              { id: "feed", label: "📢 Issue Feed & Report" },
              { id: "zones", label: "🗺️ IIUC Zone Radar" },
              { id: "ai", label: "✨ AI Intelligence & Q&A" },
            ].map((tab) => (
              <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                aria-pressed={activeTab === tab.id}
                className={`whitespace-nowrap rounded-xl px-4 py-2.5 text-sm font-semibold transition-all ${
                  activeTab === tab.id
                    ? "bg-indigo-600 text-white shadow-md shadow-indigo-900/30"
                    : "text-slate-400 hover:bg-slate-700/70 hover:text-slate-100"
                }`}>
                {tab.label}
              </button>
            ))}
          </div>
        </nav>

        {activeTab === "feed" && (
          <div className="grid grid-cols-1 lg:grid-cols-[minmax(300px,0.8fr)_minmax(0,1.2fr)] gap-6 items-start">
            <aside className="lg:sticky lg:top-24">
              <IssueForm
                existingIssues={issues}
                onSubmit={handleSubmit}
                currentUser={user}
                currentRole={role}
                language={language}
                onRequestLogin={() => setShowAuthModal(true)}
              />
            </aside>
            <section aria-label="Issue feed" className="min-w-0 space-y-5">
              <TrendingSlider
                issues={issues}
                currentRole={role}
                onUpvote={handleUpvote}
                language={language}
              />
              <FilterBar filters={filters} onChange={(nextFilters) => {
                setFilters(nextFilters);
                setZoneFilter(null);
              }} />
              {zoneFilter && (
                <button onClick={() => setZoneFilter(null)}
                  className="rounded-full border border-indigo-500/30 bg-indigo-500/10 px-3 py-1.5 text-xs text-indigo-300">
                  {ZONES.find((zone) => zone.id === zoneFilter)?.name} ×
                </button>
              )}
              {filtered.length === 0 ? (
                <div className="rounded-2xl border border-slate-700/50 bg-slate-800/40 p-8 text-center text-sm text-slate-400">
                  {language === "bn" ? "কোনো সমস্যা পাওয়া যায়নি।" : "No issues match these filters."}
                </div>
              ) : (
                <div className="space-y-4">
                  {filtered.map((issue) => (
                    <IssueCard
                      key={issue.id}
                      issue={issue}
                      currentUser={user}
                      currentRole={role}
                      language={language}
                      onUpvote={handleUpvote}
                      onStatusChange={handleStatusChange}
                      onAuthorityNote={handleAuthorityNote}
                      onDelete={handleDelete}
                    />
                  ))}
                </div>
              )}
            </section>
          </div>
        )}

        {activeTab === "zones" && (
          <section aria-label="IIUC Zone Radar" className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">
              {ZONES.map((zone) => {
                const zoneIssues = issues.filter((issue) => zone.match.test(issue.location ?? ""));
                const openCount = zoneIssues.filter((issue) => issue.status !== "Resolved").length;
                const intensity = zoneIssues.length
                  ? Math.max(8, Math.round((openCount / zoneIssues.length) * 100))
                  : 0;
                return (
                  <button key={zone.id} onClick={() => {
                    setZoneFilter(zone.id);
                    setFilters({ category: "All", status: "All", search: "" });
                    setActiveTab("feed");
                  }}
                    className="group rounded-2xl border border-slate-700/60 bg-slate-800/50 p-6 text-left shadow-lg shadow-black/10 transition-all hover:-translate-y-1 hover:border-indigo-500/40 hover:bg-slate-800">
                    <div className="mb-6 flex items-start justify-between">
                      <span className="text-3xl">{zone.icon}</span>
                      <span className="rounded-full border border-slate-700 bg-slate-900/70 px-3 py-1 text-xs text-slate-400">
                        {zoneIssues.length} {language === "bn" ? "টি রিপোর্ট" : zoneIssues.length === 1 ? "report" : "reports"}
                      </span>
                    </div>
                    <h2 className="mb-4 text-lg font-semibold text-white">
                      {language === "bn" ? ({
                        cse: "সিএসই ভবন",
                        library: "কেন্দ্রীয় লাইব্রেরি",
                        bus: "কুমিরা বাস স্ট্যান্ড",
                        academic2: "একাডেমিক ভবন ২",
                        mosque: "মসজিদ ও হল",
                        admin: "প্রশাসনিক অফিস",
                      }[zone.id]) : zone.name}
                    </h2>
                    <div className="h-2 overflow-hidden rounded-full bg-slate-700">
                      <div className={`h-full rounded-full transition-all ${
                        intensity > 60 ? "bg-rose-500" : intensity > 0 ? "bg-amber-400" : "bg-emerald-500"
                      }`} style={{ width: `${intensity}%` }} />
                    </div>
                    <div className="mt-2 flex justify-between text-xs text-slate-500">
                      <span>{language === "bn" ? "খোলা সমস্যা" : "Open issues"}</span>
                      <span>{openCount}</span>
                    </div>
                  </button>
                );
              })}
            </div>
          </section>
        )}

        {activeTab === "ai" && (
          <div className="mx-auto max-w-5xl space-y-6">
            <AICampusIntelligence issues={issues} language={language} />
            <AskCampusAI issues={issues} language={language} />
          </div>
        )}
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
      {showAuthModal && (
        <AuthModal
          onLogin={(account) => {
            setUser(account);
            setShowAuthModal(false);
          }}
          onClose={() => setShowAuthModal(false)}
        />
      )}
    </div>
  );
}
