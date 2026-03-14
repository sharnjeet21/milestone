"use client";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { ArrowLeft, AlertTriangle, CheckCircle2, Clock, Plus, X, ShieldAlert } from "lucide-react";
import { cn } from "@/lib/utils";

type Dispute = {
  id: string;
  project: string;
  milestone: string;
  raised_by: "employer" | "freelancer";
  reason: string;
  status: "OPEN" | "RESOLVED" | "DISMISSED";
  created_at: string;
};

const MOCK: Dispute[] = [
  { id: "d1", project: "AI Dashboard", milestone: "Core Build", raised_by: "freelancer", reason: "Payment not released after milestone approval.", status: "OPEN", created_at: "2026-03-10" },
  { id: "d2", project: "E-commerce Site", milestone: "Final Handoff", raised_by: "employer", reason: "Deliverable did not match agreed scope.", status: "RESOLVED", created_at: "2026-03-05" },
];

const statusConfig = {
  OPEN:      { icon: <Clock className="w-3.5 h-3.5" />,        cls: "bg-amber-500/10 text-amber-600 dark:text-amber-400" },
  RESOLVED:  { icon: <CheckCircle2 className="w-3.5 h-3.5" />, cls: "bg-green-500/10 text-green-600 dark:text-green-400" },
  DISMISSED: { icon: <X className="w-3.5 h-3.5" />,            cls: "bg-zinc-500/10 text-zinc-500" },
};

export default function DisputesPage() {
  const [disputes, setDisputes] = useState<Dispute[]>(MOCK);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ project: "", milestone: "", reason: "" });
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setDisputes(d => [...d, {
      id: Date.now().toString(),
      project: form.project,
      milestone: form.milestone,
      raised_by: "freelancer",
      reason: form.reason,
      status: "OPEN",
      created_at: new Date().toISOString().split("T")[0],
    }]);
    setSubmitted(true);
    setShowForm(false);
    setForm({ project: "", milestone: "", reason: "" });
  };

  return (
    <main className="min-h-[calc(100svh-3.5rem)] px-4 py-10 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-3xl space-y-6">

        {/* Header card */}
        <motion.div whileHover={{ y: -2, transition: { duration: 0.2 } }}
          className="rounded-[2rem] border border-border/60 bg-white/80 p-8 shadow-xl shadow-slate-900/5 backdrop-blur dark:bg-zinc-900/70">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-sm font-medium uppercase tracking-[0.24em] text-red-500 dark:text-red-400">Dispute Centre</p>
              <h1 className="mt-2 text-3xl font-medium tracking-tight text-foreground">Project Disputes</h1>
              <p className="mt-1 text-sm text-muted-foreground">Raise or track disputes. Escrow is frozen until resolved.</p>
            </div>
            <button onClick={() => setShowForm(v => !v)}
              className="inline-flex items-center gap-2 rounded-xl bg-red-500/10 px-4 py-2 text-sm font-medium text-red-600 transition hover:bg-red-500/20 dark:text-red-400">
              <Plus className="w-4 h-4" /> Raise Dispute
            </button>
          </div>

          <AnimatePresence>
            {submitted && (
              <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                className="mt-5 flex items-center gap-2 rounded-2xl border border-green-500/20 bg-green-500/10 px-4 py-3 text-sm text-green-700 dark:text-green-400">
                <CheckCircle2 className="w-4 h-4 shrink-0" /> Dispute submitted. Our team will review within 24 hours.
              </motion.div>
            )}
          </AnimatePresence>

          <AnimatePresence>
            {showForm && (
              <motion.form initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                onSubmit={handleSubmit} className="mt-6 space-y-3">
                <div className="grid gap-3 sm:grid-cols-2">
                  <input required value={form.project} onChange={e => setForm(f => ({...f, project: e.target.value}))}
                    placeholder="Project name"
                    className="h-11 rounded-xl border border-border/50 bg-background px-4 text-sm outline-none transition focus:border-red-500/60 placeholder:text-muted-foreground/60" />
                  <input required value={form.milestone} onChange={e => setForm(f => ({...f, milestone: e.target.value}))}
                    placeholder="Milestone name"
                    className="h-11 rounded-xl border border-border/50 bg-background px-4 text-sm outline-none transition focus:border-red-500/60 placeholder:text-muted-foreground/60" />
                </div>
                <textarea required rows={3} value={form.reason} onChange={e => setForm(f => ({...f, reason: e.target.value}))}
                  placeholder="Describe the issue in detail..."
                  className="w-full rounded-2xl border border-border/50 bg-background px-4 py-3 text-sm outline-none transition focus:border-red-500/60 placeholder:text-muted-foreground/60" />
                <div className="flex gap-3">
                  <button type="submit"
                    className="inline-flex h-10 items-center gap-2 rounded-xl bg-red-500 px-5 text-sm font-medium text-white transition hover:bg-red-600">
                    <ShieldAlert className="w-4 h-4" /> Submit Dispute
                  </button>
                  <button type="button" onClick={() => setShowForm(false)}
                    className="inline-flex h-10 items-center rounded-xl border border-border/50 px-4 text-sm text-muted-foreground transition hover:bg-foreground/5">
                    Cancel
                  </button>
                </div>
              </motion.form>
            )}
          </AnimatePresence>
        </motion.div>

        {/* Dispute list */}
        <div className="space-y-4">
          {disputes.map(d => (
            <motion.div key={d.id} whileHover={{ y: -2, transition: { duration: 0.2 } }}
              className="rounded-[2rem] border border-border/60 bg-white/80 p-6 shadow-xl shadow-slate-900/5 backdrop-blur dark:bg-zinc-900/70">
              <div className="flex items-start justify-between gap-4 mb-3">
                <div>
                  <p className="font-medium text-foreground">{d.project} — {d.milestone}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">Raised by {d.raised_by} · {d.created_at}</p>
                </div>
                <span className={cn("inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium", statusConfig[d.status].cls)}>
                  {statusConfig[d.status].icon} {d.status}
                </span>
              </div>
              <p className="text-sm text-muted-foreground">{d.reason}</p>
              {d.status === "OPEN" && (
                <div className="mt-4 flex items-center gap-2 rounded-2xl border border-amber-500/20 bg-amber-500/10 px-4 py-3 text-xs text-amber-700 dark:text-amber-300">
                  <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                  Escrow funds are frozen until this dispute is resolved.
                </div>
              )}
            </motion.div>
          ))}
        </div>

      </div>
    </main>
  );
}
