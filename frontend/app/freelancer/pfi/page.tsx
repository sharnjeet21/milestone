"use client";

import * as Tabs from "@radix-ui/react-tabs";
import { motion } from "framer-motion";
import {
  ArrowRight,
  Award,
  CalendarCheck2,
  CheckCircle2,
  Sparkles,
  Star,
  Target,
  TrendingUp,
} from "lucide-react";
import { useCallback, useEffect, useState } from "react";

import { useToast } from "@/context/ToastContext";
import { getFreelancerPFI, getPFIHistory } from "@/lib/api";
import { useAPI } from "@/lib/useAPI";
import { cn } from "@/lib/utils";
import type { FreelancerProfile, PFIHistoryEntry, PFIUpdate } from "@/lib/types";

type StoredUser = {
  id: string;
  name: string;
  email: string;
  role?: string;
};

type StoredEvaluationEntry = {
  projectId: string;
  milestoneId: string;
  result: {
    completion_score: number;
    payout_amount: number;
    pfi_update?: PFIUpdate;
  };
  submittedAt: string;
};

type StoredProject = {
  id: string;
  title: string;
  milestones: Array<{
    id: string;
    title: string;
  }>;
};

type PaymentHistoryItem = {
  id: string;
  projectName: string;
  milestoneTitle: string;
  score: number;
  payout: number;
  date: string;
};

type PfiViewModel = {
  score: number;
  tier: string;
  perks: string[];
  scoreChange: number;
  componentBreakdown: {
    quality: number;
    deadlines: number;
    revisions: number;
    completion: number;
  };
  improvementTips: string[];
  totalEarned: number;
};

const EVALUATION_HISTORY_KEY = "freelancer:project-history";
const tierDefinitions = [
  { label: "POOR", min: 300, max: 499 },
  { label: "AVERAGE", min: 500, max: 599 },
  { label: "GOOD", min: 600, max: 699 },
  { label: "EXCELLENT", min: 700, max: 799 },
  { label: "ELITE", min: 800, max: 900 },
] as const;

function currency(value: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(value);
}

function loadUser() {
  if (typeof window === "undefined") {
    return null as StoredUser | null;
  }

  const raw = window.localStorage.getItem("user");

  if (!raw) {
    return null;
  }

  try {
    return JSON.parse(raw) as StoredUser;
  } catch {
    return null;
  }
}

function loadEvaluationHistory() {
  if (typeof window === "undefined") {
    return [] as StoredEvaluationEntry[];
  }

  const raw = window.localStorage.getItem(EVALUATION_HISTORY_KEY);

  if (!raw) {
    return [] as StoredEvaluationEntry[];
  }

  try {
    return JSON.parse(raw) as StoredEvaluationEntry[];
  } catch {
    return [] as StoredEvaluationEntry[];
  }
}

function loadStoredProject(projectId: string) {
  if (typeof window === "undefined") {
    return null as StoredProject | null;
  }

  const raw = window.localStorage.getItem(`project:${projectId}`);

  if (!raw) {
    return null;
  }

  try {
    return JSON.parse(raw) as StoredProject;
  } catch {
    return null;
  }
}

function initials(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}

function tierTone(tier: string) {
  if (tier === "ELITE") {
    return "text-emerald-500";
  }

  if (tier === "EXCELLENT") {
    return "text-green-600 dark:text-green-400";
  }

  if (tier === "GOOD") {
    return "text-amber-600 dark:text-amber-300";
  }

  return "text-zinc-500";
}

function deriveLocalPfi(history: StoredEvaluationEntry[]): PfiViewModel {
  const latestUpdate = history.find((item) => item.result.pfi_update)?.result.pfi_update;
  const totalEarned = history.reduce(
    (sum, item) => sum + (item.result.payout_amount ?? 0),
    0,
  );

  if (!latestUpdate) {
    return {
      score: 500,
      tier: "AVERAGE",
      perks: [],
      scoreChange: 0,
      componentBreakdown: {
        quality: 50,
        deadlines: 50,
        revisions: 50,
        completion: 50,
      },
      improvementTips: ["Complete your first project to build your PFI score."],
      totalEarned,
    };
  }

  return {
    score: latestUpdate.new_score,
    tier: latestUpdate.tier,
    perks: latestUpdate.perks,
    scoreChange: latestUpdate.score_change,
    componentBreakdown: {
      quality: latestUpdate.component_breakdown.Quality ?? 82,
      deadlines: latestUpdate.component_breakdown.Deadlines ?? 84,
      revisions: latestUpdate.component_breakdown.Revisions ?? 78,
      completion: latestUpdate.component_breakdown.Completion ?? 92,
    },
    improvementTips: latestUpdate.improvement_tips,
    totalEarned,
  };
}

function normalizePfiResponse(
  response: PFIUpdate | FreelancerProfile | null,
  localFallback: PfiViewModel,
): PfiViewModel {
  if (!response) {
    return localFallback;
  }

  if ("component_breakdown" in response) {
    return {
      score: response.new_score,
      tier: response.tier,
      perks: response.perks,
      scoreChange: response.score_change,
      componentBreakdown: {
        quality: response.component_breakdown.Quality ?? localFallback.componentBreakdown.quality,
        deadlines:
          response.component_breakdown.Deadlines ?? localFallback.componentBreakdown.deadlines,
        revisions:
          response.component_breakdown.Revisions ?? localFallback.componentBreakdown.revisions,
        completion:
          response.component_breakdown.Completion ?? localFallback.componentBreakdown.completion,
      },
      improvementTips: response.improvement_tips,
      totalEarned: localFallback.totalEarned,
    };
  }

  return {
    score: response.pfi_score,
    tier: response.tier,
    perks:
      response.tier === "EXCELLENT" || response.tier === "ELITE"
        ? ["Instant payment", "Priority matching"]
        : ["Reliable payout visibility", "Milestone verification"],
    scoreChange: localFallback.scoreChange,
    componentBreakdown: {
      quality: Math.min(100, response.completed_projects * 10 + 50),
      deadlines: Math.min(100, response.on_time_deliveries),
      revisions: 82,
      completion: response.total_projects
        ? Math.min(
            100,
            Math.round((response.completed_projects / response.total_projects) * 100),
          )
        : 50,
    },
    improvementTips: localFallback.improvementTips,
    totalEarned: response.total_earnings || localFallback.totalEarned,
  };
}

function pointsToNextTier(score: number) {
  const current = tierDefinitions.find((tier) => score >= tier.min && score <= tier.max);
  const next = tierDefinitions.find((tier) => tier.min > (current?.min ?? 0));

  if (!next) {
    return 0;
  }

  return Math.max(next.min - score, 0);
}

function buildPaymentHistory(history: StoredEvaluationEntry[]) {
  return history.map((entry) => {
    const project = loadStoredProject(entry.projectId);
    const milestone = project?.milestones.find((item) => item.id === entry.milestoneId);

    return {
      id: `${entry.projectId}:${entry.milestoneId}`,
      projectName: project?.title ?? "Project workspace",
      milestoneTitle: milestone?.title ?? "Milestone submission",
      score: entry.result.completion_score,
      payout: entry.result.payout_amount,
      date: new Date(entry.submittedAt).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      }),
    } satisfies PaymentHistoryItem;
  });
}

export default function FreelancerPfiPage() {
  const { toast } = useToast();
  const [user, setUser] = useState<StoredUser | null>(null);
  const [pfi, setPfi] = useState<PfiViewModel | null>(null);
  const [localFallback, setLocalFallback] = useState<PfiViewModel | null>(null);
  const [history, setHistory] = useState<PaymentHistoryItem[]>([]);
  const [pfiHistory, setPfiHistory] = useState<PFIHistoryEntry[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);
  const { error: pfiError, execute: executePfi } =
    useAPI<PFIUpdate | FreelancerProfile>();

  useEffect(() => {
    let cancelled = false;

    const loadData = async () => {
      const currentUser = loadUser();
      const localHistory = loadEvaluationHistory();
      const localPfi = deriveLocalPfi(localHistory);
      const paymentHistory = buildPaymentHistory(localHistory);

      if (!cancelled) {
        setUser(currentUser);
        setHistory(paymentHistory);
        setLocalFallback(localPfi);
        setPfi(localPfi);
        setIsLoaded(true);
      }

      if (!currentUser?.id) {
        return;
      }

      const response = await executePfi(() => getFreelancerPFI(currentUser.id));

      if (cancelled) {
        return;
      }

      if (response) {
        setPfi(normalizePfiResponse(response, localPfi));
      } else {
        setPfi(localPfi);
        toast.info(
          "Using local PFI snapshot",
          "Live PFI data was unavailable, so a local summary was loaded.",
        );
      }

      if (currentUser?.id) {
        try {
          const historyData = await getPFIHistory(currentUser.id);
          if (!cancelled) setPfiHistory(historyData || []);
        } catch {
          // silently ignore
        }
      }
    };

    void loadData();

    return () => {
      cancelled = true;
    };
  }, [executePfi, toast]);

  const handleRetry = useCallback(async () => {
    if (!user?.id) {
      return;
    }

    const fallback = localFallback ?? deriveLocalPfi(loadEvaluationHistory());
    setLocalFallback(fallback);

    const response = await executePfi(() => getFreelancerPFI(user.id));

    if (response) {
      setPfi(normalizePfiResponse(response, fallback));
      return;
    }

    setPfi(fallback);
    toast.info(
      "Using local PFI snapshot",
      "Live PFI data was unavailable, so a local summary was loaded.",
    );
  }, [executePfi, localFallback, toast, user]);

  const userName = user?.name ?? "Freelancer";
  const userEmail = user?.email ?? "Complete your first project to build your PFI score.";
  const pfiScore = pfi?.score ?? 500;
  const currentTier = pfi?.tier ?? "AVERAGE";
  const nextTierPoints = pointsToNextTier(pfiScore);
  const totalEarned = pfi?.totalEarned ?? 0;

  const radius = 74;
  const circumference = 2 * Math.PI * radius;
  const scoreRatio = Math.max(0, Math.min((pfiScore - 300) / 600, 1));
  const dashOffset = circumference - scoreRatio * circumference;
  const angle = 180 * scoreRatio - 90;
  const indicatorX = 100 + radius * Math.cos((angle * Math.PI) / 180);
  const indicatorY = 100 + radius * Math.sin((angle * Math.PI) / 180);

  const breakdownCards = [
    {
      title: "Quality Score",
      value: pfi?.componentBreakdown.quality ?? 50,
      weight: "40% of PFI",
      icon: Sparkles,
    },
    {
      title: "Deadline Adherence",
      value: pfi?.componentBreakdown.deadlines ?? 50,
      weight: "30% of PFI",
      icon: CalendarCheck2,
    },
    {
      title: "Revision Rate",
      value: pfi?.componentBreakdown.revisions ?? 50,
      weight: "15% of PFI",
      icon: Target,
    },
    {
      title: "Completion Rate",
      value: pfi?.componentBreakdown.completion ?? 50,
      weight: "15% of PFI",
      icon: CheckCircle2,
    },
  ];

  if (!isLoaded || !pfi) {
    return (
      <main className="min-h-[calc(100svh-3.5rem)] px-4 py-10 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl animate-pulse space-y-6">
          <div className="h-72 rounded-[2rem] bg-zinc-100 dark:bg-zinc-900" />
          <div className="grid gap-4 md:grid-cols-2">
            {Array.from({ length: 4 }).map((_, index) => (
              <div key={index} className="h-40 rounded-xl bg-zinc-100 dark:bg-zinc-900" />
            ))}
          </div>
        </div>
      </main>
    );
  }

  if (pfiError && !pfi) {
    return (
      <main className="min-h-[calc(100svh-3.5rem)] px-4 py-10 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-2xl">
          <div className="rounded-[2rem] border border-border/60 bg-white/85 p-8 text-center shadow-xl shadow-slate-900/5 backdrop-blur dark:bg-zinc-900/70">
            <p className="text-sm font-medium uppercase tracking-[0.24em] text-red-500">
              Unable to load PFI
            </p>
            <p className="mt-4 text-sm text-muted-foreground">
              We couldn&apos;t reach the PFI service. Please try again.
            </p>
            <motion.button
              type="button"
              onClick={handleRetry}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="mt-6 inline-flex h-11 items-center justify-center rounded-xl bg-green-600 px-5 text-sm font-medium text-white transition hover:bg-green-700"
            >
              Retry
            </motion.button>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-[calc(100svh-3.5rem)] px-4 py-10 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl space-y-8">
        {pfiError ? (
          <div className="flex flex-col items-start justify-between gap-4 rounded-2xl border border-amber-500/30 bg-amber-500/10 p-4 text-sm text-amber-900 dark:text-amber-200 md:flex-row md:items-center">
            <span>
              Live PFI data couldn&apos;t be refreshed. Showing your latest local snapshot.
            </span>
            <motion.button
              type="button"
              onClick={handleRetry}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="inline-flex h-9 items-center justify-center rounded-full bg-amber-600 px-4 text-xs font-semibold text-white transition hover:bg-amber-500"
            >
              Retry
            </motion.button>
          </div>
        ) : null}
        <motion.section
          whileHover={{ y: -2, transition: { duration: 0.2 } }}
          className="rounded-[2rem] border border-border/60 bg-white/85 p-8 shadow-xl shadow-slate-900/5 backdrop-blur dark:bg-zinc-900/70"
        >
          <div className="grid gap-8 lg:grid-cols-[0.95fr_1.05fr] lg:items-center">
            <div className="flex items-center gap-5">
              <div className="flex h-20 w-20 items-center justify-center rounded-full bg-green-600 text-2xl font-medium text-white">
                {initials(userName)}
              </div>
              <div>
                <p className="text-sm font-medium uppercase tracking-[0.24em] text-green-600 dark:text-green-400">
                  Reputation passport
                </p>
                <h1 className="mt-2 text-3xl font-medium tracking-tight text-foreground">
                  {userName}
                </h1>
                <p className="mt-2 text-sm text-muted-foreground">{userEmail}</p>
              </div>
            </div>

            <div className="flex flex-col items-center lg:items-end">
              <div className="relative flex h-[200px] w-[200px] items-center justify-center">
                <svg className="h-full w-full -rotate-90" viewBox="0 0 200 200">
                  <defs>
                    <linearGradient id="pfi-hero-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="#ef4444" />
                      <stop offset="55%" stopColor="#f59e0b" />
                      <stop offset="100%" stopColor="#22c55e" />
                    </linearGradient>
                  </defs>
                  <circle
                    cx="100"
                    cy="100"
                    r={radius}
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="14"
                    className="text-foreground/10"
                  />
                  <motion.circle
                    cx="100"
                    cy="100"
                    r={radius}
                    fill="none"
                    stroke="url(#pfi-hero-gradient)"
                    strokeWidth="14"
                    strokeLinecap="round"
                    strokeDasharray={circumference}
                    initial={{ strokeDashoffset: circumference }}
                    animate={{ strokeDashoffset: dashOffset }}
                    transition={{ duration: 1.2, ease: "easeOut" }}
                  />
                  <motion.circle
                    cx={indicatorX}
                    cy={indicatorY}
                    r="6"
                    fill="#22c55e"
                    initial={{ opacity: 0, scale: 0.6 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.6 }}
                  />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-5xl font-medium text-foreground">{pfiScore}</span>
                  <span className={cn("mt-3 text-sm font-medium tracking-[0.28em]", tierTone(currentTier))}>
                    {currentTier}
                  </span>
                </div>
              </div>

              <div className="mt-6 w-full max-w-md rounded-2xl border border-green-200 bg-green-50 p-4 text-sm dark:border-green-900 dark:bg-green-950">
                <p className="font-medium text-green-800 dark:text-green-200">
                  Your perks:{" "}
                  {pfi.perks.length
                    ? pfi.perks.join(", ")
                    : "Complete your first project to unlock payment and matching perks."}
                </p>
              </div>

              {pfi.scoreChange !== 0 ? (
                <div className="mt-4 inline-flex items-center gap-2 rounded-full bg-green-500/10 px-4 py-2 text-sm font-medium text-green-700 dark:text-green-300">
                  <TrendingUp className="h-4 w-4" />
                  {pfi.scoreChange > 0 ? "+" : ""}
                  {pfi.scoreChange} points from last project
                </div>
              ) : (
                <p className="mt-4 text-sm text-muted-foreground">
                  Complete your first project to build your PFI score.
                </p>
              )}
            </div>
          </div>
        </motion.section>

        <Tabs.Root defaultValue="overview">
          <Tabs.List className="grid w-full max-w-md grid-cols-3 rounded-2xl border border-border/50 bg-foreground/[0.03] p-1">
            <Tabs.Trigger
              value="overview"
              className="rounded-xl px-4 py-2.5 text-sm font-medium text-muted-foreground transition data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm"
            >
              Overview
            </Tabs.Trigger>
            <Tabs.Trigger
              value="history"
              className="rounded-xl px-4 py-2.5 text-sm font-medium text-muted-foreground transition data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm"
            >
              Payment History
            </Tabs.Trigger>
            <Tabs.Trigger
              value="score-history"
              className="rounded-xl px-4 py-2.5 text-sm font-medium text-muted-foreground transition data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm"
            >
              Score History
            </Tabs.Trigger>
          </Tabs.List>

          <Tabs.Content value="overview" className="mt-8 space-y-8">
            <section>
              <div className="flex items-center justify-between gap-4">
                <div>
                  <h2 className="text-2xl font-medium text-foreground">
                    Component Breakdown
                  </h2>
                  <p className="mt-2 text-sm text-muted-foreground">
                    The metrics shaping your Professional Fidelity Index.
                  </p>
                </div>
              </div>

              <div className="mt-6 grid gap-4 md:grid-cols-2">
                {breakdownCards.map((card, index) => {
                  const Icon = card.icon;

                  return (
                    <div
                      key={card.title}
                      className="rounded-xl border border-border/60 bg-white p-4 shadow-sm shadow-slate-900/5 dark:bg-zinc-900"
                    >
                      <div className="flex items-center justify-between gap-4">
                        <div>
                          <p className="text-base font-medium text-foreground">
                            {card.title}
                          </p>
                          <p className="mt-1 text-sm text-muted-foreground">
                            {card.weight}
                          </p>
                        </div>
                        <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-green-500/10 text-green-600 dark:text-green-400">
                          <Icon className="h-4 w-4" />
                        </div>
                      </div>

                      <div className="mt-5">
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-muted-foreground">Score</span>
                          <span className="font-medium text-foreground">{card.value}</span>
                        </div>
                        <div className="mt-2 h-2 rounded-full bg-foreground/10">
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${card.value}%` }}
                            transition={{ duration: 0.8, delay: index * 0.1, ease: "easeOut" }}
                            className="h-full rounded-full bg-green-500"
                          />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>

            <motion.section
              whileHover={{ y: -2, transition: { duration: 0.2 } }}
              className="rounded-[2rem] border border-border/60 bg-white/85 p-8 shadow-xl shadow-slate-900/5 backdrop-blur dark:bg-zinc-900/70"
            >
              <div className="flex items-center justify-between gap-4">
                <div>
                  <h2 className="text-2xl font-medium text-foreground">Tier Ladder</h2>
                  <p className="mt-2 text-sm text-muted-foreground">
                    See where you sit today and how close you are to the next level.
                  </p>
                </div>
                <div className="text-sm text-muted-foreground">
                  {nextTierPoints > 0
                    ? `${nextTierPoints} points to next tier`
                    : "You are at the top tier"}
                </div>
              </div>

              <div className="mt-8 grid gap-4 lg:grid-cols-5">
                {tierDefinitions.map((tier, index) => {
                  const active = currentTier === tier.label;

                  return (
                    <div key={tier.label} className="relative">
                      {index < tierDefinitions.length - 1 ? (
                        <div className="absolute right-[-0.5rem] top-10 hidden h-px w-4 bg-border lg:block" />
                      ) : null}
                      <div
                        className={cn(
                          "rounded-2xl border px-4 py-5 text-center transition-all",
                          active
                            ? "scale-[1.04] border-green-500/30 bg-green-500/10 shadow-lg shadow-green-500/10"
                            : "border-border/60 bg-background/70",
                        )}
                      >
                        <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-full bg-foreground/5">
                          <Award
                            className={cn(
                              "h-4 w-4",
                              active ? "text-green-600 dark:text-green-400" : "text-muted-foreground",
                            )}
                          />
                        </div>
                        <p className="mt-3 text-sm font-medium text-foreground">{tier.label}</p>
                        <p className="mt-1 text-xs text-muted-foreground">
                          {tier.min}-{tier.max}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </motion.section>

            <section>
              <div>
                <h2 className="text-2xl font-medium text-foreground">
                  Improvement Tips
                </h2>
                <p className="mt-2 text-sm text-muted-foreground">
                  Targeted recommendations to raise your score faster.
                </p>
              </div>

              <div className="mt-6 grid gap-4 md:grid-cols-2">
                {pfi.improvementTips.map((tip, index) => {
                  const icons = [Star, Target, ArrowRight, Sparkles];
                  const Icon = icons[index % icons.length];

                  return (
                    <div
                      key={tip}
                      className="rounded-xl border border-border/60 bg-white p-4 shadow-sm shadow-slate-900/5 dark:bg-zinc-900"
                    >
                      <div className="flex items-start gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-green-500/10 text-green-600 dark:text-green-400">
                          <Icon className="h-4 w-4" />
                        </div>
                        <p className="text-sm leading-7 text-foreground/90">{tip}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>

            {/* Leaderboard */}
            <motion.section
              whileHover={{ y: -2, transition: { duration: 0.2 } }}
              className="rounded-[2rem] border border-border/60 bg-white/85 p-8 shadow-xl shadow-slate-900/5 backdrop-blur dark:bg-zinc-900/70"
            >
              <div className="flex items-center justify-between gap-4">
                <div>
                  <h2 className="text-2xl font-medium text-foreground">Community Leaderboard</h2>
                  <p className="mt-2 text-sm text-muted-foreground">Top earners this month by PFI score.</p>
                </div>
                <span className="rounded-full border border-green-500/20 bg-green-500/10 px-3 py-1 text-xs font-medium text-green-700 dark:text-green-300">
                  Live
                </span>
              </div>
              <div className="mt-6 space-y-3">
                {[
                  { rank: 1, name: "Priya S.", domain: "ML Engineer", score: 872, earned: 3240, tier: "ELITE" },
                  { rank: 2, name: "Carlos M.", domain: "Technical Writer", score: 841, earned: 2890, tier: "ELITE" },
                  { rank: 3, name: "Aisha K.", domain: "Data Scientist", score: 818, earned: 2650, tier: "ELITE" },
                  { rank: 4, name: "James T.", domain: "Frontend Dev", score: 791, earned: 2100, tier: "EXCELLENT" },
                  { rank: 5, name: "Mei L.", domain: "Researcher", score: 764, earned: 1870, tier: "EXCELLENT" },
                ].map((entry) => (
                  <div
                    key={entry.rank}
                    className={`flex items-center justify-between rounded-2xl border px-5 py-4 ${
                      entry.rank <= 3
                        ? "border-green-500/20 bg-green-500/5"
                        : "border-border/50 bg-background/60"
                    }`}
                  >
                    <div className="flex items-center gap-4">
                      <span className={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-semibold ${
                        entry.rank === 1 ? "bg-amber-400 text-white" :
                        entry.rank === 2 ? "bg-zinc-300 text-zinc-800" :
                        entry.rank === 3 ? "bg-amber-600/80 text-white" :
                        "bg-foreground/10 text-foreground"
                      }`}>
                        {entry.rank}
                      </span>
                      <div>
                        <p className="text-sm font-medium text-foreground">{entry.name}</p>
                        <p className="text-xs text-muted-foreground">{entry.domain}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-6 text-sm">
                      <div className="text-right">
                        <p className="font-medium text-foreground">{entry.score}</p>
                        <p className="text-xs text-muted-foreground">PFI</p>
                      </div>
                      <div className="text-right">
                        <p className="font-medium text-green-600 dark:text-green-400">{currency(entry.earned)}</p>
                        <p className="text-xs text-muted-foreground">this month</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </motion.section>
          </Tabs.Content>

          <Tabs.Content value="history" className="mt-8 space-y-6">
            <div className="rounded-xl border border-border/60 bg-white p-5 shadow-sm shadow-slate-900/5 dark:bg-zinc-900">
              <p className="text-sm text-muted-foreground">Total earned</p>
              <p className="mt-3 text-3xl font-medium text-foreground">
                {currency(totalEarned)}
              </p>
            </div>

            <motion.div
              whileHover={{ y: -2, transition: { duration: 0.2 } }}
              className="overflow-hidden rounded-[2rem] border border-border/60 bg-white/85 shadow-xl shadow-slate-900/5 dark:bg-zinc-900/70"
            >
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-border/60">
                  <thead className="bg-zinc-50/80 dark:bg-zinc-950/60">
                    <tr className="text-left text-sm text-muted-foreground">
                      <th className="px-5 py-4 font-medium">Project</th>
                      <th className="px-5 py-4 font-medium">Milestone</th>
                      <th className="px-5 py-4 font-medium">Score</th>
                      <th className="px-5 py-4 font-medium">Payout</th>
                      <th className="px-5 py-4 font-medium">Date</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/50">
                    {history.length ? (
                      history.map((item) => (
                        <tr key={item.id} className="text-sm">
                          <td className="px-5 py-4 text-foreground">{item.projectName}</td>
                          <td className="px-5 py-4 text-muted-foreground">
                            {item.milestoneTitle}
                          </td>
                          <td className="px-5 py-4 text-foreground">{item.score}</td>
                          <td className="px-5 py-4 font-medium text-green-600 dark:text-green-400">
                            {currency(item.payout)}
                          </td>
                          <td className="px-5 py-4 text-muted-foreground">{item.date}</td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td
                          colSpan={5}
                          className="px-5 py-12 text-center text-sm text-muted-foreground"
                        >
                          Complete your first project to populate your payment history.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </motion.div>
          </Tabs.Content>

          <Tabs.Content value="score-history" className="mt-8 space-y-4">
            {pfiHistory.length ? (
              pfiHistory.map((entry, index) => {
                const date = new Date(entry.recorded_at).toLocaleDateString("en-US", {
                  month: "short",
                  day: "numeric",
                  year: "numeric",
                });
                const isPositive = entry.score_change >= 0;

                return (
                  <div
                    key={index}
                    className="rounded-xl border border-border/60 bg-white p-5 shadow-sm shadow-slate-900/5 dark:bg-zinc-900"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <p className="text-sm text-muted-foreground">{date}</p>
                      <span
                        className={cn(
                          "text-sm font-semibold",
                          isPositive ? "text-green-600 dark:text-green-400" : "text-red-500",
                        )}
                      >
                        {isPositive ? "+" : ""}
                        {entry.score_change}
                      </span>
                    </div>

                    <div className="mt-3 flex items-center gap-2 text-lg font-medium text-foreground">
                      <span>{entry.previous_score}</span>
                      <ArrowRight className="h-4 w-4 text-muted-foreground" />
                      <span>{entry.new_score}</span>
                    </div>

                    <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
                      {(
                        [
                          { label: "Quality", value: entry.component_breakdown.quality },
                          { label: "Deadline", value: entry.component_breakdown.deadline },
                          { label: "Revision Rate", value: entry.component_breakdown.revision_rate },
                          { label: "Completion", value: entry.component_breakdown.completion },
                        ] as const
                      ).map((comp) => (
                        <div key={comp.label} className="rounded-lg bg-foreground/5 px-3 py-2">
                          <p className="text-xs text-muted-foreground">{comp.label}</p>
                          <p className="mt-1 text-sm font-medium text-foreground">{comp.value}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="rounded-xl border border-border/60 bg-white p-12 text-center shadow-sm dark:bg-zinc-900">
                <p className="text-sm text-muted-foreground">
                  No PFI history yet. Complete a milestone to see your score history.
                </p>
              </div>
            )}
          </Tabs.Content>
        </Tabs.Root>
      </div>
    </main>
  );
}
