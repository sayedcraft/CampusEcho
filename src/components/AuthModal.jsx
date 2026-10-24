"use client";

import { useState } from "react";
import { X, GraduationCap, ShieldCheck, Eye, EyeOff } from "lucide-react";

const AUTHORITY_PASSCODE = "iiuc2026";
const DEPARTMENTS = ["CSE", "EEE", "BBA", "EB", "Pharmacy", "Law"];
const SEMESTERS   = ["1st Sem","2nd Sem","3rd Sem","4th Sem","5th Sem","6th Sem","7th Sem","8th Sem"];

const DEMO_STUDENTS = [
  { id: "C221045", name: "Tanvir Hasan",  role: "student", department: "CSE", semester: "5th Sem" },
  { id: "E231018", name: "Nusrat Jahan",  role: "student", department: "EEE", semester: "3rd Sem" },
];
const DEMO_AUTHORITIES = [
  { id: "FAC-CSE-102", name: "Dr. Mahmudul Hasan",  role: "authority", designation: "CSE Coordinator" },
  { id: "ADM-EST-04",  name: "Engr. Rafiqul Islam", role: "authority", designation: "Transport & Estate Officer" },
];

// ── Shared field classes ──────────────────────────────────────────────────────

function fieldCls(accent = "indigo") {
  return `w-full rounded-xl bg-slate-900 border border-slate-700 text-slate-200 placeholder:text-slate-600 text-sm px-3.5 py-2.5 focus:outline-none focus:border-${accent}-500 focus:ring-1 focus:ring-${accent}-500/20 transition-all`;
}

// ── Component ─────────────────────────────────────────────────────────────────

export default function AuthModal({ onLogin, onClose }) {
  const [tab, setTab] = useState("student");

  /* Student form */
  const [sId,     setSId]     = useState("");
  const [sName,   setSName]   = useState("");
  const [sDept,   setSDept]   = useState("CSE");
  const [sSem,    setSSem]    = useState("5th Sem");
  const [sPwd,    setSPwd]    = useState("");
  const [showSP,  setShowSP]  = useState(false);
  const [sError,  setSError]  = useState("");

  /* Authority form */
  const [aId,    setAId]    = useState("");
  const [aName,  setAName]  = useState("");
  const [aDesg,  setADesg]  = useState("");
  const [aCode,  setACode]  = useState("");
  const [showAC, setShowAC] = useState(false);
  const [aError, setAError] = useState("");

  const switchTab = (t) => { setTab(t); setSError(""); setAError(""); };

  // ── Login handlers ─────────────────────────────────────────────────────────

  const loginStudent = () => {
    if (!sId.trim())   { setSError("Student ID is required.");  return; }
    if (!sName.trim()) { setSError("Full name is required.");   return; }
    if (!sPwd.trim())  { setSError("Password is required.");    return; }
    onLogin({ id: sId.trim().toUpperCase(), name: sName.trim(), role: "student", department: sDept, semester: sSem });
  };

  const loginAuthority = () => {
    if (!aId.trim())   { setAError("Faculty/Staff ID is required."); return; }
    if (!aName.trim()) { setAError("Full name is required.");        return; }
    if (aCode !== AUTHORITY_PASSCODE) { setAError("Incorrect authority passcode."); return; }
    onLogin({ id: aId.trim().toUpperCase(), name: aName.trim(), role: "authority", designation: aDesg.trim() || "IIUC Staff" });
  };

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,0.78)", backdropFilter: "blur(5px)" }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="w-full max-w-md rounded-2xl bg-slate-800 border border-slate-600/60 shadow-2xl overflow-hidden">

        {/* Header */}
        <div className="px-6 pt-5 pb-4 border-b border-slate-700 flex items-start justify-between">
          <div>
            <h2 className="text-base font-bold text-white">🎓 IIUC Campus Login</h2>
            <p className="text-xs text-slate-400 mt-0.5">Login with your IIUC Student or Faculty ID</p>
          </div>
          <button onClick={onClose} className="text-slate-500 hover:text-slate-300 transition-colors ml-4 mt-0.5">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-slate-700">
          <button onClick={() => switchTab("student")}
            className={`flex-1 flex items-center justify-center gap-2 py-3 text-sm font-semibold border-b-2 transition-all ${
              tab === "student" ? "border-indigo-500 text-indigo-300 bg-indigo-500/5" : "border-transparent text-slate-500 hover:text-slate-300"
            }`}>
            <GraduationCap className="w-4 h-4" /> Student Login
          </button>
          <button onClick={() => switchTab("authority")}
            className={`flex-1 flex items-center justify-center gap-2 py-3 text-sm font-semibold border-b-2 transition-all ${
              tab === "authority" ? "border-amber-500 text-amber-300 bg-amber-500/5" : "border-transparent text-slate-500 hover:text-slate-300"
            }`}>
            <ShieldCheck className="w-4 h-4" /> Teacher / Authority
          </button>
        </div>

        <div className="p-5 sm:p-6 space-y-4 max-h-[70vh] overflow-y-auto">

          {/* ── STUDENT TAB ── */}
          {tab === "student" && (
            <>
              {/* Demo accounts */}
              <div>
                <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2.5">⚡ 1-Click Demo Accounts</p>
                <div className="space-y-2">
                  {DEMO_STUDENTS.map((acc) => (
                    <button key={acc.id} onClick={() => onLogin(acc)}
                      className="w-full flex items-center gap-3 px-4 py-3 rounded-xl bg-indigo-500/10 hover:bg-indigo-500/20 border border-indigo-500/20 hover:border-indigo-500/40 transition-all text-left group">
                      <div className="w-9 h-9 rounded-full bg-indigo-500/20 flex items-center justify-center shrink-0 text-lg">🎓</div>
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-slate-200 leading-none mb-1">{acc.name}</p>
                        <p className="text-xs text-slate-500">ID: <span className="font-mono text-indigo-400">{acc.id}</span> · {acc.department} · {acc.semester}</p>
                      </div>
                      <span className="ml-auto text-xs text-indigo-400 font-bold whitespace-nowrap group-hover:text-indigo-300">Login →</span>
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="flex-1 h-px bg-slate-700" />
                <span className="text-xs text-slate-600">or fill in manually</span>
                <div className="flex-1 h-px bg-slate-700" />
              </div>

              {/* Student fields */}
              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">Student ID</label>
                  <input value={sId} onChange={(e) => setSId(e.target.value)} placeholder="e.g. C221045"
                    className={fieldCls("indigo")} />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">Full Name</label>
                  <input value={sName} onChange={(e) => setSName(e.target.value)} placeholder="Your full name"
                    className={fieldCls("indigo")} />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">Department</label>
                    <select value={sDept} onChange={(e) => setSDept(e.target.value)}
                      className="w-full rounded-xl bg-slate-900 border border-slate-700 text-slate-200 text-sm px-3 py-2.5 focus:outline-none focus:border-indigo-500 transition-all appearance-none cursor-pointer">
                      {DEPARTMENTS.map((d) => <option key={d} value={d}>{d}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">Semester</label>
                    <select value={sSem} onChange={(e) => setSSem(e.target.value)}
                      className="w-full rounded-xl bg-slate-900 border border-slate-700 text-slate-200 text-sm px-3 py-2.5 focus:outline-none focus:border-indigo-500 transition-all appearance-none cursor-pointer">
                      {SEMESTERS.map((s) => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">Password</label>
                  <div className="relative">
                    <input type={showSP ? "text" : "password"} value={sPwd} onChange={(e) => setSPwd(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && loginStudent()}
                      placeholder="Any password for demo"
                      className={`${fieldCls("indigo")} pr-10`} />
                    <button type="button" onClick={() => setShowSP((s) => !s)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300">
                      {showSP ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
              </div>

              {sError && <p className="text-xs text-red-400 font-medium">{sError}</p>}

              <button onClick={loginStudent}
                className="w-full py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white font-bold text-sm transition-all active:scale-[0.98] shadow-lg shadow-indigo-500/20">
                Login as Student →
              </button>
            </>
          )}

          {/* ── AUTHORITY TAB ── */}
          {tab === "authority" && (
            <>
              <div>
                <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2.5">⚡ 1-Click Demo Accounts</p>
                <div className="space-y-2">
                  {DEMO_AUTHORITIES.map((acc) => (
                    <button key={acc.id} onClick={() => onLogin(acc)}
                      className="w-full flex items-center gap-3 px-4 py-3 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/20 hover:border-amber-500/40 transition-all text-left group">
                      <div className="w-9 h-9 rounded-full bg-amber-500/20 flex items-center justify-center shrink-0 text-lg">
                        {acc.designation.startsWith("Transport") ? "🛠️" : "👨‍🏫"}
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-slate-200 leading-none mb-1">{acc.name}</p>
                        <p className="text-xs text-slate-500">ID: <span className="font-mono text-amber-400">{acc.id}</span> · {acc.designation}</p>
                      </div>
                      <span className="ml-auto text-xs text-amber-400 font-bold whitespace-nowrap group-hover:text-amber-300">Login →</span>
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="flex-1 h-px bg-slate-700" />
                <span className="text-xs text-slate-600">or fill in manually</span>
                <div className="flex-1 h-px bg-slate-700" />
              </div>

              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">Faculty / Staff ID</label>
                  <input value={aId} onChange={(e) => setAId(e.target.value)} placeholder="e.g. FAC-CSE-102"
                    className={fieldCls("amber")} />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">Full Name</label>
                  <input value={aName} onChange={(e) => setAName(e.target.value)} placeholder="Your full name"
                    className={fieldCls("amber")} />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">Designation / Office</label>
                  <input value={aDesg} onChange={(e) => setADesg(e.target.value)} placeholder="e.g. CSE Lab Coordinator"
                    className={fieldCls("amber")} />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">Authority Passcode</label>
                  <div className="relative">
                    <input type={showAC ? "text" : "password"} value={aCode} onChange={(e) => setACode(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && loginAuthority()}
                      placeholder="Enter authority passcode"
                      className={`${fieldCls("amber")} pr-10`} />
                    <button type="button" onClick={() => setShowAC((s) => !s)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300">
                      {showAC ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  <p className="text-xs text-slate-600 mt-1.5">Evaluator hint: <span className="font-mono text-slate-500">iiuc2026</span></p>
                </div>
              </div>

              {aError && <p className="text-xs text-red-400 font-medium">{aError}</p>}

              <button onClick={loginAuthority}
                className="w-full py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-400 hover:from-amber-400 hover:to-amber-300 text-slate-900 font-bold text-sm transition-all active:scale-[0.98] shadow-lg shadow-amber-500/20">
                Login as Authority →
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
