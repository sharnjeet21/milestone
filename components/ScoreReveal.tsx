"use client";

import { AnimatePresence, motion, useMotionValue, useSpring } from "framer-motion";
import { Check, CircleDollarSign, Sparkles, X } from "lucide-react";
import { useEffect, useState } from "react";

import { cn } from "@/lib/utils";
import type { EvaluationResult, PFIUpdate } from "@/lib/types";

type ScoreRevealProps = {
  evaluation: EvaluationResult;
  pfiUpdate: PFIUpdate;
  className?: string;
};

function currency(value: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(value);
}

function getTone(status: EvaluationResult["status"]) {
  if (status === "FULLY_COMPLETED") {
    return {
      ring: "stroke-green-500",
      banner: "bg-green-500/10 text-green-700 dark:text-green-300",
    };
  }

  if (status === "PARTIALLY_COMPLETED") {
    return {
      ring: "stroke-amber-500",
      banner: "bg-amber-500/10 text-amber-700 dark:text-amber-300",
    };
  }

  return {
    ring: "stroke-red-500",
    banner: "bg-red-500/10 text-red-700 dark:text-red-300",
  };
}

function AnimatedNumber({
  value,
  formatter,
  className,
}: {
  value: number;
  formatter?: (value: number) => string;
  className?: string;
}) {
  const motionValue = useMotionValue(0);
  const spring = useSpring(motionValue, { stiffness: 90, damping: 16 });
  const [displayValue, setDisplayValue] = useState(0);

  useEffect(() => {
    motionValue.set(value);
  }, [motionValue, value]);

  useEffect(() => {
    const unsubscribe = spring.on("change", (latest) => {
      setDisplayValue(Math.round(latest));
    });

    return unsubscribe;
  }, [spring]);

  return <span className={className}>{formatter ? formatter(displayValue) : displayValue}</span>;
}

export function ScoreReveal({
  evaluation,
  pfiUpdate,
  className,
}: ScoreRevealProps) {
  const tone = getTone(evaluation.status);
  const radius = 68;
  const circumference = 2 * Math.PI * radius;
  const dashOffset = circumference - (Math.max(0, Math.min(evaluation.completion_score, 100)) / 100) * circumference;
  const refundedAmount = Math.max(evaluation.payout_amount * (100 / Math.max(evaluation.payout_percentage || 1, 1)) - evaluation.payout_amount, 0);

  return (
    <motion.section
      initial={{ opacity: 0, scale: 0.96 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.35, ease: "easeOut" }}
      className={cn(
        "rounded-[2rem] border border-border/60 bg-white/85 p-8 shadow-xl shadow-slate-900/5 backdrop-blur dark:bg-zinc-900/70",
        className,
      )}
    >
      <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
        <div className="relative flex h-44 w-44 items-center justify-center">
          <svg className="h-full w-full -rotate-90" viewBox="0 0 180 180">
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
              strokeWidth="12"
              strokeLinecap="round"
              strokeDasharray={circumference}
              initial={{ strokeDashoffset: circumference }}
              animate={{ strokeDashoffset: dashOffset }}
              transition={{ duration: 1.1, ease: "easeOut" }}
              className={tone.ring}
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <AnimatedNumber value={evaluation.completion_score} className="text-5xl font-medium text-foreground" />
            <span className="mt-1 text-xs uppercase tracking-[0.3em] text-muted-foreground">
              Score
            </span>
          </div>
        </div>

        <div className="flex-1">
          <div className={cn("inline-flex rounded-full px-4 py-2 text-sm font-medium", tone.banner)}>
            {evaluation.status.replaceAll("_", " ")}
          </div>
          <p className="mt-4 text-sm leading-7 text-muted-foreground">
            {evaluation.detailed_feedback}
          </p>
        </div>
      </div>

      <motion.div
        initial="hidden"
        animate="visible"
        variants={{
          hidden: {},
          visible: {
            transition: {
              staggerChildren: 0.08,
            },
          },
        }}
        className="mt-8 space-y-3"
      >
        {evaluation.checklist_results.map((item) => (
          <motion.div
            key={item.item}
            variants={{
              hidden: { opacity: 0, y: 12 },
              visible: { opacity: 1, y: 0 },
            }}
            className="flex items-start gap-3 rounded-2xl border border-border/50 bg-background/70 p-4"
          >
            <span
              className={cn(
                "mt-0.5 inline-flex h-6 w-6 items-center justify-center rounded-full",
                item.is_completed
                  ? "bg-green-500/10 text-green-600 dark:text-green-400"
                  : "bg-red-500/10 text-red-600 dark:text-red-300",
              )}
            >
              {item.is_completed ? <Check className="h-3.5 w-3.5" /> : <X className="h-3.5 w-3.5" />}
            </span>
            <div>
              <p className="text-sm font-medium text-foreground">{item.item}</p>
              <p className="mt-1 text-sm text-muted-foreground">{item.evidence}</p>
            </div>
          </motion.div>
        ))}
      </motion.div>

      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        <div className="rounded-2xl bg-green-500/10 p-5">
          <p className="text-sm font-medium text-green-800 dark:text-green-200">Strengths</p>
          <ul className="mt-3 space-y-2 text-sm text-green-900/80 dark:text-green-100/80">
            {evaluation.strengths.map((item) => (
              <li key={item} className="flex gap-2">
                <span>•</span>
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="rounded-2xl bg-amber-500/10 p-5">
          <p className="text-sm font-medium text-amber-800 dark:text-amber-200">Gaps</p>
          <ul className="mt-3 space-y-2 text-sm text-amber-900/80 dark:text-amber-100/80">
            {evaluation.gaps.map((item) => (
              <li key={item} className="flex gap-2">
                <span>•</span>
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="mt-8 rounded-[1.5rem] border border-green-500/20 bg-green-500/10 p-6">
        <div className="flex items-center gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-green-600 text-white">
            <CircleDollarSign className="h-6 w-6" />
          </div>
          <div>
            <p className="text-sm text-green-800 dark:text-green-200">Amount Released</p>
            <AnimatedNumber
              value={evaluation.payout_amount}
              formatter={currency}
              className="mt-1 text-3xl font-medium text-green-900 dark:text-green-100"
            />
          </div>
        </div>
        {evaluation.status === "PARTIALLY_COMPLETED" && refundedAmount > 0 ? (
          <p className="mt-4 text-sm text-amber-800 dark:text-amber-200">
            Refunded to employer: {currency(Math.round(refundedAmount))}
          </p>
        ) : null}
      </div>

      <div className="mt-8 rounded-[1.5rem] border border-border/50 bg-background/70 p-6">
        <div className="flex items-center gap-3">
          <Sparkles className="h-4 w-4 text-green-600 dark:text-green-400" />
          <p className="text-sm font-medium uppercase tracking-[0.22em] text-green-600 dark:text-green-400">
            PFI update
          </p>
        </div>
        <div className="mt-4 flex items-center gap-4 overflow-hidden">
          <AnimatePresence mode="wait">
            <motion.div
              key={`prev-${pfiUpdate.previous_score}`}
              initial={{ x: 0, opacity: 1 }}
              animate={{ x: -10, opacity: 0.7 }}
              className="text-2xl font-medium text-muted-foreground"
            >
              {pfiUpdate.previous_score}
            </motion.div>
          </AnimatePresence>
          <motion.div
            initial={{ x: 20, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="text-3xl font-medium text-foreground"
          >
            {pfiUpdate.new_score}
          </motion.div>
          <span className="rounded-full bg-green-500/10 px-3 py-1 text-sm font-medium text-green-700 dark:text-green-300">
            {pfiUpdate.score_change >= 0 ? "+" : ""}
            {pfiUpdate.score_change}
          </span>
        </div>
      </div>
    </motion.section>
  );
}

export default ScoreReveal;
