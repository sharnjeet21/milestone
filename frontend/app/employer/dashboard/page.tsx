"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Briefcase, DollarSign, Plus } from "lucide-react";
import { useEffect, useState } from "react";

import { getProjects } from "@/lib/api";
import { fsGetProjects } from "@/lib/firestore";
import type { Project } from "@/lib/types";

function currency(value: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(value);
}

function getStoredEmployerId(): string | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem("user");
    if (!raw) return null;
    return (JSON.parse(raw) as { id?: string }).id ?? null;
  } catch {
    return null;
  }
}

export default function EmployerDashboardPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const employerId = getStoredEmployerId();

    const load = async () => {
      try {
        // Try Firestore filtered by employer first
        if (employerId) {
          const docs = await fsGetProjects({ employerId });
          if (docs.length > 0) {
            setProjects(docs);
            return;
          }
        }
        // Fall back to backend (returns all projects for demo)
        const data = await getProjects();
        setProjects(data);
      } catch {
        setProjects([]);
      } finally {
        setLoading(false);
      }
    };

    void load();
  }, []);

  return (
    <main className="min-h-[calc(100svh-3.5rem)] px-4 py-10 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl space-y-8">
        <motion.div
          whileHover={{ y: -2, transition: { duration: 0.2 } }}
          className="flex flex-col gap-4 rounded-[2rem] border border-border/60 bg-white/80 p-8 shadow-xl shadow-slate-900/5 backdrop-blur dark:bg-zinc-900/70 md:flex-row md:items-end md:justify-between"
        >
          <div>
            <p className="text-sm font-medium uppercase tracking-[0.24em] text-green-600 dark:text-green-400">
              Employer hub
            </p>
            <h1 className="mt-3 text-4xl font-medium tracking-tight text-foreground">
              Your Projects
            </h1>
          </div>
          <Link
            href="/employer/create"
            className="inline-flex items-center gap-2 rounded-full bg-green-600 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-green-500"
          >
            <Plus className="h-4 w-4" />
            New Project
          </Link>
        </motion.div>

        {loading ? (
          <div className="grid gap-4 md:grid-cols-2">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-40 animate-pulse rounded-[1.75rem] bg-zinc-100 dark:bg-zinc-900" />
            ))}
          </div>
        ) : projects.length === 0 ? (
          <motion.div
            whileHover={{ y: -2, transition: { duration: 0.2 } }}
            className="rounded-[2rem] border border-dashed border-border/60 bg-white/70 p-12 text-center dark:bg-zinc-900/50"
          >
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-zinc-100 dark:bg-zinc-800">
              <Briefcase className="h-5 w-5 text-muted-foreground" />
            </div>
            <h2 className="mt-4 text-xl font-medium text-foreground">No projects yet</h2>
            <p className="mt-3 text-sm text-muted-foreground">
              Create your first project and let AI decompose it into milestones.
            </p>
            <Link
              href="/employer/create"
              className="mt-6 inline-flex items-center gap-2 rounded-full bg-green-600 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-green-500"
            >
              <Plus className="h-4 w-4" />
              Create Project
            </Link>
          </motion.div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2">
            {projects.map((project) => (
              <motion.div
                key={project.id}
                whileHover={{ y: -2, transition: { duration: 0.2 } }}
                className="rounded-[1.75rem] border border-border/60 bg-white/85 p-6 shadow-sm shadow-slate-900/5 dark:bg-zinc-900/70"
              >
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <span className="rounded-full border border-border/60 px-2.5 py-1 text-xs text-muted-foreground">
                      {project.status}
                    </span>
                    <h2 className="mt-3 text-lg font-medium text-foreground">{project.title}</h2>
                    <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">
                      {project.description}
                    </p>
                  </div>
                </div>

                <div className="mt-5 flex items-center gap-4 text-sm text-muted-foreground">
                  <div className="flex items-center gap-1.5">
                    <DollarSign className="h-4 w-4" />
                    {currency(project.total_budget)}
                  </div>
                  <span>·</span>
                  <span>{project.milestones?.length ?? 0} milestones</span>
                </div>

                <div className="mt-5">
                  <Link
                    href={`/employer/dashboard/${project.id}`}
                    className="inline-flex h-9 items-center justify-center rounded-xl bg-green-600 px-4 text-sm font-medium text-white transition hover:bg-green-700"
                  >
                    View Dashboard
                  </Link>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
