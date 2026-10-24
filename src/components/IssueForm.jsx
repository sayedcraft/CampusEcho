"use client";

import { useState, useMemo, useRef, useEffect } from "react";
import {
  Send, Loader2, AlertTriangle, ChevronRight,
  RotateCcw, CheckCircle2, Edit3, Zap, MapPin,
  Tag, FileText, Globe, Building2, Hash, ThumbsUp,
  ShieldCheck, Mic, MicOff, Bot,
} from "lucide-react";
import { CATEGORIES, IIUC_LOCATIONS } from "@/data/seedIssues";
import { findSimilarIssues } from "@/lib/similarity";

// ── Demo presets ──────────────────────────────────────────────────────────────
const PRESETS = [
  {
    emoji: "📽️", label: "Broken Lab Projector",
    description: "CSE Building Lab 302 te projector last 2 week dhore kaaj korche na. Class er time instructor slides dekhate parchen na properly. Projector starts but flickers badly and goes black after 5 minutes. Multiple faculty reported this to IT cell but no repair yet.",
    location: "CSE Building - Lab 302", category: "IT & Equipment",
  },
  {
    emoji: "💧", label: "No Drinking Water",
    description: "Central Library 2nd floor e water purifier 3 din dhore completely empty. Exam season e students paani pete niche go down korte hoy ba cafeteria theke buy korte hoy. Filter machine is installed but tank is not being refilled.",
    location: "Central Library - 2nd Floor", category: "Water & Sanitation",
  },
  {
    emoji: "🚌", label: "Chawkbazar Bus Crowding",
    description: "Chawkbazar to IIUC Kumira morning 8:00 AM shuttle te only one bus comes but 50+ students waiting. Students have to push to get on, many get left behind and miss first class. Need at least one extra bus during peak morning hours.",
    location: "Kumira Bus Point (Chawkbazar Route)", category: "Transport & Bus",
  },
];

const URGENCY_OPTIONS  = ["Low", "Medium", "High"];
const URGENCY_BTN_ACTIVE = {
  Low:    "bg-emerald-500/20 text-emerald-300 border-emerald-500/40",
  Medium: "bg-amber-500/20 text-amber-300 border-amber-500/40",
  High:   "bg-red-500/20 text-red-300 border-red-500/40",
};

// ── Category keyword rules for client-side preview ────────────────────────────
const CAT_RULES = [
  { pattern: /projector|pc|computer|printer|wifi|network|lab equipment|broken screen|keyboard|mouse|software/i, cat: "IT & Equipment" },
  { pattern: /water|tap|pipe|washroom|toilet|wc|ablution|odhukhan/i,                                           cat: "Water & Sanitation" },
  { pattern: /bus|shuttle|transport|route|schedule|driver|vehicle/i,                                            cat: "Transport & Bus" },
  { pattern: /ac|air condition|fan|light|electricity|ceiling|chair|desk|door|lock|paint|repair/i,               cat: "Facilities" },
  { pattern: /queue|form|office|certificate|admit card|result|registration|admin/i,                              cat: "Admin & Queue" },
  { pattern: /seat|room|space|overcrowd|capacity|bench|hall|class.*full/i,                                       cat: "Seating & Space" },
];
const CAT_OFFICE = {
  "IT & Equipment":     "IT & Maintenance Cell",
  "Facilities":         "Estate & Facilities Office",
  "Water & Sanitation": "Estate & Facilities Office",
  "Transport & Bus":    "Transport Division",
  "Admin & Queue":      "Academic Admin Office",
  "Seating & Space":    "Academic Admin Office",
  "Other":              "Student Affairs Office",
};

function clientPreview(description, location, categoryOverride) {
  if (description.trim().length < 15) return null;
  let cat = categoryOverride || null;
  if (!cat) {
    for (const rule of CAT_RULES) {
      if (rule.pattern.test(description)) { cat = rule.cat; break; }
    }
    cat = cat || "Other";
  }
  let urgency = "Medium";
  if (/urgent|immediately|cannot|completely broken|not working|3 days|week/i.test(description)) urgency = "High";
  else if (/minor|sometimes|occasionally|small/i.test(description))                              urgency = "Low";
  return {
    category: cat,
    urgency,
    location: location?.trim() || "Not specified",
    office: CAT_OFFICE[cat] || "Student Affairs Office",
  };
}

function buildFallbackAnalysis(description, location, category) {
  const keywords = description.toLowerCase().replace(/[^a-z0-9\s]/g, " ").split(/\s+/).filter((w) => w.length > 3).slice(0, 5);
  return {
    category: category || "Other",
    urgency: "Medium",
    location: location?.trim() || "Unknown",
    summary: description.length > 220 ? description.slice(0, 220).trimEnd() + "…" : description,
    summaryBn: "AI বিশ্লেষণ পাওয়া যায়নি। স্মার্ট ফলব্যাক ব্যবহার করা হচ্ছে।",
    suggestedOffice: "Student Affairs Office",
    keywords,
  };
}

// ── Component ─────────────────────────────────────────────────────────────────

export default function IssueForm({ existingIssues = [], onSubmit, currentRole = "student" }) {
  // Step 1 inputs
  const [description, setDescription] = useState("");
  const [location,    setLocation]    = useState("");
  const [category,    setCategory]    = useState("");

  // UI state
  const [step,      setStep]    = useState(1);
  const [loading,   setLoading] = useState(false);
  const [error,     setError]   = useState(null);
  const [modelUsed, setModelUsed] = useState("");

  // Step 2 editable fields
  const [editSummary,  setEditSummary]  = useState("");
  const [editBn,       setEditBn]       = useState("");
  const [editCategory, setEditCategory] = useState("");
  const [editLocation, setEditLocation] = useState("");
  const [editUrgency,  setEditUrgency]  = useState("Medium");
  const [editOffice,   setEditOffice]   = useState("");
  const [editKeywords, setEditKeywords] = useState([]);

  // Similar issues
  const [similarIssues, setSimilarIssues] = useState([]);
  const [upvotedId,     setUpvotedId]     = useState(null);

  // ── Voice input (Web Speech API) ───────────────────────────────────────────
  const recognitionRef = useRef(null);
  const [speechSupported, setSpeechSupported] = useState(false);
  const [isListening,     setIsListening]     = useState(false);
  const [voiceLang,       setVoiceLang]       = useState("bn-BD");
  const [interimText,     setInterimText]     = useState("");

  useEffect(() => {
    const SpeechRec = (typeof window !== "undefined")
      && (window.SpeechRecognition || window.webkitSpeechRecognition);
    if (!SpeechRec) return;
    setSpeechSupported(true);
    const rec = new SpeechRec();
    rec.continuous     = true;
    rec.interimResults = true;
    rec.onresult = (event) => {
      let interim = "";
      let finalPart = "";
      for (let i = event.resultIndex; i < event.results.length; i++) {
        if (event.results[i].isFinal) finalPart += event.results[i][0].transcript;
        else interim += event.results[i][0].transcript;
      }
      if (finalPart) {
        setDescription((prev) => (prev ? prev.trimEnd() + " " + finalPart : finalPart).trim());
        setInterimText("");
      } else {
        setInterimText(interim);
      }
    };
    rec.onend  = () => { setIsListening(false); setInterimText(""); };
    rec.onerror = () => { setIsListening(false); setInterimText(""); };
    recognitionRef.current = rec;
  }, []);

  const toggleListening = () => {
    if (!recognitionRef.current) return;
    if (isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
    } else {
      recognitionRef.current.lang = voiceLang;
      try { recognitionRef.current.start(); setIsListening(true); } catch {}
    }
  };

  // ── Client-side AI preview (live as user types) ────────────────────────────
  const preview = useMemo(() => clientPreview(description, location, category), [description, location, category]);

  const duplicatePreview = useMemo(() => {
    if (!preview || description.length < 20) return [];
    const candidate = {
      description,
      summary:  description,
      keywords: description.toLowerCase().replace(/[^a-z0-9\s]/g, " ").split(/\s+/).filter((w) => w.length > 3).slice(0, 5),
      category: preview.category,
      location,
    };
    return findSimilarIssues(candidate, existingIssues);
  }, [description, location, preview, existingIssues]);

  // ── Helpers ────────────────────────────────────────────────────────────────

  const resetForm = () => {
    setStep(1); setDescription(""); setLocation(""); setCategory("");
    setError(null); setSimilarIssues([]); setUpvotedId(null); setModelUsed("");
    setEditSummary(""); setEditBn(""); setEditCategory(""); setEditLocation("");
    setEditUrgency("Medium"); setEditOffice(""); setEditKeywords([]);
    setIsListening(false); setInterimText("");
  };

  const applyPreset = (preset) => {
    resetForm();
    setDescription(preset.description); setLocation(preset.location); setCategory(preset.category);
    setTimeout(() => document.getElementById("report-form")?.scrollIntoView({ behavior: "smooth", block: "start" }), 50);
  };

  const populateStep2 = (analysis, provider) => {
    setEditSummary(analysis.summary ?? "");
    setEditBn(analysis.summaryBn ?? "");
    setEditCategory(analysis.category ?? "Other");
    setEditLocation(analysis.location ?? "Unknown");
    setEditUrgency(analysis.urgency ?? "Medium");
    setEditOffice(analysis.suggestedOffice ?? "");
    setEditKeywords(analysis.keywords ?? []);
    setModelUsed(provider ?? "");
    const candidate = { description, summary: analysis.summary, keywords: analysis.keywords, category: analysis.category, location: analysis.location };
    setSimilarIssues(findSimilarIssues(candidate, existingIssues));
    setStep(2);
  };

  const handleAnalyze = async () => {
    if (!description.trim() || description.trim().length < 20) return;
    setLoading(true); setError(null);
    try {
      const res  = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: description.slice(0, 80), description: description.trim(), category, location }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || `HTTP ${res.status}`);
      populateStep2(data.analysis, data.meta?.provider);
    } catch (err) {
      setError(err.message || "AI analysis failed.");
    } finally {
      setLoading(false);
    }
  };

  const handleFallback = () => { setError(null); populateStep2(buildFallbackAnalysis(description, location, category), "smart-fallback"); };

  const handleSubmit = () => {
    const issue = {
      id: `issue-${Date.now()}`,
      title: description.replace(/\s+/g, " ").slice(0, 100),
      description,
      summary: editSummary, summaryBn: editBn,
      category: editCategory, location: editLocation,
      suggestedOffice: editOffice, urgency: editUrgency,
      keywords: editKeywords,
      status: "Open", authorityNote: null, updatedBy: null,
      createdAt: new Date().toISOString(),
      similarCount: similarIssues.length,
    };
    onSubmit?.(issue); resetForm();
  };

  const handleUpvoteExisting = (id) => { setUpvotedId(id); onSubmit?.({ __upvote: true, id }); setTimeout(resetForm, 1800); };

  const modelBadge =
    modelUsed.startsWith("ollama") ? "bg-violet-500/20 text-violet-300 border-violet-500/30" :
    modelUsed.startsWith("gemini") ? "bg-blue-500/20 text-blue-300 border-blue-500/30" :
    "bg-slate-700 text-slate-400 border-slate-600";

  const canAnalyze = !loading && description.trim().length >= 20;

  // ── Authority mode placeholder ─────────────────────────────────────────────
  if (currentRole === "authority") {
    return (
      <section id="report-form" className="rounded-2xl bg-amber-500/5 border border-amber-500/20 overflow-hidden">
        <div className="px-5 sm:px-6 py-6 text-center">
          <div className="w-12 h-12 rounded-2xl bg-amber-500/20 flex items-center justify-center mx-auto mb-4">
            <ShieldCheck className="w-6 h-6 text-amber-400" />
          </div>
          <h2 className="text-base font-bold text-amber-300 mb-2">Authority Dashboard Active</h2>
          <p className="text-sm text-slate-400 leading-relaxed">
            You are logged in as <span className="text-amber-300 font-semibold">IIUC Faculty / Staff</span>.
            Use the controls on each issue card to update statuses, post official remarks, or remove invalid reports.
          </p>
          <p className="text-xs text-slate-600 mt-3">Switch to Student Mode to report a new issue.</p>
        </div>
      </section>
    );
  }

  // ── Student form ──────────────────────────────────────────────────────────
  return (
    <section id="report-form" aria-label="Report a Campus Issue" className="rounded-2xl bg-slate-800/40 border border-slate-700/50 overflow-hidden">

      {/* Header + presets */}
      <div className="px-5 sm:px-6 pt-5 pb-5 border-b border-slate-700/50 bg-gradient-to-r from-indigo-600/8 to-violet-600/8">
        <h2 className="text-lg font-bold text-slate-100">Report a Campus Issue</h2>
        <p className="text-sm text-slate-400 mt-0.5">
          Write in <span className="text-white">English or Bangla</span>
        </p>
        <div className="mt-4">
          <p className="text-xs text-slate-500 font-semibold uppercase tracking-wider mb-2.5">⚡ Quick Demo Presets:</p>
          <div className="flex flex-wrap gap-2">
            {PRESETS.map((p) => (
              <button key={p.label} onClick={() => applyPreset(p)}
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-700/80 hover:bg-slate-600/80 border border-slate-600 hover:border-indigo-500/40 text-sm text-slate-200 font-medium transition-all duration-150 hover:-translate-y-0.5 active:translate-y-0">
                <span className="text-base leading-none">{p.emoji}</span>
                <span>{p.label}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="p-5 sm:p-6">

        {/* ── STEP 1 ── */}
        {step === 1 && (
          <div className="space-y-4">

            {/* Textarea with voice controls */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label htmlFor="issue-description" className="text-sm font-medium text-slate-300">
                  Describe the issue <span className="text-red-400" aria-hidden>*</span>
                </label>
                {/* Voice controls */}
                <div className="flex items-center gap-2">
                  {speechSupported && (
                    <>
                      {/* Language toggle */}
                      <div className="flex rounded-lg overflow-hidden border border-slate-700 text-xs">
                        <button onClick={() => setVoiceLang("bn-BD")}
                          className={`px-2 py-1 transition-colors ${voiceLang === "bn-BD" ? "bg-indigo-600 text-white" : "bg-slate-800 text-slate-500 hover:text-slate-300"}`}>
                          বাং
                        </button>
                        <button onClick={() => setVoiceLang("en-US")}
                          className={`px-2 py-1 transition-colors ${voiceLang === "en-US" ? "bg-indigo-600 text-white" : "bg-slate-800 text-slate-500 hover:text-slate-300"}`}>
                          EN
                        </button>
                      </div>
                      {/* Mic button */}
                      <button
                        onClick={toggleListening}
                        title={isListening ? "Stop recording" : `🎙️ Speak in ${voiceLang === "bn-BD" ? "বাংলা" : "English"}`}
                        className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold border transition-all duration-200 ${
                          isListening
                            ? "bg-red-500/20 text-red-300 border-red-500/40 animate-pulse"
                            : "bg-slate-700 text-slate-300 border-slate-600 hover:bg-indigo-500/10 hover:text-indigo-300 hover:border-indigo-500/30"
                        }`}
                      >
                        {isListening ? <><MicOff className="w-3.5 h-3.5" /> Stop</> : <><Mic className="w-3.5 h-3.5" /> 🎙️ Speak</>}
                      </button>
                    </>
                  )}
                </div>
              </div>

              <div className="relative">
                <textarea
                  id="issue-description"
                  value={description + (interimText ? " " + interimText : "")}
                  onChange={(e) => {
                    // When user edits manually, strip any interim text
                    setDescription(e.target.value.replace(interimText, "").trim() || e.target.value);
                    setInterimText("");
                  }}
                  placeholder="Describe the problem… Lab equipment broken? Long admin queue? Bus schedule issue?"
                  rows={5} dir="auto"
                  className={`w-full rounded-xl bg-slate-900/60 border text-slate-200 placeholder:text-slate-600 text-sm p-3.5 focus:outline-none focus:ring-1 resize-none transition-all leading-relaxed ${
                    isListening
                      ? "border-red-500/40 focus:border-red-500 focus:ring-red-500/20 ring-1 ring-red-500/20"
                      : "border-slate-700 focus:border-indigo-500 focus:ring-indigo-500/30"
                  }`}
                />
                {isListening && (
                  <div className="absolute bottom-3 right-3 flex items-center gap-1.5 px-2 py-1 rounded-lg bg-red-500/20 border border-red-500/30">
                    <span className="w-1.5 h-1.5 rounded-full bg-red-400 animate-pulse" />
                    <span className="text-xs text-red-300 font-medium">Recording…</span>
                  </div>
                )}
              </div>
              <div className="flex justify-between mt-1">
                <p className="text-xs text-slate-600">Min 20 characters{speechSupported ? " — or use 🎙️ voice input" : ""}</p>
                <p className={`text-xs tabular-nums ${description.length < 20 ? "text-slate-600" : "text-slate-500"}`}>{description.length} chars</p>
              </div>

              {/* 🤖 AI Auto-Detection Preview */}
              {preview && (
                <div className="mt-3 rounded-xl bg-indigo-500/6 border border-indigo-500/15 p-3">
                  <div className="flex items-center gap-2 mb-2">
                    <Bot className="w-3.5 h-3.5 text-indigo-400" />
                    <span className="text-xs font-bold text-indigo-400 uppercase tracking-wide">🤖 AI Auto-Detection Preview</span>
                    <span className="text-xs text-slate-600 font-normal">— instant client-side estimate</span>
                  </div>
                  <div className="grid grid-cols-2 gap-x-4 gap-y-1.5">
                    <div className="flex items-center gap-1.5">
                      <Tag className="w-3 h-3 text-slate-500 shrink-0" />
                      <span className="text-xs text-slate-500">Category:</span>
                      <span className="text-xs font-semibold text-violet-400 ml-1">{preview.category}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Zap className="w-3 h-3 text-slate-500 shrink-0" />
                      <span className="text-xs text-slate-500">Urgency:</span>
                      <span className={`text-xs font-semibold ml-1 ${preview.urgency === "High" ? "text-red-400" : preview.urgency === "Medium" ? "text-amber-400" : "text-emerald-400"}`}>
                        {preview.urgency}
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5 col-span-2">
                      <MapPin className="w-3 h-3 text-slate-500 shrink-0" />
                      <span className="text-xs text-slate-500">Location:</span>
                      <span className="text-xs font-semibold text-slate-300 ml-1 truncate">{preview.location}</span>
                    </div>
                    <div className="flex items-center gap-1.5 col-span-2">
                      <Building2 className="w-3 h-3 text-slate-500 shrink-0" />
                      <span className="text-xs text-slate-500">Office:</span>
                      <span className="text-xs font-semibold text-slate-300 ml-1">{preview.office}</span>
                    </div>
                    {duplicatePreview.length > 0 && (
                      <div className="flex items-center gap-1.5 col-span-2">
                        <span className="text-xs">🔁</span>
                        <span className="text-xs text-amber-400 font-semibold">
                          {duplicatePreview.length} possible duplicate{duplicatePreview.length > 1 ? "s" : ""} detected — AI will confirm after analysis
                        </span>
                      </div>
                    )}
                  </div>
                  <p className="text-xs text-slate-600 mt-2 italic">Full AI analysis runs when you click "Analyze Issue with AI" below.</p>
                </div>
              )}
            </div>

            {/* Location + Category */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label htmlFor="issue-location" className="block text-sm font-medium text-slate-300 mb-1.5">
                  Campus Location <span className="text-slate-500 font-normal text-xs">(optional)</span>
                </label>
                <input id="issue-location" list="iiuc-locations" value={location} onChange={(e) => setLocation(e.target.value)}
                  placeholder="e.g. CSE Building - Lab 302"
                  className="w-full rounded-xl bg-slate-900/60 border border-slate-700 text-slate-200 placeholder:text-slate-600 text-sm px-3.5 py-2.5 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/30 transition-all" />
                <datalist id="iiuc-locations">{IIUC_LOCATIONS.map((l) => <option key={l} value={l} />)}</datalist>
              </div>
              <div>
                <label htmlFor="issue-category" className="block text-sm font-medium text-slate-300 mb-1.5">
                  Category <span className="text-slate-500 font-normal text-xs">(AI will auto-detect)</span>
                </label>
                <select id="issue-category" value={category} onChange={(e) => setCategory(e.target.value)}
                  className="w-full rounded-xl bg-slate-900/60 border border-slate-700 text-slate-200 text-sm px-3.5 py-2.5 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/30 transition-all appearance-none cursor-pointer">
                  <option value="">AI will auto-detect…</option>
                  {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
            </div>

            {/* Error */}
            {error && (
              <div className="rounded-xl bg-red-500/8 border border-red-500/30 p-4">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-red-300 mb-1">AI Analysis Failed</p>
                    <p className="text-xs text-red-400/80 mb-3 break-words">{error}</p>
                    <div className="flex flex-wrap gap-2">
                      <button onClick={handleAnalyze} disabled={loading}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-500/20 hover:bg-red-500/30 border border-red-500/40 text-red-300 text-xs font-semibold transition-all disabled:opacity-50">
                        <RotateCcw className="w-3.5 h-3.5" /> Retry AI Analysis
                      </button>
                      <button onClick={handleFallback}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-700 hover:bg-slate-600 border border-slate-600 text-slate-300 text-xs font-semibold transition-all">
                        <Zap className="w-3.5 h-3.5 text-amber-400" /> Continue with Smart Fallback
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Analyze CTA */}
            <button onClick={handleAnalyze} disabled={!canAnalyze}
              className="w-full flex items-center justify-center gap-2 py-3 px-6 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 disabled:from-slate-700 disabled:to-slate-700 disabled:text-slate-500 disabled:cursor-not-allowed text-white font-semibold text-sm shadow-lg shadow-indigo-500/20 hover:shadow-indigo-500/30 transition-all duration-200 hover:-translate-y-0.5 active:translate-y-0 disabled:shadow-none disabled:translate-y-0">
              {loading ? (<><Loader2 className="w-4 h-4 animate-spin" /> Analyzing with open-weight AI model…</>) :
                (<><Zap className="w-4 h-4" /> Analyze Issue with AI <ChevronRight className="w-4 h-4" /></>)}
            </button>
            {!description.trim() && <p className="text-xs text-slate-600 text-center -mt-2">Enter a description or click a Quick Demo Preset to get started.</p>}
          </div>
        )}

        {/* ── STEP 2 ── */}
        {step === 2 && (
          <div className="space-y-5">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <button onClick={() => setStep(1)} className="text-xs text-slate-500 hover:text-slate-300 transition-colors">← Edit original report</button>
              {modelUsed && (
                <span className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${modelBadge}`}>
                  <Zap className="w-3 h-3" /> Analyzed by: {modelUsed}
                </span>
              )}
            </div>

            <div className="rounded-xl bg-slate-900/50 border border-slate-700/50 p-4 sm:p-5 space-y-4">
              <h3 className="text-sm font-semibold text-slate-300 flex items-center gap-2">
                <Edit3 className="w-4 h-4 text-indigo-400" />
                Review &amp; Edit AI Output
                <span className="text-xs font-normal text-slate-500 ml-1">— all fields editable</span>
              </h3>

              <div>
                <label className="flex items-center gap-1.5 text-xs font-semibold text-slate-500 mb-1.5 uppercase tracking-wide"><Globe className="w-3.5 h-3.5" /> English Summary</label>
                <textarea value={editSummary} onChange={(e) => setEditSummary(e.target.value)} rows={3}
                  className="w-full rounded-lg bg-slate-800 border border-slate-700 text-slate-200 text-sm p-3 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/20 resize-none transition-all leading-relaxed" />
              </div>

              <div>
                <label className="flex items-center gap-1.5 text-xs font-semibold text-slate-500 mb-1.5 uppercase tracking-wide"><FileText className="w-3.5 h-3.5" /> বাংলা সারসংক্ষেপ</label>
                <textarea value={editBn} onChange={(e) => setEditBn(e.target.value)} rows={3} dir="auto"
                  className="w-full rounded-lg bg-slate-800 border border-slate-700 text-slate-200 text-sm p-3 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/20 resize-none transition-all leading-relaxed" />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="flex items-center gap-1.5 text-xs font-semibold text-slate-500 mb-1.5 uppercase tracking-wide"><Tag className="w-3.5 h-3.5" /> Category</label>
                  <select value={editCategory} onChange={(e) => setEditCategory(e.target.value)}
                    className="w-full rounded-lg bg-slate-800 border border-slate-700 text-slate-200 text-sm px-3 py-2.5 focus:outline-none focus:border-indigo-500 transition-all appearance-none">
                    {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div>
                  <label className="flex items-center gap-1.5 text-xs font-semibold text-slate-500 mb-1.5 uppercase tracking-wide"><Zap className="w-3.5 h-3.5 text-amber-400" /> AI Suggested Urgency</label>
                  <div className="flex gap-2 h-[38px]">
                    {URGENCY_OPTIONS.map((u) => (
                      <button key={u} onClick={() => setEditUrgency(u)} aria-pressed={editUrgency === u}
                        className={`flex-1 rounded-lg text-xs font-bold border transition-all ${editUrgency === u ? URGENCY_BTN_ACTIVE[u] : "bg-transparent border-slate-700 text-slate-600 hover:text-slate-400 hover:border-slate-600"}`}>
                        {u}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="flex items-center gap-1.5 text-xs font-semibold text-slate-500 mb-1.5 uppercase tracking-wide">
                    <MapPin className="w-3.5 h-3.5" /> Extracted Location
                    {editLocation === "Unknown" && <span className="ml-1 text-amber-400 normal-case font-normal">⚠ not detected</span>}
                  </label>
                  <input list="iiuc-locations-2" value={editLocation} onChange={(e) => setEditLocation(e.target.value)}
                    className={`w-full rounded-lg border text-sm px-3 py-2.5 focus:outline-none focus:border-indigo-500 transition-all ${editLocation === "Unknown" ? "bg-amber-500/8 border-amber-500/30 text-amber-300" : "bg-slate-800 border-slate-700 text-slate-200"}`} />
                  <datalist id="iiuc-locations-2">{IIUC_LOCATIONS.map((l) => <option key={l} value={l} />)}</datalist>
                </div>
                <div>
                  <label className="flex items-center gap-1.5 text-xs font-semibold text-slate-500 mb-1.5 uppercase tracking-wide"><Building2 className="w-3.5 h-3.5" /> Suggested IIUC Office</label>
                  <input value={editOffice} onChange={(e) => setEditOffice(e.target.value)}
                    className="w-full rounded-lg bg-slate-800 border border-slate-700 text-slate-200 text-sm px-3 py-2.5 focus:outline-none focus:border-indigo-500 transition-all" />
                </div>
              </div>

              <div>
                <label className="flex items-center gap-1.5 text-xs font-semibold text-slate-500 mb-1.5 uppercase tracking-wide"><Hash className="w-3.5 h-3.5" /> Keywords <span className="text-slate-600 normal-case font-normal ml-1">click to remove</span></label>
                <div className="flex flex-wrap gap-1.5 min-h-[28px]">
                  {editKeywords.length > 0
                    ? editKeywords.map((kw, i) => (
                        <button key={i} onClick={() => setEditKeywords(editKeywords.filter((_, idx) => idx !== i))}
                          className="px-2.5 py-1 rounded-lg bg-slate-700 text-slate-300 text-xs font-mono border border-slate-600 hover:bg-red-500/20 hover:text-red-300 hover:border-red-500/30 transition-all">
                          #{kw} ×
                        </button>
                      ))
                    : <span className="text-xs text-slate-600 italic self-center">No keywords extracted</span>
                  }
                </div>
              </div>
            </div>

            {/* Similar issues alert */}
            {similarIssues.length > 0 && !upvotedId && (
              <div className="rounded-xl border border-amber-500/25 bg-amber-500/5 overflow-hidden">
                <div className="px-4 py-3 bg-amber-500/10 border-b border-amber-500/20 flex flex-wrap items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
                  <span className="text-sm font-bold text-amber-300">{similarIssues.length} Similar Issue{similarIssues.length > 1 ? "s" : ""} Already Reported!</span>
                  <span className="text-xs text-amber-600">Upvoting helps admin prioritize faster.</span>
                </div>
                <div className="p-4 space-y-3">
                  {similarIssues.slice(0, 3).map((si) => (
                    <div key={si.id} className="rounded-xl bg-slate-800/70 border border-slate-700/50 p-3">
                      <div className="flex items-start justify-between gap-3 flex-wrap">
                        <div className="flex-1 min-w-0">
                          <div className="flex flex-wrap items-center gap-1.5 mb-1.5">
                            <span className="text-xs font-extrabold text-amber-400">{si.matchScore}% match</span>
                            <span className={`text-xs font-semibold px-1.5 py-0.5 rounded ${si.status === "Resolved" ? "text-emerald-400 bg-emerald-500/10" : si.status === "In Progress" ? "text-amber-400 bg-amber-500/10" : "text-red-400 bg-red-500/10"}`}>{si.status}</span>
                            {si.matchReasons?.map((r) => <span key={r} className="text-xs bg-slate-700 text-slate-400 px-1.5 py-0.5 rounded border border-slate-600">{r}</span>)}
                          </div>
                          <p className="text-sm font-semibold text-slate-200 line-clamp-1">{si.title}</p>
                          {si.location && si.location !== "Unknown" && (
                            <p className="text-xs text-slate-500 flex items-center gap-1 mt-0.5"><MapPin className="w-3 h-3 shrink-0" />{si.location}</p>
                          )}
                        </div>
                        <button onClick={() => handleUpvoteExisting(si.id)}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/40 text-amber-300 text-xs font-bold transition-all whitespace-nowrap active:scale-95">
                          <ThumbsUp className="w-3.5 h-3.5" /> Upvote (+1) Existing
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {upvotedId && (
              <div className="rounded-xl bg-emerald-500/10 border border-emerald-500/30 p-4 flex items-center gap-3">
                <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
                <div>
                  <p className="text-sm font-bold text-emerald-300">Upvote registered! 🎉</p>
                  <p className="text-xs text-emerald-600 mt-0.5">Your voice helps this get resolved faster. Resetting…</p>
                </div>
              </div>
            )}

            {!upvotedId && (
              <button onClick={handleSubmit}
                className="w-full flex items-center justify-center gap-2 py-3 px-6 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white font-bold text-sm shadow-lg shadow-indigo-500/20 hover:shadow-indigo-500/30 transition-all duration-200 hover:-translate-y-0.5 active:translate-y-0">
                <Send className="w-4 h-4" />
                {similarIssues.length > 0 ? "Submit as New Report Anyway" : "Submit Issue Report"}
              </button>
            )}
          </div>
        )}
      </div>
    </section>
  );
}
