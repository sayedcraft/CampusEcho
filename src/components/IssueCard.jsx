"use client";

import { useState } from "react";
import {
  MapPin, Building2, ChevronDown, ChevronUp, ThumbsUp,
  Trash2, ShieldCheck, Save, Pencil, Sparkles, Loader2,
  CheckSquare, Clock,
} from "lucide-react";

// ── Style maps ──────────────────────────────────────────────────────────────

const URGENCY_PILL = {
  High:   "bg-red-500/15 text-red-400 border-red-500/30",
  Medium: "bg-amber-500/15 text-amber-400 border-amber-500/30",
  Low:    "bg-emerald-500/15 text-emerald-400 border-emerald-500/30",
};
const STATUS_BADGE = {
  Open:          "bg-red-500/20 text-red-300 border-red-500/40",
  "In Progress": "bg-amber-500/20 text-amber-300 border-amber-500/40",
  Resolved:      "bg-emerald-500/20 text-emerald-300 border-emerald-500/40",
};
const CATEGORY_PILL = {
  "Facilities":        "bg-blue-500/15 text-blue-400",
  "IT & Equipment":    "bg-violet-500/15 text-violet-400",
  "Water & Sanitation":"bg-cyan-500/15 text-cyan-400",
  "Transport & Bus":   "bg-orange-500/15 text-orange-400",
  "Admin & Queue":     "bg-pink-500/15 text-pink-400",
  "Seating & Space":   "bg-teal-500/15 text-teal-400",
  "Other":             "bg-slate-500/15 text-slate-400",
};
const STATUS_OPTIONS = ["Open", "In Progress", "Resolved"];

// ── Component ───────────────────────────────────────────────────────────────

export default function IssueCard({
  issue,
  currentRole = "student",
  onUpvote,
  onStatusChange,
  onAuthorityNote,
  onDelete,
}) {
  // Display
  const [expanded,      setExpanded]      = useState(false);
  const [localStatus,   setLocalStatus]   = useState(issue.status ?? "Open");
  const [similarCount,  setSimilarCount]  = useState(issue.similarCount ?? 0);
  const [upvoted,       setUpvoted]       = useState(false);

  // Authority note editing
  const [editingNote,   setEditingNote]   = useState(false);
  const [noteText,      setNoteText]      = useState(issue.authorityNote ?? "");
  const [noteBy,        setNoteBy]        = useState(issue.updatedBy ?? "");

  // AI draft
  const [aiLoading,     setAiLoading]     = useState(false);
  const [aiSteps,       setAiSteps]       = useState([]);
  const [aiTimeline,    setAiTimeline]    = useState("");
  const [aiError,       setAiError]       = useState("");

  // Delete confirmation
  const [confirmDelete, setConfirmDelete] = useState(false);

  // ── Handlers ─────────────────────────────────────────────────────────────

  const handleStatusChange = (s) => { setLocalStatus(s); onStatusChange?.(issue.id, s); };

  const handleUpvote = () => {
    if (upvoted || currentRole !== "student") return;
    setUpvoted(true); setSimilarCount((c) => c + 1); onUpvote?.(issue.id);
  };

  const handleSaveNote = () => { onAuthorityNote?.(issue.id, noteText, noteBy); setEditingNote(false); };

  const handleAIDraft = async () => {
    setAiLoading(true); setAiError(""); setAiSteps([]); setAiTimeline("");
    try {
      const res  = await fetch("/api/ai-assistant", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mode: "draft_authority_reply", payload: { issue } }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || `HTTP ${res.status}`);
      const r = data.result;
      // Auto-fill note textarea with bilingual reply
      const combined = r.officialReply + (r.officialReplyBn ? `\n\n${r.officialReplyBn}` : "");
      setNoteText(combined);
      if (!noteBy) setNoteBy("IIUC Faculty / Dept. Coordinator");
      setAiSteps(r.actionSteps ?? []);
      setAiTimeline(r.estimatedTimeline ?? "");
      setEditingNote(true); // open the editor so they see the filled content
    } catch (err) {
      setAiError(err.message || "AI draft failed");
    } finally {
      setAiLoading(false);
    }
  };

  const handleDelete = () => { onDelete?.(issue.id); };

  const isAuthority = currentRole === "authority";

  return (
    <article className="rounded-2xl bg-slate-800/60 border border-slate-700/40 hover:border-slate-600/60 transition-all duration-200 overflow-hidden">

      {/* ── Card Body ── */}
      <div className="p-4 sm:p-5">

        {/* Row 1: category + urgency + similar + (student) status */}
        <div className="flex flex-wrap items-center gap-2 mb-3">
          <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${CATEGORY_PILL[issue.category] ?? CATEGORY_PILL.Other}`}>
            {issue.category}
          </span>
          <span className={`px-2.5 py-1 rounded-full text-xs font-semibold border ${URGENCY_PILL[issue.urgency] ?? URGENCY_PILL.Low}`}>
            ⚡ AI Urgency: {issue.urgency ?? "—"}
          </span>
          {similarCount > 0 && (
            <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-slate-700/80 text-slate-300 border border-slate-600/60">
              🔁 {similarCount} similar {similarCount === 1 ? "report" : "reports"}
            </span>
          )}
          {/* Read-only status badge — students only */}
          {!isAuthority && (
            <span className={`ml-auto px-2.5 py-1 rounded-full text-xs font-semibold border ${STATUS_BADGE[localStatus] ?? STATUS_BADGE.Open}`}>
              {localStatus}
            </span>
          )}
        </div>

        {/* Title */}
        <h3 className="text-base sm:text-lg font-semibold text-slate-100 mb-2.5 leading-snug">{issue.title}</h3>

        {/* Location + Office */}
        <div className="flex flex-wrap gap-x-4 gap-y-1.5 mb-3">
          {issue.location && issue.location !== "Unknown" && (
            <div className="flex items-center gap-1.5 text-xs text-slate-400">
              <MapPin className="w-3.5 h-3.5 text-slate-500 shrink-0" /><span>{issue.location}</span>
            </div>
          )}
          {issue.suggestedOffice && (
            <div className="flex items-center gap-1.5 text-xs text-slate-400">
              <Building2 className="w-3.5 h-3.5 text-slate-500 shrink-0" /><span>{issue.suggestedOffice}</span>
            </div>
          )}
        </div>

        {/* English summary */}
        {issue.summary && <p className="text-sm text-slate-300 leading-relaxed mb-2">{issue.summary}</p>}

        {/* Bangla summary */}
        {issue.summaryBn && (
          <p dir="auto" className="text-sm text-slate-400 leading-relaxed mb-3 pl-3 border-l-2 border-indigo-500/40 italic">
            {issue.summaryBn}
          </p>
        )}

        {/* Expandable original */}
        {issue.description && (
          <>
            <button onClick={() => setExpanded((e) => !e)} aria-expanded={expanded}
              className="flex items-center gap-1 text-xs text-slate-500 hover:text-slate-300 transition-colors mb-1">
              {expanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
              {expanded ? "Hide" : "Show"} original student report
            </button>
            {expanded && (
              <p className="text-xs text-slate-500 leading-relaxed rounded-lg bg-slate-900/60 border border-slate-700/50 p-3 mt-1 mb-3">
                {issue.description}
              </p>
            )}
          </>
        )}

        {/* Authority Note — visible to both roles */}
        {noteText && !editingNote && (
          <div className="mt-3 rounded-xl bg-amber-500/8 border border-amber-500/25 p-3.5">
            <div className="flex items-center gap-1.5 mb-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-amber-400 shrink-0" />
              <span className="text-xs font-bold text-amber-400 uppercase tracking-wide">Official IIUC Authority Update</span>
            </div>
            <p className="text-sm text-amber-200/90 leading-relaxed whitespace-pre-line">👨‍🏫 {noteText}</p>
            {noteBy && <p className="text-xs text-amber-600 mt-1.5 font-medium">— {noteBy}</p>}
          </div>
        )}

        {/* Keywords */}
        {issue.keywords?.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mt-3">
            {issue.keywords.map((kw) => (
              <span key={kw} className="px-2 py-0.5 rounded text-xs bg-slate-900/70 text-slate-600 border border-slate-700/50 font-mono">#{kw}</span>
            ))}
          </div>
        )}
      </div>

      {/* ── STUDENT FOOTER ── */}
      {!isAuthority && (
        <div className="px-4 sm:px-5 pb-4 pt-3 border-t border-slate-700/30 flex items-center justify-end">
          <button onClick={handleUpvote} disabled={upvoted}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all duration-200 ${
              upvoted
                ? "bg-indigo-500/20 text-indigo-300 border-indigo-500/40 cursor-default"
                : "bg-slate-700/60 text-slate-300 border-slate-600 hover:bg-indigo-500/10 hover:text-indigo-300 hover:border-indigo-500/30 active:scale-95"
            }`}>
            <ThumbsUp className="w-3.5 h-3.5" />
            {upvoted ? "Reported! ✓" : "+1 I face this too"}
          </button>
        </div>
      )}

      {/* ── AUTHORITY ADMIN CONTROL BAR ── */}
      {isAuthority && (
        <div className="border-t border-amber-500/15 bg-amber-500/5">

          {/* Status selector */}
          <div className="px-4 sm:px-5 py-3 flex flex-wrap items-center gap-2 border-b border-amber-500/10">
            <span className="text-xs font-semibold text-amber-500/70 uppercase tracking-wider mr-1">Status:</span>
            {STATUS_OPTIONS.map((s) => (
              <button key={s} onClick={() => handleStatusChange(s)} aria-pressed={localStatus === s}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold border transition-all duration-150 ${
                  localStatus === s ? STATUS_BADGE[s] : "bg-transparent border-slate-700 text-slate-600 hover:text-slate-400 hover:border-slate-600"
                }`}>
                {s}
              </button>
            ))}
          </div>

          {/* Official Remark + AI Draft */}
          <div className="px-4 sm:px-5 py-3 border-b border-amber-500/10">
            <div className="flex items-center justify-between mb-2 flex-wrap gap-2">
              <span className="text-xs font-semibold text-amber-500/70 uppercase tracking-wider flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5" /> Official Remark
              </span>
              <div className="flex items-center gap-2">
                {/* AI Draft button */}
                <button
                  onClick={handleAIDraft}
                  disabled={aiLoading}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-600/20 hover:bg-indigo-600/30 border border-indigo-500/30 text-indigo-300 text-xs font-bold transition-all disabled:opacity-60"
                >
                  {aiLoading
                    ? <><Loader2 className="w-3 h-3 animate-spin" /> Drafting…</>
                    : <><Sparkles className="w-3 h-3" /> ✨ AI Draft Official Reply &amp; Action Plan</>
                  }
                </button>
                {!editingNote && (
                  <button onClick={() => setEditingNote(true)}
                    className="flex items-center gap-1 text-xs text-amber-500 hover:text-amber-300 transition-colors">
                    <Pencil className="w-3 h-3" />
                    {noteText ? "Edit" : "Add"}
                  </button>
                )}
              </div>
            </div>

            {/* AI error */}
            {aiError && (
              <p className="text-xs text-red-400 mb-2 flex items-center gap-1">
                <span>⚠</span> {aiError} — using fallback
              </p>
            )}

            {/* AI Action Steps (shown after draft) */}
            {aiSteps.length > 0 && (
              <div className="mb-3 rounded-lg bg-indigo-500/8 border border-indigo-500/20 p-3">
                <p className="text-xs font-bold text-indigo-400 mb-2 flex items-center gap-1.5">
                  <CheckSquare className="w-3.5 h-3.5" /> AI Resolution Checklist
                </p>
                <ol className="space-y-1.5">
                  {aiSteps.map((step, i) => (
                    <li key={i} className="flex items-start gap-2 text-xs text-slate-300">
                      <span className="w-4 h-4 rounded-full bg-indigo-500/20 text-indigo-400 text-xs flex items-center justify-center shrink-0 font-bold mt-0.5">{i + 1}</span>
                      {step}
                    </li>
                  ))}
                </ol>
                {aiTimeline && (
                  <p className="mt-2 flex items-center gap-1.5 text-xs text-emerald-400">
                    <Clock className="w-3 h-3" /> Estimated: {aiTimeline}
                  </p>
                )}
              </div>
            )}

            {/* Note editor */}
            {editingNote ? (
              <div className="space-y-2">
                <textarea value={noteText} onChange={(e) => setNoteText(e.target.value)} rows={4}
                  placeholder="Official response to students…"
                  className="w-full rounded-lg bg-slate-800 border border-amber-500/30 text-slate-200 text-sm p-3 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500/20 resize-none transition-all placeholder:text-slate-600 whitespace-pre-line" />
                <input value={noteBy} onChange={(e) => setNoteBy(e.target.value)}
                  placeholder="Updated by (e.g. CSE Dept. Coordinator)"
                  className="w-full rounded-lg bg-slate-800 border border-amber-500/30 text-slate-200 text-xs px-3 py-2 focus:outline-none focus:border-amber-500 transition-all placeholder:text-slate-600" />
                <div className="flex gap-2">
                  <button onClick={handleSaveNote}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/40 text-amber-300 text-xs font-bold transition-all">
                    <Save className="w-3.5 h-3.5" /> Save Remark
                  </button>
                  <button onClick={() => { setEditingNote(false); setNoteText(issue.authorityNote ?? ""); setNoteBy(issue.updatedBy ?? ""); }}
                    className="px-3 py-1.5 rounded-lg bg-slate-700 hover:bg-slate-600 border border-slate-600 text-slate-400 text-xs font-medium transition-all">
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              !noteText
                ? <p className="text-xs text-slate-600 italic">No remark yet. Use <span className="text-indigo-400">✨ AI Draft</span> or click "Add" to respond.</p>
                : null
            )}
          </div>

          {/* Delete */}
          <div className="px-4 sm:px-5 py-3 flex items-center justify-end">
            {confirmDelete ? (
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs text-red-400">Delete this report permanently?</span>
                <button onClick={handleDelete}
                  className="px-3 py-1.5 rounded-lg bg-red-500/30 hover:bg-red-500/50 border border-red-500/50 text-red-300 text-xs font-bold transition-all">
                  Yes, Delete
                </button>
                <button onClick={() => setConfirmDelete(false)}
                  className="px-3 py-1.5 rounded-lg bg-slate-700 hover:bg-slate-600 border border-slate-600 text-slate-400 text-xs font-medium transition-all">
                  Cancel
                </button>
              </div>
            ) : (
              <button onClick={() => setConfirmDelete(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 hover:border-red-500/40 text-red-500 hover:text-red-400 text-xs font-semibold transition-all">
                <Trash2 className="w-3.5 h-3.5" /> Delete Report
              </button>
            )}
          </div>
        </div>
      )}
    </article>
  );
}
