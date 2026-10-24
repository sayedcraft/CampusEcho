/**
 * /api/ai-assistant — Unified AI endpoint for two modes:
 *   - "executive_briefing"  : Analyzes all open issues → campus health report
 *   - "draft_authority_reply": Takes one issue → official reply + action plan
 *
 * Provider cascade: Ollama (local) → Gemini API (cloud fallback)
 */

import { NextResponse } from "next/server";



// ── Config ──────────────────────────────────────────────────────────────────
const OLLAMA_BASE    = process.env.OLLAMA_BASE_URL  ?? "http://127.0.0.1:11434";
const OLLAMA_MODEL   = process.env.OLLAMA_MODEL     ?? "qwen2.5:3b";
const GEMINI_API_KEY = process.env.GEMINI_API_KEY   ?? "";
const GEMINI_MODEL   = "gemini-2.0-flash";
const OLLAMA_TIMEOUT = 45_000;

// ── Prompt builders ──────────────────────────────────────────────────────────

const SYSTEM = {
  executive_briefing: `You are an AI campus operations analyst for IIUC Kumira university. You analyze student-reported campus issues and produce concise executive intelligence reports for university administration. Always respond with ONLY valid JSON — no prose, no markdown.`,
  draft_authority_reply: `You are a helpful IIUC Faculty/Department Coordinator. Given a student campus issue report, produce a professional official response and concrete resolution steps. Always respond with ONLY valid JSON — no prose, no markdown.`,
};

function buildPrompt(mode, payload) {
  if (mode === "executive_briefing") {
    const issues = (payload.issues ?? []).slice(0, 6);
    const summary = issues.map((i, n) =>
      `${n + 1}. [${i.category}] ${i.title} | Status: ${i.status} | Urgency: ${i.urgency} | Location: ${i.location || "Unknown"}`
    ).join("\n");

    return {
      system: SYSTEM.executive_briefing,
      user: `Current IIUC Kumira campus issues (${issues.length} total):\n${summary}\n\nReturn ONLY this JSON:\n{"headline":"<1-sentence English campus health summary>","headlineBn":"<same in Bangla>","criticalHotspots":[{"area":"<area>","issueCount":<number>,"rootCause":"<root cause>","recommendedAction":"<action for admin>"}],"priorityOrder":[{"office":"<IIUC office name>","reason":"<why urgent>","urgency":"High|Medium|Low"}]}`,
    };
  }

  if (mode === "draft_authority_reply") {
    const i = payload.issue ?? {};
    return {
      system: SYSTEM.draft_authority_reply,
      user: `Campus issue report:\nTitle: ${i.title}\nCategory: ${i.category}\nLocation: ${i.location || "Unknown"}\nUrgency: ${i.urgency}\nSummary: ${i.summary}\n\nReturn ONLY this JSON:\n{"officialReply":"<polite English response to students>","officialReplyBn":"<same in Bangla>","actionSteps":["<step1>","<step2>","<step3>"],"estimatedTimeline":"<e.g. Within 48 hours>"}`,
    };
  }

  throw new Error(`Unknown mode: ${mode}`);
}

// ── Deterministic fallbacks ──────────────────────────────────────────────────

const CAT_OFFICE = {
  "IT & Equipment":     "IT & Maintenance Cell",
  "Facilities":         "Estate & Facilities Office",
  "Water & Sanitation": "Estate & Facilities Office",
  "Transport & Bus":    "Transport Division",
  "Admin & Queue":      "Academic Admin Office",
  "Seating & Space":    "Academic Admin Office",
  "Other":              "Student Affairs Office",
};

function buildBriefingFallback(payload) {
  const issues = payload.issues ?? [];
  const catCount = {};
  issues.forEach((i) => { catCount[i.category] = (catCount[i.category] || 0) + 1; });
  const sorted = Object.entries(catCount).sort((a, b) => b[1] - a[1]);
  const highUrgency = issues.filter((i) => i.urgency === "High").length;

  return {
    headline: `IIUC Kumira campus has ${issues.length} active issues — ${highUrgency} high-urgency — requiring coordinated administrative action.`,
    headlineBn: `IIUC কুমিরা ক্যাম্পাসে ${issues.length}টি সক্রিয় সমস্যা রয়েছে, যার মধ্যে ${highUrgency}টি জরুরি ভিত্তিতে সমাধান প্রয়োজন।`,
    criticalHotspots: sorted.slice(0, 3).map(([area, count]) => ({
      area, issueCount: count,
      rootCause: `${count} unresolved ${area} report${count > 1 ? "s" : ""} indicate a recurring maintenance gap.`,
      recommendedAction: `Assign a dedicated ${area} focal point for weekly audits and a 48-hour response SLA.`,
    })),
    priorityOrder: sorted.slice(0, 3).map(([cat, count]) => ({
      office: CAT_OFFICE[cat] || "Student Affairs Office",
      reason: `${count} open ${cat} issue${count > 1 ? "s" : ""} with unresolved student complaints`,
      urgency: count >= 3 ? "High" : count === 2 ? "Medium" : "Low",
    })),
  };
}

function buildReplyFallback(payload) {
  const i = payload.issue ?? {};
  return {
    officialReply: `Dear Students, we have received your report regarding "${i.title}" at ${i.location || "the campus"}. The ${i.suggestedOffice || "relevant department"} has been notified and is assessing the situation. We are committed to resolving this promptly. Thank you for helping us improve our campus.`,
    officialReplyBn: `প্রিয় শিক্ষার্থীরা, "${i.title}" সংক্রান্ত আপনাদের অভিযোগ আমরা পেয়েছি। ${i.suggestedOffice || "সংশ্লিষ্ট বিভাগ"} ইতোমধ্যে বিষয়টি যাচাই করছে। আমরা দ্রুত সমাধানের ব্যবস্থা নিচ্ছি।`,
    actionSteps: [
      `Contact ${i.suggestedOffice || "the relevant office"} to assign a responsible staff member`,
      `Conduct an on-site inspection at ${i.location || "the reported location"} within 24 hours`,
      `Report resolution status to students via official notice board within 72 hours`,
    ],
    estimatedTimeline: i.urgency === "High" ? "Within 24 hours" : "Within 48–72 hours",
  };
}

// ── Output validators ────────────────────────────────────────────────────────

function stripFences(text) {
  return text
    .replace(/^```(?:json)?[\s\S]*?```$/ms, (m) => m.replace(/^```(?:json)?/, "").replace(/```$/, ""))
    .trim();
}

function extractJSON(text) {
  const cleaned = stripFences(text);
  const start = cleaned.indexOf("{");
  const end   = cleaned.lastIndexOf("}");
  if (start === -1 || end === -1) return null;
  try { return JSON.parse(cleaned.slice(start, end + 1)); } catch { return null; }
}

function validateBriefing(obj) {
  if (!obj || typeof obj !== "object") return false;
  if (typeof obj.headline !== "string" || !obj.headline) return false;
  if (!Array.isArray(obj.criticalHotspots)) return false;
  if (!Array.isArray(obj.priorityOrder)) return false;
  return true;
}

function validateReply(obj) {
  if (!obj || typeof obj !== "object") return false;
  if (typeof obj.officialReply !== "string" || !obj.officialReply) return false;
  if (!Array.isArray(obj.actionSteps) || obj.actionSteps.length === 0) return false;
  return true;
}

// ── AI callers ───────────────────────────────────────────────────────────────

async function callOllama(system, user) {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), OLLAMA_TIMEOUT);
  try {
    const res = await fetch(`${OLLAMA_BASE}/api/chat`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      signal: ctrl.signal,
      body: JSON.stringify({
        model: OLLAMA_MODEL,
        stream: false,
        options: { temperature: 0.3, num_predict: 500 },
        messages: [
          { role: "system", content: system },
          { role: "user",   content: user   },
        ],
      }),
    });
    if (!res.ok) throw new Error(`Ollama HTTP ${res.status}`);
    const data = await res.json();
    return data?.message?.content ?? "";
  } finally {
    clearTimeout(timer);
  }
}

async function callGemini(system, user) {
  if (!GEMINI_API_KEY) throw new Error("GEMINI_API_KEY not set");
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${GEMINI_API_KEY}`;
  const combined = `${system}\n\n---\n\n${user}`;
  for (let attempt = 1; attempt <= 2; attempt++) {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ role: "user", parts: [{ text: combined }] }],
        generationConfig: { temperature: 0.3, maxOutputTokens: 500 },
      }),
    });
    if (res.status === 503 && attempt === 1) { await new Promise((r) => setTimeout(r, 2000)); continue; }
    if (!res.ok) { const e = await res.text(); throw new Error(`Gemini HTTP ${res.status}: ${e}`); }
    const data = await res.json();
    const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!text) throw new Error("Gemini returned empty content");
    return text;
  }
  throw new Error("Gemini failed after retry");
}

// ── Request handler ──────────────────────────────────────────────────────────

export async function POST(request) {
  let mode, payload;
  try {
    ({ mode, payload } = await request.json());
    if (!mode || !payload) throw new Error("Missing mode or payload");
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 400 });
  }

  const validate  = mode === "executive_briefing" ? validateBriefing : validateReply;
  const fallback  = mode === "executive_briefing" ? buildBriefingFallback(payload) : buildReplyFallback(payload);

  let { system, user } = buildPrompt(mode, payload);
  let provider = "fallback";
  let result   = null;

  // Try Ollama
  try {
    const raw  = await callOllama(system, user);
    const json = extractJSON(raw);
    if (validate(json)) { result = json; provider = `ollama:${OLLAMA_MODEL}`; }
    else console.warn("[ai-assistant] Ollama output failed validation — falling back to Gemini");
  } catch (err) {
    console.warn("[ai-assistant] Ollama unavailable:", err.message);
  }

  // Try Gemini
  if (!result && GEMINI_API_KEY) {
    try {
      const raw  = await callGemini(system, user);
      const json = extractJSON(raw);
      if (validate(json)) { result = json; provider = `gemini:${GEMINI_MODEL}`; }
      else console.warn("[ai-assistant] Gemini output failed validation — using deterministic fallback");
    } catch (err) {
      console.warn("[ai-assistant] Gemini failed:", err.message);
    }
  }

  // Deterministic fallback
  if (!result) { result = fallback; provider = "deterministic-fallback"; }

  return NextResponse.json({ result, meta: { provider, mode } });
}
