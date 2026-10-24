"use client";

import { useMemo, useState } from "react";
import { CheckCircle2, Clock3, MapPin, MessageCircle, Send, ThumbsUp, UsersRound } from "lucide-react";

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

function getAverageResolutionHours(issues) {
  const durations = issues
    .map((issue) => {
      const createdAt = Date.parse(issue.createdAt ?? "");
      const resolvedAt = Date.parse(issue.resolvedAt ?? "");
      return Number.isFinite(createdAt) && Number.isFinite(resolvedAt) && resolvedAt >= createdAt
        ? (resolvedAt - createdAt) / 3_600_000
        : null;
    })
    .filter((duration) => duration !== null);

  return durations.length
    ? durations.reduce((total, duration) => total + duration, 0) / durations.length
    : null;
}

function formatResolutionTime(hours, language) {
  if (hours === null) return language === "bn" ? "তথ্য নেই" : "Not enough data";
  if (hours < 24) return language === "bn" ? "২৪ ঘণ্টার কম" : "Under 24 Hours";
  const days = hours / 24;
  return language === "bn"
    ? `${days.toFixed(1)} দিন`
    : `${days.toFixed(1)} days`;
}

export default function CommunityWall({
  issues,
  language = "en",
  currentUser,
  currentRole,
  onReact,
  onAddComment,
  onRequestLogin,
}) {
  const [openComments, setOpenComments] = useState(null);
  const [draft, setDraft] = useState("");
  const isBangla = language === "bn";

  const resolvedIssues = useMemo(
    () => issues.filter((issue) => issue.status === "Resolved"),
    [issues],
  );
  const solvedThisMonth = useMemo(() => {
    const now = new Date();
    return resolvedIssues.filter((issue) => {
      const resolvedAt = Date.parse(issue.resolvedAt ?? "");
      if (!Number.isFinite(resolvedAt)) return false;
      const date = new Date(resolvedAt);
      return date.getFullYear() === now.getFullYear() && date.getMonth() === now.getMonth();
    }).length;
  }, [resolvedIssues]);
  const responseRate = issues.length
    ? Math.round((issues.filter((issue) => issue.authorityNote?.trim()).length / issues.length) * 100)
    : 0;
  const averageResolutionHours = useMemo(
    () => getAverageResolutionHours(resolvedIssues),
    [resolvedIssues],
  );

  const requestStudentLogin = () => onRequestLogin?.();

  const handleReaction = (issue) => {
    if (currentRole !== "student") {
      requestStudentLogin();
      return;
    }
    onReact?.(issue.id);
  };

  const handleCommentSubmit = (event, issueId) => {
    event.preventDefault();
    if (currentRole !== "student") {
      requestStudentLogin();
      return;
    }
    const message = draft.trim();
    if (!message) return;
    onAddComment?.(issueId, message);
    setDraft("");
  };

  return (
    <section aria-label={isBangla ? "কমিউনিটি ও প্রভাব" : "Community and impact"} className="space-y-7">
      <header className="overflow-hidden rounded-3xl border border-indigo-100 bg-gradient-to-br from-indigo-50 via-white to-emerald-50 p-6 shadow-sm shadow-slate-200/40 sm:p-8">
        <div className="mb-7 max-w-2xl">
          <p className="mb-2 text-sm font-semibold uppercase tracking-[0.16em] text-indigo-700">
            {isBangla ? "একসাথে উন্নত ক্যাম্পাস" : "A better campus, together"}
          </p>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
            {isBangla ? "🤝 কমিউনিটি ও ইতিবাচক প্রভাব" : "🤝 Community & Wall of Impact"}
          </h1>
          <p className="mt-2 text-sm text-slate-600">
            {isBangla
              ? "সমাধান হওয়া সমস্যাগুলো দেখুন, দায়বদ্ধতাকে স্বীকৃতি দিন, ধন্যবাদ জানান।"
              : "See what got fixed, recognize accountability, and celebrate the people who made it happen."}
          </p>
        </div>

        <div className="grid gap-3 sm:grid-cols-3">
          <Metric
            icon={<CheckCircle2 className="h-5 w-5" />}
            value={solvedThisMonth}
            label={isBangla ? "এই মাসে সমাধান" : "Solved this month"}
          />
          <Metric
            icon={<Clock3 className="h-5 w-5" />}
            value={formatResolutionTime(averageResolutionHours, language)}
            label={isBangla ? "গড় সমাধানের সময়" : "Average resolution time"}
          />
          <Metric
            icon={<UsersRound className="h-5 w-5" />}
            value={`${responseRate}%`}
            label={isBangla ? "কর্তৃপক্ষের সাড়া" : "Authority response rate"}
          />
        </div>
      </header>

      <div className="flex items-end justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white">
            {isBangla ? "সমাধান হওয়া সমস্যাগুলো" : "Resolved on campus"}
          </h2>
          <p className="mt-1 text-sm text-slate-400">
            {isBangla
              ? `${resolvedIssues.length}টি যাচাইকৃত সমাধান`
              : `${resolvedIssues.length} verified ${resolvedIssues.length === 1 ? "resolution" : "resolutions"}`}
          </p>
        </div>
      </div>

      {resolvedIssues.length === 0 ? (
        <div className="rounded-2xl border border-slate-700/60 bg-slate-800/50 p-10 text-center">
          <span className="text-4xl" aria-hidden="true">🌱</span>
          <p className="mt-3 font-semibold text-slate-200">
            {isBangla ? "এখনো কোনো সমস্যা সমাধান হয়নি" : "No resolved issues yet"}
          </p>
          <p className="mt-1 text-sm text-slate-400">
            {isBangla ? "সমস্যা সমাধান হলে এখানে দেখা যাবে।" : "Resolved campus reports will appear here."}
          </p>
        </div>
      ) : (
        <div className="grid gap-5 xl:grid-cols-2">
          {resolvedIssues.map((issue) => {
            const comments = Array.isArray(issue.comments) ? issue.comments : [];
            const isCommentOpen = openComments === issue.id;
            const hasReacted = currentUser && (issue.thanksBy ?? []).includes(currentUser.id);
            const resolutionNote = issue.authorityNote?.trim()
              || (isBangla ? "কর্তৃপক্ষ সমস্যাটি সমাধান করেছে।" : "The authority has resolved this report.");
            const updatedBy = issue.updatedBy || issue.suggestedOffice || (isBangla ? "IIUC কর্তৃপক্ষ" : "IIUC Authority");

            return (
              <article key={issue.id} className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-sm shadow-slate-200/40 transition-all hover:-translate-y-0.5 hover:border-emerald-200 hover:shadow-md">
                <div className="p-5 sm:p-6">
                  <div className="mb-4 flex flex-wrap items-center gap-2">
                    <span className="rounded-full bg-slate-700/70 px-3 py-1.5 text-xs font-semibold text-slate-200">
                      <span aria-hidden="true">{CATEGORY_ICON[issue.category] ?? CATEGORY_ICON.Other}</span>
                      {" "}{isBangla ? CATEGORY_BN[issue.category] ?? issue.category : issue.category}
                    </span>
                    {issue.location && (
                      <span className="inline-flex max-w-full items-center gap-1 rounded-full border border-slate-700 bg-slate-900/60 px-3 py-1.5 text-xs text-slate-400">
                        <MapPin className="h-3 w-3 shrink-0" />
                        <span className="truncate">{issue.location}</span>
                      </span>
                    )}
                    <span className="ml-auto inline-flex items-center gap-1 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1.5 text-xs font-semibold text-emerald-300">
                      <CheckCircle2 className="h-3.5 w-3.5" />
                      {isBangla ? "✅ সমাধান যাচাইকৃত" : "✅ Verified Fixed"}
                    </span>
                  </div>

                  <p className="text-base font-semibold leading-relaxed text-white">
                    {isBangla ? issue.summaryBn || issue.summary || issue.title : issue.summary || issue.title}
                  </p>

                  <div className="mt-5 rounded-xl border border-emerald-500/15 bg-emerald-500/[0.07] p-4">
                    <p className="mb-1.5 text-xs font-bold uppercase tracking-wide text-emerald-300">
                      {isBangla ? "কর্তৃপক্ষের সমাধান" : "Official resolution"}
                    </p>
                    <p className="text-sm leading-relaxed text-emerald-950">{resolutionNote}</p>
                    <p className="mt-2 text-xs font-semibold text-emerald-300/75">
                      {isBangla ? "সমাধান করেছেন" : "Resolved by"} {updatedBy}
                      {issue.suggestedOffice && updatedBy !== issue.suggestedOffice
                        ? ` · ${issue.suggestedOffice}`
                        : ""}
                    </p>
                  </div>
                </div>

                <footer className="border-t border-slate-700/60 bg-slate-900/30 px-5 py-3 sm:px-6">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <button
                      type="button"
                      onClick={() => handleReaction(issue)}
                      aria-pressed={Boolean(hasReacted)}
                      className={`inline-flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-semibold transition-colors ${
                        hasReacted
                          ? "bg-indigo-500/15 text-indigo-300"
                          : "text-slate-300 hover:bg-slate-700/70 hover:text-white"
                      }`}
                    >
                      <ThumbsUp className="h-4 w-4" />
                      {isBangla ? "🎉 দারুণ / ধন্যবাদ" : "🎉 Awesome / Thanks"}
                      <span className="rounded-full bg-slate-700/70 px-2 py-0.5 text-xs tabular-nums">
                        +{issue.thanksCount ?? 0}
                      </span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setOpenComments(isCommentOpen ? null : issue.id)}
                      aria-expanded={isCommentOpen}
                      className="inline-flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-medium text-slate-400 transition-colors hover:bg-slate-700/70 hover:text-white"
                    >
                      <MessageCircle className="h-4 w-4" />
                      {isBangla ? "শিক্ষার্থীদের মন্তব্য" : "Student Comments"} ({comments.length})
                    </button>
                  </div>

                  {isCommentOpen && (
                    <div className="mt-3 space-y-3 border-t border-slate-700/50 pt-4">
                      {comments.length > 0 ? (
                        <ul className="max-h-56 space-y-3 overflow-y-auto">
                          {comments.map((comment) => (
                            <li key={comment.id} className="rounded-xl bg-slate-800/70 px-3 py-2.5">
                              <p className="text-xs font-semibold text-indigo-300">{comment.name || (isBangla ? "IIUC শিক্ষার্থী" : "IIUC Student")}</p>
                              <p className="mt-1 break-words text-sm text-slate-200">{comment.text}</p>
                            </li>
                          ))}
                        </ul>
                      ) : (
                        <p className="text-sm text-slate-500">
                          {isBangla ? "এখনো কোনো মন্তব্য নেই। প্রথম ধন্যবাদটি জানান!" : "No comments yet. Be the first to say thanks!"}
                        </p>
                      )}

                      <form onSubmit={(event) => handleCommentSubmit(event, issue.id)} className="flex gap-2">
                        <label className="sr-only" htmlFor={`comment-${issue.id}`}>
                          {isBangla ? "আপনার মন্তব্য" : "Your comment"}
                        </label>
                        <input
                          id={`comment-${issue.id}`}
                          value={draft}
                          onChange={(event) => setDraft(event.target.value)}
                          maxLength={300}
                          placeholder={isBangla ? "একটি ধন্যবাদ বার্তা লিখুন..." : "Write a quick thank-you..."}
                          className="min-w-0 flex-1 rounded-xl border border-slate-700 bg-slate-900/70 px-3 py-2.5 text-sm text-white outline-none placeholder:text-slate-500 focus:border-indigo-500"
                        />
                        <button
                          type="submit"
                          disabled={!draft.trim()}
                          aria-label={isBangla ? "মন্তব্য পাঠান" : "Post comment"}
                          className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-indigo-600 text-white transition-colors hover:bg-indigo-500 disabled:cursor-not-allowed disabled:opacity-40"
                        >
                          <Send className="h-4 w-4" />
                        </button>
                      </form>
                      {currentRole !== "student" && (
                        <p className="text-xs text-slate-500">
                          {isBangla ? "প্রতিক্রিয়া জানাতে শিক্ষার্থী হিসেবে লগইন করুন।" : "Log in as a student to react or comment."}
                        </p>
                      )}
                    </div>
                  )}
                </footer>
              </article>
            );
          })}
        </div>
      )}
    </section>
  );
}

function Metric({ icon, value, label }) {
  return (
    <div className="rounded-2xl border border-slate-200/80 bg-white/90 p-4 shadow-sm">
      <div className="mb-3 flex items-center gap-2 text-slate-600">
        {icon}
        <span className="text-xs font-semibold uppercase tracking-wide">{label}</span>
      </div>
      <p className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">{value}</p>
    </div>
  );
}
