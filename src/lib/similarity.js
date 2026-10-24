/**
 * similarity.js
 * Deterministic duplicate / similar-issue detection for CampusEcho.
 *
 * Algorithm (all scoring is additive, capped at 1.0 before the %-conversion):
 *
 *   Token overlap score  — Jaccard-like overlap of normalized tokens drawn
 *                          from (description + summary + keywords) of both issues.
 *                          Max contribution: 0.50
 *
 *   Category bonus       — +0.25 when both issues share the same category.
 *
 *   Location bonus       — +0.25 when both locations are non-"Unknown" AND
 *                          share at least one significant building / room token.
 *
 * Threshold: issues with a combined score >= 0.35 are returned as "similar".
 */

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

/** Words that carry no semantic meaning and should be filtered out. */
const STOP_WORDS = new Set([
  "a", "an", "the", "is", "are", "was", "were", "be", "been", "being",
  "have", "has", "had", "do", "does", "did", "will", "would", "shall",
  "should", "may", "might", "must", "can", "could", "to", "of", "in",
  "on", "at", "for", "with", "by", "from", "and", "or", "but", "not",
  "no", "so", "if", "as", "it", "its", "this", "that", "these", "those",
  "i", "we", "you", "he", "she", "they", "my", "our", "your", "his",
  "her", "their", "what", "which", "who", "how", "when", "where", "why",
  // Common Banglish filler that adds noise
  "e", "ta", "te", "ke", "er", "re", "ba", "o",
]);

/**
 * Tokenizes a string into a Set of lowercase, de-duplicated meaningful tokens.
 * Strips punctuation, numbers-only tokens, and stop-words.
 *
 * @param {string} text
 * @returns {Set<string>}
 */
function tokenize(text) {
  if (!text || typeof text !== "string") return new Set();

  return new Set(
    text
      .toLowerCase()
      .replace(/[^a-z0-9\u0980-\u09FF\s]/g, " ") // keep latin, digits, Bengali script
      .split(/\s+/)
      .filter((t) => t.length > 1 && !STOP_WORDS.has(t) && !/^\d+$/.test(t))
  );
}

/**
 * Builds a combined token set from an issue's description, summary, and keywords.
 *
 * @param {object} issue
 * @returns {Set<string>}
 */
function buildTokenSet(issue) {
  const combined = [
    issue.description ?? "",
    issue.summary ?? "",
    ...(Array.isArray(issue.keywords) ? issue.keywords : []),
  ].join(" ");
  return tokenize(combined);
}

/**
 * Jaccard-like overlap: |A ∩ B| / |A ∪ B|, scaled to a max contribution of 0.50.
 *
 * @param {Set<string>} setA
 * @param {Set<string>} setB
 * @returns {number}  0 – 0.50
 */
function tokenOverlapScore(setA, setB) {
  if (setA.size === 0 || setB.size === 0) return 0;

  let intersectionSize = 0;
  for (const token of setA) {
    if (setB.has(token)) intersectionSize++;
  }

  const unionSize = setA.size + setB.size - intersectionSize;
  const jaccard = intersectionSize / unionSize; // 0 – 1
  return jaccard * 0.50;                         // scale to max 0.50
}

/**
 * Returns +0.25 if both issues are in the same category.
 *
 * @param {object} newIssue
 * @param {object} existing
 * @returns {number}
 */
function categoryBonus(newIssue, existing) {
  if (
    newIssue.category &&
    existing.category &&
    newIssue.category === existing.category
  ) {
    return 0.25;
  }
  return 0;
}

/**
 * Returns +0.25 when both locations are real (not "Unknown") and share at least
 * one significant location token (building name, room number, etc.).
 *
 * @param {string} locA
 * @param {string} locB
 * @returns {number}
 */
function locationBonus(locA, locB) {
  const UNKNOWN = "unknown";
  if (!locA || !locB) return 0;
  if (locA.toLowerCase() === UNKNOWN || locB.toLowerCase() === UNKNOWN) return 0;

  const tokensA = tokenize(locA);
  const tokensB = tokenize(locB);

  for (const t of tokensA) {
    if (tokensB.has(t)) return 0.25;
  }
  return 0;
}

/**
 * Collects human-readable reasons for the match to surface in the UI.
 *
 * @param {number} overlapScore
 * @param {number} catBonus
 * @param {number} locBonus
 * @returns {string[]}
 */
function buildMatchReasons(overlapScore, catBonus, locBonus) {
  const reasons = [];
  if (overlapScore >= 0.15) reasons.push("Matching keywords");
  if (catBonus > 0) reasons.push("Same category");
  if (locBonus > 0) reasons.push("Similar location");
  return reasons;
}

// ---------------------------------------------------------------------------
// Primary export
// ---------------------------------------------------------------------------

/**
 * Finds existing issues that are similar to a newly submitted report.
 *
 * @param {object} newIssue       - The freshly analysed issue (may lack an id).
 * @param {object[]} existingIssues - Array of existing issues to compare against.
 * @param {number} [threshold=0.35] - Minimum combined score to be "similar".
 * @returns {Array<object & { matchScore: number, matchReasons: string[] }>}
 *   Matching issues sorted by matchScore descending, with matchScore (0-100)
 *   and matchReasons array added.
 */
export function findSimilarIssues(newIssue, existingIssues, threshold = 0.35) {
  if (!newIssue || !Array.isArray(existingIssues) || existingIssues.length === 0) {
    return [];
  }

  const newTokens = buildTokenSet(newIssue);

  const results = [];

  for (const existing of existingIssues) {
    // Skip comparing an issue to itself (same id)
    if (existing.id && newIssue.id && existing.id === newIssue.id) continue;

    const existingTokens = buildTokenSet(existing);
    const overlap  = tokenOverlapScore(newTokens, existingTokens);
    const catBonus = categoryBonus(newIssue, existing);
    const locBonus = locationBonus(newIssue.location, existing.location);

    const rawScore = overlap + catBonus + locBonus;
    const capped   = Math.min(rawScore, 1.0);

    if (capped >= threshold) {
      results.push({
        ...existing,
        matchScore:   Math.round(capped * 100),
        matchReasons: buildMatchReasons(overlap, catBonus, locBonus),
      });
    }
  }

  // Sort highest match first
  results.sort((a, b) => b.matchScore - a.matchScore);
  return results;
}
