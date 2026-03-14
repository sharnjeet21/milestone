"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import { useState } from "react";
import {
  ArrowRight,
  CheckCircle2,
  Code2,
  FileText,
  Loader2,
  MessageSquare,
  Sparkles,
  Star,
} from "lucide-react";
import { cn } from "@/lib/utils";

type Step = "intro" | "quiz" | "result";

type Question = {
  id: string;
  text: string;
  options: { label: string; value: string }[];
};

const questions: Question[] = [
  {
    id: "domain",
    text: "What's your primary area of expertise?",
    options: [
      { label: "Software Engineering / Code", value: "code" },
      { label: "Writing / Content / Editing", value: "content" },
      { label: "Data Science / Analytics", value: "data" },
      { label: "Design / UX / Visual", value: "design" },
      { label: "Math / Science / Research", value: "research" },
    ],
  },
  {
    id: "experience",
    text: "How many years of professional experience do you have?",
    options: [
      { label: "Less than 1 year", value: "0" },
      { label: "1–3 years", value: "1" },
      { label: "3–5 years", value: "3" },
      { label: "5–10 years", value: "5" },
      { label: "10+ years", value: "10" },
    ],
  },
  {
    id: "availability",
    text: "How many hours per week can you dedicate to tasks?",
    options: [
      { label: "1–5 hours (casual)", value: "5" },
      { label: "5–10 hours (part-time)", value: "10" },
      { label: "10–20 hours (serious)", value: "20" },
      { label: "20+ hours (full-time)", value: "40" },
    ],
  },
  {
    id: "task_type",
    text: "Which type of work interests you most?",
    options: [
      { label: "Rating & ranking AI responses", value: "rate" },
      { label: "Rewriting & improving AI content", value: "rewrite" },
      { label: "Evaluating code quality", value: "code_eval" },
      { label: "Generating training examples", value: "generate" },
      { label: "All of the above", value: "all" },
    ],
  },
  {
    id: "ai_familiarity",
    text: "How familiar are you with AI-generated content?",
    options: [
      { label: "Not familiar at all", value: "0" },
      { label: "I've used ChatGPT or similar tools", value: "1" },
      { label: "I work with AI tools regularly", value: "2" },
      { label: "I build or fine-tune AI models", value: "3" },
    ],
  },
];

type Answers = Record<string, string>;

function computeResult(answers: Answers) {
  const exp = parseInt(answers.experience ?? "0");
  const ai = parseInt(answers.ai_familiarity ?? "0");
  const hours = parseInt(answers.availability ?? "5");

  const baseScore = 500 + exp * 20 + ai * 30;
  const cappedScore = Math.min(baseScore, 720);

  const domain = answers.domain ?? "content";
  const taskType = answers.task_type ?? "rate";

  const taskMap: Record<string, { title: string; icon: typeof Code2; pay: string; color: string }> = {
    code: { title: "Code Evaluation", icon: Code2, pay: "$30–$65/hr", color: "text-green-600" },
    content: { title: "Rewrite & Improve", icon: FileText, pay: "$20–$45/hr", color: "text-purple-600" },
    data: { title: "Data Generation", icon: Sparkles, pay: "$18–$40/hr", color: "text-amber-600" },
    design: { title: "Rate & Rank", icon: MessageSquare, pay: "$15–$35/hr", color: "text-blue-600" },
    research: { title: "Data Generation", icon: Sparkles, pay: "$18–$40/hr", color: "text-amber-600" },
  };

  const recommended = taskMap[domain] ?? taskMap.content;
  const tier = cappedScore >= 700 ? "EXCELLENT" : cappedScore >= 600 ? "GOOD" : "AVERAGE";
  const weeklyEst = hours * (domain === "code" ? 35 : domain === "data" ? 28 : 22);

  return { score: cappedScore, tier, recommended, weeklyEst };
}

export default function OnboardingPage() {
  const router = useRouter();
  const [step, setStep] = useState<Step>("intro");
  const [currentQ, setCurrentQ] = useState(0);
  const [answers, setAnswers] = useState<Answers>({});
  const [saving, setSaving] = useState(false);

  const question = questions[currentQ];
  const result = step === "result" ? computeResult(answers) : null;

  const handleAnswer = (value: string) => {
    const next = { ...answers, [question.id]: value };
    setAnswers(next);
    if (currentQ < questions.length - 1) {
      setCurrentQ((q) => q + 1);
    } else {
      setStep("result");
    }
  };

  const handleStart = async () => {
    setSaving(true);
    await new Promise((r) => setTimeout(r, 600));
    setSaving(false);
    if (typeof window !== "undefined") {
      const stored = window.localStorage.getItem("user");
      if (!stored) {
        router.push("/signup");
        return;
      }
    }
    router.push("/freelancer/browse");
  };

  return (
    <main className="min-h-[calc(100svh-3.5rem)] bg-[radial-gradient(circle_at_top,_rgba(16,185,129,0.08),_transparent_40%),linear-gradient(180deg,_rgba(255,255,255,0.96),_rgba(240,253,250,0.86)_52%,_rgba(255,255,255,1))] px-4 py-16 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-2xl">
        <AnimatePresence mode="wait">
          {step === "intro" && (
            <motion.div
              key="intro"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="rounded-[2rem] border border-border/60 bg-white/80 p-10 shadow-xl shadow-slate-900/5 backdrop-blur dark:bg-zinc-900/70"
            >
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-green-500/20 bg-green-500/10 text-green-600">
                <Sparkles className="h-6 w-6" />
              </div>
              <p className="mt-6 text-sm font-medium uppercase tracking-[0.24em] text-green-600">Skills Assessment</p>
              <h1 className="mt-2 text-3xl font-medium tracking-tight text-foreground">
                Let's find the right tasks for you.
              </h1>
              <p className="mt-4 text-muted-foreground leading-7">
                Answer 5 quick questions and we'll match you to AI training tasks that fit your background. Takes about 2 minutes.
              </p>

              <div className="mt-8 space-y-3">
                {[
                  "Matched to tasks based on your expertise",
                  "Starting PFI score calculated from your background",
                  "Estimated weekly earnings shown upfront",
                ].map((item) => (
                  <div key={item} className="flex items-center gap-3 text-sm text-foreground/80">
                    <CheckCircle2 className="h-4 w-4 shrink-0 text-green-600" />
                    {item}
                  </div>
                ))}
              </div>

              <button
                type="button"
                onClick={() => setStep("quiz")}
                className="mt-8 inline-flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-green-600 text-sm font-medium text-white transition hover:bg-green-700"
              >
                Start Assessment
                <ArrowRight className="h-4 w-4" />
              </button>
            </motion.div>
          )}

          {step === "quiz" && (
            <motion.div
              key={`q-${currentQ}`}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.25 }}
              className="rounded-[2rem] border border-border/60 bg-white/80 p-10 shadow-xl shadow-slate-900/5 backdrop-blur dark:bg-zinc-900/70"
            >
              {/* Progress */}
              <div className="mb-8">
                <div className="flex items-center justify-between text-xs text-muted-foreground mb-2">
                  <span>Question {currentQ + 1} of {questions.length}</span>
                  <span>{Math.round(((currentQ) / questions.length) * 100)}% complete</span>
                </div>
                <div className="h-1.5 rounded-full bg-foreground/10">
                  <motion.div
                    className="h-full rounded-full bg-green-500"
                    animate={{ width: `${(currentQ / questions.length) * 100}%` }}
                    transition={{ duration: 0.3 }}
                  />
                </div>
              </div>

              <h2 className="text-xl font-medium text-foreground">{question.text}</h2>

              <div className="mt-6 space-y-3">
                {question.options.map((opt) => (
                  <motion.button
                    key={opt.value}
                    type="button"
                    onClick={() => handleAnswer(opt.value)}
                    whileHover={{ scale: 1.01 }}
                    whileTap={{ scale: 0.99 }}
                    className="flex w-full items-center justify-between rounded-xl border border-border/50 bg-background px-5 py-4 text-left text-sm font-medium text-foreground transition hover:border-green-500/50 hover:bg-green-500/5"
                  >
                    {opt.label}
                    <ArrowRight className="h-4 w-4 text-muted-foreground" />
                  </motion.button>
                ))}
              </div>

              {currentQ > 0 && (
                <button
                  type="button"
                  onClick={() => setCurrentQ((q) => q - 1)}
                  className="mt-4 text-sm text-muted-foreground transition hover:text-foreground"
                >
                  ← Back
                </button>
              )}
            </motion.div>
          )}

          {step === "result" && result && (
            <motion.div
              key="result"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-6"
            >
              <div className="rounded-[2rem] border border-border/60 bg-white/80 p-10 shadow-xl shadow-slate-900/5 backdrop-blur dark:bg-zinc-900/70">
                <div className="flex items-center gap-3">
                  <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-green-500/20 bg-green-500/10 text-green-600">
                    <Star className="h-6 w-6" />
                  </div>
                  <div>
                    <p className="text-sm font-medium uppercase tracking-[0.24em] text-green-600">Assessment complete</p>
                    <h2 className="text-2xl font-medium text-foreground">You're a great fit.</h2>
                  </div>
                </div>

                <div className="mt-8 grid gap-4 sm:grid-cols-3">
                  <div className="rounded-2xl border border-border/50 bg-background/60 p-5 text-center">
                    <p className="text-xs uppercase tracking-wide text-muted-foreground">Starting PFI</p>
                    <p className="mt-2 text-3xl font-medium text-foreground">{result.score}</p>
                    <p className={cn("mt-1 text-xs font-medium",
                      result.tier === "EXCELLENT" ? "text-green-600" :
                      result.tier === "GOOD" ? "text-amber-600" : "text-zinc-500"
                    )}>{result.tier}</p>
                  </div>
                  <div className="rounded-2xl border border-border/50 bg-background/60 p-5 text-center">
                    <p className="text-xs uppercase tracking-wide text-muted-foreground">Est. Weekly</p>
                    <p className="mt-2 text-3xl font-medium text-green-600">${result.weeklyEst}</p>
                    <p className="mt-1 text-xs text-muted-foreground">based on availability</p>
                  </div>
                  <div className="rounded-2xl border border-border/50 bg-background/60 p-5 text-center">
                    <p className="text-xs uppercase tracking-wide text-muted-foreground">Best Match</p>
                    <p className={cn("mt-2 text-base font-medium", result.recommended.color)}>{result.recommended.title}</p>
                    <p className="mt-1 text-xs text-muted-foreground">{result.recommended.pay}</p>
                  </div>
                </div>

                <div className="mt-6 rounded-2xl border border-green-500/20 bg-green-500/5 p-5">
                  <p className="text-sm font-medium text-foreground">Recommended task type</p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Based on your background, you're best suited for <span className={cn("font-medium", result.recommended.color)}>{result.recommended.title}</span> tasks at {result.recommended.pay}. Your PFI score will grow as you complete more tasks.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={handleStart}
                  disabled={saving}
                  className="mt-8 inline-flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-green-600 text-sm font-medium text-white transition hover:bg-green-700 disabled:opacity-60"
                >
                  {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <ArrowRight className="h-4 w-4" />}
                  {saving ? "Setting up your account..." : "Browse Available Tasks"}
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </main>
  );
}
