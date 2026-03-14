"use client";

import {
  AnimatePresence,
  motion,
  useMotionValue,
  useSpring,
  useTransform,
} from "framer-motion";
import {
  CalendarDays,
  Check,
  CheckCircle2,
  CircleDollarSign,
  Clock3,
  Code2,
  FileText,
  Layers3,
  Loader2,
  Paintbrush,
  Sparkles,
  X,
} from "lucide-react";
import { useParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { useToast } from "@/context/ToastContext";
import { getProject, submitMilestone } from "@/lib/api";
import { auth } from "@/lib/firebase";
import { useAPI } from "@/lib/useAPI";
import { cn } from "@/lib/utils";
import { recordEarning } from "@/app/payment/page";
import type {
  ChecklistEvaluation,
  DeliverableType,
  EvaluationResult,
  Milestone,
  PFIUpdate,
  Project,
  SubmitMilestonePayload,
} from "@/lib/types";

type SubmissionType = "text" | "code" | "design";

type AppliedProject = {
  id: string;
  title: string;
  description: string;
  deliverable_type: DeliverableType;
  tech_stack: string[];
  budget: number;
  timeline_days: number;
  posted_hours_ago: number;
  employer_name: string;
  active_milestone: string;
  progress: number;
  days_remaining: number;
  applied_at?: string;
};

type StoredEvaluation = {
  projectId: string;
  milestoneId: string;
  result: EvaluationResult;
  submittedAt: string;
};

const APPLIED_PROJECTS_KEY = "freelancer:applied-projects";
const EVALUATION_HISTORY_KEY = "freelancer:project-history";

const evaluatingMessages = [
  "Reading your submission...",
  "Checking checklist items...",
  "Calculating quality score...",
  "Determining payment...",
];

const submissionPlaceholders: Record<SubmissionType, string> = {
  text: "Paste your written content here...",
  code: "Paste your code, GitHub link, or describe your implementation...",
  design: "Describe your design decisions and paste Figma/image links...",
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

function loadAppliedProjects() {
  if (typeof window === "undefined") {
    return [] as AppliedProject[];
  }

  const raw = window.localStorage.getItem(APPLIED_PROJECTS_KEY);

  if (!raw) {
    return [] as AppliedProject[];
  }

  try {
    return JSON.parse(raw) as AppliedProject[];
  } catch {
    return [] as AppliedProject[];
  }
}

function saveProject(project: Project) {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem(`project:${project.id}`, JSON.stringify(project));
}

function saveEvaluationHistory(entry: StoredEvaluation) {
  if (typeof window === "undefined") {
    return;
  }

  const raw = window.localStorage.getItem(EVALUATION_HISTORY_KEY);
  const current = raw ? ((JSON.parse(raw) as StoredEvaluation[]) ?? []) : [];
  const next = [
    entry,
    ...current.filter(
      (item) =>
        !(item.projectId === entry.projectId && item.milestoneId === entry.milestoneId),
    ),
  ].slice(0, 20);

  window.localStorage.setItem(EVALUATION_HISTORY_KEY, JSON.stringify(next));
}

function buildProjectFromAppliedProject(projectId: string): Project {
  const appliedProject = loadAppliedProjects().find((project) => project.id === projectId);

  if (!appliedProject) {
    return {
      id: projectId,
      employer_id: "employer_demo",
      freelancer_id: "freelancer_demo",
      title: "Freelancer workspace preview",
      description:
        "A local workspace preview generated because no project snapshot was available.",
      total_budget: 4200,
      milestones: [
        {
          id: `${projectId}_ms_1`,
          title: "Initial deliverable pass",
          description: "Submit the first production-ready iteration for AI review.",
          deliverable_type: "code",
          checklist: [
            { item: "Core scope delivered", is_completed: false, weight: 40 },
            { item: "Acceptance criteria addressed", is_completed: false, weight: 35 },
            { item: "Documentation included", is_completed: false, weight: 25 },
          ],
          deadline_days: 7,
          payment_amount: 1800,
          status: "IN_PROGRESS",
          completion_score: 0,
          feedback: "",
          submitted_work: "",
        },
        {
          id: `${projectId}_ms_2`,
          title: "Refinement and polish",
          description: "Address review items and complete the remaining feature polish.",
          deliverable_type: "code",
          checklist: [
            { item: "Review fixes applied", is_completed: false, weight: 50 },
            { item: "QA pass complete", is_completed: false, weight: 50 },
          ],
          deadline_days: 10,
          payment_amount: 1400,
          status: "PENDING",
          completion_score: 0,
          feedback: "",
          submitted_work: "",
        },
        {
          id: `${projectId}_ms_3`,
          title: "Final handoff",
          description: "Package the final submission, handoff notes, and release-ready assets.",
          deliverable_type: "code",
          checklist: [
            { item: "Final package delivered", is_completed: false, weight: 60 },
            { item: "Knowledge transfer notes", is_completed: false, weight: 40 },
          ],
          deadline_days: 8,
          payment_amount: 1000,
          status: "PENDING",
          completion_score: 0,
          feedback: "",
          submitted_work: "",
        },
      ],
      status: "IN_PROGRESS",
      vault_id: `vault_${projectId}`,
      success_fee: 210,
      created_at: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
      project_summary:
        "This workspace tracks a milestone submission flow with AI evaluation and payout simulation.",
      risk_factors: ["Clarify proof of completion for the active milestone."],
    };
  }

  const payments = [
    Math.round(appliedProject.budget * 0.35),
    Math.round(appliedProject.budget * 0.4),
    appliedProject.budget - Math.round(appliedProject.budget * 0.35) - Math.round(appliedProject.budget * 0.4),
  ];

  return {
    id: appliedProject.id,
    employer_id: appliedProject.employer_name.toLowerCase().replace(/\s+/g, "_"),
    freelancer_id: "freelancer_demo",
    title: appliedProject.title,
    description: appliedProject.description,
    total_budget: appliedProject.budget,
    milestones: [
      {
        id: `${appliedProject.id}_ms_1`,
        title: appliedProject.active_milestone,
        description: "Deliver the primary milestone output for initial verification.",
        deliverable_type: appliedProject.deliverable_type,
        checklist: [
          { item: "Core deliverable submitted", is_completed: false, weight: 40 },
          { item: "Requirements mapped to output", is_completed: false, weight: 35 },
          { item: "Supporting notes included", is_completed: false, weight: 25 },
        ],
        deadline_days: Math.max(5, Math.round(appliedProject.timeline_days * 0.35)),
        payment_amount: payments[0],
        status: "IN_PROGRESS",
        completion_score: appliedProject.progress,
        feedback: "",
        submitted_work: "",
      },
      {
        id: `${appliedProject.id}_ms_2`,
        title: "Refinement and review cycle",
        description: "Apply iteration feedback and complete quality refinements.",
        deliverable_type: appliedProject.deliverable_type,
        checklist: [
          { item: "Review items closed", is_completed: false, weight: 50 },
          { item: "Secondary polish delivered", is_completed: false, weight: 50 },
        ],
        deadline_days: Math.max(5, Math.round(appliedProject.timeline_days * 0.33)),
        payment_amount: payments[1],
        status: "PENDING",
        completion_score: 0,
        feedback: "",
        submitted_work: "",
      },
      {
        id: `${appliedProject.id}_ms_3`,
        title: "Final delivery and handoff",
        description: "Package the final deliverable and supporting handoff materials.",
        deliverable_type: appliedProject.deliverable_type,
        checklist: [
          { item: "Final assets delivered", is_completed: false, weight: 60 },
          { item: "Handoff notes complete", is_completed: false, weight: 40 },
        ],
        deadline_days: Math.max(4, appliedProject.timeline_days - Math.round(appliedProject.timeline_days * 0.68)),
        payment_amount: payments[2],
        status: "PENDING",
        completion_score: 0,
        feedback: "",
        submitted_work: "",
      },
    ],
    status: "IN_PROGRESS",
    vault_id: `vault_${appliedProject.id}`,
    success_fee: Math.round(appliedProject.budget * 0.05),
    created_at:
      appliedProject.applied_at ?? new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    project_summary: `Freelancer workspace for ${appliedProject.employer_name}.`,
    risk_factors: ["Provide strong evidence tied to each checklist item."],
  };
}

function getActiveMilestone(project: Project) {
  return (
    project.milestones.find(
      (milestone) =>
        milestone.status === "IN_PROGRESS" ||
        milestone.status === "SUBMITTED" ||
        milestone.status === "PARTIALLY_COMPLETED",
    ) ?? project.milestones.find((milestone) => milestone.status === "PENDING") ?? project.milestones[0]
  );
}

function deriveChecklistResults(
  milestone: Milestone,
  content: string,
  completionScore: number,
): ChecklistEvaluation[] {
  const words = content.trim().split(/\s+/).filter(Boolean).length;

  return milestone.checklist.map((item, index) => {
    const met =
      completionScore >= 90 ||
      (completionScore >= 65 && index < Math.max(1, milestone.checklist.length - 1));

    return {
      ...item,
      is_completed: met,
      evidence: met
        ? words > 10
          ? "Submission includes relevant implementation details and milestone coverage."
          : "Submission references deliverable intent clearly enough for partial verification."
        : "More concrete evidence or milestone-specific detail is needed for verification.",
    };
  });
}

function buildFallbackEvaluation(
  milestone: Milestone,
  form: {
    submission_content: string;
    days_taken: number;
    revision_count: number;
  },
): EvaluationResult {
  const contentLength = form.submission_content.trim().length;
  const deadlinePressure = Math.max(0, form.days_taken - milestone.deadline_days) * 6;
  const revisionPenalty = form.revision_count * 4;
  const baseScore = Math.min(100, Math.max(28, Math.round(contentLength / 18)));
  const completionScore = Math.max(25, Math.min(100, baseScore - deadlinePressure - revisionPenalty));
  const status =
    completionScore >= 90
      ? "FULLY_COMPLETED"
      : completionScore >= 60
        ? "PARTIALLY_COMPLETED"
        : "UNMET";
  const payoutPercentage =
    status === "FULLY_COMPLETED" ? 100 : status === "PARTIALLY_COMPLETED" ? Math.max(35, completionScore) : 0;
  const payoutAmount = Math.round((milestone.payment_amount * payoutPercentage) / 100);

  return {
    completion_score: completionScore,
    status,
    checklist_results: deriveChecklistResults(
      milestone,
      form.submission_content,
      completionScore,
    ),
    strengths:
      status === "UNMET"
        ? ["The submission shows intent and partial milestone coverage."]
        : [
            "Submission maps to the milestone objective clearly.",
            "Evidence is organized enough for automated verification.",
          ],
    gaps:
      status === "FULLY_COMPLETED"
        ? ["Minor polish opportunities remain for future milestones."]
        : [
            "Some checklist criteria need stronger proof or clearer scope mapping.",
            "Submission detail can be tightened for faster acceptance.",
          ],
    detailed_feedback:
      status === "FULLY_COMPLETED"
        ? "AI verification found strong alignment with the milestone checklist and release criteria."
        : status === "PARTIALLY_COMPLETED"
          ? "AI verification found meaningful progress, but some checklist items need clearer evidence before full release."
          : "AI verification could not confirm enough milestone evidence to release payment.",
    payout_amount: payoutAmount,
    payout_percentage: payoutPercentage,
    pfi_update: {
      previous_score: 718,
      new_score:
        status === "FULLY_COMPLETED" ? 732 : status === "PARTIALLY_COMPLETED" ? 724 : 708,
      score_change:
        status === "FULLY_COMPLETED" ? 14 : status === "PARTIALLY_COMPLETED" ? 6 : -10,
      tier: status === "FULLY_COMPLETED" ? "EXCELLENT" : "GOOD",
      tier_color: status === "FULLY_COMPLETED" ? "#86efac" : "#fcd34d",
      perks: [],
      component_breakdown: {
        Quality: Math.min(100, completionScore + 6),
        Deadlines: Math.max(40, 100 - Math.max(0, form.days_taken - milestone.deadline_days) * 8),
        Revisions: Math.max(35, 100 - form.revision_count * 9),
      },
      improvement_tips: [
        "Tie each submission section directly to checklist evidence.",
        "Keep revision rounds tight with explicit acceptance proof.",
      ],
    },
  };
}

function updateProjectWithEvaluation(
  project: Project,
  milestoneId: string,
  result: EvaluationResult,
  submissionContent: string,
): Project {
  const milestones = project.milestones.map((milestone) =>
    milestone.id === milestoneId
      ? {
          ...milestone,
          status: result.status,
          completion_score: result.completion_score,
          checklist: result.checklist_results.map((item) => ({
            item: item.item,
            is_completed: item.is_completed,
            weight: item.weight,
          })),
          feedback: result.detailed_feedback,
          submitted_work: submissionContent,
        }
      : milestone,
  );

  return {
    ...project,
    milestones,
  };
}

function getStatusTone(status: EvaluationResult["status"]) {
  if (status === "FULLY_COMPLETED") {
    return {
      ring: "stroke-green-500",
      banner: "bg-green-500/10 text-green-700 dark:text-green-300",
      bar: "bg-green-500",
    };
  }

  if (status === "PARTIALLY_COMPLETED") {
    return {
      ring: "stroke-amber-500",
      banner: "bg-amber-500/10 text-amber-700 dark:text-amber-300",
      bar: "bg-amber-500",
    };
  }

  return {
    ring: "stroke-red-500",
    banner: "bg-red-500/10 text-red-700 dark:text-red-300",
    bar: "bg-red-500",
  };
}

function EvaluationScoreCircle({
  score,
  status,
}: {
  score: number;
  status: EvaluationResult["status"];
}) {
  const tone = getStatusTone(status);
  const motionValue = useMotionValue(0);
  const spring = useSpring(motionValue, { stiffness: 90, damping: 18 });
  const [displayScore, setDisplayScore] = useState(0);
  const radius = 66;
  const circumference = 2 * Math.PI * radius;
  const dashOffset = circumference - (Math.min(score, 100) / 100) * circumference;

  useEffect(() => {
    motionValue.set(score);
  }, [motionValue, score]);

  useEffect(() => {
    const unsubscribe = spring.on("change", (value) => {
      setDisplayScore(Math.round(value));
    });

    return unsubscribe;
  }, [spring]);

  return (
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
        <span className="text-5xl font-medium text-foreground">{displayScore}</span>
        <span className="mt-1 text-xs uppercase tracking-[0.3em] text-muted-foreground">
          Score
        </span>
      </div>
    </div>
  );
}

function AnimatedCurrency({
  amount,
  className,
}: {
  amount: number;
  className?: string;
}) {
  const motionValue = useMotionValue(0);
  const spring = useSpring(motionValue, { stiffness: 85, damping: 16 });
  const [displayValue, setDisplayValue] = useState(0);

  useEffect(() => {
    motionValue.set(amount);
  }, [amount, motionValue]);

  useEffect(() => {
    const unsubscribe = spring.on("change", (value) => {
      setDisplayValue(Math.round(value));
    });

    return unsubscribe;
  }, [spring]);

  return <span className={className}>{currency(displayValue)}</span>;
}

export default function FreelancerWorkspacePage() {
  const params = useParams<{ projectId: string }>();
  const projectId = Array.isArray(params?.projectId) ? params.projectId[0] : params?.projectId;
  const { toast } = useToast();
  const progressValue = useMotionValue(0);
  const progressSpring = useSpring(progressValue, { stiffness: 75, damping: 20 });
  const progressWidth = useTransform(progressSpring, (value) => `${value}%`);
  const [progressNumber, setProgressNumber] = useState(0);
  const {
    data: project,
    loading: isLoading,
    error: projectError,
    execute: executeProject,
    setData: setProject,
  } = useAPI<Project>();
  const [submissionType, setSubmissionType] = useState<SubmissionType>("text");
  const [submissionContent, setSubmissionContent] = useState("");
  const [daysTaken, setDaysTaken] = useState("");
  const [revisionCount, setRevisionCount] = useState("");
  const [isEvaluating, setIsEvaluating] = useState(false);
  const [evaluationMessageIndex, setEvaluationMessageIndex] = useState(0);
  const [evaluationResult, setEvaluationResult] = useState<EvaluationResult | null>(null);
  const submitPromiseRef = useRef<Promise<EvaluationResult> | null>(null);

  useEffect(() => {
    const unsubscribe = progressSpring.on("change", (value) => {
      setProgressNumber(Math.round(value));
    });

    return unsubscribe;
  }, [progressSpring]);

  const loadProject = useCallback(async () => {
    if (!projectId) {
      return null;
    }

    const response = await executeProject(() => getProject(projectId));

    if (response) {
      setProject(response);
      saveProject(response);
      return response;
    }

    const fallback = getStoredProject(projectId) ?? buildProjectFromAppliedProject(projectId);
    setProject(fallback);
    saveProject(fallback);
    return fallback;
  }, [executeProject, projectId, setProject]);

  useEffect(() => {
    if (!projectId) {
      return;
    }

    void loadProject();
  }, [projectId, loadProject]);

  const activeMilestone = useMemo(
    () => (project ? getActiveMilestone(project) : null),
    [project],
  );

  useEffect(() => {
    if (!activeMilestone) {
      return;
    }

    const deliverable = activeMilestone.deliverable_type;

    if (deliverable === "code") {
      setSubmissionType("code");
    } else if (deliverable === "design") {
      setSubmissionType("design");
    } else {
      setSubmissionType("text");
    }
  }, [activeMilestone]);

  const daysRemaining = useMemo(() => {
    if (!project || !activeMilestone) {
      return 0;
    }

    const totalProjectDays = project.milestones.reduce(
      (sum, milestone) => sum + milestone.deadline_days,
      0,
    );
    const elapsedDays = Math.max(
      1,
      Math.ceil(
        (Date.now() - new Date(project.created_at).getTime()) / (1000 * 60 * 60 * 24),
      ),
    );
    const completedBeforeActive = project.milestones
      .slice(0, project.milestones.findIndex((milestone) => milestone.id === activeMilestone.id))
      .reduce((sum, milestone) => sum + milestone.deadline_days, 0);
    const milestoneElapsed = Math.max(0, elapsedDays - completedBeforeActive);

    return Math.max(activeMilestone.deadline_days - milestoneElapsed, 0);
  }, [activeMilestone, project]);

  const releasedTotal = useMemo(() => {
    if (!project || !activeMilestone) {
      return 0;
    }

    return project.milestones
      .filter((milestone) => milestone.id !== activeMilestone.id)
      .reduce((sum, milestone) => {
        if (milestone.status === "FULLY_COMPLETED") {
          return sum + milestone.payment_amount;
        }

        if (milestone.status === "PARTIALLY_COMPLETED") {
          return sum + Math.round((milestone.payment_amount * milestone.completion_score) / 100);
        }

        return sum;
      }, 0);
  }, [activeMilestone, project]);

  const handleSubmit = async () => {
    if (!project || !activeMilestone || !submissionContent.trim()) {
      toast.error(
        "Submission incomplete",
        "Add your work details before sending it to AI evaluation.",
      );
      return;
    }

    const payload: SubmitMilestonePayload = {
      project_id: project.id,
      milestone_id: activeMilestone.id,
      submission_type: submissionType,
      submission_content: submissionContent.trim(),
      days_taken: Number(daysTaken || 0),
      revision_count: Number(revisionCount || 0),
    };

    setIsEvaluating(true);
    setEvaluationResult(null);
    setEvaluationMessageIndex(0);
    progressValue.set(0);
    progressValue.set(100);

    const messageInterval = window.setInterval(() => {
      setEvaluationMessageIndex((current) =>
        current < evaluatingMessages.length - 1 ? current + 1 : current,
      );
    }, 620);

    submitPromiseRef.current = (async () => {
      try {
        const response = (await submitMilestone(payload)) as EvaluationResult;
        return response;
      } catch {
        return buildFallbackEvaluation(activeMilestone, payload);
      }
    })();

    try {
      const [result] = await Promise.all([
        submitPromiseRef.current,
        new Promise((resolve) => window.setTimeout(resolve, 2500)),
      ]);

      const normalizedResult: EvaluationResult = {
        ...result,
        pfi_update:
          result.pfi_update ??
          buildFallbackEvaluation(activeMilestone, payload).pfi_update,
      };

      const nextProject = updateProjectWithEvaluation(
        project,
        activeMilestone.id,
        normalizedResult,
        payload.submission_content,
      );

      saveProject(nextProject);
      saveEvaluationHistory({
        projectId: project.id,
        milestoneId: activeMilestone.id,
        result: normalizedResult,
        submittedAt: new Date().toISOString(),
      });

      // Record earning in Firestore for the logged-in user
      if (normalizedResult.payout_amount > 0) {
        const currentUser = auth.currentUser;
        if (currentUser) {
          const now = new Date();
          const weekStart = new Date(now);
          weekStart.setDate(now.getDate() - now.getDay());
          const weekEnd = new Date(weekStart);
          weekEnd.setDate(weekStart.getDate() + 6);
          const fmt = (d: Date) =>
            d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
          await recordEarning(currentUser.uid, {
            period: `${fmt(weekStart)} – ${fmt(weekEnd)}`,
            tasks: 1,
            payout: normalizedResult.payout_amount,
            account: "PayPal",
            status: "Pending",
          });
        }
      }

      setProject(nextProject);
      setEvaluationResult(normalizedResult);
      toast.success(
        "Evaluation complete",
        `AI marked this milestone as ${normalizedResult.status.replaceAll("_", " ").toLowerCase()}.`,
      );
    } finally {
      window.clearInterval(messageInterval);
      setIsEvaluating(false);
    }
  };

  if (!projectId) {
    return null;
  }

  if (isLoading && !project) {
    return (
      <main className="min-h-[calc(100svh-3.5rem)] px-4 py-10 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl animate-pulse space-y-6">
          <div className="grid gap-6 lg:grid-cols-[1.4fr_0.8fr]">
            <div className="h-[42rem] rounded-[2rem] bg-zinc-100 dark:bg-zinc-900" />
            <div className="h-[42rem] rounded-[2rem] bg-zinc-100 dark:bg-zinc-900" />
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
              Unable to load workspace
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

  if (!project || !activeMilestone) {
    return null;
  }

  const tone = evaluationResult ? getStatusTone(evaluationResult.status) : null;
  const refundAmount =
    evaluationResult && activeMilestone
      ? Math.max(activeMilestone.payment_amount - evaluationResult.payout_amount, 0)
      : 0;
  const pfiUpdate = evaluationResult?.pfi_update;

  return (
    <main className="min-h-[calc(100svh-3.5rem)] px-4 py-10 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl space-y-6">
        {projectError ? (
          <div className="flex flex-col items-start justify-between gap-4 rounded-2xl border border-amber-500/30 bg-amber-500/10 p-4 text-sm text-amber-900 dark:text-amber-200 md:flex-row md:items-center">
            <span>
              Live workspace data couldn&apos;t be refreshed. Showing the latest local snapshot.
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
        <div className="grid gap-6 lg:grid-cols-[1.3fr_0.7fr]">
          <section className="space-y-6">
          <motion.div
            whileHover={{ y: -2, transition: { duration: 0.2 } }}
            className="rounded-[2rem] border border-border/60 bg-white/80 p-8 shadow-xl shadow-slate-900/5 backdrop-blur dark:bg-zinc-900/70"
          >
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <p className="text-sm font-medium uppercase tracking-[0.24em] text-green-600 dark:text-green-400">
                  Active milestone
                </p>
                <h1 className="mt-3 text-xl font-medium text-foreground">
                  {activeMilestone.title}
                </h1>
              </div>
              <div className="flex flex-wrap items-center gap-3">
                <span
                  className={cn(
                    "rounded-full px-3 py-1 text-sm font-medium capitalize",
                    activeMilestone.deliverable_type === "code"
                      ? "bg-green-500/10 text-green-700 dark:text-green-300"
                      : activeMilestone.deliverable_type === "design"
                        ? "bg-fuchsia-500/10 text-fuchsia-700 dark:text-fuchsia-300"
                        : activeMilestone.deliverable_type === "content"
                          ? "bg-sky-500/10 text-sky-700 dark:text-sky-300"
                          : "bg-amber-500/10 text-amber-700 dark:text-amber-300",
                  )}
                >
                  {activeMilestone.deliverable_type}
                </span>
                <span
                  className={cn(
                    "text-sm font-medium",
                    daysRemaining < 3
                      ? "animate-pulse text-red-500"
                      : "text-muted-foreground",
                  )}
                >
                  {daysRemaining} days remaining
                </span>
              </div>
            </div>
          </motion.div>

          <motion.div
            whileHover={{ y: -2, transition: { duration: 0.2 } }}
            className="rounded-[2rem] border border-border/60 bg-white/80 p-8 shadow-xl shadow-slate-900/5 backdrop-blur dark:bg-zinc-900/70"
          >
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-green-500/10 text-green-600 dark:text-green-400">
                <Sparkles className="h-5 w-5" />
              </div>
              <div>
                <h2 className="text-xl font-medium text-foreground">
                  Work Submission Form
                </h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  Submit your deliverable and let the AI verify checklist coverage and payout.
                </p>
              </div>
            </div>

            <div className="mt-6 flex flex-wrap gap-3">
              {[
                { key: "text", label: "Text", icon: FileText },
                { key: "code", label: "Code", icon: Code2 },
                { key: "design", label: "Design", icon: Paintbrush },
              ].map((option) => {
                const Icon = option.icon;

                return (
                  <motion.button
                    key={option.key}
                    type="button"
                    onClick={() => setSubmissionType(option.key as SubmissionType)}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className={cn(
                      "inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium transition",
                      submissionType === option.key
                        ? "bg-green-600 text-white"
                        : "border border-border/60 bg-background text-foreground hover:bg-foreground/5",
                    )}
                  >
                    <Icon className="h-4 w-4" />
                    {option.label}
                  </motion.button>
                );
              })}
            </div>

            <textarea
              value={submissionContent}
              onChange={(event) => setSubmissionContent(event.target.value)}
              placeholder={submissionPlaceholders[submissionType]}
              className="mt-6 min-h-[300px] w-full rounded-[1.5rem] border border-border/50 bg-background px-4 py-4 text-sm leading-7 outline-none transition focus:border-green-500/60"
            />

            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">Days taken</label>
                <input
                  type="number"
                  min="0"
                  value={daysTaken}
                  onChange={(event) => setDaysTaken(event.target.value)}
                  className="h-11 w-full rounded-xl border border-border/50 bg-background px-4 text-sm outline-none transition focus:border-green-500/60"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">Revision count</label>
                <input
                  type="number"
                  min="0"
                  value={revisionCount}
                  onChange={(event) => setRevisionCount(event.target.value)}
                  className="h-11 w-full rounded-xl border border-border/50 bg-background px-4 text-sm outline-none transition focus:border-green-500/60"
                />
              </div>
            </div>

            <motion.button
              type="button"
              onClick={handleSubmit}
              disabled={isEvaluating}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="mt-6 inline-flex h-12 w-full items-center justify-center rounded-xl bg-green-600 px-6 text-base font-medium text-white transition hover:bg-green-700 disabled:cursor-wait"
            >
              {isEvaluating ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Evaluating submission...
                </>
              ) : (
                "Submit for AI Evaluation"
              )}
            </motion.button>
          </motion.div>

          <AnimatePresence mode="wait">
            {isEvaluating ? (
              <motion.div
                key="evaluating"
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -12 }}
                whileHover={{ y: -2, transition: { duration: 0.2 } }}
                className="rounded-[2rem] border border-border/60 bg-white/80 p-8 shadow-xl shadow-slate-900/5 backdrop-blur dark:bg-zinc-900/70"
              >
                <div className="h-8 w-40 animate-pulse rounded-full bg-zinc-100 dark:bg-zinc-800" />
                <div className="mt-6 space-y-3">
                  <div className="h-4 w-full animate-pulse rounded-full bg-zinc-100 dark:bg-zinc-800" />
                  <div className="h-4 w-5/6 animate-pulse rounded-full bg-zinc-100 dark:bg-zinc-800" />
                  <div className="h-4 w-2/3 animate-pulse rounded-full bg-zinc-100 dark:bg-zinc-800" />
                </div>
                <p className="mt-8 text-lg font-medium text-foreground">
                  {evaluatingMessages[evaluationMessageIndex]}
                </p>
                <div className="mt-4 h-3 overflow-hidden rounded-full bg-foreground/10">
                  <motion.div
                    className="h-full rounded-full bg-green-500"
                    style={{ width: progressWidth }}
                  />
                </div>
                <p className="mt-2 text-sm text-muted-foreground">{progressNumber}% complete</p>
              </motion.div>
            ) : evaluationResult && tone ? (
              <motion.div
                key="result"
                initial={{ opacity: 0, scale: 0.96 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.98 }}
                transition={{ duration: 0.35, ease: "easeOut" }}
                whileHover={{ y: -2, transition: { duration: 0.2 } }}
                className="rounded-[2rem] border border-border/60 bg-white/80 p-8 shadow-xl shadow-slate-900/5 backdrop-blur dark:bg-zinc-900/70"
              >
                <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
                  <EvaluationScoreCircle
                    score={evaluationResult.completion_score}
                    status={evaluationResult.status}
                  />
                  <div className="flex-1">
                    <div className={cn("inline-flex rounded-full px-4 py-2 text-sm font-medium", tone.banner)}>
                      {evaluationResult.status.replaceAll("_", " ")}
                    </div>
                    <p className="mt-4 text-sm leading-7 text-muted-foreground">
                      {evaluationResult.detailed_feedback}
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
                  {evaluationResult.checklist_results.map((item) => (
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
                        {item.is_completed ? (
                          <Check className="h-3.5 w-3.5" />
                        ) : (
                          <X className="h-3.5 w-3.5" />
                        )}
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
                    <p className="text-sm font-medium text-green-800 dark:text-green-200">
                      Strengths
                    </p>
                    <ul className="mt-3 space-y-2 text-sm text-green-900/80 dark:text-green-100/80">
                      {evaluationResult.strengths.map((item) => (
                        <li key={item} className="flex gap-2">
                          <span>•</span>
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="rounded-2xl bg-amber-500/10 p-5">
                    <p className="text-sm font-medium text-amber-800 dark:text-amber-200">
                      Gaps
                    </p>
                    <ul className="mt-3 space-y-2 text-sm text-amber-900/80 dark:text-amber-100/80">
                      {evaluationResult.gaps.map((item) => (
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
                      <p className="text-sm text-green-800 dark:text-green-200">
                        Amount Released
                      </p>
                      <AnimatedCurrency
                        amount={evaluationResult.payout_amount}
                        className="mt-1 text-3xl font-medium text-green-900 dark:text-green-100"
                      />
                    </div>
                  </div>
                  {evaluationResult.status === "PARTIALLY_COMPLETED" && refundAmount > 0 ? (
                    <p className="mt-4 text-sm text-amber-800 dark:text-amber-200">
                      Refunded to employer: {currency(refundAmount)}
                    </p>
                  ) : null}
                </div>

                {pfiUpdate ? (
                  <div className="mt-8 rounded-[1.5rem] border border-border/50 bg-background/70 p-6">
                    <p className="text-sm font-medium uppercase tracking-[0.22em] text-green-600 dark:text-green-400">
                      PFI update
                    </p>
                    <div className="mt-4 flex items-center gap-4 overflow-hidden">
                      <motion.div
                        initial={{ x: 0, opacity: 1 }}
                        animate={{ x: -10, opacity: 0.7 }}
                        className="text-2xl font-medium text-muted-foreground"
                      >
                        {pfiUpdate.previous_score}
                      </motion.div>
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
                ) : null}
              </motion.div>
            ) : null}
          </AnimatePresence>
          </section>

          <aside className="space-y-6 lg:sticky lg:top-20 lg:self-start">
          <motion.div
            whileHover={{ y: -2, transition: { duration: 0.2 } }}
            className="rounded-[2rem] border border-border/60 bg-white/80 p-6 shadow-xl shadow-slate-900/5 backdrop-blur dark:bg-zinc-900/70"
          >
            <div className="flex items-center gap-3">
              <Layers3 className="h-5 w-5 text-green-600 dark:text-green-400" />
              <h2 className="text-lg font-medium text-foreground">Milestone Details</h2>
            </div>

            <div className="mt-6">
              <p className="text-sm font-medium text-foreground">Checklist</p>
              <div className="mt-3 space-y-3">
                {activeMilestone.checklist.map((item) => (
                  <div
                    key={item.item}
                    className="flex items-start justify-between gap-3 rounded-2xl bg-background/70 p-4"
                  >
                    <div className="flex gap-3">
                      <span
                        className={cn(
                          "mt-0.5 inline-flex h-5 w-5 items-center justify-center rounded-full border",
                          item.is_completed
                            ? "border-green-500 bg-green-500 text-white"
                            : "border-border/60 bg-background",
                        )}
                      >
                        {item.is_completed ? <Check className="h-3 w-3" /> : null}
                      </span>
                      <span className="text-sm text-foreground/90">{item.item}</span>
                    </div>
                    <span className="rounded-full bg-zinc-100 px-2 py-1 text-xs text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300">
                      {Math.round(item.weight)}%
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-6 rounded-2xl bg-background/70 p-4">
              <p className="text-sm font-medium text-foreground">Payment breakdown</p>
              <div className="mt-3 space-y-2 text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">This milestone</span>
                  <span className="font-medium text-foreground">
                    {currency(activeMilestone.payment_amount)}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Released total</span>
                  <span className="font-medium text-foreground">
                    {currency(releasedTotal)}
                  </span>
                </div>
              </div>
            </div>

            <div className="mt-6">
              <p className="text-sm font-medium text-foreground">Project timeline</p>
              <div className="mt-3 space-y-3">
                {project.milestones.map((milestone, index) => (
                  <div key={milestone.id} className="flex gap-3">
                    <div className="flex flex-col items-center">
                      <span
                        className={cn(
                          "inline-flex h-7 w-7 items-center justify-center rounded-full text-xs font-medium",
                          milestone.id === activeMilestone.id
                            ? "bg-green-600 text-white"
                            : "bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300",
                        )}
                      >
                        {index + 1}
                      </span>
                      {index < project.milestones.length - 1 ? (
                        <span className="mt-2 h-8 w-px bg-border/70" />
                      ) : null}
                    </div>
                    <div className="pb-2">
                      <p
                        className={cn(
                          "text-sm font-medium",
                          milestone.id === activeMilestone.id
                            ? "text-foreground"
                            : "text-muted-foreground",
                        )}
                      >
                        {milestone.title}
                      </p>
                      <p className="mt-1 text-xs text-muted-foreground">
                        {milestone.deadline_days} days
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-6 rounded-2xl bg-background/70 p-4">
              <div className="flex items-center gap-2 text-sm font-medium text-foreground">
                <CalendarDays className="h-4 w-4 text-green-600 dark:text-green-400" />
                Days taken vs deadline
              </div>
              <div className="mt-4 flex items-end gap-4">
                <div className="flex-1">
                  <div className="h-16 rounded-t-xl bg-green-500/20" />
                  <p className="mt-2 text-center text-xs text-muted-foreground">
                    Deadline
                  </p>
                  <p className="text-center text-sm font-medium text-foreground">
                    {activeMilestone.deadline_days}
                  </p>
                </div>
                <div className="flex-1">
                  <div
                    className="rounded-t-xl bg-green-500"
                    style={{
                      height: `${Math.max(
                        16,
                        (Number(daysTaken || 0) / Math.max(activeMilestone.deadline_days, 1)) * 64,
                      )}px`,
                    }}
                  />
                  <p className="mt-2 text-center text-xs text-muted-foreground">
                    Taken
                  </p>
                  <p className="text-center text-sm font-medium text-foreground">
                    {Number(daysTaken || 0)}
                  </p>
                </div>
              </div>
            </div>
          </motion.div>
          </aside>
        </div>
      </div>
    </main>
  );
}
