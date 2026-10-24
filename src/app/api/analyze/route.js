/**
 * src/app/api/analyze/route.js
 * POST /api/analyze
 *
 * Accepts a campus issue description and returns:
 *   - AI-generated structured analysis (category, urgency, location, summaries, keywords)
 *   - Similar existing issues (via deterministic similarity engine)
 *   - Which AI provider was used (for UI transparency)
 *
 * Provider strategy:
 *   1. Ollama (local, qwen2.5:3b) — primary, zero-cost, offline-capable
 *   2. Gemini 2.0 Flash          — cloud fallback when Ollama is unavailable
 *
 * Both providers receive the same structured JSON prompt so the validator
 * produces consistent output regardless of which one responds.
 */

import { NextResponse } from "next/server";
import { hasCompleteAIAnalysis, validateAIAnalysis } from "@/lib/validator";
import { buildFallbackAnalysis } from "@/lib/fallbackAnalysis";
import { findSimilarIssues } from "@/lib/similarity";
import seedIssues, { CATEGORIES, IIUC_LOCATIONS } from "@/data/seedIssues";

// ---------------------------------------------------------------------------
// Configuration
// ---------------------------------------------------------------------------

const OLLAMA_BASE_URL  = process.env.OLLAMA_BASE_URL  ?? "http://127.0.0.1:11434";
const OLLAMA_MODEL     = process.env.OLLAMA_MODEL     ?? "llama3.2:latest";
const GEMINI_API_KEY   = process.env.GEMINI_API_KEY   ?? "";
const GEMINI_MODEL     = "gemini-3.8-flash";
const OLLAMA_TIMEOUT_MS = 45_000; // qwen2.5:3b cold-start on CPU ~35-40 s
const GEMINI_TIMEOUT_MS = 15_000;

// ---------------------------------------------------------------------------
// Prompt builder
// ---------------------------------------------------------------------------

/**
 * Builds the shared system + user prompt for both AI providers.
 * The model is instructed to return ONLY a JSON object, no prose.
 *
 * @param {object} p
 * @param {string} p.title
 * @param {string} p.description
 * @param {string} p.userCategory  - Category pre-selected by the user in the form
 * @param {string} p.userLocation  - Location typed/selected by the user in the form
 * @returns {{ system: string, user: string }}
 */
function buildPrompt({ title, description, userCategory, userLocation }) {
  const categoryList = CATEGORIES.join(", ");
  const locationHint = userLocation ? `The user indicated the location as: "${userLocation}".` : "";

  const system = `You are a campus issue classification assistant for IIUC (International Islamic University Chittagong), Kumira campus.
Your job is to analyse student-submitted campus issue reports and return ONLY a valid JSON object — no explanations, no markdown prose, no code fences.

Rules you MUST follow:
1. "category" must be exactly one of: ${categoryList}
2. "urgency" must be exactly one of: Low, Medium, High
3. "location" — CRITICAL: NEVER invent a location. If the user's description or the location hint makes the location clear, use it verbatim or in a cleaned form. If you genuinely cannot determine the location, return null.
4. "summary" — concise English summary (2-3 sentences max).
5. "summaryBn" — concise Bangla summary of the same content (2-3 sentences).
6. "suggestedOffice" — the most relevant IIUC administrative office (e.g., "IT & Maintenance Cell", "Estate & Facilities Office", "Transport Division", "Academic Admin Office", "Student Affairs Office").
7. "keywords" — array of 3-5 lowercase English words that best identify this issue type.

Return ONLY this JSON shape (no other text):
{
  "category": "...",
  "urgency": "...",
  "location": "...",
  "summary": "...",
  "summaryBn": "...",
  "suggestedOffice": "...",
  "keywords": ["...", "..."]
}`;

  const user = `Analyse this campus issue report.
${locationHint}
User's selected category: "${userCategory || "Unknown"}"

Title: ${title}

Description:
${description}`;

  return { system, user };
}

// ---------------------------------------------------------------------------
// Ollama provider
// ---------------------------------------------------------------------------

/**
 * Calls the local Ollama /api/chat endpoint.
 * Returns the raw assistant message string, or throws on timeout/error.
 *
 * @param {string} system
 * @param {string} user
 * @returns {Promise<string>}
 */
async function callOllama(system, user) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), OLLAMA_TIMEOUT_MS);

  try {
    const res = await fetch(`${OLLAMA_BASE_URL}/api/chat`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      signal: controller.signal,
      body: JSON.stringify({
        model: OLLAMA_MODEL,
        stream: false,
        options: { temperature: 0.2, num_predict: 300 }, // JSON-only → short output
        messages: [
          { role: "system", content: system },
          { role: "user",   content: user   },
        ],
      }),
    });

    if (!res.ok) throw new Error(`Ollama HTTP ${res.status}`);

    const data = await res.json();
    // Ollama chat response shape: { message: { role, content }, ... }
    const content = data?.message?.content;
    if (!content) throw new Error("Ollama returned empty content");
    return content;
  } finally {
    clearTimeout(timer);
  }
}

// ---------------------------------------------------------------------------
// Gemini provider
// ---------------------------------------------------------------------------

/**
 * Calls the Gemini 2.0 Flash generateContent REST endpoint.
 * Returns the raw text response, or throws on error.
 *
 * @param {string} system
 * @param {string} user
 * @returns {Promise<string>}
 */
async function callGemini(system, user) {
  if (!GEMINI_API_KEY) throw new Error("GEMINI_API_KEY is not set");

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), GEMINI_TIMEOUT_MS);
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${GEMINI_API_KEY}`;

  // Embed system prompt as first user turn — avoids empty-output bug with
  // system_instruction + responseMimeType on gemini-3.8-flash.
  const combinedUserPrompt = `${system}\n\n---\n\n${user}`;

  const payload = JSON.stringify({
    contents: [{ role: "user", parts: [{ text: combinedUserPrompt }] }],
    generationConfig: { temperature: 0.2, maxOutputTokens: 400 },
  });

  try {
    // One automatic retry on transient 503 (demand spike)
    for (let attempt = 1; attempt <= 2; attempt++) {
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        signal: controller.signal,
        body: payload,
      });

      if (res.status === 503 && attempt === 1) {
        await new Promise((r) => setTimeout(r, 2000));
        continue;
      }

      if (!res.ok) {
        const err = await res.text();
        throw new Error(`Gemini HTTP ${res.status}: ${err}`);
      }

      const data = await res.json();

      // Guard against safety blocks or empty candidates
      const candidate = data?.candidates?.[0];
      if (!candidate) throw new Error("Gemini returned no candidates");
      if (candidate.finishReason === "SAFETY") throw new Error("Gemini blocked by safety filter");

      const text = candidate?.content?.parts?.[0]?.text;
      if (!text) throw new Error("Gemini returned empty content");
      return text;
    }

    throw new Error("Gemini failed after retry");
  } catch (error) {
    if (controller.signal.aborted) {
      throw new Error(`Gemini timed out after ${GEMINI_TIMEOUT_MS / 1000} seconds`);
    }
    throw error;
  } finally {
    clearTimeout(timer);
  }
}

// ---------------------------------------------------------------------------
// Route handler
// ---------------------------------------------------------------------------

export async function POST(request) {
  // ── 1. Parse & basic validation ─────────────────────────────────────────
  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "Invalid JSON in request body" },
      { status: 400 }
    );
  }

  const { title, description, category: userCategory, location: userLocation } = body;

  if (!title?.trim() || !description?.trim()) {
    return NextResponse.json(
      { error: "Both 'title' and 'description' are required" },
      { status: 400 }
    );
  }

  if (description.trim().length < 20) {
    return NextResponse.json(
      { error: "Description is too short. Please provide more detail (at least 20 characters)." },
      { status: 400 }
    );
  }

  // ── 2. Build prompt ─────────────────────────────────────────────────────
  const { system, user } = buildPrompt({
    title:        title.trim(),
    description:  description.trim(),
    userCategory: userCategory ?? "",
    userLocation: userLocation ?? "",
  });

  // ── 3. Call AI (Ollama → Gemini fallback) ────────────────────────────────
  let rawAIOutput = "";
  let provider    = "unknown";
  let attemptedProvider = "";
  let fallbackReason = "";

  try {
    rawAIOutput = await callOllama(system, user);
    provider    = `ollama:${OLLAMA_MODEL}`;
  } catch (ollamaError) {
    attemptedProvider = `ollama:${OLLAMA_MODEL}`;
    console.warn(`[analyze] Ollama unavailable (${ollamaError.message}), falling back to Gemini`);
    try {
      rawAIOutput = await callGemini(system, user);
      provider    = `gemini:${GEMINI_MODEL}`;
    } catch (geminiError) {
      console.error("[analyze] Gemini also failed:", geminiError.message);
      attemptedProvider += ` → gemini:${GEMINI_MODEL}`;
      provider = "smart-fallback";
      fallbackReason = "providers-unavailable";
    }
  }

  // ── 4. Validate & sanitize AI output ────────────────────────────────────
  const completeAnalysis = hasCompleteAIAnalysis(rawAIOutput);
  const analysis = completeAnalysis
    ? validateAIAnalysis(rawAIOutput, userLocation, userCategory)
    : buildFallbackAnalysis(description, userLocation, userCategory);
  const analysisProvider = completeAnalysis ? provider : "smart-fallback";

  if (!completeAnalysis) {
    if (!fallbackReason) {
      attemptedProvider = provider;
      fallbackReason = "incomplete-analysis";
      console.warn(`[analyze] ${provider} returned incomplete analysis; using deterministic fallback`);
    }
  }

  // ── 5. Similarity check against seed + (future) stored issues ───────────
  const candidateIssue = {
    title:       title.trim(),
    description: description.trim(),
    summary:     analysis.summary,
    keywords:    analysis.keywords,
    category:    analysis.category,
    location:    analysis.location,
  };

  const similarIssues = findSimilarIssues(candidateIssue, seedIssues);

  // ── 6. Return ────────────────────────────────────────────────────────────
  return NextResponse.json({
    analysis,
    similarIssues,
    meta: {
      provider: analysisProvider,
      ...(!completeAnalysis ? { attemptedProvider, warning: fallbackReason } : {}),
      similarCount: similarIssues.length,
      timestamp:    new Date().toISOString(),
    },
  });
}
