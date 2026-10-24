import { CATEGORIES, IIUC_LOCATIONS } from "@/data/seedIssues";

const CATEGORY_KEYWORDS = {
  "Facilities": ["ac", "air conditioner", "electricity", "light", "fan", "building", "cleaning"],
  "IT & Equipment": ["computer", "pc", "projector", "wifi", "internet", "printer", "laptop", "lab"],
  "Water & Sanitation": ["water", "tap", "toilet", "washroom", "drinking", "drain"],
  "Transport & Bus": ["bus", "transport", "shuttle", "route", "traffic"],
  "Admin & Queue": ["queue", "office", "admit card", "certificate", "registration", "payment"],
  "Seating & Space": ["seat", "classroom", "room", "crowded", "space"],
};

const CATEGORY_OFFICE = {
  Facilities: "Estate & Facilities Office",
  "IT & Equipment": "IT & Maintenance Cell",
  "Water & Sanitation": "Estate & Facilities Office",
  "Transport & Bus": "Transport Division",
  "Admin & Queue": "Academic Admin Office",
  "Seating & Space": "Academic Admin Office",
  Other: "Student Affairs Office",
};

export function buildFallbackAnalysis(description, location, category) {
  const normalized = description.trim().replace(/\s+/g, " ");
  const lowerDescription = normalized.toLowerCase();
  const detectedCategory = CATEGORIES.includes(category)
    ? category
    : Object.entries(CATEGORY_KEYWORDS).find(([, keywords]) =>
      keywords.some((keyword) => lowerDescription.includes(keyword))
    )?.[0] ?? "Other";
  const detectedLocation = location?.trim()
    || IIUC_LOCATIONS.find((candidate) => lowerDescription.includes(candidate.toLowerCase()))
    || "Unknown";
  const keywords = lowerDescription
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .filter((word) => word.length > 3)
    .slice(0, 5);

  return {
    category: detectedCategory,
    urgency: /\b(urgent|emergency|danger|unsafe|fire|accident|exposed wire)\b/i.test(normalized)
      ? "High"
      : "Medium",
    location: detectedLocation,
    summary: normalized.length > 220 ? `${normalized.slice(0, 220).trimEnd()}…` : normalized,
    summaryBn: "AI সারাংশ তৈরি করা যায়নি। মূল প্রতিবেদনটি দেখুন।",
    suggestedOffice: CATEGORY_OFFICE[detectedCategory],
    keywords,
  };
}
