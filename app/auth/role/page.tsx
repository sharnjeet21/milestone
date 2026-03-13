"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { BriefcaseBusiness, Check, Code2 } from "lucide-react";

type UserRole = "employer" | "freelancer";

type RoleCard = {
  eyebrow: string;
  title: string;
  description: string;
  bullets: string[];
  cta: string;
  role: UserRole;
  icon: typeof BriefcaseBusiness;
};

const roleCards: RoleCard[] = [
  {
    eyebrow: "I'm an Employer",
    title: "Post Projects",
    description:
      "Describe your project, set a budget. AI handles everything else.",
    bullets: [
      "AI milestone generation",
      "Escrow protection",
      "Quality verification",
    ],
    cta: "Continue as Employer",
    role: "employer",
    icon: BriefcaseBusiness,
  },
  {
    eyebrow: "I'm a Freelancer",
    title: "Find Work",
    description:
      "Browse projects, submit work, get paid instantly on approval.",
    bullets: [
      "Instant payments",
      "PFI reputation score",
      "AI-verified quality",
    ],
    cta: "Continue as Freelancer",
    role: "freelancer",
    icon: Code2,
  },
];

export default function RoleSelectionPage() {
  const router = useRouter();

  const handleSelectRole = (role: UserRole) => {
    window.localStorage.setItem("role", role);
    router.push("/auth/login");
  };

  return (
    <main className="flex min-h-[calc(100svh-3.5rem)] items-center justify-center px-4 py-16 sm:px-6 lg:px-8">
      <div className="mx-auto w-full max-w-6xl">
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-sm font-medium uppercase tracking-[0.24em] text-green-600 dark:text-green-400">
            Choose your path
          </p>
          <h1 className="mt-4 text-4xl font-medium tracking-tight text-foreground sm:text-5xl">
            Start with the role that fits how you work.
          </h1>
          <p className="mt-4 text-lg text-muted-foreground">
            MilestoneAI adapts the workflow, payment controls, and reputation
            system around whether you are hiring or shipping.
          </p>
        </div>

        <div className="mt-12 grid gap-6 lg:grid-cols-2">
          {roleCards.map((card, index) => {
            const Icon = card.icon;

            return (
              <motion.div
                key={card.role}
                initial={{ opacity: 0, x: index === 0 ? -48 : 48 }}
                animate={{ opacity: 1, x: 0 }}
                whileHover={{ y: -2, transition: { duration: 0.2 } }}
                transition={{ duration: 0.5, ease: "easeOut", delay: index * 0.08 }}
                className="group rounded-[2rem] border border-border/60 bg-white/80 p-8 shadow-xl shadow-slate-900/5 backdrop-blur transition-all hover:border-green-500/50 hover:shadow-green-500/10 dark:bg-zinc-900/70"
              >
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-green-500/20 bg-green-500/10 text-green-600 dark:text-green-400">
                  <Icon className="h-6 w-6" />
                </div>

                <p className="mt-6 text-sm font-medium uppercase tracking-[0.2em] text-muted-foreground">
                  {card.eyebrow}
                </p>
                <h2 className="mt-3 text-3xl font-medium text-foreground">
                  {card.title}
                </h2>
                <p className="mt-4 text-base leading-7 text-muted-foreground">
                  {card.description}
                </p>

                <div className="mt-8 space-y-3">
                  {card.bullets.map((bullet) => (
                    <div key={bullet} className="flex items-center gap-3 text-sm">
                      <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-green-500/10 text-green-600 dark:text-green-400">
                        <Check className="h-3.5 w-3.5" />
                      </span>
                      <span className="text-foreground/80">{bullet}</span>
                    </div>
                  ))}
                </div>

                <motion.button
                  type="button"
                  onClick={() => handleSelectRole(card.role)}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="mt-10 inline-flex h-11 w-full items-center justify-center rounded-xl bg-green-600 px-4 text-sm font-medium text-white transition-colors hover:bg-green-700"
                >
                  {card.cta}
                </motion.button>
              </motion.div>
            );
          })}
        </div>

        <p className="mt-8 text-center text-sm text-muted-foreground">
          Already have an account?{" "}
          <Link
            href="/auth/login"
            className="font-medium text-foreground transition-colors hover:text-green-600 dark:hover:text-green-400"
          >
            Sign in
          </Link>
        </p>
      </div>
    </main>
  );
}
