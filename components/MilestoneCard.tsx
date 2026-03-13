"use client";

import { motion } from "framer-motion";
import {
  AlertCircle,
  Check,
  CheckCircle2,
  Clock,
  Lock,
  XCircle,
} from "lucide-react";
import { useMemo, useState } from "react";

import { cn } from "@/lib/utils";
import type { Milestone } from "@/lib/types";

type MilestoneCardProps = {
  milestone: Milestone;
  index: number;
  showFull?: boolean;
  className?: string;
};

function currency(value: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(value);
}

function getMilestoneTone(status: Milestone["status"]) {
  switch (status) {
    case "FULLY_COMPLETED":
      return {
        border: "border-l-4 border-green-500",
        icon: <CheckCircle2 className="h-5 w-5 text-green-500" />,
        progress: "bg-green-500",
        amount: "text-green-600 dark:text-green-400",
      };
    case "PARTIALLY_COMPLETED":
      return {
        border: "border-l-4 border-amber-500",
        icon: <AlertCircle className="h-5 w-5 text-amber-500" />,
        progress: "bg-amber-500",
        amount: "text-amber-600 dark:text-amber-300",
      };
    case "UNMET":
      return {
        border: "border-l-4 border-red-500",
        icon: <XCircle className="h-5 w-5 text-red-500" />,
        progress: "bg-red-500",
        amount: "text-red-600 dark:text-red-300",
      };
    case "IN_PROGRESS":
    case "SUBMITTED":
      return {
        border: "border-l-4 border-blue-500",
        icon: <Clock className="h-5 w-5 text-blue-500" />,
        progress: "bg-blue-500",
        amount: "text-zinc-500 dark:text-zinc-400",
      };
    default:
      return {
        border: "border-l-4 border-zinc-300 dark:border-zinc-700",
        icon: <Lock className="h-5 w-5 text-zinc-500" />,
        progress: "bg-zinc-300 dark:bg-zinc-700",
        amount: "text-zinc-500 dark:text-zinc-400",
      };
  }
}

export function MilestoneCard({
  milestone,
  index,
  showFull = false,
  className,
}: MilestoneCardProps) {
  const [expanded, setExpanded] = useState(showFull);
  const tone = getMilestoneTone(milestone.status);
  const checklistItems = useMemo(
    () =>
      showFull || expanded
        ? milestone.checklist
        : milestone.checklist.slice(0, 4),
    [expanded, milestone.checklist, showFull],
  );

  return (
    <motion.article
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay: index * 0.08, ease: "easeOut" }}
      className={cn(
        "rounded-2xl bg-background/80 p-5 shadow-sm shadow-slate-900/5",
        tone.border,
        className,
      )}
    >
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex items-start gap-3">
          <span className="mt-0.5">{tone.icon}</span>
          <div>
            <h3 className="text-lg font-medium text-foreground">{milestone.title}</h3>
            <p className="mt-1 text-sm leading-6 text-muted-foreground">
              {milestone.description}
            </p>
          </div>
        </div>
        <div className="text-right">
          <p className={cn("text-sm font-medium", tone.amount)}>
            {currency(milestone.payment_amount)}
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            {milestone.deadline_days} days
          </p>
        </div>
      </div>

      <div className="mt-5">
        <div className="mb-2 flex items-center justify-between text-xs text-muted-foreground">
          <span>Completion</span>
          <span>{milestone.completion_score}%</span>
        </div>
        <div className="h-2 overflow-hidden rounded-full bg-foreground/10">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${Math.max(0, Math.min(100, milestone.completion_score))}%` }}
            transition={{ duration: 0.8, ease: "easeOut", delay: index * 0.06 }}
            className={cn("h-full rounded-full", tone.progress)}
          />
        </div>
      </div>

      <div className="mt-5 space-y-3">
        {checklistItems.map((item) => (
          <div
            key={item.item}
            className="flex items-start justify-between gap-3 rounded-xl bg-background/70 px-3 py-3"
          >
            <div className="flex items-start gap-3">
              <span
                className={cn(
                  "mt-0.5 inline-flex h-5 w-5 items-center justify-center rounded-full border",
                  item.is_completed
                    ? "border-green-500 bg-green-500 text-white"
                    : "border-border/60 text-transparent",
                )}
              >
                <Check className="h-3 w-3" />
              </span>
              <span className="text-sm text-foreground/90">{item.item}</span>
            </div>
            <span className="rounded-full bg-zinc-100 px-2 py-1 text-xs text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300">
              {Math.round(item.weight)}%
            </span>
          </div>
        ))}
      </div>

      {!showFull && milestone.checklist.length > 4 ? (
        <button
          type="button"
          onClick={() => setExpanded((current) => !current)}
          className="mt-4 text-sm font-medium text-green-700 transition hover:text-green-800 dark:text-green-300 dark:hover:text-green-200"
        >
          {expanded ? "Show less" : `Show ${milestone.checklist.length - 4} more`}
        </button>
      ) : null}
    </motion.article>
  );
}

export default MilestoneCard;
