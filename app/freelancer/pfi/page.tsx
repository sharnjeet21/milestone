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
import { useEffect, useState } from "react";

import { useToast } from "@/components/ToastProvider";
import { getFreelancerPFI } from "@/lib/api";
import { cn } from "@/lib/utils";
import type { FreelancerProfile, PFIUpdate } from "@/lib/types";

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
  const [history, setHistory] = useState<PaymentHistoryItem[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

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
      }

      if (!currentUser?.id) {
        if (!cancelled) {
          setPfi(localPfi);
          setIsLoaded(true);
        }
        return;
      }

      try {
        const response = await getFreelancerPFI(currentUser.id);

        if (!cancelled) {
          setPfi(normalizePfiResponse(response, localPfi));
        }
      } catch {
        if (!cancelled) {
          setPfi(localPfi);
          toast({
            title: "Using local PFI snapshot",
            description: "Live PFI data was unavailable, so a local summary was loaded.",
          });
        }
      } finally {
        if (!cancelled) {
          setIsLoaded(true);
        }
      }
    };

    void loadData();

    return () => {
      cancelled = true;
    };
  }, [toast]);

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

  return (
    <main className="min-h-[calc(100svh-3.5rem)] px-4 py-10 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl space-y-8">
        <section className="rounded-[2rem] border border-border/60 bg-white/85 p-8 shadow-xl shadow-slate-900/5 backdrop-blur dark:bg-zinc-900/70">
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
        </section>

        <Tabs.Root defaultValue="overview">
          <Tabs.List className="grid w-full max-w-md grid-cols-2 rounded-2xl border border-border/50 bg-foreground/[0.03] p-1">
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
                            transition={{ duration: 0.8, delay: index * 0.2, ease: "easeOut" }}
                            className="h-full rounded-full bg-green-500"
                          />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>

            <section className="rounded-[2rem] border border-border/60 bg-white/85 p-8 shadow-xl shadow-slate-900/5 backdrop-blur dark:bg-zinc-900/70">
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
            </section>

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
          </Tabs.Content>

          <Tabs.Content value="history" className="mt-8 space-y-6">
            <div className="rounded-xl border border-border/60 bg-white p-5 shadow-sm shadow-slate-900/5 dark:bg-zinc-900">
              <p className="text-sm text-muted-foreground">Total earned</p>
              <p className="mt-3 text-3xl font-medium text-foreground">
                {currency(totalEarned)}
              </p>
            </div>

            <div className="overflow-hidden rounded-[2rem] border border-border/60 bg-white/85 shadow-xl shadow-slate-900/5 dark:bg-zinc-900/70">
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
            </div>
          </Tabs.Content>
        </Tabs.Root>
      </div>
    </main>
  );
}
