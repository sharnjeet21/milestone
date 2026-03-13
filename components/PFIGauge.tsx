"use client";

import { motion } from "framer-motion";

import { cn } from "@/lib/utils";

type PFIGaugeProps = {
  score: number;
  showBreakdown?: boolean;
  scoreChange?: number;
  className?: string;
};

function getTier(score: number) {
  if (score >= 800) {
    return "ELITE";
  }

  if (score >= 700) {
    return "EXCELLENT";
  }

  if (score >= 600) {
    return "GOOD";
  }

  if (score >= 500) {
    return "AVERAGE";
  }

  return "POOR";
}

function tierTone(tier: string) {
  if (tier === "ELITE") {
    return "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300";
  }

  if (tier === "EXCELLENT") {
    return "bg-green-500/10 text-green-700 dark:text-green-300";
  }

  if (tier === "GOOD") {
    return "bg-amber-500/10 text-amber-700 dark:text-amber-300";
  }

  return "bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300";
}

export function PFIGauge({
  score,
  showBreakdown = false,
  scoreChange,
  className,
}: PFIGaugeProps) {
  const tier = getTier(score);
  const radius = 66;
  const circumference = 2 * Math.PI * radius;
  const clampedScore = Math.max(300, Math.min(score, 900));
  const ratio = (clampedScore - 300) / 600;
  const dashOffset = circumference - ratio * circumference;
  const breakdown = {
    Quality: Math.min(100, Math.round(((clampedScore - 300) / 6) * 0.9 + 45)),
    Deadlines: Math.min(100, Math.round(((clampedScore - 300) / 6) * 0.85 + 48)),
    Revisions: Math.min(100, Math.round(((clampedScore - 300) / 6) * 0.72 + 42)),
  };

  return (
    <motion.div
      whileHover={{ y: -2, transition: { duration: 0.2 } }}
      className={cn(
        "rounded-[2rem] border border-border/60 bg-white/85 p-6 shadow-xl shadow-slate-900/5 backdrop-blur dark:bg-zinc-900/70",
        className,
      )}
    >
      <div className="flex items-center gap-6">
        <div className="relative flex h-40 w-40 items-center justify-center">
          <svg className="h-full w-full -rotate-90" viewBox="0 0 180 180">
            <defs>
              <linearGradient id="pfi-gauge-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#ef4444" />
                <stop offset="55%" stopColor="#f59e0b" />
                <stop offset="100%" stopColor="#22c55e" />
              </linearGradient>
            </defs>
            <circle
              cx="90"
              cy="90"
              r={radius}
              fill="none"
              stroke="currentColor"
              strokeWidth="12"
              className="text-foreground/10"
            />
            <motion.circle
              cx="90"
              cy="90"
              r={radius}
              fill="none"
              stroke="url(#pfi-gauge-gradient)"
              strokeWidth="12"
              strokeLinecap="round"
              strokeDasharray={circumference}
              initial={{ strokeDashoffset: circumference }}
              animate={{ strokeDashoffset: dashOffset }}
              transition={{ duration: 1, ease: "easeOut" }}
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-4xl font-medium text-foreground">{clampedScore}</span>
            <span className="text-xs uppercase tracking-[0.24em] text-muted-foreground">
              / 900
            </span>
          </div>
        </div>

        <div>
          <span className={cn("inline-flex rounded-full px-3 py-1 text-xs font-medium", tierTone(tier))}>
            {tier}
          </span>
          {typeof scoreChange === "number" ? (
            <p className="mt-3 text-sm font-medium text-green-600 dark:text-green-400">
              {scoreChange > 0 ? "+" : ""}
              {scoreChange} points
            </p>
          ) : null}
        </div>
      </div>

      {showBreakdown ? (
        <div className="mt-6 space-y-4">
          {Object.entries(breakdown).map(([label, value], index) => (
            <div key={label}>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">{label}</span>
                <span className="text-foreground">{value}</span>
              </div>
              <div className="mt-2 h-2 rounded-full bg-foreground/10">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${value}%` }}
                  transition={{ duration: 0.8, delay: index * 0.1, ease: "easeOut" }}
                  className="h-full rounded-full bg-green-500"
                />
              </div>
            </div>
          ))}
        </div>
      ) : null}
    </motion.div>
  );
}

export default PFIGauge;
