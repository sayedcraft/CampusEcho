"use client";

import { Search, X } from "lucide-react";
import { CATEGORIES, STATUSES } from "@/data/seedIssues";

const ALL_CATEGORIES = ["All", ...CATEGORIES];
const ALL_STATUSES   = ["All", ...STATUSES];

/** Active style per status value */
const STATUS_ACTIVE = {
  All:          "bg-slate-100 border-slate-200 text-slate-800",
  Open:         "bg-amber-50 border-amber-200 text-amber-800",
  "In Progress":"bg-blue-50 border-blue-200 text-blue-800",
  Resolved:     "bg-emerald-50 border-emerald-200 text-emerald-800",
};

export default function FilterBar({ filters = {}, onChange }) {
  const { category = "All", status = "All", search = "" } = filters;

  /** Merge a single key change into the parent filters object */
  const update = (key, value) => onChange?.({ ...filters, [key]: value });

  return (
    <div className="mb-6 space-y-3" role="search" aria-label="Filter issues">

      {/* ── Search ── */}
      <div className="relative">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 pointer-events-none" />
        <input
          id="issue-search"
          type="search"
          placeholder="Search by title, location, keywords…"
          value={search}
          onChange={(e) => update("search", e.target.value)}
          className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-10 pr-10 text-sm text-slate-900 placeholder:text-slate-400 transition-all focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500/30"
        />
        {search && (
          <button
            onClick={() => update("search", "")}
            aria-label="Clear search"
            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* ── Category pills ── */}
      <div className="flex flex-wrap gap-2" role="group" aria-label="Filter by category">
        {ALL_CATEGORIES.map((cat) => (
          <button
            key={cat}
            onClick={() => update("category", cat)}
            aria-pressed={category === cat}
            className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-all duration-150 ${
              category === cat
                ? "bg-indigo-600 border-indigo-600 text-white shadow-sm shadow-indigo-200"
                : "bg-white border-slate-200 text-slate-600 hover:border-slate-300 hover:text-slate-900"
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* ── Status segmented buttons ── */}
      <div className="flex flex-wrap gap-2" role="group" aria-label="Filter by status">
        <span className="self-center text-xs text-slate-600 font-medium mr-1">Status:</span>
        {ALL_STATUSES.map((s) => (
          <button
            key={s}
            onClick={() => update("status", s)}
            aria-pressed={status === s}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all duration-150 ${
              status === s
                ? STATUS_ACTIVE[s]
                : "bg-white border-slate-200 text-slate-600 hover:text-slate-900 hover:border-slate-300"
            }`}
          >
            {s === "All" ? "All Statuses" : s}
          </button>
        ))}
      </div>
    </div>
  );
}
