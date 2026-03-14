"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Layers3 } from "lucide-react";
import { useEffect, useState } from "react";

type AppliedProject = {
  id: string;
  title: string;
  employer_name: string;
  progress: number;
  days_remaining: number;
};

export default function FreelancerWorkspaceIndexPage() {
  const [projects, setProjects] = useState<AppliedProject[]>([]);

  useEffect(() => {
    const raw = window.localStorage.getItem("freelancer:applied-projects");
    if (raw) {
      try {
        setProjects(JSON.parse(raw) as AppliedProject[]);
      } catch {
        setProjects([]);
      }
    }
  }, []);

  return (
    <main className="min-h-[calc(100svh-3.5rem)] px-4 py-10 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl space-y-8">
        <motion.div
          whileHover={{ y: -2, transition: { duration: 0.2 } }}
          className="rounded-[2rem] border border-border/60 bg-white/80 p-8 shadow-xl shadow-slate-900/5 backdrop-blur dark:bg-zinc-900/70"
        >
          <p className="text-sm font-medium uppercase tracking-[0.24em] text-green-600 dark:text-green-400">
            Freelancer workspace
          </p>
          <h1 className="mt-3 text-4xl font-medium tracking-tight text-foreground">
            My Workspaces
          </h1>
        </motion.div>

        {projects.length === 0 ? (
          <motion.div
            whileHover={{ y: -2, transition: { duration: 0.2 } }}
            className="rounded-[2rem] border border-dashed border-border/60 bg-white/70 p-12 text-center dark:bg-zinc-900/50"
          >
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-zinc-100 dark:bg-zinc-800">
              <Layers3 className="h-5 w-5 text-muted-foreground" />
            </div>
            <h2 className="mt-4 text-xl font-medium text-foreground">No active workspaces</h2>
            <p className="mt-3 text-sm text-muted-foreground">
              Apply to a project first to open a workspace.
            </p>
            <Link
              href="/freelancer/browse"
              className="mt-6 inline-flex items-center justify-center rounded-full bg-green-600 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-green-500"
            >
              Browse Projects
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
                <p className="text-sm text-muted-foreground">{project.employer_name}</p>
                <h2 className="mt-2 text-lg font-medium text-foreground">{project.title}</h2>
                <div className="mt-4">
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
                <div className="mt-5">
                  <Link
                    href={`/freelancer/workspace/${project.id}`}
                    className="inline-flex h-9 items-center justify-center rounded-xl bg-green-600 px-4 text-sm font-medium text-white transition hover:bg-green-700"
                  >
                    Open Workspace
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
