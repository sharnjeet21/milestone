"use client";

import { motion, useMotionValue, useSpring, useTransform } from "framer-motion";
import { useEffect, useState } from "react";

import { cn } from "@/lib/utils";

type LoadingEvaluationProps = {
  className?: string;
};

const loadingMessages = [
  "Reading your submission...",
  "Checking checklist items...",
  "Calculating quality score...",
  "Determining payment...",
];

export function LoadingEvaluation({ className }: LoadingEvaluationProps) {
  const progressValue = useMotionValue(0);
  const progressSpring = useSpring(progressValue, { stiffness: 75, damping: 18 });
  const progressWidth = useTransform(progressSpring, (value) => `${value}%`);
  const [progressNumber, setProgressNumber] = useState(0);
  const [messageIndex, setMessageIndex] = useState(0);

  useEffect(() => {
    progressValue.set(100);
    const intervalId = window.setInterval(() => {
      setMessageIndex((current) =>
        current < loadingMessages.length - 1 ? current + 1 : current,
      );
    }, 620);

    const unsubscribe = progressSpring.on("change", (value) => {
      setProgressNumber(Math.round(value));
    });

    return () => {
      window.clearInterval(intervalId);
      unsubscribe();
    };
  }, [progressSpring, progressValue]);

  return (
    <motion.div
      whileHover={{ y: -2, transition: { duration: 0.2 } }}
      className={cn(
        "rounded-[2rem] border border-border/60 bg-white/85 p-8 shadow-xl shadow-slate-900/5 backdrop-blur dark:bg-zinc-900/70",
        className,
      )}
    >
      <div className="h-8 w-40 animate-pulse rounded-full bg-zinc-100 dark:bg-zinc-800" />
      <div className="mt-6 space-y-3">
        <div className="h-4 w-full animate-pulse rounded-full bg-zinc-100 dark:bg-zinc-800" />
        <div className="h-4 w-5/6 animate-pulse rounded-full bg-zinc-100 dark:bg-zinc-800" />
        <div className="h-4 w-2/3 animate-pulse rounded-full bg-zinc-100 dark:bg-zinc-800" />
      </div>

      <p className="mt-8 text-lg font-medium text-foreground">
        {loadingMessages[messageIndex]}
      </p>

      <div className="mt-4 h-3 overflow-hidden rounded-full bg-foreground/10">
        <motion.div
          className="h-full rounded-full bg-green-500"
          style={{ width: progressWidth }}
        />
      </div>
      <p className="mt-2 text-sm text-muted-foreground">{progressNumber}% complete</p>
    </motion.div>
  );
}

export default LoadingEvaluation;
