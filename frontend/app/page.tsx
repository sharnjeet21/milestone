"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import {
  ArrowRight,
  Briefcase,
  CheckCircle2,
  Clock3,
  Code2,
  FileText,
  Layers3,
  MessageSquare,
  ShieldCheck,
  Sparkles,
  Star,
  TrendingUp,
  Wallet,
  Zap,
} from "lucide-react";

import type { FreelancerProfile, PFIUpdate } from "@/lib/types";

const floatingShapes = [
  { className: "left-[-6rem] top-20 h-72 w-72 bg-emerald-500/10 md:left-8 md:top-12", duration: 8, delay: 0 },
  { className: "right-[-4rem] top-32 h-64 w-64 bg-teal-400/10 md:right-24 md:top-24", duration: 9, delay: 0.6 },
  { className: "bottom-20 left-[18%] h-80 w-80 bg-green-400/10 md:bottom-10 md:left-[28%]", duration: 10, delay: 1.1 },
  { className: "bottom-12 right-[12%] h-56 w-56 bg-cyan-400/10 md:bottom-24 md:right-[18%]", duration: 8.5, delay: 1.8 },
];

const trustStats = [
  { icon: Briefcase, label: "12,000+ experts" },
  { icon: Clock3, label: "Weekly payouts" },
  { icon: ShieldCheck, label: "AI-verified quality" },
];

const taskTypes = [
  {
    icon: MessageSquare,
    title: "Rate & Rank",
    description: "Evaluate AI responses for quality, accuracy, and helpfulness. Compare outputs and rank them.",
    pay: "$15–$35/hr",
    color: "bg-blue-500/10 text-blue-600 dark:text-blue-400",
    border: "border-blue-500/20",
  },
  {
    icon: FileText,
    title: "Rewrite & Improve",
    description: "Rewrite AI-generated content to be more accurate, natural, and aligned with human expectations.",
    pay: "$20–$45/hr",
    color: "bg-purple-500/10 text-purple-600 dark:text-purple-400",
    border: "border-purple-500/20",
  },
  {
    icon: Code2,
    title: "Code Evaluation",
    description: "Review AI-generated code for correctness, efficiency, and best practices. Fix bugs and edge cases.",
    pay: "$30–$65/hr",
    color: "bg-green-500/10 text-green-600 dark:text-green-400",
    border: "border-green-500/20",
  },
  {
    icon: Sparkles,
    title: "Data Generation",
    description: "Create high-quality training examples, prompts, and responses to improve AI model performance.",
    pay: "$18–$40/hr",
    color: "bg-amber-500/10 text-amber-600 dark:text-amber-400",
    border: "border-amber-500/20",
  },
];

const steps = [
  {
    number: "1",
    title: "Apply & get assessed",
    description: "Complete a short skills quiz. AI matches you to tasks that fit your expertise level.",
    icon: CheckCircle2,
  },
  {
    number: "2",
    title: "Pick up tasks",
    description: "Browse available missions. Work on your schedule — no minimums, no deadlines.",
    icon: Layers3,
  },
  {
    number: "3",
    title: "Get paid weekly",
    description: "Payments go out every Tuesday via PayPal. Your PFI score unlocks higher-paying tasks.",
    icon: Wallet,
  },
];

const featuredPfiUpdate: PFIUpdate = {
  previous_score: 728,
  new_score: 742,
  score_change: 14,
  tier: "EXCELLENT",
  tier_color: "#86efac",
  perks: ["priority matching", "faster withdrawals"],
  component_breakdown: { Quality: 88, Deadlines: 94, Revisions: 85, Completion: 100 },
  improvement_tips: [],
};

const pfiStats = Object.entries(featuredPfiUpdate.component_breakdown).map(([label, value]) => ({ label, value: `${value}%` }));
const gaugeRadius = 72;
const gaugeCircumference = 2 * Math.PI * gaugeRadius;
const gaugeProgress = 0.82;

const testimonials = [
  { name: "Priya S.", role: "ML Engineer", text: "I earn $800–$1200/month reviewing code tasks on weekends. The PFI system keeps me motivated to do quality work.", score: 812 },
  { name: "Carlos M.", role: "Technical Writer", text: "Rewrite tasks are perfect for my background. Weekly PayPal payouts, no chasing invoices.", score: 741 },
  { name: "Aisha K.", role: "Data Scientist", text: "The AI evaluation is fair and transparent. I know exactly why I got paid what I did.", score: 768 },
];

export default function HomePage() {
  return (
    <>
      <main className="overflow-hidden">
        {/* Hero */}
        <section className="relative isolate flex min-h-[calc(100svh-3.5rem)] items-center justify-center px-4 py-16 sm:px-6 lg:px-8">
          <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_top,_rgba(16,185,129,0.08),_transparent_40%),linear-gradient(180deg,_rgba(255,255,255,0.9),_rgba(240,253,250,0.78)_52%,_rgba(255,255,255,1))] dark:bg-[radial-gradient(circle_at_top,_rgba(16,185,129,0.12),_transparent_40%),linear-gradient(180deg,_rgba(10,10,10,1),_rgba(9,16,14,1)_52%,_rgba(10,10,10,1))]" />
          {floatingShapes.map((shape) => (
            <motion.div
              key={shape.className}
              animate={{ y: [0, -20, 0] }}
              transition={{ duration: shape.duration, repeat: Infinity, ease: "easeInOut", delay: shape.delay }}
              className={`absolute -z-10 rounded-full blur-3xl ${shape.className}`}
            />
          ))}

          <div className="mx-auto flex max-w-5xl flex-col items-center text-center">
            <div className="inline-flex items-center gap-2 rounded-full border border-green-500/20 bg-white/80 px-4 py-2 text-sm text-foreground/80 shadow-sm shadow-green-900/5 backdrop-blur dark:bg-zinc-900/80">
              <span className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
              <span>AI Training + Freelance Work Platform</span>
            </div>

            <h1 className="mt-8 max-w-4xl text-balance text-5xl font-medium tracking-tight text-foreground sm:text-6xl">
              Get paid to make AI smarter.
            </h1>

            <p className="mt-6 max-w-xl text-lg leading-8 text-muted-foreground">
              Join thousands of experts earning weekly by rating, rewriting, and evaluating AI outputs — or post projects and let AI manage milestone payments automatically.
            </p>

            <div className="mt-10 flex flex-col items-center gap-4 sm:flex-row">
              <Link
                href="/onboarding"
                className="inline-flex min-w-[180px] items-center justify-center gap-2 rounded-full bg-green-600 px-6 py-3 text-sm font-medium text-white transition-colors hover:bg-green-500"
              >
                Start Earning
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                href="/employer/create"
                className="inline-flex min-w-[180px] items-center justify-center rounded-full border border-border/80 bg-background/70 px-6 py-3 text-sm font-medium text-foreground transition-colors hover:bg-foreground/5"
              >
                Post a Project
              </Link>
            </div>

            <div className="mt-10 flex flex-col items-center gap-4 sm:flex-row sm:flex-wrap sm:justify-center sm:gap-6">
              {trustStats.map((stat) => {
                const Icon = stat.icon;
                return (
                  <div key={stat.label} className="inline-flex items-center gap-2 text-sm text-muted-foreground">
                    <Icon className="h-4 w-4 text-green-600 dark:text-green-400" />
                    <span>{stat.label}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* Task types */}
        <section className="px-4 py-24 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-6xl">
            <div className="mx-auto max-w-2xl text-center">
              <p className="text-sm font-medium uppercase tracking-[0.24em] text-green-600 dark:text-green-400">Task types</p>
              <h2 className="mt-4 text-3xl font-medium tracking-tight text-foreground sm:text-4xl">
                Work that matches your expertise.
              </h2>
              <p className="mt-4 text-muted-foreground">
                Every task is AI-matched to your skill level. Higher PFI score = higher-paying tasks.
              </p>
            </div>

            <div className="mt-14 grid gap-6 md:grid-cols-2 lg:grid-cols-4">
              {taskTypes.map((task, index) => {
                const Icon = task.icon;
                return (
                  <motion.div
                    key={task.title}
                    initial={{ opacity: 0, y: 24 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    whileHover={{ y: -4, transition: { duration: 0.2 } }}
                    viewport={{ once: true, amount: 0.3 }}
                    transition={{ duration: 0.45, delay: index * 0.1 }}
                    className="rounded-3xl border border-border/70 bg-white/80 p-6 shadow-lg shadow-slate-900/5 backdrop-blur dark:bg-zinc-900/70"
                  >
                    <div className={`inline-flex h-11 w-11 items-center justify-center rounded-2xl border ${task.border} ${task.color}`}>
                      <Icon className="h-5 w-5" />
                    </div>
                    <h3 className="mt-5 text-base font-medium text-foreground">{task.title}</h3>
                    <p className="mt-2 text-sm leading-6 text-muted-foreground">{task.description}</p>
                    <p className="mt-4 text-sm font-medium text-green-600 dark:text-green-400">{task.pay}</p>
                  </motion.div>
                );
              })}
            </div>
          </div>
        </section>

        {/* How it works */}
        <section className="bg-zinc-50/80 px-4 py-24 dark:bg-zinc-950/40 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-6xl">
            <div className="mx-auto max-w-2xl text-center">
              <p className="text-sm font-medium uppercase tracking-[0.24em] text-green-600 dark:text-green-400">How it works</p>
              <h2 className="mt-4 text-3xl font-medium tracking-tight text-foreground sm:text-4xl">
                Three steps to your first payout.
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
                      <span className="inline-flex h-11 w-11 items-center justify-center rounded-full bg-green-500 text-sm font-semibold text-white">{step.number}</span>
                      <div className="rounded-2xl border border-green-500/20 bg-green-500/10 p-3 text-green-600 dark:text-green-400">
                        <Icon className="h-5 w-5" />
                      </div>
                    </div>
                    <h3 className="mt-6 text-xl font-medium text-foreground">{step.title}</h3>
                    <p className="mt-3 text-sm leading-7 text-muted-foreground">{step.description}</p>
                  </motion.div>
                );
              })}
            </div>
          </div>
        </section>

        {/* PFI section */}
        <section className="bg-zinc-950 px-4 py-24 text-white sm:px-6 lg:px-8">
          <div className="mx-auto grid max-w-6xl gap-12 lg:grid-cols-[1.05fr_0.95fr] lg:items-center">
            <div>
              <p className="text-sm font-medium uppercase tracking-[0.24em] text-green-400">Professional Fidelity Index</p>
              <h2 className="mt-4 text-3xl font-medium tracking-tight sm:text-4xl">Your reputation, quantified.</h2>
              <p className="mt-6 max-w-xl text-lg leading-8 text-zinc-300">
                The PFI is your freelance credit score — built from quality scores, deadline adherence, and revision counts. Higher score = priority task matching and faster payouts.
              </p>
              <div className="mt-8 grid grid-cols-2 gap-4">
                {[
                  { label: "POOR", range: "300–499", color: "text-red-400" },
                  { label: "AVERAGE", range: "500–599", color: "text-amber-400" },
                  { label: "EXCELLENT", range: "700–799", color: "text-green-400" },
                  { label: "ELITE", range: "800–900", color: "text-emerald-300" },
                ].map((tier) => (
                  <div key={tier.label} className="rounded-2xl border border-white/10 bg-white/5 p-4">
                    <p className={`text-sm font-medium ${tier.color}`}>{tier.label}</p>
                    <p className="mt-1 text-xs text-zinc-400">{tier.range}</p>
                  </div>
                ))}
              </div>
            </div>

            <motion.div
              whileHover={{ y: -2, transition: { duration: 0.2 } }}
              className="rounded-[2rem] border border-white/10 bg-white/5 p-8 shadow-2xl shadow-black/30 backdrop-blur"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm uppercase tracking-[0.24em] text-zinc-400">Live PFI</p>
                  <p className="mt-2 text-4xl font-medium">742</p>
                </div>
                <div className="inline-flex items-center gap-2 rounded-full border border-green-500/20 bg-green-500/10 px-3 py-1 text-xs font-medium text-green-300">
                  <Sparkles className="h-3.5 w-3.5" />
                  EXCELLENT
                </div>
              </div>

              <div className="mt-8 flex justify-center">
                <div className="relative flex h-52 w-52 items-center justify-center">
                  <svg className="h-full w-full -rotate-90" viewBox="0 0 180 180">
                    <circle cx="90" cy="90" r={gaugeRadius} fill="none" stroke="rgba(255,255,255,0.12)" strokeWidth="12" />
                    <motion.circle
                      cx="90" cy="90" r={gaugeRadius} fill="none" stroke="url(#pfi-gradient)"
                      strokeWidth="12" strokeLinecap="round" strokeDasharray={gaugeCircumference}
                      initial={{ strokeDashoffset: gaugeCircumference }}
                      animate={{ strokeDashoffset: gaugeCircumference * (1 - gaugeProgress) }}
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
                    <p className="text-5xl font-medium">742</p>
                    <p className="mt-2 text-xs uppercase tracking-[0.3em] text-zinc-400">PFI Score</p>
                  </div>
                </div>
              </div>

              <div className="mt-8 grid grid-cols-2 gap-4">
                {pfiStats.map((stat) => (
                  <motion.div key={stat.label} whileHover={{ y: -2, transition: { duration: 0.2 } }} className="rounded-2xl border border-white/10 bg-white/5 p-4">
                    <p className="text-sm text-zinc-400">{stat.label}</p>
                    <p className="mt-2 text-lg font-medium text-white">{stat.value}</p>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          </div>
        </section>

        {/* Testimonials */}
        <section className="px-4 py-24 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-6xl">
            <div className="mx-auto max-w-2xl text-center">
              <p className="text-sm font-medium uppercase tracking-[0.24em] text-green-600 dark:text-green-400">Community</p>
              <h2 className="mt-4 text-3xl font-medium tracking-tight text-foreground sm:text-4xl">
                Experts earning on their terms.
              </h2>
            </div>

            <div className="mt-14 grid gap-6 md:grid-cols-3">
              {testimonials.map((t, index) => (
                <motion.div
                  key={t.name}
                  initial={{ opacity: 0, y: 24 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  whileHover={{ y: -4, transition: { duration: 0.2 } }}
                  viewport={{ once: true, amount: 0.3 }}
                  transition={{ duration: 0.45, delay: index * 0.1 }}
                  className="rounded-3xl border border-border/70 bg-white/80 p-6 shadow-lg shadow-slate-900/5 backdrop-blur dark:bg-zinc-900/70"
                >
                  <div className="flex items-center gap-1 text-amber-400">
                    {Array.from({ length: 5 }).map((_, i) => <Star key={i} className="h-3.5 w-3.5 fill-current" />)}
                  </div>
                  <p className="mt-4 text-sm leading-7 text-muted-foreground">"{t.text}"</p>
                  <div className="mt-5 flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-foreground">{t.name}</p>
                      <p className="text-xs text-muted-foreground">{t.role}</p>
                    </div>
                    <div className="flex items-center gap-1.5 rounded-full bg-green-500/10 px-3 py-1 text-xs font-medium text-green-700 dark:text-green-300">
                      <TrendingUp className="h-3 w-3" />
                      PFI {t.score}
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="px-4 py-24 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-3xl">
            <motion.div
              whileHover={{ y: -2, transition: { duration: 0.2 } }}
              className="rounded-[2rem] border border-green-500/20 bg-gradient-to-br from-green-500/10 to-emerald-500/5 p-12 text-center shadow-xl shadow-green-900/5"
            >
              <div className="inline-flex items-center gap-2 rounded-full border border-green-500/20 bg-white/80 px-4 py-2 text-sm text-green-700 backdrop-blur dark:bg-zinc-900/80 dark:text-green-300">
                <Zap className="h-3.5 w-3.5" />
                Apply in under 5 minutes
              </div>
              <h2 className="mt-6 text-3xl font-medium tracking-tight text-foreground sm:text-4xl">
                Ready to start earning?
              </h2>
              <p className="mt-4 text-muted-foreground">
                Take the skills quiz, get matched to tasks, and receive your first payout within a week.
              </p>
              <div className="mt-8 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
                <Link
                  href="/onboarding"
                  className="inline-flex min-w-[180px] items-center justify-center gap-2 rounded-full bg-green-600 px-6 py-3 text-sm font-medium text-white transition hover:bg-green-500"
                >
                  Get Started
                  <ArrowRight className="h-4 w-4" />
                </Link>
                <Link
                  href="/freelancer/browse"
                  className="inline-flex min-w-[180px] items-center justify-center rounded-full border border-border/80 bg-background/70 px-6 py-3 text-sm font-medium text-foreground transition hover:bg-foreground/5"
                >
                  Browse Tasks
                </Link>
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
              AI training work + autonomous milestone payments for modern freelancers.
            </p>
          </div>
          <div className="flex flex-col gap-3 text-sm md:items-end">
            <Link href="/onboarding" className="transition-colors hover:text-white">Get Started</Link>
            <Link href="/freelancer/browse" className="transition-colors hover:text-white">Browse Tasks</Link>
            <Link href="/freelancer/pfi" className="transition-colors hover:text-white">PFI Score</Link>
            <Link href="/employer/create" className="transition-colors hover:text-white">Post a Project</Link>
            <Link href="/login" className="transition-colors hover:text-white">Login</Link>
          </div>
        </div>
      </footer>
    </>
  );
}
