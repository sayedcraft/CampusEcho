<div align="center">

# 📢 CampusEcho — IIUC Edition

### *Every campus problem deserves to be heard.*

**AI-powered campus issue reporting & discovery for IIUC Kumira Campus**
Built in 95 minutes for the **IIUC Hackathon 2026**

[![License: MIT](https://img.shields.io/badge/License-MIT-violet.svg)](./LICENSE)
[![Next.js](https://img.shields.io/badge/Next.js-16.4.3-black?logo=next.js)](https://nextjs.org)
[![Ollama](https://img.shields.io/badge/AI-Ollama%20%7C%20qwen2.5:3b-6366f1)](https://ollama.ai)
[![Open Weight](https://img.shields.io/badge/Open--Weight%20AI-Apache%202.0-10b981)](https://huggingface.co/Qwen/Qwen2.5-3B-Instruct)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-v4-38bdf8?logo=tailwindcss)](https://tailwindcss.com)

</div>

---

## 🎯 The Real IIUC Problem We Solve

Every day at **IIUC Kumira campus**, students face real, recurring problems:

| Problem | What Actually Happens |
|---|---|
| 📽️ **Broken lab projector in CSE Lab 302** | Posted in a WhatsApp group, seen by 30 people, forgotten in 2 days |
| 💧 **Water purifier empty in Central Library** | Reported verbally to a guard, never reaches Facilities office |
| 🚌 **Chawkbazar shuttle chronically late** | Complained about on Facebook, 50 reactions, zero action |
| 📋 **2-hour queue at Controller of Examinations** | Discussed in class, no formal record, happens every exam season |
| 🕌 **3 of 4 taps broken in Central Mosque ablution area** | Known to everyone, reported to no one official |

**The result?** Problems repeat semester after semester. The same broken projector, the same late bus. There's no structured channel — just scattered Facebook posts, word-of-mouth, and silent frustration.

**CampusEcho fixes this.** It gives every student a voice that reaches the right office — automatically, in their own language.

---

## ✨ What CampusEcho Does

```
Student types their complaint (in any language)
        ↓
Open-weight AI extracts: category · location · urgency · Bangla summary · keywords
        ↓
Duplicate detector checks: "Has someone already reported this?"
        ↓
If yes  → Upvote the existing report (strength in numbers)
If no   → Submit structured report routed to the right IIUC office
        ↓
Live Campus Pulse dashboard shows what's open, in-progress, resolved
```

**Languages supported:** English · বাংলা · Banglish (and any mix of the three)

### IIUC Login & Live Q&A

- Log in as a student or teacher/authority with an IIUC ID; one-click demo accounts are available for both roles.
- Student reports show the reporter by default, with an option to hide the student's ID publicly.
- Student accounts can upvote reports. Teacher/authority demo accounts can update status, write official remarks, draft AI action plans, and delete reports.
- Ask CampusEcho AI questions in Bangla, Banglish, or English. Answers use only the current issue feed and cite the referenced issue IDs and statuses.
- The active demo account and issue feed are stored in this browser's `localStorage`; there is no server-side identity verification or shared account database.

> **Demo authentication notice:** These zero-config accounts demonstrate the interface and role-based controls only. Client-side roles and the shared authority passcode are not production authentication or a security boundary.

---

## 🤖 Open-Weight AI Model Disclosure

> **CampusEcho runs entirely on open-weight models.** No proprietary black-box AI is required for core functionality.

### Primary Runtime — Local / Offline

| Property | Value |
|---|---|
| **Runtime** | [Ollama](https://ollama.ai) |
| **Model** | `qwen2.5:3b` |
| **License** | Apache 2.0 (fully open-weight) |
| **Source** | [Qwen2.5-3B-Instruct on Hugging Face](https://huggingface.co/Qwen/Qwen2.5-3B-Instruct) |
| **Runs on** | Any machine with Ollama installed — **no GPU required** |
| **Privacy** | 100% local inference — student reports never leave the device |

### Cloud Fallback Runtime — API Deployment

| Property | Value |
|---|---|
| **Runtime** | Google AI Studio API |
| **Model** | `gemma-3-27b-it` (Google Gemma — open-weight) |
| **License** | [Gemma Terms of Use](https://ai.google.dev/gemma/terms) (open-weight, free for research) |
| **Trigger** | Automatically used when Ollama is unavailable or times out |
| **Key** | `GEMINI_API_KEY` in `.env.local` (Google AI Studio free tier) |

### What the AI Does With Each Report

Given a raw student complaint (English, Bangla, or Banglish), the model returns **structured JSON**:

```json
{
  "category": "IT & Equipment",
  "urgency": "High",
  "location": "CSE Building - Lab 302",
  "summary": "Projector in Lab 302 has been non-functional for 2 weeks...",
  "summaryBn": "ল্যাব ৩০২-এর প্রজেক্টর ২ সপ্তাহ ধরে কাজ করছে না...",
  "suggestedOffice": "IT & Maintenance Cell",
  "keywords": ["projector", "lab", "flickering", "cse", "equipment"]
}
```

---

## 🛡️ Reliability & Anti-Hallucination Guardrails

A core concern with AI is **hallucination** — the model inventing facts. For a campus issue tracker, a fabricated location is worse than no location. We address this with strict validation in [`src/lib/validator.js`](./src/lib/validator.js):

### Location Policy — Zero Fabrication Tolerance

```
AI returns location
    ↓
Is it null / "Unknown" / "Not specified" / "N/A" / empty?
    ↓ YES                      ↓ NO
Did user provide a        Use the AI's location
fallback location?        (it looks genuine)
    ↓ YES      ↓ NO
Use user's    Set location = "Unknown"
input         (honest, never invented)
```

This is enforced against **8 placeholder patterns** (`"unknown"`, `"not specified"`, `"n/a"`, `"none"`, `"unspecified"`, `"null"`, `"undefined"`, empty string). The UI displays an amber `⚠ not detected` warning and prompts the user to fill it in manually.

### Urgency Labelling

Urgency is **always labelled as "AI Suggested Urgency"** in both the form's review step and the issue cards. It is never presented as ground truth — it is a starting point that humans can override before submission.

### JSON Extraction

The validator safely strips markdown code fences (` ```json `) from model responses before parsing, so malformed outputs don't crash the application.

---

## 🔍 Similar-Issue Detection Architecture

Before a student submits a new report, [`src/lib/similarity.js`](./src/lib/similarity.js) runs a **deterministic, zero-latency** check against all existing issues client-side.

### Scoring Model

```
Total Score = Token Overlap Score + Category Bonus + Location Bonus
```

| Signal | Method | Max Contribution |
|---|---|---|
| **Token overlap** | Jaccard similarity on normalized tokens from description + summary + keywords | +0.50 |
| **Category match** | Exact match on category string | +0.25 |
| **Location match** | Shared building/room token when neither location is "Unknown" | +0.25 |
| **Threshold** | Issues scoring ≥ 0.35 are surfaced as "similar" | — |

### Tokenization

- Lowercases and strips punctuation
- Removes 40+ English stop-words **plus** common Banglish filler (`ta`, `te`, `ke`, `er`, `ba`, etc.)
- Preserves Bengali Unicode script (`\u0980–\u09FF`) for Bangla keyword matching
- Filters pure-number tokens

### Output

Each similar issue is returned with:
- `matchScore` (0–100%) — displayed prominently
- `matchReasons` — human-readable array: `["Same category", "Matching keywords", "Similar location"]`

**Demo:** Click the **📽️ Broken Lab Projector** preset and run AI analysis — it will immediately surface seed issue #1 (CSE Lab 302 / IT & Equipment) as a 35–60% similar match.

---

## 🚀 Local Setup — Step by Step

### Prerequisites

| Requirement | Version | Install |
|---|---|---|
| Node.js | ≥ 18.x | [nodejs.org](https://nodejs.org) |
| Ollama | Latest | [ollama.ai](https://ollama.ai) |
| Git | Any | [git-scm.com](https://git-scm.com) |

### 1 — Pull the open-weight model

```bash
# Start Ollama service (if not already running)
ollama serve

# Pull the primary model (≈1.9 GB, Apache 2.0 open-weight)
ollama pull qwen2.5:3b

# Verify it's available
ollama list
```

### 2 — Clone the repository

```bash
git clone https://github.com/sayedcraft/CampusEcho.git
cd CampusEcho
```

### 3 — Configure environment variables

Create `.env.local` in the project root:

```env
# ── Local AI (Primary — fully offline, open-weight) ─────────────────────────
OLLAMA_BASE_URL=http://127.0.0.1:11434
OLLAMA_MODEL=qwen2.5:3b

# ── Cloud AI Fallback (Google Gemma via AI Studio API) ───────────────────────
# Get a free key at https://aistudio.google.com/apikey
GEMINI_API_KEY=your_google_ai_studio_key_here

# ── App ──────────────────────────────────────────────────────────────────────
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

> **Offline mode:** If you omit `GEMINI_API_KEY`, CampusEcho still works fully via Ollama. The cloud fallback is only triggered when Ollama is unavailable.

### 4 — Install dependencies & run

```bash
npm install
npm run dev
```

Open **http://localhost:3000** — the app is live.

### 5 — Try the demo flow

1. Log in with one of the demo student accounts in **Switch Account / Login**.
2. Click any **Quick Demo Preset** chip (📽️ 💧 🚌), then **Analyze Issue with AI**.
3. Review the structured output and similar reports; upvote an existing report or submit a new one.
4. Ask one of the sample questions in **Ask CampusEcho AI** to see a bilingual answer with issue references.
5. Switch to a demo teacher or authority account to update statuses, add remarks, draft an AI action plan, and delete reports.
6. Watch **Campus Pulse** stats update in real time.

---

## 🗂 Project Structure

```
CampusEcho/
├── src/
│   ├── app/
│   │   ├── api/analyze/route.js   ← POST /api/analyze (Ollama → Gemma fallback)
│   │   ├── globals.css            ← Dark slate-900 theme
│   │   ├── layout.js              ← SEO metadata + Geist font
│   │   └── page.js                ← Full reactive app shell
│   ├── components/
│   │   ├── Navbar.jsx             ← Brand, AI status pill, CTA
│   │   ├── CampusPulse.jsx        ← Live 4-metric stats dashboard
│   │   ├── IssueForm.jsx          ← 3 presets · 2-step AI flow · similarity alert
│   │   ├── FilterBar.jsx          ← Search · category pills · status buttons
│   │   └── IssueCard.jsx          ← Dual-language card · upvote · status selector
│   ├── data/
│   │   └── seedIssues.js          ← CATEGORIES · STATUSES · IIUC_LOCATIONS · 6 seeds
│   └── lib/
│       ├── validator.js           ← AI output validation + anti-hallucination
│       └── similarity.js          ← Token overlap + category/location scoring
├── .env.local                     ← API keys (not committed)
├── LICENSE                        ← MIT
└── README.md
```

---

## ⚠️ Known Limitations

| Limitation | Detail |
|---|---|
| **No persistent storage** | Issues are held in React state — a page refresh resets to seed data. A future version would use a database (e.g., Supabase, SQLite). |
| **Cold-start latency** | `qwen2.5:3b` takes 35–45 s on first request when running on CPU without GPU acceleration. Subsequent requests are faster (~5–15 s). |
| **Gemini demand spikes** | The cloud fallback (`gemma-3-27b-it` via AI Studio) may return 503 during high-demand periods. The route auto-retries once after 2 s. |
| **Bangla summaries** | Quality depends on the model's Bangla training data. `qwen2.5:3b` produces acceptable but not perfect Bangla — larger models improve this. |
| **Similarity is keyword-based** | The current engine uses token overlap, not semantic embeddings. Two semantically identical reports phrased very differently may score below the 0.35 threshold. |

---

## 🗺️ Future Roadmap

- [ ] **Persistent database** — Supabase or PlanetScale for cross-session data
- [ ] **User authentication** — IIUC student ID login so reports are attributed
- [ ] **Admin dashboard** — Office-wise view for IT Cell, Transport Division, etc.
- [ ] **Email/SMS notifications** — Alert the suggested office on high-urgency reports
- [ ] **Semantic similarity** — Replace token overlap with `nomic-embed-text` embeddings via Ollama for better duplicate detection
- [ ] **Bangla NLP** — Fine-tuned model on IIUC-specific vocabulary for better Banglish parsing
- [ ] **Mobile app** — React Native wrapper for on-the-go reporting
- [ ] **Public status page** — Let students track issue resolution progress

---

## 📄 License

This project is licensed under the **MIT License** — see [LICENSE](./LICENSE) for details.

The AI models used are:
- **qwen2.5:3b** — Apache 2.0 (Alibaba Cloud / Qwen Team)
- **Google Gemma** — [Gemma Terms of Use](https://ai.google.dev/gemma/terms) (open-weight, free for research & non-commercial use)

---

<div align="center">

Built with ❤️ for **IIUC Kumira Campus** · IIUC Hackathon 2026

*"Every campus problem deserves to be heard."*

</div>
