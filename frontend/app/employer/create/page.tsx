"use client";

import { AnimatePresence, motion } from "framer-motion";
import {
  AlertTriangle,
  Check,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  CircleDollarSign,
  ClipboardList,
  CreditCard,
  Loader2,
  LockKeyhole,
  Plus,
  ShieldAlert,
  Sparkles,
  X,
} from "lucide-react";
import { useRouter } from "next/navigation";
import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type FormEvent,
  type KeyboardEvent,
} from "react";

import { useToast } from "@/context/ToastContext";
import { clarifyProject, createProject } from "@/lib/api";
import { cn } from "@/lib/utils";
import type {
  Checklist,
  CreateProjectPayload,
  DeliverableType,
  Milestone,
  Project,
  ProjectClarification,
} from "@/lib/types";

type Stage = 1 | 2 | 3;

type MockUser = {
  id: string;
  role?: string;
  name?: string;
  email?: string;
};

type ProjectFormState = {
  title: string;
  description: string;
  total_budget: string;
  timeline_days: string;
  deliverable_type: DeliverableType;
  tech_stack: string[];
};

const clarifyDefaults: ProjectClarification = {
  clarity_score: 0,
  ambiguous_areas: [],
  clarification_questions: [],
  is_clear_enough: false,
};

const analysisSteps = [
  "Analyzing requirements...",
  "Identifying deliverables...",
  "Creating milestone checklist...",
  "Calculating payments...",
  "Building risk assessment...",
];

const deliverableOptions: DeliverableType[] = [
  "code",
  "content",
  "design",
  "data",
];

function getEmployerId() {
  if (typeof window === "undefined") {
    return "employer_demo";
  }

  const raw = window.localStorage.getItem("user");

  if (!raw) {
    return "employer_demo";
  }

  try {
    const user = JSON.parse(raw) as MockUser;
    return user.id || "employer_demo";
  } catch {
    return "employer_demo";
  }
}

function persistProject(project: Project) {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem(`project:${project.id}`, JSON.stringify(project));
}

function currency(value: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(value);
}

function buildMockChecklist(description: string): Checklist[] {
  const seeds = description
    .split(/[.!?]/)
    .map((item) => item.trim())
    .filter(Boolean)
    .slice(0, 6);

  return (seeds.length ? seeds : [
    "Define technical scope",
    "Build the primary workflow",
    "Review and polish the delivery",
  ]).map((item, index) => ({
    item,
    is_completed: false,
    weight: Math.max(10, 100 / Math.max(seeds.length || 3, 3) - index),
  }));
}

function buildMockProject(payload: CreateProjectPayload): Project {
  const milestoneCount = 3;
  const totalBudget = payload.total_budget;
  const successFee = Math.round(totalBudget * 0.05);
  const perMilestoneBudget = Math.floor(totalBudget / milestoneCount);
  const baseChecklist = buildMockChecklist(payload.description);

  const milestones: Milestone[] = Array.from({ length: milestoneCount }).map(
    (_, index) => ({
      id: `ms_${Date.now()}_${index + 1}`,
      title: [
        "Foundation & planning",
        "Core build execution",
        "QA, launch, and handoff",
      ][index],
      description: [
        "Translate the brief into a concrete delivery plan, architecture, and kickoff checklist.",
        "Build the main functional deliverables and validate the implementation against the scope.",
        "Polish the output, resolve defects, and package the final delivery for acceptance.",
      ][index],
      deliverable_type: payload.deliverable_type,
      checklist: baseChecklist.slice(index, index + 4).length
        ? baseChecklist.slice(index, index + 4)
        : baseChecklist,
      deadline_days: Math.max(2, Math.round(payload.timeline_days / milestoneCount)),
      payment_amount:
        index === milestoneCount - 1
          ? totalBudget - perMilestoneBudget * (milestoneCount - 1)
          : perMilestoneBudget,
      status: "PENDING",
      completion_score: 0,
      feedback: "",
      submitted_work: "",
    }),
  );

  return {
    id: `project_${Date.now()}`,
    employer_id: payload.employer_id,
    freelancer_id: "",
    title: payload.title,
    description: payload.description,
    total_budget: totalBudget,
    milestones,
    status: "DRAFT",
    vault_id: `vault_${Date.now()}`,
    success_fee: successFee,
    created_at: new Date().toISOString(),
    project_summary:
      "AI segmented your brief into milestone-based delivery phases with payment protection and verification checkpoints.",
    risk_factors: [
      "Scope may expand if integrations are not fully specified.",
      "Timeline confidence depends on timely feedback cycles.",
      "Clarify acceptance criteria for final delivery approval.",
    ],
  };
}

function getClarityColor(score: number) {
  if (score > 70) {
    return {
      ring: "stroke-green-500",
      text: "text-green-600 dark:text-green-400",
      chip: "border-green-500/20 bg-green-500/10 text-green-700 dark:text-green-300",
    };
  }

  if (score >= 40) {
    return {
      ring: "stroke-amber-500",
      text: "text-amber-600 dark:text-amber-300",
      chip: "border-amber-500/20 bg-amber-500/10 text-amber-700 dark:text-amber-300",
    };
  }

  return {
    ring: "stroke-red-500",
    text: "text-red-600 dark:text-red-300",
    chip: "border-red-500/20 bg-red-500/10 text-red-700 dark:text-red-300",
  };
}

// ── PayPal checkout helper ────────────────────────────────────────────────────

import { PayPalButtons, PayPalScriptProvider } from "@paypal/react-paypal-js";

function PayPalCheckout({
  amount,
  projectId,
  vaultId,
  onSuccess,
  onCancel,
}: {
  amount: number;
  projectId: string;
  vaultId: string;
  onSuccess: (captureId: string) => void;
  onCancel: () => void;
}) {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:9001/api";
  const clientId = process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID || "";

  const createOrder = async () => {
    const res = await fetch(`${apiUrl}/paypal/create-order`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ project_id: projectId, vault_id: vaultId, amount }),
    });
    const data = await res.json();
    // Mock mode
    if (data.mock) {
      onSuccess(data.order_id);
      return data.order_id;
    }
    return data.order_id;
  };

  const onApprove = async (data: { orderID: string }) => {
    const res = await fetch(`${apiUrl}/paypal/capture-order`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ order_id: data.orderID, project_id: projectId }),
    });
    const capture = await res.json();
    onSuccess(capture.capture_id || data.orderID);
  };

  // No real client ID — use mock flow
  if (!clientId || clientId.startsWith("YOUR_")) {
    return (
      <div className="space-y-3">
        <p className="rounded-xl border border-amber-500/20 bg-amber-500/10 px-4 py-3 text-sm text-amber-700">
          PayPal keys not configured — running in mock mode. Add your Client ID to <code>.env.local</code> for real payments.
        </p>
        <button
          type="button"
          onClick={() => onSuccess(`MOCK-${Date.now()}`)}
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#0070ba] py-3 text-sm font-medium text-white transition hover:bg-[#005ea6]"
        >
          <LockKeyhole className="h-4 w-4" />
          Simulate PayPal Payment (Mock)
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="w-full rounded-xl border border-border/60 py-2.5 text-sm font-medium transition hover:bg-foreground/5"
        >
          Cancel
        </button>
      </div>
    );
  }

  return (
    <PayPalScriptProvider options={{ clientId, currency: "USD" }}>
      <PayPalButtons
        style={{ layout: "vertical", color: "blue", shape: "rect", label: "pay" }}
        createOrder={createOrder}
        onApprove={onApprove}
        onCancel={onCancel}
      />
    </PayPalScriptProvider>
  );
}

export default function EmployerCreateProjectPage() {
  const router = useRouter();
  const { toast } = useToast();
  const requestIdRef = useRef(0);
  const [stage, setStage] = useState<Stage>(1);
  const [form, setForm] = useState<ProjectFormState>({
    title: "",
    description: "",
    total_budget: "",
    timeline_days: "",
    deliverable_type: "code",
    tech_stack: [],
  });
  const [tagInput, setTagInput] = useState("");
  const [clarity, setClarity] = useState<ProjectClarification>(clarifyDefaults);
  const [isClarifying, setIsClarifying] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [analysisProgress, setAnalysisProgress] = useState(0);
  const [showClarificationModal, setShowClarificationModal] = useState(false);
  const [createdProject, setCreatedProject] = useState<Project | null>(null);
  const [expandedMilestones, setExpandedMilestones] = useState<Record<string, boolean>>({});
  const [isLockingFunds, setIsLockingFunds] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);

  const totalBudgetNumber = Number(form.total_budget || 0);
  const timelineNumber = Number(form.timeline_days || 0);
  const clarityTone = getClarityColor(clarity.clarity_score);
  const clarityRadius = 48;
  const clarityCircumference = 2 * Math.PI * clarityRadius;
  const clarityOffset =
    clarityCircumference -
    (Math.min(Math.max(clarity.clarity_score, 0), 100) / 100) * clarityCircumference;

  const canGenerateRoadmap =
    clarity.clarity_score > 50 &&
    form.title.trim().length > 0 &&
    totalBudgetNumber > 0 &&
    timelineNumber > 0;

  const budgetBreakdown = useMemo(() => {
    if (!createdProject || createdProject.total_budget <= 0) {
      return [];
    }

    return createdProject.milestones.map((milestone, index) => ({
      ...milestone,
      percent: (milestone.payment_amount / createdProject.total_budget) * 100,
      color: [
        "bg-green-500",
        "bg-emerald-400",
        "bg-teal-400",
        "bg-cyan-400",
        "bg-lime-400",
      ][index % 5],
    }));
  }, [createdProject]);

  useEffect(() => {
    if (!form.description.trim()) {
      setClarity(clarifyDefaults);
      return;
    }

    const currentRequestId = requestIdRef.current + 1;
    requestIdRef.current = currentRequestId;

    const timeoutId = window.setTimeout(async () => {
      setIsClarifying(true);

      try {
        const response = await clarifyProject(form.description.trim());

        if (requestIdRef.current === currentRequestId) {
          setClarity(response);
        }
      } catch {
        if (requestIdRef.current === currentRequestId) {
          toast.info(
            "Clarity check unavailable",
            "We couldn't refresh the live clarity meter right now.",
          );
        }
      } finally {
        if (requestIdRef.current === currentRequestId) {
          setIsClarifying(false);
        }
      }
    }, 1000);

    return () => window.clearTimeout(timeoutId);
  }, [form.description, toast]);

  useEffect(() => {
    if (stage !== 2) {
      return;
    }

    setIsGenerating(true);
    setAnalysisProgress(0);

    const intervalId = window.setInterval(() => {
      setAnalysisProgress((current) =>
        current < analysisSteps.length ? current + 1 : current,
      );
    }, 400);

    const timeoutId = window.setTimeout(async () => {
      const payload: CreateProjectPayload = {
        employer_id: getEmployerId(),
        title: form.title.trim(),
        description: form.description.trim(),
        total_budget: totalBudgetNumber,
        timeline_days: timelineNumber,
        deliverable_type: form.deliverable_type,
        tech_stack: form.tech_stack,
      };

      try {
        const response = await createProject(payload);
        persistProject(response);
        setCreatedProject(response);
        setStage(3);
      } catch {
        const mockProject = buildMockProject(payload);
        persistProject(mockProject);
        setCreatedProject(mockProject);
        setStage(3);
        toast.info(
          "Using local roadmap preview",
          "The API wasn't reachable, so we generated a preview roadmap locally.",
        );
      } finally {
        setIsGenerating(false);
      }
    }, 2000);

    return () => {
      window.clearInterval(intervalId);
      window.clearTimeout(timeoutId);
    };
  }, [
    form.deliverable_type,
    form.description,
    form.tech_stack,
    form.title,
    stage,
    timelineNumber,
    toast,
    totalBudgetNumber,
  ]);

  const handleAddTag = () => {
    const nextTag = tagInput.trim();

    if (!nextTag) {
      return;
    }

    setForm((current) => ({
      ...current,
      tech_stack: current.tech_stack.includes(nextTag)
        ? current.tech_stack
        : [...current.tech_stack, nextTag],
    }));
    setTagInput("");
  };

  const handleTagKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Enter") {
      event.preventDefault();
      handleAddTag();
    }
  };

  const requestFreshClarification = async () => {
    const response = await clarifyProject(form.description.trim());
    setClarity(response);
    return response;
  };

  const handleGenerateRoadmap = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!canGenerateRoadmap) {
      return;
    }

    setIsClarifying(true);

    try {
      const response = await requestFreshClarification();

      if (!response.is_clear_enough) {
        setShowClarificationModal(true);
        return;
      }

      setShowClarificationModal(false);
      setStage(2);
    } catch {
      toast.error(
        "Roadmap generation blocked",
        "We couldn't validate the brief. Please try again in a moment.",
      );
    } finally {
      setIsClarifying(false);
    }
  };

  const handleConfirmEscrow = () => {
    if (!createdProject) return;
    setShowPaymentModal(true);
  };

  const handlePaymentSuccess = (captureId: string) => {
    setShowPaymentModal(false);
    setIsLockingFunds(true);
    if (createdProject) {
      persistProject({ ...createdProject, paypal_capture_id: captureId });
    }
    window.setTimeout(() => {
      router.push(`/employer/dashboard/${createdProject!.id}`);
    }, 900);
  };

  return (
    <>
      <main className="min-h-[calc(100svh-3.5rem)] bg-[radial-gradient(circle_at_top,_rgba(16,185,129,0.10),_transparent_28%),linear-gradient(180deg,_rgba(255,255,255,0.96),_rgba(240,253,250,0.86)_52%,_rgba(255,255,255,1))] px-4 py-10 dark:bg-[radial-gradient(circle_at_top,_rgba(16,185,129,0.12),_transparent_28%),linear-gradient(180deg,_rgba(10,10,10,1),_rgba(8,18,14,1)_52%,_rgba(10,10,10,1))] sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          {stage === 1 ? (
            <div className="grid gap-8 lg:grid-cols-[1.45fr_0.95fr]">
              <motion.section
                whileHover={{ y: -2, transition: { duration: 0.2 } }}
                className="rounded-[2rem] border border-border/60 bg-white/80 p-8 shadow-xl shadow-slate-900/5 backdrop-blur dark:bg-zinc-900/70"
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-green-500/20 bg-green-500/10 text-green-600 dark:text-green-400">
                    <Sparkles className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-sm font-medium uppercase tracking-[0.24em] text-green-600 dark:text-green-400">
                      Stage 1
                    </p>
                    <h1 className="mt-1 text-3xl font-medium tracking-tight text-foreground">
                      Create your AI-ready project brief
                    </h1>
                  </div>
                </div>

                <form className="mt-8 space-y-6" onSubmit={handleGenerateRoadmap}>
                  <div className="grid gap-6 md:grid-cols-2">
                    <div className="space-y-2 md:col-span-2">
                      <label className="text-sm font-medium text-foreground">
                        Project title
                      </label>
                      <input
                        type="text"
                        value={form.title}
                        onChange={(event) =>
                          setForm((current) => ({
                            ...current,
                            title: event.target.value,
                          }))
                        }
                        placeholder="AI-powered internal tooling platform"
                        className="h-11 w-full rounded-xl border border-border/50 bg-background px-4 text-sm outline-none transition focus:border-green-500/60"
                      />
                    </div>

                    <div className="space-y-2 md:col-span-2">
                      <label className="text-sm font-medium text-foreground">
                        Project description
                      </label>
                      <textarea
                        rows={6}
                        value={form.description}
                        onChange={(event) =>
                          setForm((current) => ({
                            ...current,
                            description: event.target.value,
                          }))
                        }
                        placeholder="Describe your project in detail. What do you need built? What are the key features? What tech stack?"
                        className="w-full rounded-2xl border border-border/50 bg-background px-4 py-3 text-sm leading-6 outline-none transition focus:border-green-500/60"
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-medium text-foreground">
                        Total budget
                      </label>
                      <div className="relative">
                        <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
                          $
                        </span>
                        <input
                          type="number"
                          min="0"
                          value={form.total_budget}
                          onChange={(event) =>
                            setForm((current) => ({
                              ...current,
                              total_budget: event.target.value,
                            }))
                          }
                          placeholder="12000"
                          className="h-11 w-full rounded-xl border border-border/50 bg-background pl-8 pr-4 text-sm outline-none transition focus:border-green-500/60"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-medium text-foreground">
                        Timeline
                      </label>
                      <div className="relative">
                        <input
                          type="number"
                          min="1"
                          value={form.timeline_days}
                          onChange={(event) =>
                            setForm((current) => ({
                              ...current,
                              timeline_days: event.target.value,
                            }))
                          }
                          placeholder="30"
                          className="h-11 w-full rounded-xl border border-border/50 bg-background px-4 pr-16 text-sm outline-none transition focus:border-green-500/60"
                        />
                        <span className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
                          days
                        </span>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-medium text-foreground">
                        Deliverable type
                      </label>
                      <select
                        value={form.deliverable_type}
                        onChange={(event) =>
                          setForm((current) => ({
                            ...current,
                            deliverable_type: event.target.value as DeliverableType,
                          }))
                        }
                        className="h-11 w-full rounded-xl border border-border/50 bg-background px-4 text-sm capitalize outline-none transition focus:border-green-500/60"
                      >
                        {deliverableOptions.map((option) => (
                          <option key={option} value={option}>
                            {option}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-medium text-foreground">
                        Tech stack
                      </label>
                      <div className="rounded-2xl border border-border/50 bg-background p-3">
                        <div className="flex flex-wrap gap-2">
                          {form.tech_stack.map((tag) => (
                            <span
                              key={tag}
                              className="inline-flex items-center gap-2 rounded-full bg-green-500/10 px-3 py-1 text-xs font-medium text-green-700 dark:text-green-300"
                            >
                              {tag}
                              <motion.button
                                type="button"
                                onClick={() =>
                                  setForm((current) => ({
                                    ...current,
                                    tech_stack: current.tech_stack.filter(
                                      (item) => item !== tag,
                                    ),
                                  }))
                                }
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                                className="text-green-700/70 transition hover:text-green-800 dark:text-green-300/70 dark:hover:text-green-200"
                              >
                                <X className="h-3 w-3" />
                              </motion.button>
                            </span>
                          ))}
                        </div>
                        <div className="mt-3 flex gap-2">
                          <input
                            type="text"
                            value={tagInput}
                            onChange={(event) => setTagInput(event.target.value)}
                            onKeyDown={handleTagKeyDown}
                            placeholder="Type a technology and press Enter"
                            className="h-10 w-full rounded-xl border border-border/40 bg-background px-3 text-sm outline-none transition focus:border-green-500/60"
                          />
                          <motion.button
                            type="button"
                            onClick={handleAddTag}
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-border/50 text-foreground transition hover:border-green-500/50 hover:text-green-600"
                          >
                            <Plus className="h-4 w-4" />
                          </motion.button>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-end border-t border-border/50 pt-6">
                    <motion.button
                      type="submit"
                      disabled={!canGenerateRoadmap || isClarifying}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      className="inline-flex h-12 items-center justify-center rounded-xl bg-green-600 px-6 text-sm font-medium text-white transition hover:bg-green-700 disabled:cursor-not-allowed disabled:bg-green-600/50"
                    >
                      {isClarifying ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Validating brief...
                        </>
                      ) : (
                        "Generate AI Roadmap"
                      )}
                    </motion.button>
                  </div>
                </form>
              </motion.section>

              <motion.aside
                whileHover={{ y: -2, transition: { duration: 0.2 } }}
                className="rounded-[2rem] border border-border/60 bg-white/80 p-8 shadow-xl shadow-slate-900/5 backdrop-blur dark:bg-zinc-900/70"
              >
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className="text-sm font-medium uppercase tracking-[0.24em] text-green-600 dark:text-green-400">
                      Live clarity meter
                    </p>
                    <h2 className="mt-2 text-2xl font-medium text-foreground">
                      Is your brief specific enough?
                    </h2>
                  </div>
                  {isClarifying ? (
                    <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                  ) : null}
                </div>

                <div className="mt-8 flex justify-center">
                  <div className="relative flex h-40 w-40 items-center justify-center">
                    <svg className="h-full w-full -rotate-90" viewBox="0 0 120 120">
                      <circle
                        cx="60"
                        cy="60"
                        r={clarityRadius}
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="10"
                        className="text-foreground/10"
                      />
                      <motion.circle
                        cx="60"
                        cy="60"
                        r={clarityRadius}
                        fill="none"
                        strokeWidth="10"
                        strokeLinecap="round"
                        strokeDasharray={clarityCircumference}
                        animate={{ strokeDashoffset: clarityOffset }}
                        transition={{ duration: 0.5, ease: "easeOut" }}
                        className={clarityTone.ring}
                      />
                    </svg>
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                      <span className={cn("text-4xl font-medium", clarityTone.text)}>
                        {clarity.clarity_score}
                      </span>
                      <span className="mt-1 text-xs uppercase tracking-[0.28em] text-muted-foreground">
                        Clarity
                      </span>
                    </div>
                  </div>
                </div>

                <div className="mt-8 rounded-2xl border border-border/50 bg-background/60 p-4">
                  <p className="text-sm font-medium text-foreground">
                    Ambiguous areas
                  </p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {clarity.ambiguous_areas.length ? (
                      clarity.ambiguous_areas.map((area) => (
                        <span
                          key={area}
                          className={cn(
                            "inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-medium",
                            clarityTone.chip,
                          )}
                        >
                          <AlertTriangle className="h-3 w-3" />
                          {area}
                        </span>
                      ))
                    ) : (
                      <span className="text-sm text-muted-foreground">
                        No major ambiguity detected yet.
                      </span>
                    )}
                  </div>
                </div>

                <div className="mt-4 rounded-2xl border border-border/50 bg-background/60 p-4">
                  <p className="text-sm font-medium text-foreground">
                    Clarification questions
                  </p>
                  <ol className="mt-3 space-y-3">
                    {clarity.clarification_questions.length ? (
                      clarity.clarification_questions.map((question, index) => (
                        <li
                          key={question}
                          className="flex gap-3 text-sm leading-6 text-muted-foreground"
                        >
                          <span className="inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-foreground/5 text-xs font-medium text-foreground">
                            {index + 1}
                          </span>
                          <span>{question}</span>
                        </li>
                      ))
                    ) : (
                      <li className="text-sm text-muted-foreground">
                        Start describing the work to get AI-generated questions.
                      </li>
                    )}
                  </ol>
                </div>
              </motion.aside>
            </div>
          ) : null}

          {stage === 3 && createdProject ? (
            <div className="grid gap-8 lg:grid-cols-[1.45fr_0.95fr]">
              <section>
                <motion.div
                  whileHover={{ y: -2, transition: { duration: 0.2 } }}
                  className="rounded-[2rem] border border-border/60 bg-white/80 p-8 shadow-xl shadow-slate-900/5 backdrop-blur dark:bg-zinc-900/70"
                >
                  <p className="text-sm font-medium uppercase tracking-[0.24em] text-green-600 dark:text-green-400">
                    Stage 3
                  </p>
                  <h1 className="mt-3 text-4xl font-medium tracking-tight text-foreground">
                    Your AI-Generated Roadmap
                  </h1>
                  <p className="mt-4 max-w-3xl text-lg leading-8 text-muted-foreground">
                    {createdProject.project_summary}
                  </p>

                  <div className="mt-6 flex flex-wrap gap-2">
                    {createdProject.risk_factors.map((factor) => (
                      <span
                        key={factor}
                        className="inline-flex items-center gap-2 rounded-full border border-amber-500/20 bg-amber-500/10 px-3 py-1 text-xs font-medium text-amber-700 dark:text-amber-300"
                      >
                        <ShieldAlert className="h-3.5 w-3.5" />
                        {factor}
                      </span>
                    ))}
                  </div>
                </motion.div>

                <div className="relative mt-8 space-y-6 pl-10">
                  <div className="absolute left-4 top-0 h-full w-px bg-gradient-to-b from-green-500/60 via-green-500/20 to-transparent" />
                  {createdProject.milestones.map((milestone, index) => {
                    const expanded = expandedMilestones[milestone.id] ?? false;
                    const visibleChecklist = expanded
                      ? milestone.checklist
                      : milestone.checklist.slice(0, 4);

                    return (
                      <motion.div
                        key={milestone.id}
                        initial={{ opacity: 0, y: 28 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{
                          duration: 0.45,
                          delay: index * 0.12,
                          ease: "easeOut",
                        }}
                        className="relative rounded-[1.75rem] border border-border/60 bg-white/85 p-6 shadow-lg shadow-slate-900/5 backdrop-blur dark:bg-zinc-900/70"
                      >
                        <div className="absolute -left-[2.85rem] top-6 flex h-10 w-10 items-center justify-center rounded-full border-4 border-background bg-green-500 text-sm font-semibold text-white shadow-lg shadow-green-500/20">
                          {index + 1}
                        </div>

                        <div className="flex flex-wrap items-start justify-between gap-4">
                          <div>
                            <p className="text-sm uppercase tracking-[0.24em] text-muted-foreground">
                              Milestone {index + 1}
                            </p>
                            <h3 className="mt-2 text-2xl font-medium text-foreground">
                              {milestone.title}
                            </h3>
                          </div>
                          <span className="rounded-full border border-green-500/20 bg-green-500/10 px-3 py-1 text-xs font-medium capitalize text-green-700 dark:text-green-300">
                            {milestone.deliverable_type}
                          </span>
                        </div>

                        <p className="mt-4 text-sm leading-7 text-muted-foreground">
                          {milestone.description}
                        </p>

                        <div className="mt-5 flex flex-wrap gap-3 text-sm">
                          <div className="inline-flex items-center gap-2 rounded-full border border-border/60 bg-background/70 px-3 py-1.5 text-muted-foreground">
                            <ClipboardList className="h-4 w-4" />
                            {milestone.deadline_days} days
                          </div>
                          <div className="inline-flex items-center gap-2 rounded-full border border-border/60 bg-background/70 px-3 py-1.5 text-muted-foreground">
                            <CircleDollarSign className="h-4 w-4" />
                            {currency(milestone.payment_amount)}
                          </div>
                        </div>

                        <div className="mt-6 rounded-2xl border border-border/50 bg-background/60 p-4">
                          <p className="text-sm font-medium text-foreground">
                            Milestone checklist
                          </p>
                          <div className="mt-3 space-y-3">
                            {visibleChecklist.map((item) => (
                              <div key={item.item} className="flex items-start gap-3 text-sm">
                                <span className="mt-0.5 inline-flex h-5 w-5 items-center justify-center rounded-full bg-green-500/10 text-green-600 dark:text-green-400">
                                  <Check className="h-3.5 w-3.5" />
                                </span>
                                <div>
                                  <p className="text-foreground/90">{item.item}</p>
                                  <p className="text-xs text-muted-foreground">
                                    Weight {Math.round(item.weight)}%
                                  </p>
                                </div>
                              </div>
                            ))}
                          </div>

                          {milestone.checklist.length > 4 ? (
                            <motion.button
                              type="button"
                              onClick={() =>
                                setExpandedMilestones((current) => ({
                                  ...current,
                                  [milestone.id]: !expanded,
                                }))
                              }
                              whileHover={{ scale: 1.02 }}
                              whileTap={{ scale: 0.98 }}
                              className="mt-4 inline-flex items-center gap-2 text-sm font-medium text-green-700 transition hover:text-green-800 dark:text-green-300 dark:hover:text-green-200"
                            >
                              {expanded ? (
                                <>
                                  Show less
                                  <ChevronUp className="h-4 w-4" />
                                </>
                              ) : (
                                <>
                                  Show more
                                  <ChevronDown className="h-4 w-4" />
                                </>
                              )}
                            </motion.button>
                          ) : null}
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              </section>

              <motion.aside
                animate={isLockingFunds ? { scale: [1, 0.97, 1] } : { scale: 1 }}
                transition={{ duration: 0.8, ease: "easeInOut" }}
                whileHover={{ y: -2, transition: { duration: 0.2 } }}
                className="self-start rounded-[2rem] border border-border/60 bg-white/85 p-8 shadow-xl shadow-slate-900/5 backdrop-blur dark:bg-zinc-900/70"
              >
                <p className="text-sm font-medium uppercase tracking-[0.24em] text-green-600 dark:text-green-400">
                  Escrow summary
                </p>
                <h2 className="mt-3 text-2xl font-medium text-foreground">
                  Budget breakdown
                </h2>

                <div className="mt-6 overflow-hidden rounded-full bg-foreground/10">
                  <div className="flex h-4 w-full overflow-hidden rounded-full">
                    {budgetBreakdown.map((item) => (
                      <div
                        key={item.id}
                        className={cn("h-full", item.color)}
                        style={{ width: `${Math.max(item.percent, 8)}%` }}
                        title={`${item.title}: ${item.percent.toFixed(0)}%`}
                      />
                    ))}
                  </div>
                </div>

                <div className="mt-6 space-y-4">
                  {budgetBreakdown.map((item, index) => (
                    <div key={item.id} className="flex items-center justify-between gap-4 text-sm">
                      <div className="flex items-center gap-3">
                        <span className={cn("h-3 w-3 rounded-full", item.color)} />
                        <span className="text-foreground/80">
                          Milestone {index + 1}
                        </span>
                      </div>
                      <span className="text-muted-foreground">
                        {currency(item.payment_amount)} ({item.percent.toFixed(0)}%)
                      </span>
                    </div>
                  ))}
                </div>

                <div className="mt-8 space-y-3 rounded-2xl border border-border/50 bg-background/60 p-5 text-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Success fee</span>
                    <span className="font-medium text-foreground">
                      {currency(createdProject.success_fee)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Total locked in escrow</span>
                    <span className="font-medium text-foreground">
                      {currency(createdProject.total_budget)}
                    </span>
                  </div>
                </div>

                <div className="relative mt-8 overflow-hidden rounded-[1.5rem] border border-green-500/20 bg-green-500/10 p-4">
                  <div
                    className={cn(
                      "pointer-events-none absolute inset-y-0 left-0 w-1/2 origin-left bg-zinc-950/90 transition-transform duration-700",
                      isLockingFunds ? "scale-x-100" : "scale-x-0",
                    )}
                  />
                  <div
                    className={cn(
                      "pointer-events-none absolute inset-y-0 right-0 w-1/2 origin-right bg-zinc-950/90 transition-transform duration-700",
                      isLockingFunds ? "scale-x-100" : "scale-x-0",
                    )}
                  />
                  <motion.button
                    type="button"
                    onClick={handleConfirmEscrow}
                    disabled={isLockingFunds}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className="relative inline-flex h-14 w-full items-center justify-center gap-2 rounded-[1rem] bg-green-600 px-6 text-base font-medium text-white transition hover:bg-green-700 disabled:cursor-wait"
                  >
                    {isLockingFunds ? (
                      <>
                        <LockKeyhole className="h-5 w-5" />
                        Locking escrow...
                      </>
                    ) : (
                      <>
                        <LockKeyhole className="h-5 w-5" />
                        Confirm & Lock Funds in Escrow
                      </>
                    )}
                  </motion.button>
                </div>
              </motion.aside>
            </div>
          ) : null}
        </div>
      </main>

      <AnimatePresence>
        {showClarificationModal ? (
          <>
            <motion.button
              type="button"
              aria-label="Close clarification modal"
              onClick={() => setShowClarificationModal(false)}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="fixed inset-0 z-[70] bg-slate-950/50 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, y: 32 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              className="fixed left-1/2 top-1/2 z-[71] w-[calc(100%-2rem)] max-w-2xl -translate-x-1/2 -translate-y-1/2 rounded-[2rem] border border-border/60 bg-background p-8 shadow-2xl shadow-slate-950/20"
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-sm font-medium uppercase tracking-[0.24em] text-amber-600 dark:text-amber-300">
                    Clarification needed
                  </p>
                  <h2 className="mt-2 text-3xl font-medium text-foreground">
                    Your brief needs a little more specificity
                  </h2>
                </div>
                <motion.button
                  type="button"
                  onClick={() => setShowClarificationModal(false)}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-border/60"
                >
                  <X className="h-4 w-4" />
                </motion.button>
              </div>

              <div className="mt-6 rounded-2xl border border-amber-500/20 bg-amber-500/10 p-4 text-sm text-amber-800 dark:text-amber-200">
                The AI flagged this brief as not clear enough to generate a confident escrow roadmap yet.
              </div>

              <ol className="mt-6 space-y-3">
                {clarity.clarification_questions.map((question, index) => (
                  <li
                    key={question}
                    className="flex gap-3 rounded-2xl border border-border/50 bg-background/80 p-4 text-sm leading-6"
                  >
                    <span className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-foreground/5 font-medium text-foreground">
                      {index + 1}
                    </span>
                    <span className="text-muted-foreground">{question}</span>
                  </li>
                ))}
              </ol>

              <div className="mt-8 flex justify-end">
                <motion.button
                  type="button"
                  onClick={() => setShowClarificationModal(false)}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="inline-flex h-11 items-center justify-center rounded-xl bg-green-600 px-5 text-sm font-medium text-white transition hover:bg-green-700"
                >
                  Update brief
                </motion.button>
              </div>
            </motion.div>
          </>
        ) : null}
      </AnimatePresence>

      <AnimatePresence>
        {stage === 2 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[80] flex items-center justify-center bg-slate-950/75 px-4 backdrop-blur-md"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              className="w-full max-w-2xl rounded-[2rem] border border-white/10 bg-zinc-950/90 p-8 text-white shadow-2xl shadow-black/40"
            >
              <p className="text-sm font-medium uppercase tracking-[0.24em] text-green-400">
                Stage 2
              </p>
              <h2 className="mt-3 text-4xl font-medium tracking-tight">
                AI is analyzing your project...
              </h2>
              <p className="mt-4 max-w-xl text-base leading-7 text-zinc-400">
                We&apos;re breaking the brief into milestones, assigning payouts,
                and building a verification-ready roadmap.
              </p>

              <motion.div
                initial="hidden"
                animate="visible"
                variants={{
                  hidden: {},
                  visible: {
                    transition: {
                      staggerChildren: 0.12,
                    },
                  },
                }}
                className="mt-10 space-y-4"
              >
                {analysisSteps.map((step, index) => {
                  const complete = analysisProgress > index + 1;
                  const active = analysisProgress === index + 1;

                  return (
                    <motion.div
                      key={step}
                      variants={{
                        hidden: { opacity: 0, y: 12 },
                        visible: { opacity: 1, y: 0 },
                      }}
                      className="flex items-center justify-between rounded-2xl border border-white/10 bg-white/5 px-4 py-4"
                    >
                      <span className="text-sm text-zinc-200">{step}</span>
                      <span
                        className={cn(
                          "inline-flex h-8 w-8 items-center justify-center rounded-full border",
                          complete
                            ? "border-green-500/30 bg-green-500/10 text-green-400"
                            : active
                              ? "border-green-500/30 bg-green-500/10 text-green-400"
                              : "border-white/10 bg-white/5 text-zinc-500",
                        )}
                      >
                        {complete ? (
                          <CheckCircle2 className="h-4 w-4" />
                        ) : active ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <span className="h-2 w-2 rounded-full bg-current" />
                        )}
                      </span>
                    </motion.div>
                  );
                })}
              </motion.div>

              <div className="mt-8 flex items-center gap-3 text-sm text-zinc-400">
                {isGenerating ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin text-green-400" />
                    Preparing your escrow-ready project roadmap
                  </>
                ) : null}
              </div>
            </motion.div>
          </motion.div>
        ) : null}
      </AnimatePresence>
      <AnimatePresence>
        {showPaymentModal && createdProject ? (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[90] bg-slate-950/50 backdrop-blur-sm"
              onClick={() => setShowPaymentModal(false)}
            />
            <motion.div
              initial={{ opacity: 0, y: 32 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              className="fixed left-1/2 top-1/2 z-[91] w-[calc(100%-2rem)] max-w-md -translate-x-1/2 -translate-y-1/2 rounded-[2rem] border border-border/60 bg-background p-8 shadow-2xl"
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-sm font-medium uppercase tracking-[0.24em] text-green-600">
                    Secure payment
                  </p>
                  <h2 className="mt-2 text-2xl font-medium text-foreground">
                    Fund escrow vault
                  </h2>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {currency(createdProject.total_budget)} held securely until milestones are approved.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setShowPaymentModal(false)}
                  className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-border/60"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              <div className="mt-6 flex items-center gap-3 rounded-2xl border border-blue-500/20 bg-blue-500/10 px-4 py-3 text-sm text-blue-700 dark:text-blue-300">
                <CreditCard className="h-4 w-4 shrink-0" />
                Pay securely via PayPal. Funds are held in escrow and only released when milestones pass AI verification.
              </div>

              <div className="mt-6">
                <PayPalCheckout
                  amount={createdProject.total_budget}
                  projectId={createdProject.id}
                  vaultId={createdProject.vault_id}
                  onSuccess={handlePaymentSuccess}
                  onCancel={() => setShowPaymentModal(false)}
                />
              </div>
            </motion.div>
          </>
        ) : null}
      </AnimatePresence>
    </>
  );
}
