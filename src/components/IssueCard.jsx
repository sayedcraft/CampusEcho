"use client";

import { useState } from "react";
import {
  MapPin, ChevronDown, ChevronUp, ThumbsUp, Trash2, ShieldCheck,
  Save, Pencil, Sparkles, Loader2, CheckSquare, Clock,
} from "lucide-react";

const STATUS_BADGE = {
  Open: "border-rose-500/30 bg-rose-500/10 text-rose-300",
  "In Progress": "border-amber-500/30 bg-amber-500/10 text-amber-300",
  Resolved: "border-emerald-500/30 bg-emerald-500/10 text-emerald-300",
};
const STATUS_OPTIONS = ["Open", "In Progress", "Resolved"];
const CATEGORY_STYLE = {
  Facilities: "bg-blue-500/15 text-blue-300",
  "IT & Equipment": "bg-violet-500/15 text-violet-300",
  "Water & Sanitation": "bg-cyan-500/15 text-cyan-300",
  "Transport & Bus": "bg-orange-500/15 text-orange-300",
  "Admin & Queue": "bg-pink-500/15 text-pink-300",
  "Seating & Space": "bg-teal-500/15 text-teal-300",
  Other: "bg-slate-500/15 text-slate-300",
};
const CATEGORY_ICON = {
  Facilities: "🏢",
  "IT & Equipment": "💻",
  "Water & Sanitation": "💧",
  "Transport & Bus": "🚌",
  "Admin & Queue": "📋",
  "Seating & Space": "🪑",
  Other: "📍",
};
const CATEGORY_BN = {
  Facilities: "সুবিধা",
  "IT & Equipment": "আইটি ও সরঞ্জাম",
  "Water & Sanitation": "পানি ও স্যানিটেশন",
  "Transport & Bus": "পরিবহন ও বাস",
  "Admin & Queue": "প্রশাসন ও সারি",
  "Seating & Space": "আসন ও স্থান",
  Other: "অন্যান্য",
};
const STATUS_BN = { Open: "খোলা", "In Progress": "চলমান", Resolved: "সমাধান" };

export default function IssueCard({
  issue,
  currentUser,
  currentRole,
  language = "en",
  onUpvote,
  onStatusChange,
  onAuthorityNote,
  onDelete,
}) {
  const [expanded, setExpanded] = useState(false);
  const [upvoted, setUpvoted] = useState(false);
  const [editingNote, setEditingNote] = useState(false);
  const [noteDraft, setNoteDraft] = useState({
    source: issue.authorityNote ?? "",
    value: issue.authorityNote ?? "",
  });
  const [aiLoading, setAiLoading] = useState(false);
  const [aiSteps, setAiSteps] = useState([]);
  const [aiTimeline, setAiTimeline] = useState("");
  const [aiError, setAiError] = useState("");
  const [confirmDelete, setConfirmDelete] = useState(false);

  const status = issue.status ?? "Open";
  const noteText = noteDraft.source === (issue.authorityNote ?? "")
    ? noteDraft.value
    : issue.authorityNote ?? "";
  const setNoteText = (value) => setNoteDraft({ source: issue.authorityNote ?? "", value });
  const reporter = issue.reporterId === "Anonymous Student" || !issue.reporterName
    ? (language === "bn" ? "বেনামী শিক্ষার্থী" : "Anonymous IIUC Student")
    : `${issue.reporterName} (${issue.reporterId})`;
  const isAuthority = currentRole === "authority";
  const affectedCount = issue.affectedCount
    ? issue.affectedCount + (issue.similarCount ?? 0)
    : (issue.similarCount ?? 0) + 1;
  const urgencyLevel = { Low: 28, Medium: 58, High: 88 }[issue.urgency] ?? 40;
  const impact = Math.max(urgencyLevel, Math.min(100, affectedCount));
  const impactColor = issue.urgency === "High"
    ? "from-rose-500 to-orange-400"
    : issue.urgency === "Medium"
      ? "from-amber-400 to-yellow-300"
      : "from-emerald-500 to-teal-300";
  const summary = language === "bn"
    ? issue.summaryBn || issue.summary || issue.title
    : issue.summary || issue.title;

  const handleUpvote = () => {
    if (upvoted || currentRole !== "student") return;
    setUpvoted(true);
    onUpvote?.(issue.id);
  };

  const handleAIDraft = async () => {
    setAiLoading(true);
    setAiError("");
    setAiSteps([]);
    setAiTimeline("");
    try {
      const response = await fetch("/api/ai-assistant", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mode: "draft_authority_reply", payload: { issue } }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || `HTTP ${response.status}`);
      const draft = data.result;
      setNoteText(
        language === "bn"
          ? draft.officialReplyBn || draft.officialReply
          : draft.officialReply,
      );
      setAiSteps(draft.actionSteps ?? []);
      setAiTimeline(draft.estimatedTimeline ?? "");
      setEditingNote(true);
    } catch (error) {
      setAiError(error.message || "AI draft failed.");
    } finally {
      setAiLoading(false);
    }
  };

  return (
    <article className="overflow-hidden rounded-2xl border border-slate-700/50 bg-slate-800/60 p-5 shadow-lg shadow-black/10 transition-colors hover:border-slate-600/70">
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold ${CATEGORY_STYLE[issue.category] ?? CATEGORY_STYLE.Other}`}>
          <span aria-hidden>{CATEGORY_ICON[issue.category] ?? CATEGORY_ICON.Other}</span>
          {language === "bn" ? CATEGORY_BN[issue.category] ?? issue.category : issue.category}
        </span>
        {issue.location && issue.location !== "Unknown" && (
          <span className="inline-flex max-w-full items-center gap-1 rounded-full border border-slate-700 bg-slate-900/50 px-3 py-1.5 text-xs text-slate-400">
            <MapPin className="h-3 w-3 shrink-0" />
            <span className="truncate">{issue.location}</span>
          </span>
        )}
        <span className={`ml-auto rounded-full border px-3 py-1.5 text-xs font-semibold ${STATUS_BADGE[status] ?? STATUS_BADGE.Open}`}>
          {language === "bn" ? STATUS_BN[status] ?? status : status}
        </span>
      </div>

      <p dir={language === "bn" ? "auto" : undefined} className="mb-5 line-clamp-1 text-base font-semibold leading-6 text-slate-100">
        {summary}
      </p>

      <div className="mb-5" aria-label={`${issue.urgency ?? "Medium"} impact, ${affectedCount} affected`}>
        <div className="h-2 overflow-hidden rounded-full bg-slate-700/80">
          <div className={`h-full rounded-full bg-gradient-to-r ${impactColor} transition-all duration-500`} style={{ width: `${impact}%` }} />
        </div>
      </div>

      <div className="flex items-center justify-between gap-3 border-t border-slate-700/50 pt-3">
        {currentRole === "student" ? (
          <button onClick={handleUpvote} disabled={upvoted}
            className={`inline-flex items-center gap-2 rounded-xl px-3 py-2 text-xs font-semibold transition-colors ${
              upvoted ? "bg-indigo-500/15 text-indigo-300" : "bg-slate-700/70 text-slate-300 hover:bg-indigo-500/15 hover:text-indigo-200"
            }`}>
            <ThumbsUp className="h-3.5 w-3.5" />
            {language === "bn" ? `প্রভাবিত ${affectedCount}` : `+1 Affected (${affectedCount})`}
          </button>
        ) : (
          <span className="text-xs text-slate-500">
            {language === "bn" ? `প্রভাবিত ${affectedCount}` : `${affectedCount} affected`}
          </span>
        )}
        <button onClick={() => setExpanded((value) => !value)} aria-expanded={expanded}
          className="inline-flex items-center gap-1.5 rounded-xl px-3 py-2 text-xs font-semibold text-slate-400 transition-colors hover:bg-slate-700/60 hover:text-white">
          {expanded
            ? <>{language === "bn" ? "বন্ধ করুন" : "Hide"} <ChevronUp className="h-3.5 w-3.5" /></>
            : <>{language === "bn" ? "বিস্তারিত" : "Details"} <ChevronDown className="h-3.5 w-3.5" /></>}
        </button>
      </div>

      {expanded && (
        <div className="mt-4 space-y-4 border-t border-slate-700/50 pt-4">
          <div className="space-y-2 text-sm leading-relaxed text-slate-400">
            {issue.description && <p dir="auto">{issue.description}</p>}
            <p className="text-xs text-slate-500">
              {language === "bn" ? "প্রতিবেদক" : "Reported by"}: {reporter}
            </p>
            {issue.updatedBy && (
              <p className="text-xs text-slate-500">
                {language === "bn" ? "আপডেট করেছেন" : "Updated by"} {issue.updatedBy}
              </p>
            )}
            {issue.keywords?.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {issue.keywords.map((keyword) => (
                  <span key={keyword} className="rounded-md bg-slate-900/70 px-2 py-1 text-xs text-slate-500">#{keyword}</span>
                ))}
              </div>
            )}
          </div>

          {noteText && !editingNote && (
            <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-4">
              <p className="mb-2 flex items-center gap-1.5 text-xs font-semibold text-amber-300">
                <ShieldCheck className="h-3.5 w-3.5" />
                {language === "bn" ? "কর্তৃপক্ষের নোট" : "Official update"}
              </p>
              <p className="whitespace-pre-line text-sm leading-relaxed text-amber-100/90">{noteText}</p>
            </div>
          )}

          {isAuthority && (
            <div className="space-y-4 rounded-xl border border-amber-500/15 bg-amber-500/5 p-4">
              <div className="flex flex-wrap items-center gap-2">
                {STATUS_OPTIONS.map((option) => (
                  <button key={option} onClick={() => onStatusChange?.(issue.id, option)}
                    aria-pressed={status === option}
                    className={`rounded-lg border px-3 py-1.5 text-xs font-semibold transition-colors ${
                      status === option ? STATUS_BADGE[option] : "border-slate-700 text-slate-500 hover:text-slate-200"
                    }`}>
                    {option}
                  </button>
                ))}
              </div>

              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="flex items-center gap-1.5 text-xs font-semibold text-amber-300">
                  <ShieldCheck className="h-3.5 w-3.5" />
                  {language === "bn" ? "কর্তৃপক্ষের মন্তব্য" : "Official remark"}
                </span>
                <div className="flex gap-2">
                  <button onClick={handleAIDraft} disabled={aiLoading}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-indigo-500/30 bg-indigo-500/10 px-3 py-1.5 text-xs font-semibold text-indigo-300 disabled:opacity-50">
                    {aiLoading ? <Loader2 className="h-3 w-3 animate-spin" /> : <Sparkles className="h-3 w-3" />}
                    {language === "bn" ? "AI খসড়া" : "AI draft"}
                  </button>
                  {!editingNote && (
                    <button onClick={() => setEditingNote(true)} className="inline-flex items-center gap-1 text-xs text-slate-400 hover:text-white">
                      <Pencil className="h-3 w-3" /> {noteText ? "Edit" : "Add"}
                    </button>
                  )}
                </div>
              </div>

              {aiError && <p className="text-xs text-rose-300">{aiError}</p>}
              {aiSteps.length > 0 && (
                <div className="space-y-2 rounded-lg bg-indigo-500/5 p-3">
                  <p className="flex items-center gap-1.5 text-xs font-semibold text-indigo-300">
                    <CheckSquare className="h-3.5 w-3.5" /> {language === "bn" ? "করণীয়" : "Action plan"}
                  </p>
                  <ol className="list-inside list-decimal space-y-1 text-xs text-slate-300">
                    {aiSteps.map((step, index) => <li key={index}>{step}</li>)}
                  </ol>
                  {aiTimeline && <p className="flex items-center gap-1 text-xs text-emerald-300"><Clock className="h-3 w-3" />{aiTimeline}</p>}
                </div>
              )}
              {editingNote && (
                <div className="space-y-2">
                  <textarea value={noteText} onChange={(event) => setNoteText(event.target.value)} rows={4}
                    className="w-full resize-y rounded-xl border border-slate-700 bg-slate-900/70 p-3 text-sm text-slate-200 focus:border-amber-500 focus:outline-none"
                    placeholder={language === "bn" ? "শিক্ষার্থীদের জন্য বার্তা" : "Message for students"} />
                  <p className="text-xs text-slate-500">
                    {currentUser?.name} ({currentUser?.id})
                  </p>
                  <div className="flex gap-2">
                    <button onClick={() => {
                      onAuthorityNote?.(issue.id, noteText);
                      setEditingNote(false);
                    }} className="inline-flex items-center gap-1.5 rounded-lg bg-amber-500/15 px-3 py-2 text-xs font-semibold text-amber-200">
                      <Save className="h-3.5 w-3.5" /> Save
                    </button>
                    <button onClick={() => {
                      setEditingNote(false);
                      setNoteText(issue.authorityNote ?? "");
                    }} className="rounded-lg px-3 py-2 text-xs text-slate-400 hover:bg-slate-700">
                      Cancel
                    </button>
                  </div>
                </div>
              )}
              <div className="flex justify-end gap-2 border-t border-amber-500/10 pt-3">
                {confirmDelete ? (
                  <>
                    <button onClick={handleDelete} className="rounded-lg bg-rose-500/20 px-3 py-2 text-xs font-semibold text-rose-200">Confirm delete</button>
                    <button onClick={() => setConfirmDelete(false)} className="rounded-lg px-3 py-2 text-xs text-slate-400">Cancel</button>
                  </>
                ) : (
                  <button onClick={() => setConfirmDelete(true)} className="inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs text-rose-300 hover:bg-rose-500/10">
                    <Trash2 className="h-3.5 w-3.5" /> Delete
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </article>
  );
}
