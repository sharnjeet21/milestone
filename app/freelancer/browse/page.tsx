"use client";

import Link from "next/link";
import * as Tabs from "@radix-ui/react-tabs";
import { AnimatePresence, motion } from "framer-motion";
import {
  BriefcaseBusiness,
  CheckCircle2,
  Clock3,
  DollarSign,
  Search,
  TimerReset,
  X,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";

import { useToast } from "@/context/ToastContext";
import { cn } from "@/lib/utils";
import type { DeliverableType } from "@/lib/types";

type BrowseProject = {
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
};

type AppliedProject = BrowseProject & {
  applied_at: string;
};

const APPLIED_PROJECTS_KEY = "freelancer:applied-projects";

const mockProjects: BrowseProject[] = [
  {
    id: "proj_react_ops_console",
    title: "React Operations Console for Internal Teams",
    description:
      "Build a modern React dashboard for operations managers with role-based access, analytics charts, approval queues, and audit logging. The product should support responsive layouts, reusable UI primitives, and API integrations for live metrics.",
    deliverable_type: "code",
    tech_stack: ["React", "TypeScript", "Tailwind", "REST API"],
    budget: 7200,
    timeline_days: 45,
    posted_hours_ago: 4,
    employer_name: "Northlane Systems",
    active_milestone: "Design system and analytics dashboard foundations",
    progress: 38,
    days_remaining: 27,
  },
  {
    id: "proj_content_fintech_series",
    title: "Fintech Thought Leadership Content Series",
    description:
      "Write a six-piece content package for a B2B fintech company, including two pillar articles, three customer education posts, and one executive POV piece. Research should be original, clear, and optimized for search intent without sounding generic.",
    deliverable_type: "content",
    tech_stack: ["SEO", "Editorial Research", "B2B SaaS"],
    budget: 2400,
    timeline_days: 21,
    posted_hours_ago: 9,
    employer_name: "Ledger Grove",
    active_milestone: "Research and editorial outline approval",
    progress: 54,
    days_remaining: 12,
  },
  {
    id: "proj_logo_refresh",
    title: "Logo Refresh for Climate Tech Startup",
    description:
      "Create a refreshed logo system and mini brand direction for a climate startup preparing for launch. Deliverables should include icon exploration, wordmark options, color direction, and export-ready presentation assets for web and investor materials.",
    deliverable_type: "design",
    tech_stack: ["Branding", "Figma", "Illustrator"],
    budget: 1800,
    timeline_days: 14,
    posted_hours_ago: 16,
    employer_name: "Verde Circuit",
    active_milestone: "Concept exploration and mark refinement",
    progress: 22,
    days_remaining: 10,
  },
  {
    id: "proj_marketing_data_analysis",
    title: "Marketing Attribution Data Analysis Sprint",
    description:
      "Audit attribution performance across paid and lifecycle channels, identify waste, and build a clear findings deck with recommendations. Work includes cleaning datasets, validating channel assumptions, and summarizing insights for leadership review.",
    deliverable_type: "data",
    tech_stack: ["Python", "SQL", "Looker Studio", "Pandas"],
    budget: 3200,
    timeline_days: 18,
    posted_hours_ago: 6,
    employer_name: "Signal Harbor",
    active_milestone: "Data cleanup and baseline reporting",
    progress: 61,
    days_remaining: 8,
  },
  {
    id: "proj_api_partner_platform",
    title: "Partner API Development for B2B Platform",
    description:
      "Design and implement a secure partner-facing API with authentication, usage limits, and documentation. The engagement includes endpoint planning, implementation, test coverage, and a polished integration guide for external teams.",
    deliverable_type: "code",
    tech_stack: ["Node.js", "OpenAPI", "PostgreSQL", "Auth"],
    budget: 8000,
    timeline_days: 60,
    posted_hours_ago: 2,
    employer_name: "Axiom Grid",
    active_milestone: "Authentication and endpoint contract design",
    progress: 29,
    days_remaining: 42,
  },
  {
    id: "proj_mobile_habit_app",
    title: "Mobile Habit Coaching App MVP",
    description:
      "Build an MVP mobile experience for guided habit tracking with streaks, push notifications, onboarding, and subscription-ready screens. The app should feel polished, lightweight, and ready for a focused beta release.",
    deliverable_type: "code",
    tech_stack: ["React Native", "Expo", "Firebase", "Notifications"],
    budget: 6800,
    timeline_days: 50,
    posted_hours_ago: 11,
    employer_name: "Bright Path Labs",
    active_milestone: "Onboarding flow and tracker interactions",
    progress: 44,
    days_remaining: 31,
  },
];

function currency(value: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(value);
}

function postedTime(hoursAgo: number) {
  return hoursAgo < 24 ? `${hoursAgo}h ago` : `${Math.floor(hoursAgo / 24)}d ago`;
}

function deliverableTone(type: DeliverableType) {
  switch (type) {
    case "code":
      return "bg-green-500/10 text-green-700 dark:text-green-300";
    case "content":
      return "bg-sky-500/10 text-sky-700 dark:text-sky-300";
    case "design":
      return "bg-fuchsia-500/10 text-fuchsia-700 dark:text-fuchsia-300";
    case "data":
      return "bg-amber-500/10 text-amber-700 dark:text-amber-300";
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

export default function FreelancerBrowsePage() {
  const { toast } = useToast();
  const [search, setSearch] = useState("");
  const [selectedType, setSelectedType] = useState<DeliverableType | "all">("all");
  const [maxBudget, setMaxBudget] = useState(12000);
  const [timelineFilter, setTimelineFilter] = useState<"all" | "14-30" | "31-45" | "46-60">("all");
  const [expandedDescriptions, setExpandedDescriptions] = useState<Record<string, boolean>>({});
  const [appliedProjects, setAppliedProjects] = useState<AppliedProject[]>([]);
  const [selectedProject, setSelectedProject] = useState<BrowseProject | null>(null);

  useEffect(() => {
    setAppliedProjects(loadAppliedProjects());
  }, []);

  const filteredProjects = useMemo(() => {
    return mockProjects.filter((project) => {
      const matchesType =
        selectedType === "all" || project.deliverable_type === selectedType;
      const matchesBudget = project.budget >= 500 && project.budget <= maxBudget;
      const matchesTimeline =
        timelineFilter === "all" ||
        (timelineFilter === "14-30" &&
          project.timeline_days >= 14 &&
          project.timeline_days <= 30) ||
        (timelineFilter === "31-45" &&
          project.timeline_days >= 31 &&
          project.timeline_days <= 45) ||
        (timelineFilter === "46-60" &&
          project.timeline_days >= 46 &&
          project.timeline_days <= 60);
      const term = search.trim().toLowerCase();
      const matchesSearch =
        !term ||
        [project.title, project.description, project.employer_name, ...project.tech_stack]
          .join(" ")
          .toLowerCase()
          .includes(term);

      return matchesType && matchesBudget && matchesTimeline && matchesSearch;
    });
  }, [maxBudget, search, selectedType, timelineFilter]);

  const appliedProjectIds = useMemo(
    () => new Set(appliedProjects.map((project) => project.id)),
    [appliedProjects],
  );

  const handleApply = () => {
    if (!selectedProject) {
      return;
    }

    const alreadyApplied = appliedProjectIds.has(selectedProject.id);

    if (alreadyApplied) {
      setSelectedProject(null);
      return;
    }

    const nextAppliedProject: AppliedProject = {
      ...selectedProject,
      applied_at: new Date().toISOString(),
    };
    const nextProjects = [nextAppliedProject, ...appliedProjects].slice(0, 10);

    setAppliedProjects(nextProjects);
    window.localStorage.setItem(APPLIED_PROJECTS_KEY, JSON.stringify(nextProjects));
    setSelectedProject(null);
    toast.success(
      "Application submitted",
      `You're now tracking ${selectedProject.title} in My Active Projects.`,
    );
  };

  return (
    <>
      <main className="min-h-[calc(100svh-3.5rem)] px-4 py-10 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <motion.div
            whileHover={{ y: -2, transition: { duration: 0.2 } }}
            className="flex flex-col gap-4 rounded-[2rem] border border-border/60 bg-white/80 p-8 shadow-xl shadow-slate-900/5 backdrop-blur dark:bg-zinc-900/70 md:flex-row md:items-end md:justify-between"
          >
            <div>
              <p className="text-sm font-medium uppercase tracking-[0.24em] text-green-600 dark:text-green-400">
                Freelancer discovery
              </p>
              <h1 className="mt-3 text-4xl font-medium tracking-tight text-foreground">
                Available Projects
              </h1>
            </div>
            <span className="inline-flex w-fit rounded-full border border-green-500/20 bg-green-500/10 px-3 py-1.5 text-sm font-medium text-green-700 dark:text-green-300">
              {filteredProjects.length} open now
            </span>
          </motion.div>

          <Tabs.Root defaultValue="browse" className="mt-8">
            <Tabs.List className="grid w-full max-w-md grid-cols-2 rounded-2xl border border-border/50 bg-foreground/[0.03] p-1">
              <Tabs.Trigger
                value="browse"
                className="rounded-xl px-4 py-2.5 text-sm font-medium text-muted-foreground transition data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm"
              >
                Browse
              </Tabs.Trigger>
              <Tabs.Trigger
                value="active"
                className="rounded-xl px-4 py-2.5 text-sm font-medium text-muted-foreground transition data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm"
              >
                My Active Projects
              </Tabs.Trigger>
            </Tabs.List>

            <Tabs.Content value="browse" className="mt-8 space-y-6">
              <motion.section
                whileHover={{ y: -2, transition: { duration: 0.2 } }}
                className="rounded-[2rem] border border-border/60 bg-white/80 p-6 shadow-lg shadow-slate-900/5 backdrop-blur dark:bg-zinc-900/70"
              >
                <div className="grid gap-4 lg:grid-cols-[1fr_1.2fr_1fr_1.2fr]">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-foreground">
                      Deliverable type
                    </label>
                    <select
                      value={selectedType}
                      onChange={(event) =>
                        setSelectedType(event.target.value as DeliverableType | "all")
                      }
                      className="h-11 w-full rounded-xl border border-border/50 bg-background px-4 text-sm outline-none transition focus:border-green-500/60"
                    >
                      <option value="all">All types</option>
                      <option value="code">Code</option>
                      <option value="content">Content</option>
                      <option value="design">Design</option>
                      <option value="data">Data</option>
                    </select>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium text-foreground">
                      Budget range
                    </label>
                    <div className="rounded-xl border border-border/50 bg-background px-4 py-3">
                      <input
                        type="range"
                        min={500}
                        max={20000}
                        step={250}
                        value={maxBudget}
                        onChange={(event) => setMaxBudget(Number(event.target.value))}
                        className="w-full accent-green-600"
                      />
                      <div className="mt-2 flex items-center justify-between text-xs text-muted-foreground">
                        <span>$500</span>
                        <span>Up to {currency(maxBudget)}</span>
                        <span>$20,000</span>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium text-foreground">
                      Timeline
                    </label>
                    <select
                      value={timelineFilter}
                      onChange={(event) =>
                        setTimelineFilter(
                          event.target.value as "all" | "14-30" | "31-45" | "46-60",
                        )
                      }
                      className="h-11 w-full rounded-xl border border-border/50 bg-background px-4 text-sm outline-none transition focus:border-green-500/60"
                    >
                      <option value="all">Any timeline</option>
                      <option value="14-30">14-30 days</option>
                      <option value="31-45">31-45 days</option>
                      <option value="46-60">46-60 days</option>
                    </select>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium text-foreground">
                      Search
                    </label>
                    <div className="relative">
                      <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                      <input
                        type="text"
                        value={search}
                        onChange={(event) => setSearch(event.target.value)}
                        placeholder="Search title, stack, or employer"
                        className="h-11 w-full rounded-xl border border-border/50 bg-background pl-10 pr-4 text-sm outline-none transition focus:border-green-500/60"
                      />
                    </div>
                  </div>
                </div>
              </motion.section>

              <section className="grid gap-6 lg:grid-cols-2">
                {filteredProjects.map((project) => {
                  const expanded = expandedDescriptions[project.id] ?? false;
                  const alreadyApplied = appliedProjectIds.has(project.id);

                  return (
                    <motion.div
                      key={project.id}
                      whileHover={{ y: -2, transition: { duration: 0.2 } }}
                      className="rounded-[1.75rem] border border-border/60 bg-white/85 p-6 shadow-sm shadow-slate-900/5 transition-shadow hover:shadow-md dark:bg-zinc-900/70"
                    >
                      <div className="flex items-center justify-between gap-4">
                        <span
                          className={cn(
                            "rounded-full px-3 py-1 text-xs font-medium capitalize",
                            deliverableTone(project.deliverable_type),
                          )}
                        >
                          {project.deliverable_type}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          Posted {postedTime(project.posted_hours_ago)}
                        </span>
                      </div>

                      <h2 className="mt-4 text-base font-medium text-foreground">
                        {project.title}
                      </h2>

                      <div className="mt-3">
                        <p
                          className={cn(
                            "text-sm leading-7 text-muted-foreground",
                            !expanded && "line-clamp-2",
                          )}
                        >
                          {project.description}
                        </p>
                        <motion.button
                          type="button"
                          onClick={() =>
                            setExpandedDescriptions((current) => ({
                              ...current,
                              [project.id]: !expanded,
                            }))
                          }
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          className="mt-2 text-sm font-medium text-green-700 transition hover:text-green-800 dark:text-green-300 dark:hover:text-green-200"
                        >
                          {expanded ? "See less" : "See more"}
                        </motion.button>
                      </div>

                      <div className="mt-4 flex flex-wrap gap-2">
                        {project.tech_stack.map((tag) => (
                          <span
                            key={tag}
                            className="rounded-full bg-zinc-100 px-3 py-1 text-xs text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>

                      <div className="mt-6 flex items-center justify-between gap-4">
                        <div>
                          <p className="text-base font-medium text-green-600 dark:text-green-400">
                            {currency(project.budget)}
                          </p>
                          <p className="mt-1 text-sm text-muted-foreground">
                            {project.timeline_days} days
                          </p>
                        </div>

                        <motion.button
                          type="button"
                          onClick={() => setSelectedProject(project)}
                          disabled={alreadyApplied}
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          className="inline-flex h-10 items-center justify-center rounded-xl bg-green-600 px-4 text-sm font-medium text-white transition hover:bg-green-700 disabled:cursor-not-allowed disabled:bg-green-600/50"
                        >
                          {alreadyApplied ? "Applied" : "Apply"}
                        </motion.button>
                      </div>
                    </motion.div>
                  );
                })}
              </section>
            </Tabs.Content>

            <Tabs.Content value="active" className="mt-8">
              <div className="grid gap-6 lg:grid-cols-2">
                {appliedProjects.length ? (
                  appliedProjects.map((project) => (
                    <motion.div
                      key={project.id}
                      whileHover={{ y: -2, transition: { duration: 0.2 } }}
                      className="rounded-[1.75rem] border border-border/60 bg-white/85 p-6 shadow-sm shadow-slate-900/5 dark:bg-zinc-900/70"
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <p className="text-sm text-muted-foreground">{project.employer_name}</p>
                          <h2 className="mt-2 text-lg font-medium text-foreground">
                            {project.title}
                          </h2>
                        </div>
                        <span className="rounded-full bg-green-500/10 px-3 py-1 text-xs font-medium text-green-700 dark:text-green-300">
                          Active
                        </span>
                      </div>

                      <div className="mt-5 space-y-3 text-sm">
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <BriefcaseBusiness className="h-4 w-4" />
                          Current milestone: {project.active_milestone}
                        </div>
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <Clock3 className="h-4 w-4" />
                          {project.days_remaining} days remaining
                        </div>
                      </div>

                      <div className="mt-5">
                        <div className="flex items-center justify-between text-xs text-muted-foreground">
                          <span>Progress</span>
                          <span>{project.progress}%</span>
                        </div>
                        <div className="mt-2 h-2 rounded-full bg-foreground/10">
                          <div
                            className="h-full rounded-full bg-green-500"
                            style={{ width: `${project.progress}%` }}
                          />
                        </div>
                      </div>

                      <div className="mt-6">
                        <Link
                          href={`/freelancer/workspace/${project.id}`}
                          className="inline-flex h-10 items-center justify-center rounded-xl bg-green-600 px-4 text-sm font-medium text-white transition hover:bg-green-700"
                        >
                          Go to Workspace
                        </Link>
                      </div>
                    </motion.div>
                  ))
                ) : (
                  <motion.div
                    whileHover={{ y: -2, transition: { duration: 0.2 } }}
                    className="rounded-[1.75rem] border border-dashed border-border/60 bg-white/70 p-8 text-center dark:bg-zinc-900/50"
                  >
                    <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-zinc-100 dark:bg-zinc-800">
                      <TimerReset className="h-5 w-5 text-muted-foreground" />
                    </div>
                    <h2 className="mt-4 text-xl font-medium text-foreground">
                      No active projects yet
                    </h2>
                    <p className="mt-3 text-sm leading-6 text-muted-foreground">
                      Apply to a project from the Browse tab and it will appear here
                      as part of your active pipeline.
                    </p>
                  </motion.div>
                )}
              </div>
            </Tabs.Content>
          </Tabs.Root>
        </div>
      </main>

      <AnimatePresence>
        {selectedProject ? (
          <>
            <motion.button
              type="button"
              aria-label="Close apply modal"
              onClick={() => setSelectedProject(null)}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[70] bg-slate-950/45 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 16 }}
              className="fixed left-1/2 top-1/2 z-[71] w-[calc(100%-2rem)] max-w-lg -translate-x-1/2 -translate-y-1/2 rounded-[2rem] border border-border/60 bg-background p-8 shadow-2xl shadow-slate-950/20"
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-sm font-medium uppercase tracking-[0.24em] text-green-600 dark:text-green-400">
                    Confirm application
                  </p>
                  <h2 className="mt-2 text-2xl font-medium text-foreground">
                    Apply to {selectedProject.title}?
                  </h2>
                </div>
                <motion.button
                  type="button"
                  onClick={() => setSelectedProject(null)}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-border/60"
                >
                  <X className="h-4 w-4" />
                </motion.button>
              </div>

              <div className="mt-6 space-y-3 rounded-2xl bg-zinc-50 p-4 dark:bg-zinc-900">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <DollarSign className="h-4 w-4" />
                  {currency(selectedProject.budget)}
                </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Clock3 className="h-4 w-4" />
                  {selectedProject.timeline_days} days
                </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <CheckCircle2 className="h-4 w-4" />
                  Employer: {selectedProject.employer_name}
                </div>
              </div>

              <p className="mt-6 text-sm leading-6 text-muted-foreground">
                This will save the project to your active list locally so you can
                jump into the workspace flow.
              </p>

              <div className="mt-8 flex justify-end gap-3">
                <motion.button
                  type="button"
                  onClick={() => setSelectedProject(null)}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="inline-flex h-10 items-center justify-center rounded-xl border border-border/60 px-4 text-sm font-medium text-foreground transition hover:bg-foreground/5"
                >
                  Cancel
                </motion.button>
                <motion.button
                  type="button"
                  onClick={handleApply}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="inline-flex h-10 items-center justify-center rounded-xl bg-green-600 px-4 text-sm font-medium text-white transition hover:bg-green-700"
                >
                  Confirm Apply
                </motion.button>
              </div>
            </motion.div>
          </>
        ) : null}
      </AnimatePresence>
    </>
  );
}
