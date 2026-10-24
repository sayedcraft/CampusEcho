/**
 * validator.js
 * AI response validation and sanitization for CampusEcho.
 *
 * STRICT NON-HALLUCINATION POLICY:
 *   - location is NEVER fabricated. If the AI can't determine it, we fall back
 *     to the user-supplied fallbackLocation or explicitly set "Unknown".
 *   - All fields have safe, deterministic fallbacks so a bad AI response can
 *     never crash the app or surface garbage data.
 */

import { CATEGORIES } from "@/data/seedIssues";

const VALID_URGENCIES = ["Low", "Medium", "High"];

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

/**
 * Strips markdown code fences and extracts the first {...} JSON block.
 * Handles responses like: ```json\n{...}\n``` or plain {…}.
 *
 * @param {string} raw
 * @returns {string}
 */
function extractJSON(raw) {
  if (typeof raw !== "string") return "{}";

  // Remove markdown code fences (```json ... ``` or ``` ... ```)
  let cleaned = raw
    .replace(/^```(?:json)?\s*/im, "")
    .replace(/\s*```\s*$/m, "")
    .trim();

  // If there is still surrounding text, pull out the first {...} block
  const firstBrace = cleaned.indexOf("{");
  const lastBrace = cleaned.lastIndexOf("}");
  if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
    cleaned = cleaned.slice(firstBrace, lastBrace + 1);
  }

  return cleaned;
}

/**
 * Safely trims a value to a non-empty string, or returns the fallback.
 *
 * @param {unknown} value
 * @param {string} fallback
 * @returns {string}
 */
function safeString(value, fallback = "") {
  if (typeof value === "string" && value.trim().length > 0) {
    return value.trim();
  }
  return fallback;
}

/**
 * Returns true when the location string looks like a real, non-placeholder value.
 *
 * @param {unknown} loc
 * @returns {boolean}
 */
function isLocationFabricated(loc) {
  if (!loc || typeof loc !== "string" || loc.trim().length === 0) return true;
  const normalized = loc.trim().toLowerCase();
  const PLACEHOLDER_PATTERNS = [
    "unknown",
    "not specified",
    "not provided",
    "n/a",
    "none",
    "unspecified",
    "null",
    "undefined",
  ];
  return PLACEHOLDER_PATTERNS.includes(normalized);
}

// ---------------------------------------------------------------------------
// Primary export
// ---------------------------------------------------------------------------

/**
 * Validates and sanitizes raw AI JSON output for a submitted campus issue.
 *
 * @param {string} rawOutput          - Raw string returned by the Gemini API.
 * @param {string} [fallbackLocation] - The location the user typed in the form.
 * @param {string} [fallbackCategory] - The category the user selected in the form.
 * @returns {{
 *   category: string,
 *   urgency: "Low"|"Medium"|"High",
 *   location: string,
 *   summary: string,
 *   summaryBn: string,
 *   suggestedOffice: string,
 *   keywords: string[],
 * }}
 */
export function validateAIAnalysis(rawOutput, fallbackLocation, fallbackCategory) {
  // ── 1. Parse ────────────────────────────────────────────────────────────
  let parsed = {};
  try {
    const jsonString = extractJSON(rawOutput);
    parsed = JSON.parse(jsonString);
  } catch {
    // If the AI returned garbage JSON, we work with empty defaults below.
    parsed = {};
  }

  // ── 2. category ─────────────────────────────────────────────────────────
  const category = CATEGORIES.includes(parsed.category)
    ? parsed.category
    : CATEGORIES.includes(fallbackCategory)
    ? fallbackCategory
    : "Other";

  // ── 3. urgency ──────────────────────────────────────────────────────────
  const urgency = VALID_URGENCIES.includes(parsed.urgency) ? parsed.urgency : "Medium";

  // ── 4. location — STRICT NON-HALLUCINATION ──────────────────────────────
  // Priority:  AI value (if genuine) → user's fallbackLocation → "Unknown"
  let location;
  if (!isLocationFabricated(parsed.location)) {
    location = parsed.location.trim();
  } else if (fallbackLocation && !isLocationFabricated(fallbackLocation)) {
    location = fallbackLocation.trim();
  } else {
    location = "Unknown";
  }

  // ── 5. summary (English) ────────────────────────────────────────────────
  const summary = safeString(
    parsed.summary,
    "No summary available. Please review the original description."
  );

  // ── 6. summaryBn (Bangla) ───────────────────────────────────────────────
  const summaryBn = safeString(
    parsed.summaryBn,
    "সারসংক্ষেপ পাওয়া যায়নি। মূল বিবরণটি দেখুন।"
  );

  // ── 7. suggestedOffice ──────────────────────────────────────────────────
  const suggestedOffice = safeString(parsed.suggestedOffice, "Student Affairs Office");

  // ── 8. keywords — up to 5 lowercase non-empty strings ───────────────────
  let keywords = [];
  if (Array.isArray(parsed.keywords)) {
    keywords = parsed.keywords
      .filter((k) => typeof k === "string" && k.trim().length > 0)
      .map((k) => k.trim().toLowerCase())
      .slice(0, 5);
  }

  return { category, urgency, location, summary, summaryBn, suggestedOffice, keywords };
}
