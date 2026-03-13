"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import {
  BriefcaseBusiness,
  ClipboardList,
  Clock3,
  ShieldCheck,
  Sparkles,
  Wallet,
} from "lucide-react";

import type { FreelancerProfile, PFIUpdate } from "@/lib/types";

const floatingShapes = [
  {
    className:
      "left-[-6rem] top-20 h-72 w-72 bg-emerald-500/10 md:left-8 md:top-12",
    duration: 8,
    delay: 0,
  },
  {
    className:
      "right-[-4rem] top-32 h-64 w-64 bg-teal-400/10 md:right-24 md:top-24",
    duration: 9,
    delay: 0.6,
  },
  {
    className:
      "bottom-20 left-[18%] h-80 w-80 bg-green-400/10 md:bottom-10 md:left-[28%]",
    duration: 10,
    delay: 1.1,
  },
  {
    className:
      "bottom-12 right-[12%] h-56 w-56 bg-cyan-400/10 md:bottom-24 md:right-[18%]",
    duration: 8.5,
    delay: 1.8,
  },
];

const trustStats = [
  { icon: BriefcaseBusiness, label: "2,400+ projects" },
  { icon: Clock3, label: "98% on-time payment" },
  { icon: ShieldCheck, label: "0 disputed payments" },
];

const steps = [
  {
    number: "1",
    title: "Describe your project",
    description:
      "Type your requirements. AI analyzes scope and generates a milestone roadmap with checklists.",
    icon: ClipboardList,
  },
  {
    number: "2",
    title: "Funds locked in escrow",
    description:
      "Total budget is secured in our AI vault. No payment leaves without verified work.",
    icon: ShieldCheck,
  },
  {
    number: "3",
    title: "Auto-pay per milestone",
    description:
      "Submit work. AI evaluates quality. Payment releases instantly to your wallet.",
    icon: Wallet,
  },
];

const featuredFreelancer: FreelancerProfile = {
  id: "featured-freelancer",
  name: "Featured Freelancer",
  email: "featured@milestoneai.dev",
  pfi_score: 742,
  tier: "EXCELLENT",
  total_projects: 2400,
  completed_projects: 2400,
  on_time_deliveries: 94,
  total_earnings: 0,
};

const featuredPfiUpdate: PFIUpdate = {
  previous_score: 728,
  new_score: 742,
  score_change: 14,
  tier: "EXCELLENT",
  tier_color: "#86efac",
  perks: ["priority matching", "faster withdrawals"],
  component_breakdown: {
    Quality: 88,
    Deadlines: 94,
    Revisions: 85,
    Completion: 100,
  },
  improvement_tips: ["Keep review cycles lean", "Maintain delivery streaks"],
};

const pfiStats = Object.entries(featuredPfiUpdate.component_breakdown).map(
  ([label, value]) => ({
    label,
    value: `${value}%`,
  }),
);

const gaugeRadius = 72;
const gaugeCircumference = 2 * Math.PI * gaugeRadius;
const gaugeProgress = 0.82;

export default function HomePage() {
  return (
    <>
      <main className="overflow-hidden">
        <section className="relative isolate flex min-h-[calc(100svh-3.5rem)] items-center justify-center px-4 py-16 sm:px-6 lg:px-8">
          <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_top,_rgba(16,185,129,0.08),_transparent_40%),linear-gradient(180deg,_rgba(255,255,255,0.9),_rgba(240,253,250,0.78)_52%,_rgba(255,255,255,1))] dark:bg-[radial-gradient(circle_at_top,_rgba(16,185,129,0.12),_transparent_40%),linear-gradient(180deg,_rgba(10,10,10,1),_rgba(9,16,14,1)_52%,_rgba(10,10,10,1))]" />
          {floatingShapes.map((shape) => (
            <motion.div
              key={shape.className}
              animate={{ y: [0, -20, 0] }}
              transition={{
                duration: shape.duration,
                repeat: Number.POSITIVE_INFINITY,
                ease: "easeInOut",
                delay: shape.delay,
              }}
              className={`absolute -z-10 rounded-full blur-3xl ${shape.className}`}
            />
          ))}

          <div className="mx-auto flex max-w-5xl flex-col items-center text-center">
            <div className="inline-flex items-center gap-2 rounded-full border border-green-500/20 bg-white/80 px-4 py-2 text-sm text-foreground/80 shadow-sm shadow-green-900/5 backdrop-blur dark:bg-zinc-900/80">
              <span className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
              <span>Autonomous AI Payment Agent</span>
            </div>

            <h1 className="mt-8 max-w-4xl text-balance text-5xl font-medium tracking-tight text-foreground sm:text-6xl">
              Work gets paid. Automatically.
            </h1>

            <p className="mt-6 max-w-xl text-lg leading-8 text-muted-foreground">
              AI decomposes your project into milestones, holds funds in escrow,
              and releases payment only when work is verified.
            </p>

            <div className="mt-10 flex flex-col items-center gap-4 sm:flex-row">
              <Link
                href="/auth/role"
                className="inline-flex min-w-[170px] items-center justify-center rounded-full bg-green-600 px-6 py-3 text-sm font-medium text-white transition-colors hover:bg-green-500"
              >
                Post a Project
              </Link>
              <Link
                href="/auth/role"
                className="inline-flex min-w-[170px] items-center justify-center rounded-full border border-border/80 bg-background/70 px-6 py-3 text-sm font-medium text-foreground transition-colors hover:bg-foreground/5"
              >
                Find Work
              </Link>
            </div>

            <div className="mt-10 flex flex-col items-center gap-4 sm:flex-row sm:flex-wrap sm:justify-center sm:gap-6">
              {trustStats.map((stat) => {
                const Icon = stat.icon;

                return (
                  <div
                    key={stat.label}
                    className="inline-flex items-center gap-2 text-sm text-muted-foreground"
                  >
                    <Icon className="h-4 w-4 text-green-600 dark:text-green-400" />
                    <span>{stat.label}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        <section className="px-4 py-24 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-6xl">
            <div className="mx-auto max-w-2xl text-center">
              <p className="text-sm font-medium uppercase tracking-[0.24em] text-green-600 dark:text-green-400">
                How it works
              </p>
              <h2 className="mt-4 text-3xl font-medium tracking-tight text-foreground sm:text-4xl">
                Milestones, escrow, and verified release.
              </h2>
            </div>

            <div className="relative mt-14 grid gap-6 md:grid-cols-3 md:gap-8">
              <div className="absolute left-[16.66%] right-[16.66%] top-14 hidden border-t border-dashed border-green-500/30 md:block" />

              {steps.map((step, index) => {
                const Icon = step.icon;

                return (
                  <motion.div
                    key={step.number}
                    initial={{ opacity: 0, y: 24 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    whileHover={{ y: -2, transition: { duration: 0.2 } }}
                    viewport={{ once: true, amount: 0.3 }}
                    transition={{ duration: 0.45, delay: index * 0.15 }}
                    className="relative rounded-3xl border border-border/70 bg-white/80 p-6 shadow-lg shadow-slate-900/5 backdrop-blur dark:bg-zinc-900/70"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <span className="inline-flex h-11 w-11 items-center justify-center rounded-full bg-green-500 text-sm font-semibold text-white">
                        {step.number}
                      </span>
                      <div className="rounded-2xl border border-green-500/20 bg-green-500/10 p-3 text-green-600 dark:text-green-400">
                        <Icon className="h-5 w-5" />
                      </div>
                    </div>
                    <h3 className="mt-6 text-xl font-medium text-foreground">
                      {step.title}
                    </h3>
                    <p className="mt-3 text-sm leading-7 text-muted-foreground">
                      {step.description}
                    </p>
                  </motion.div>
                );
              })}
            </div>
          </div>
        </section>

        <section className="bg-zinc-950 px-4 py-24 text-white sm:px-6 lg:px-8">
          <div className="mx-auto grid max-w-6xl gap-12 lg:grid-cols-[1.05fr_0.95fr] lg:items-center">
            <div>
              <p className="text-sm font-medium uppercase tracking-[0.24em] text-green-400">
                Professional Fidelity Index
              </p>
              <h2 className="mt-4 text-3xl font-medium tracking-tight sm:text-4xl">
                Your reputation, quantified.
              </h2>
              <p className="mt-6 max-w-xl text-lg leading-8 text-zinc-300">
                The PFI is your freelance credit score — built from quality
                scores, deadline adherence, and revision counts across every
                project.
              </p>
            </div>

            <motion.div
              whileHover={{ y: -2, transition: { duration: 0.2 } }}
              className="rounded-[2rem] border border-white/10 bg-white/5 p-8 shadow-2xl shadow-black/30 backdrop-blur"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm uppercase tracking-[0.24em] text-zinc-400">
                    Live PFI
                  </p>
                  <p className="mt-2 text-4xl font-medium">
                    {featuredFreelancer.pfi_score}
                  </p>
                </div>
                <div className="inline-flex items-center gap-2 rounded-full border border-green-500/20 bg-green-500/10 px-3 py-1 text-xs font-medium text-green-300">
                  <Sparkles className="h-3.5 w-3.5" />
                  {featuredPfiUpdate.tier}
                </div>
              </div>

              <div className="mt-8 flex justify-center">
                <div className="relative flex h-52 w-52 items-center justify-center">
                  <svg className="h-full w-full -rotate-90" viewBox="0 0 180 180">
                    <circle
                      cx="90"
                      cy="90"
                      r={gaugeRadius}
                      fill="none"
                      stroke="rgba(255,255,255,0.12)"
                      strokeWidth="12"
                    />
                    <motion.circle
                      cx="90"
                      cy="90"
                      r={gaugeRadius}
                      fill="none"
                      stroke="url(#pfi-gradient)"
                      strokeWidth="12"
                      strokeLinecap="round"
                      strokeDasharray={gaugeCircumference}
                      initial={{ strokeDashoffset: gaugeCircumference }}
                      animate={{
                        strokeDashoffset:
                          gaugeCircumference * (1 - gaugeProgress),
                      }}
                      transition={{ duration: 1.4, ease: "easeOut", delay: 0.2 }}
                    />
                    <defs>
                      <linearGradient id="pfi-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="#34d399" />
                        <stop offset="100%" stopColor="#2dd4bf" />
                      </linearGradient>
                    </defs>
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <p className="text-5xl font-medium">
                      {featuredFreelancer.pfi_score}
                    </p>
                    <p className="mt-2 text-xs uppercase tracking-[0.3em] text-zinc-400">
                      PFI Score
                    </p>
                  </div>
                </div>
              </div>

              <div className="mt-8 grid grid-cols-2 gap-4">
                {pfiStats.map((stat) => (
                  <motion.div
                    key={stat.label}
                    whileHover={{ y: -2, transition: { duration: 0.2 } }}
                    className="rounded-2xl border border-white/10 bg-white/5 p-4"
                  >
                    <p className="text-sm text-zinc-400">{stat.label}</p>
                    <p className="mt-2 text-lg font-medium text-white">
                      {stat.value}
                    </p>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          </div>
        </section>
      </main>

      <footer className="bg-zinc-950 px-4 py-10 text-zinc-400 sm:px-6 lg:px-8">
        <div className="mx-auto flex max-w-6xl flex-col gap-8 border-t border-white/10 pt-8 md:flex-row md:items-center md:justify-between">
          <div>
            <div className="flex items-center gap-2 text-sm text-white">
              <span className="h-2 w-2 rounded-full bg-green-500" />
              <span className="font-medium">MilestoneAI</span>
            </div>
            <p className="mt-3 max-w-sm text-sm text-zinc-400">
              Autonomous escrow and milestone verification for modern freelance
              work.
            </p>
          </div>

          <div className="flex flex-col gap-3 text-sm md:items-end">
            <Link href="/auth/role" className="transition-colors hover:text-white">
              Get Started
            </Link>
            <Link href="/freelancer/pfi" className="transition-colors hover:text-white">
              Professional Fidelity Index
            </Link>
            <Link href="/auth/login" className="transition-colors hover:text-white">
              Login
            </Link>
          </div>
        </div>
      </footer>
    </>
  );
}
