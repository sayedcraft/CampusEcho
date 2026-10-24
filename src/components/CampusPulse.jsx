"use client";

import { useMemo } from "react";
import { FileText, AlertCircle, CheckCircle2, TrendingUp } from "lucide-react";

export default function CampusPulse({ issues = [] }) {
  const stats = useMemo(() => {
    const total = issues.length;
    const open = issues.filter((i) => i.status === "Open").length;
    const resolved = issues.filter((i) => i.status === "Resolved").length;

    // Top reported category
    const catCount = {};
    issues.forEach((i) => {
      if (i.category) catCount[i.category] = (catCount[i.category] || 0) + 1;
    });
    const sorted = Object.entries(catCount).sort((a, b) => b[1] - a[1]);
    const topEntry = sorted[0] ?? null;

    return { total, open, resolved, topEntry };
  }, [issues]);

  const cards = [
    {
      label: "Total Reports",
      sublabel: "All submitted issues",
      value: stats.total,
      Icon: FileText,
      gradient: "from-indigo-500/20 via-indigo-600/10 to-transparent",
      border: "border-indigo-500/20 hover:border-indigo-500/40",
      iconBg: "bg-indigo-500/20",
      iconColor: "text-indigo-400",
      valueColor: "text-indigo-200",
    },
    {
      label: "Open Issues",
      sublabel: "Needs attention",
      value: stats.open,
      Icon: AlertCircle,
      gradient: "from-red-500/20 via-red-600/10 to-transparent",
      border: "border-red-500/20 hover:border-red-500/40",
      iconBg: "bg-red-500/20",
      iconColor: "text-red-400",
      valueColor: "text-red-200",
    },
    {
      label: "Resolved",
      sublabel: "Successfully fixed",
      value: stats.resolved,
      Icon: CheckCircle2,
      gradient: "from-emerald-500/20 via-emerald-600/10 to-transparent",
      border: "border-emerald-500/20 hover:border-emerald-500/40",
      iconBg: "bg-emerald-500/20",
      iconColor: "text-emerald-400",
      valueColor: "text-emerald-200",
    },
    {
      label: "Top Category",
      sublabel: stats.topEntry ? `${stats.topEntry[1]} report${stats.topEntry[1] !== 1 ? "s" : ""}` : "No data yet",
      // Show first word only so it fits the card on mobile
      value: stats.topEntry
        ? stats.topEntry[0].length > 14
          ? stats.topEntry[0].split(" ").slice(0, 2).join(" ")
          : stats.topEntry[0]
        : "—",
      Icon: TrendingUp,
      gradient: "from-amber-500/20 via-amber-600/10 to-transparent",
      border: "border-amber-500/20 hover:border-amber-500/40",
      iconBg: "bg-amber-500/20",
      iconColor: "text-amber-400",
      valueColor: "text-amber-200",
    },
  ];

  return (
    <section aria-label="Campus Pulse Statistics" className="mb-8">
      {/* Section heading */}
      <div className="flex items-center gap-2 mb-4">
        <div className="w-1 h-5 rounded-full bg-gradient-to-b from-indigo-500 to-violet-500" />
        <h2 className="text-xs font-semibold text-slate-500 uppercase tracking-widest">
          Campus Pulse
        </h2>
        {issues.length > 0 && (
          <span className="ml-auto text-xs text-slate-600">
            Live · {issues.length} issue{issues.length !== 1 ? "s" : ""}
          </span>
        )}
      </div>

      {/* Metric cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {cards.map(({ label, sublabel, value, Icon, gradient, border, iconBg, iconColor, valueColor }) => (
          <div
            key={label}
            className={`relative rounded-2xl p-4 sm:p-5 bg-gradient-to-br ${gradient} border ${border} overflow-hidden transition-all duration-300 hover:scale-[1.02] cursor-default`}
          >
            {/* Subtle corner glow */}
            <div className="absolute -top-4 -right-4 w-16 h-16 rounded-full blur-2xl opacity-30 bg-current pointer-events-none" />

            <div className="relative flex flex-col gap-3">
              {/* Icon */}
              <div className={`w-8 h-8 rounded-lg ${iconBg} flex items-center justify-center shrink-0`}>
                <Icon className={`w-4 h-4 ${iconColor}`} />
              </div>

              {/* Value */}
              <p className={`text-2xl sm:text-3xl font-extrabold ${valueColor} tabular-nums leading-none tracking-tight`}>
                {value}
              </p>

              {/* Labels */}
              <div>
                <p className="text-sm font-semibold text-slate-300 leading-tight">{label}</p>
                {sublabel && (
                  <p className="text-xs text-slate-500 mt-0.5 leading-tight">{sublabel}</p>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
