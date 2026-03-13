"use client";

import { AnimatePresence, motion, useMotionValue, useSpring, useTransform } from "framer-motion";
import {
  AlertTriangle,
  ArrowDownLeft,
  ArrowUpRight,
  Check,
  CheckCircle2,
  Clock3,
  Lock,
  MessageSquareText,
  Send,
  ShieldCheck,
} from "lucide-react";
import { useParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";

import { useToast } from "@/context/ToastContext";
import { getEscrow, getFreelancerPFI, getProject } from "@/lib/api";
import { useAPI } from "@/lib/useAPI";
import { cn } from "@/lib/utils";
import type { FreelancerProfile, Milestone, PFIUpdate, Project } from "@/lib/types";

type StatusStyle = {
  border: string;
  icon: JSX.Element;
  bar: string;
  amount: string;
};

type EscrowTransaction = {
  id: string;
  type: "IN" | "OUT" | "REF";
  description: string;
  amount: number;
};

type EscrowSummary = {
  lockedAmount: number;
  releasedAmount: number;
  transactions: EscrowTransaction[];
};

type PfiCardData = {
  score: number;
  tier: string;
  delta: number;
  metrics: {
    Quality: number;
    Deadlines: number;
    Revisions: number;
  };
};

type ChatMessage = {
  id: string;
  role: "assistant" | "user";
  content: string;
};

function currency(value: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(value);
}

function getStoredProject(projectId: string) {
  if (typeof window === "undefined") {
    return null;
  }

  const raw = window.localStorage.getItem(`project:${projectId}`);

  if (!raw) {
    return null;
  }

  try {
    return JSON.parse(raw) as Project;
  } catch {
    return null;
  }
}

function buildFallbackProject(projectId: string): Project {
  return {
    id: projectId,
    employer_id: "employer_demo",
    freelancer_id: "freelancer_demo",
    title: "Autonomous milestone operations dashboard",
    description:
      "A fallback project preview used when the backend project record is unavailable.",
    total_budget: 12000,
    milestones: [
      {
        id: `${projectId}_1`,
        title: "Requirements alignment",
        description: "Finalize scope, acceptance criteria, and implementation plan.",
        deliverable_type: "code",
        checklist: [
          { item: "Scope approved", is_completed: true, weight: 30 },
          { item: "Architecture reviewed", is_completed: true, weight: 25 },
          { item: "Acceptance criteria captured", is_completed: false, weight: 45 },
        ],
        deadline_days: 5,
        payment_amount: 2500,
        status: "PARTIALLY_COMPLETED",
        completion_score: 62,
        feedback:
          "AI notes that the scope is strong, but final acceptance criteria should be made more explicit before release.",
        submitted_work: "",
      },
      {
        id: `${projectId}_2`,
        title: "Core build execution",
        description: "Implement the main delivery flow and validate major functionality.",
        deliverable_type: "code",
        checklist: [
          { item: "Core flow implemented", is_completed: false, weight: 40 },
          { item: "Edge cases covered", is_completed: false, weight: 30 },
          { item: "Internal QA pass", is_completed: false, weight: 30 },
        ],
        deadline_days: 10,
        payment_amount: 5500,
        status: "IN_PROGRESS",
        completion_score: 34,
        feedback: "",
        submitted_work: "",
      },
      {
        id: `${projectId}_3`,
        title: "Launch, documentation, and handoff",
        description: "Prepare final release, documentation, and knowledge transfer.",
        deliverable_type: "code",
        checklist: [
          { item: "Release checklist", is_completed: false, weight: 35 },
          { item: "Handoff docs", is_completed: false, weight: 35 },
          { item: "Launch support", is_completed: false, weight: 30 },
        ],
        deadline_days: 7,
        payment_amount: 4000,
        status: "PENDING",
        completion_score: 0,
        feedback: "",
        submitted_work: "",
      },
    ],
    status: "IN_PROGRESS",
    vault_id: `vault_${projectId}`,
    success_fee: 600,
    created_at: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000).toISOString(),
    project_summary:
      "MilestoneAI is actively tracking delivery progress, escrow release readiness, and milestone risk.",
    risk_factors: [
      "Acceptance criteria on milestone one still need refinement.",
      "Core delivery timeline depends on review turnaround.",
    ],
  };
}

function deriveEscrowFromProject(project: Project): EscrowSummary {
  const releasedAmount = project.milestones
    .filter((milestone) => milestone.status === "FULLY_COMPLETED")
    .reduce((sum, milestone) => sum + milestone.payment_amount, 0);

  const partiallyReleased = project.milestones
    .filter((milestone) => milestone.status === "PARTIALLY_COMPLETED")
    .reduce(
      (sum, milestone) =>
        sum + milestone.payment_amount * (milestone.completion_score / 100),
      0,
    );

  const totalReleased = Math.round(releasedAmount + partiallyReleased);

  return {
    lockedAmount: Math.max(project.total_budget - totalReleased, 0),
    releasedAmount: totalReleased,
    transactions: [
      {
        id: `${project.id}_tx_1`,
        type: "IN",
        description: "Initial escrow funding",
        amount: project.total_budget,
      },
      {
        id: `${project.id}_tx_2`,
        type: "OUT",
        description: "Milestone payout release",
        amount: Math.min(totalReleased, project.total_budget),
      },
      {
        id: `${project.id}_tx_3`,
        type: "REF",
        description: "Risk reserve adjustment",
        amount: Math.round(project.success_fee * 0.2),
      },
    ],
  };
}

function derivePfiFromProject(project: Project): PfiCardData {
  const completed = project.milestones.filter(
    (milestone) => milestone.status === "FULLY_COMPLETED",
  ).length;
  const averageCompletion =
    project.milestones.reduce((sum, milestone) => sum + milestone.completion_score, 0) /
    project.milestones.length;

  const score = Math.min(
    900,
    Math.round(620 + averageCompletion * 2.1 + completed * 18),
  );
  const tier = score >= 780 ? "ELITE" : score >= 690 ? "EXCELLENT" : "GOOD";

  return {
    score,
    tier,
    delta: 12,
    metrics: {
      Quality: Math.min(100, Math.round(averageCompletion + 28)),
      Deadlines: 94,
      Revisions: 85,
    },
  };
}

function normalizePfi(
  project: Project,
  response: PFIUpdate | FreelancerProfile | null,
): PfiCardData {
  if (!response) {
    return derivePfiFromProject(project);
  }

  if ("component_breakdown" in response) {
    return {
      score: response.new_score,
      tier: response.tier,
      delta: response.score_change,
      metrics: {
        Quality: response.component_breakdown.Quality ?? 88,
        Deadlines: response.component_breakdown.Deadlines ?? 92,
        Revisions: response.component_breakdown.Revisions ?? 84,
      },
    };
  }

  return {
    score: response.pfi_score,
    tier: response.tier,
    delta: 12,
    metrics: {
      Quality: 88,
      Deadlines: response.on_time_deliveries,
      Revisions: 85,
    },
  };
}

function getStatusStyle(status: Milestone["status"]): StatusStyle {
  switch (status) {
    case "FULLY_COMPLETED":
      return {
        border: "border-l-4 border-green-500",
        icon: <CheckCircle2 className="h-5 w-5 text-green-500" />,
        bar: "bg-green-500",
        amount: "text-green-600 dark:text-green-400",
      };
    case "PARTIALLY_COMPLETED":
      return {
        border: "border-l-4 border-amber-500",
        icon: <Clock3 className="h-5 w-5 text-amber-500" />,
        bar: "bg-amber-500",
        amount: "text-amber-600 dark:text-amber-300",
      };
    case "UNMET":
      return {
        border: "border-l-4 border-red-500",
        icon: <AlertTriangle className="h-5 w-5 text-red-500" />,
        bar: "bg-red-500",
        amount: "text-red-600 dark:text-red-300",
      };
    default:
      return {
        border: "border-l-4 border-zinc-300 dark:border-zinc-700",
        icon: <Lock className="h-5 w-5 text-zinc-500" />,
        bar: "bg-zinc-300 dark:bg-zinc-700",
        amount: "text-zinc-600 dark:text-zinc-400",
      };
  }
}

function getProjectStatusTone(status: string) {
  if (status.includes("COMPLETE")) {
    return "border-green-500/20 bg-green-500/10 text-green-700 dark:text-green-300";
  }

  if (status.includes("RISK") || status.includes("UNMET")) {
    return "border-red-500/20 bg-red-500/10 text-red-700 dark:text-red-300";
  }

  return "border-amber-500/20 bg-amber-500/10 text-amber-700 dark:text-amber-300";
}

function AnimatedMilestoneProgress({
  value,
  colorClass,
}: {
  value: number;
  colorClass: string;
}) {
  const motionValue = useMotionValue(0);
  const spring = useSpring(motionValue, {
    stiffness: 90,
    damping: 18,
    mass: 0.8,
  });
  const width = useTransform(spring, (latest) => `${Math.min(Math.max(latest, 0), 100)}%`);
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

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <span>Completion score</span>
        <span>{displayValue}%</span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-foreground/10">
        <motion.div className={cn("h-full rounded-full", colorClass)} style={{ width }} />
      </div>
    </div>
  );
}

function MilestoneCard({ milestone }: { milestone: Milestone }) {
  const [feedbackOpen, setFeedbackOpen] = useState(false);
  const style = getStatusStyle(milestone.status);

  return (
    <div
      className={cn(
        "rounded-2xl bg-background/80 p-5 shadow-sm shadow-slate-900/5",
        style.border,
      )}
    >
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex items-start gap-3">
          <span className="mt-1">{style.icon}</span>
          <div>
            <h3 className="text-lg font-medium text-foreground">{milestone.title}</h3>
            <p className="mt-1 text-sm text-muted-foreground">{milestone.description}</p>
          </div>
        </div>
        <span className={cn("text-sm font-medium", style.amount)}>
          {currency(milestone.payment_amount)}
        </span>
      </div>

      <div className="mt-5">
        <AnimatedMilestoneProgress value={milestone.completion_score} colorClass={style.bar} />
      </div>

      <div className="mt-5 flex flex-wrap gap-2">
        {milestone.checklist.map((item) => (
          <span
            key={item.item}
            className={cn(
              "inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-medium",
              item.is_completed
                ? "bg-green-500/10 text-green-700 dark:text-green-300"
                : "bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300",
            )}
          >
            {item.is_completed ? <Check className="h-3 w-3" /> : null}
            {item.item}
          </span>
        ))}
      </div>

      {milestone.feedback ? (
        <div className="mt-5">
          <motion.button
            type="button"
            onClick={() => setFeedbackOpen((current) => !current)}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="text-sm font-medium text-foreground transition hover:text-green-600 dark:hover:text-green-400"
          >
            AI Feedback
          </motion.button>
          <AnimatePresence initial={false}>
            {feedbackOpen ? (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="overflow-hidden"
              >
                <div className="mt-3 rounded-xl bg-zinc-100 p-4 text-sm leading-6 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300">
                  {milestone.feedback}
                </div>
              </motion.div>
            ) : null}
          </AnimatePresence>
        </div>
      ) : null}
    </div>
  );
}

export default function EmployerProjectDashboardPage() {
  const params = useParams<{ projectId: string }>();
  const projectId = Array.isArray(params?.projectId) ? params.projectId[0] : params?.projectId;
  const { toast } = useToast();
  const {
    data: project,
    loading: isLoading,
    error: projectError,
    execute: executeProject,
    setData: setProject,
  } = useAPI<Project>();
  const [escrow, setEscrow] = useState<EscrowSummary | null>(null);
  const [pfi, setPfi] = useState<PfiCardData | null>(null);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [chatInput, setChatInput] = useState("");
  const [isAsking, setIsAsking] = useState(false);

  const loadProject = useCallback(async () => {
    if (!projectId) {
      return null;
    }

    const response = await executeProject(() => getProject(projectId));

    if (response) {
      setProject(response);
      window.localStorage.setItem(`project:${response.id}`, JSON.stringify(response));
      return response;
    }

    const fallback = getStoredProject(projectId) ?? buildFallbackProject(projectId);
    setProject(fallback);
    toast.info(
      "Loaded local project snapshot",
      "Live project data was unavailable, so a saved preview was used.",
    );
    return fallback;
  }, [executeProject, projectId, setProject, toast]);

  useEffect(() => {
    if (!projectId) {
      return;
    }

    void loadProject();
    const intervalId = window.setInterval(() => {
      void loadProject();
    }, 30000);

    return () => {
      window.clearInterval(intervalId);
    };
  }, [projectId, loadProject]);

  useEffect(() => {
    if (!project) {
      return;
    }

    let cancelled = false;

    const loadSidebarData = async () => {
      const derivedEscrow = deriveEscrowFromProject(project);
      const derivedPfi = derivePfiFromProject(project);

      setEscrow(derivedEscrow);
      setPfi(derivedPfi);

      try {
        const [escrowResponse, pfiResponse] = await Promise.all([
          getEscrow(project.vault_id).catch(() => null),
          project.freelancer_id ? getFreelancerPFI(project.freelancer_id).catch(() => null) : null,
        ]);

        if (cancelled) {
          return;
        }

        if (escrowResponse && typeof escrowResponse === "object") {
          const maybeTransactions =
            "transactions" in escrowResponse && Array.isArray(escrowResponse.transactions)
              ? (escrowResponse.transactions as EscrowTransaction[])
              : derivedEscrow.transactions;

          setEscrow({
            lockedAmount:
              "locked_amount" in escrowResponse &&
              typeof escrowResponse.locked_amount === "number"
                ? escrowResponse.locked_amount
                : derivedEscrow.lockedAmount,
            releasedAmount:
              "released_amount" in escrowResponse &&
              typeof escrowResponse.released_amount === "number"
                ? escrowResponse.released_amount
                : derivedEscrow.releasedAmount,
            transactions: maybeTransactions.slice(0, 3),
          });
        }

        setPfi(normalizePfi(project, pfiResponse));
      } catch {
        if (!cancelled) {
          setEscrow(derivedEscrow);
          setPfi(derivedPfi);
        }
      }
    };

    void loadSidebarData();
    setChatMessages((current) =>
      current.length
        ? current
        : [
            {
              id: `assistant_${project.id}`,
              role: "assistant",
              content: `Project is ${project.status.toLowerCase()} with ${project.milestones.length} milestone(s). Current focus: ${project.milestones.find((milestone) => milestone.status !== "FULLY_COMPLETED")?.title ?? "final approval"}.`,
            },
          ],
    );

    return () => {
      cancelled = true;
    };
  }, [project]);

  const projectDays = useMemo(() => {
    if (!project) {
      return { currentDay: 0, totalDays: 0 };
    }

    const totalDays = project.milestones.reduce(
      (sum, milestone) => sum + milestone.deadline_days,
      0,
    );
    const elapsed = Math.max(
      1,
      Math.ceil(
        (Date.now() - new Date(project.created_at).getTime()) / (1000 * 60 * 60 * 24),
      ),
    );

    return {
      currentDay: Math.min(elapsed, totalDays || elapsed),
      totalDays,
    };
  }, [project]);

  const releasedAmount =
    escrow?.releasedAmount ??
    project?.milestones
      .filter((milestone) => milestone.status === "FULLY_COMPLETED")
      .reduce((sum, milestone) => sum + milestone.payment_amount, 0) ??
    0;

  const lockedAmount =
    escrow?.lockedAmount ??
    Math.max((project?.total_budget ?? 0) - releasedAmount, 0);

  const lastAssistantMessage =
    [...chatMessages].reverse().find((message) => message.role === "assistant")?.content ??
    "Ask the AI project manager for a delivery update.";

  const handleAskAi = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!chatInput.trim() || !project) {
      return;
    }

    const userMessage: ChatMessage = {
      id: `user_${Date.now()}`,
      role: "user",
      content: chatInput.trim(),
    };

    const nextMessages = [...chatMessages, userMessage].slice(-5);
    setChatMessages(nextMessages);
    setChatInput("");
    setIsAsking(true);

    try {
      const response = await fetch("/api/employer/project-chat", {
        method: "POST",
        headers: {
          "content-type": "application/json",
        },
        body: JSON.stringify({
          project,
          messages: nextMessages.map((message) => ({
            role: message.role,
            content: message.content,
          })),
        }),
      });

      const data = (await response.json()) as { message?: string };

      if (!response.ok || !data.message) {
        throw new Error(data.message || "Unable to reach AI project manager.");
      }

      const assistantMessage: ChatMessage = {
        id: `assistant_${Date.now()}`,
        role: "assistant",
        content: data.message,
      };

      setChatMessages((current) => [...current, assistantMessage].slice(-5));
    } catch (error) {
      toast.error(
        "AI project manager unavailable",
        error instanceof Error
          ? error.message
          : "Please try your question again shortly.",
      );
    } finally {
      setIsAsking(false);
    }
  };

  if (!projectId) {
    return null;
  }

  if (isLoading && !project) {
    return (
      <main className="min-h-[calc(100svh-3.5rem)] px-4 py-10 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl animate-pulse space-y-6">
          <div className="h-24 rounded-3xl bg-zinc-100 dark:bg-zinc-900" />
          <div className="grid gap-4 md:grid-cols-4">
            {Array.from({ length: 4 }).map((_, index) => (
              <div key={index} className="h-28 rounded-xl bg-zinc-100 dark:bg-zinc-900" />
            ))}
          </div>
          <div className="grid gap-6 lg:grid-cols-[1.45fr_0.95fr]">
            <div className="h-[42rem] rounded-3xl bg-zinc-100 dark:bg-zinc-900" />
            <div className="h-[42rem] rounded-3xl bg-zinc-100 dark:bg-zinc-900" />
          </div>
        </div>
      </main>
    );
  }

  if (projectError && !project) {
    return (
      <main className="min-h-[calc(100svh-3.5rem)] px-4 py-10 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-2xl">
          <div className="rounded-[2rem] border border-border/60 bg-white/85 p-8 text-center shadow-xl shadow-slate-900/5 backdrop-blur dark:bg-zinc-900/70">
            <p className="text-sm font-medium uppercase tracking-[0.24em] text-red-500">
              Unable to load project
            </p>
            <p className="mt-4 text-sm text-muted-foreground">
              We couldn&apos;t reach the project service. Please try again.
            </p>
            <motion.button
              type="button"
              onClick={() => void loadProject()}
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

  if (!project) {
    return null;
  }

  const pfiData = pfi ?? derivePfiFromProject(project);
  const gaugeRadius = 54;
  const gaugeCircumference = 2 * Math.PI * gaugeRadius;
  const gaugeOffset =
    gaugeCircumference - (Math.min(pfiData.score, 900) / 900) * gaugeCircumference;
  const vaultFillPercent =
    project.total_budget > 0
      ? Math.min((lockedAmount / project.total_budget) * 100, 100)
      : 0;

  return (
    <main className="min-h-[calc(100svh-3.5rem)] px-4 py-10 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl space-y-8">
        {projectError ? (
          <div className="flex flex-col items-start justify-between gap-4 rounded-2xl border border-amber-500/30 bg-amber-500/10 p-4 text-sm text-amber-900 dark:text-amber-200 md:flex-row md:items-center">
            <span>
              Live project data couldn&apos;t be refreshed. Showing the latest local snapshot.
            </span>
            <motion.button
              type="button"
              onClick={() => void loadProject()}
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
          className="flex flex-col gap-6 rounded-[2rem] border border-border/60 bg-white/80 p-8 shadow-xl shadow-slate-900/5 backdrop-blur dark:bg-zinc-900/70 lg:flex-row lg:items-end lg:justify-between"
        >
          <div>
            <p className="text-sm font-medium uppercase tracking-[0.24em] text-green-600 dark:text-green-400">
              Employer dashboard
            </p>
            <h1 className="mt-3 text-4xl font-medium tracking-tight text-foreground">
              {project.title}
            </h1>
            <p className="mt-3 max-w-3xl text-base leading-7 text-muted-foreground">
              {project.project_summary}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <span
              className={cn(
                "rounded-full border px-3 py-1.5 text-sm font-medium",
                getProjectStatusTone(project.status),
              )}
            >
              {project.status}
            </span>
            <span className="rounded-full border border-border/60 px-3 py-1.5 text-sm text-muted-foreground">
              Day {projectDays.currentDay} of {projectDays.totalDays || 1}
            </span>
          </div>
        </motion.section>

        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {[
            { label: "Total Budget", value: currency(project.total_budget) },
            { label: "Released", value: currency(releasedAmount) },
            { label: "In Escrow", value: currency(lockedAmount) },
            { label: "Success Fee", value: currency(project.success_fee) },
          ].map((stat) => (
            <div
              key={stat.label}
              className="rounded-xl bg-zinc-50 p-4 dark:bg-zinc-900"
            >
              <p className="text-sm text-muted-foreground">{stat.label}</p>
              <p className="mt-3 text-2xl font-medium text-foreground">{stat.value}</p>
            </div>
          ))}
        </section>

        <section className="grid gap-6 lg:grid-cols-[1.45fr_0.95fr]">
          <div className="space-y-6">
            <motion.div
              whileHover={{ y: -2, transition: { duration: 0.2 } }}
              className="rounded-[2rem] border border-border/60 bg-white/80 p-8 shadow-xl shadow-slate-900/5 backdrop-blur dark:bg-zinc-900/70"
            >
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                  <h2 className="text-2xl font-medium text-foreground">
                    Milestone Roadmap
                  </h2>
                  <p className="mt-2 text-sm text-muted-foreground">
                    AI-generated · {project.milestones.length} milestones
                  </p>
                </div>
                <div className="inline-flex items-center gap-2 rounded-full border border-green-500/20 bg-green-500/10 px-3 py-1.5 text-xs font-medium text-green-700 dark:text-green-300">
                  <ShieldCheck className="h-3.5 w-3.5" />
                  Escrow monitored
                </div>
              </div>

              <div className="mt-8 space-y-4">
                {project.milestones.map((milestone) => (
                  <MilestoneCard key={milestone.id} milestone={milestone} />
                ))}
              </div>
            </motion.div>
          </div>

          <aside className="space-y-6">
            <motion.div
              whileHover={{ y: -2, transition: { duration: 0.2 } }}
              className="rounded-[2rem] border border-border/60 bg-white/80 p-6 shadow-xl shadow-slate-900/5 backdrop-blur dark:bg-zinc-900/70"
            >
              <h3 className="text-lg font-medium text-foreground">Escrow Vault</h3>

              <div className="mt-6 flex items-center gap-6">
                <div className="relative h-48 w-14 overflow-hidden rounded-full border border-border/60 bg-zinc-100 dark:bg-zinc-900">
                  <motion.div
                    initial={{ height: 0 }}
                    animate={{ height: `${vaultFillPercent}%` }}
                    transition={{ duration: 0.8, ease: "easeOut" }}
                    className="absolute bottom-0 left-0 w-full rounded-full bg-gradient-to-t from-green-600 via-green-500 to-emerald-300"
                  />
                </div>
                <div>
                  <p className="text-3xl font-medium text-foreground">
                    {currency(lockedAmount)}
                  </p>
                  <p className="mt-2 text-sm text-muted-foreground">
                    secured in vault
                  </p>
                  <p className="mt-4 text-sm text-muted-foreground">
                    Released so far: {currency(releasedAmount)}
                  </p>
                </div>
              </div>

              <div className="mt-8">
                <p className="text-sm font-medium text-foreground">Transaction log</p>
                <div className="mt-4 space-y-3">
                  {(escrow?.transactions ?? deriveEscrowFromProject(project).transactions)
                    .slice(0, 3)
                    .map((transaction) => (
                      <div
                        key={transaction.id}
                        className="flex items-center justify-between rounded-xl bg-zinc-50 px-4 py-3 dark:bg-zinc-900"
                      >
                        <div className="flex items-center gap-3">
                          <span
                            className={cn(
                              "inline-flex items-center gap-1 rounded-full px-2 py-1 text-[11px] font-medium",
                              transaction.type === "IN"
                                ? "bg-green-500/10 text-green-700 dark:text-green-300"
                                : transaction.type === "OUT"
                                  ? "bg-zinc-200 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300"
                                  : "bg-red-500/10 text-red-700 dark:text-red-300",
                            )}
                          >
                            {transaction.type === "IN" ? (
                              <ArrowDownLeft className="h-3 w-3" />
                            ) : transaction.type === "OUT" ? (
                              <ArrowUpRight className="h-3 w-3" />
                            ) : (
                              <AlertTriangle className="h-3 w-3" />
                            )}
                            {transaction.type}
                          </span>
                          <span className="text-sm text-muted-foreground">
                            {transaction.description}
                          </span>
                        </div>
                        <span className="text-sm font-medium text-foreground">
                          {currency(transaction.amount)}
                        </span>
                      </div>
                    ))}
                </div>
              </div>
            </motion.div>

            <motion.div
              whileHover={{ y: -2, transition: { duration: 0.2 } }}
              className="rounded-[2rem] border border-border/60 bg-white/80 p-6 shadow-xl shadow-slate-900/5 backdrop-blur dark:bg-zinc-900/70"
            >
              <h3 className="text-lg font-medium text-foreground">Freelancer PFI Score</h3>

              <div className="mt-6 flex items-center gap-6">
                <div className="relative flex h-32 w-32 items-center justify-center">
                  <svg className="h-full w-full -rotate-90" viewBox="0 0 140 140">
                    <circle
                      cx="70"
                      cy="70"
                      r={gaugeRadius}
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="10"
                      className="text-foreground/10"
                    />
                    <motion.circle
                      cx="70"
                      cy="70"
                      r={gaugeRadius}
                      fill="none"
                      stroke="url(#pfi-dash-gradient)"
                      strokeWidth="10"
                      strokeLinecap="round"
                      strokeDasharray={gaugeCircumference}
                      initial={{ strokeDashoffset: gaugeCircumference }}
                      animate={{ strokeDashoffset: gaugeOffset }}
                      transition={{ duration: 1, ease: "easeOut" }}
                    />
                    <defs>
                      <linearGradient id="pfi-dash-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="#34d399" />
                        <stop offset="100%" stopColor="#22c55e" />
                      </linearGradient>
                    </defs>
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="text-3xl font-medium text-foreground">
                      {pfiData.score}
                    </span>
                    <span className="text-xs uppercase tracking-[0.24em] text-muted-foreground">
                      / 900
                    </span>
                  </div>
                </div>

                <div>
                  <span
                    className={cn(
                      "inline-flex rounded-full px-3 py-1 text-xs font-medium",
                      pfiData.tier === "ELITE"
                        ? "bg-green-500/10 text-green-700 dark:text-green-300"
                        : pfiData.tier === "EXCELLENT"
                          ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300"
                          : "bg-amber-500/10 text-amber-700 dark:text-amber-300",
                    )}
                  >
                    {pfiData.tier}
                  </span>
                  <p className="mt-4 text-sm font-medium text-green-600 dark:text-green-400">
                    +{pfiData.delta} this project
                  </p>
                </div>
              </div>

              <div className="mt-6 space-y-4">
                {Object.entries(pfiData.metrics).map(([label, value], index) => (
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
            </motion.div>

            <motion.div
              whileHover={{ y: -2, transition: { duration: 0.2 } }}
              className="rounded-[2rem] border border-border/60 bg-white/80 p-6 shadow-xl shadow-slate-900/5 backdrop-blur dark:bg-zinc-900/70"
            >
              <div className="flex items-center gap-3">
                <MessageSquareText className="h-5 w-5 text-green-600 dark:text-green-400" />
                <h3 className="text-lg font-medium text-foreground">
                  AI Project Manager Chat
                </h3>
              </div>

              <div className="mt-5 rounded-2xl bg-zinc-100 p-4 text-sm leading-6 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300">
                {lastAssistantMessage}
              </div>

              <div className="mt-4 space-y-3">
                {chatMessages.map((message) => (
                  <div
                    key={message.id}
                    className={cn(
                      "rounded-2xl px-4 py-3 text-sm leading-6",
                      message.role === "assistant"
                        ? "bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300"
                        : "bg-green-500/10 text-green-800 dark:text-green-200",
                    )}
                  >
                    {message.content}
                  </div>
                ))}
              </div>

              <form className="mt-4 flex gap-3" onSubmit={handleAskAi}>
                <input
                  type="text"
                  value={chatInput}
                  onChange={(event) => setChatInput(event.target.value)}
                  placeholder="Ask about risk, payout timing, or milestone status"
                  className="h-11 w-full rounded-xl border border-border/50 bg-background px-4 text-sm outline-none transition focus:border-green-500/60"
                />
                <motion.button
                  type="submit"
                  disabled={isAsking}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-green-600 px-4 text-sm font-medium text-white transition hover:bg-green-700 disabled:cursor-wait"
                >
                  <Send className="h-4 w-4" />
                  {isAsking ? "Thinking" : "Ask"}
                </motion.button>
              </form>
            </motion.div>
          </aside>
        </section>
      </div>
    </main>
  );
}
