"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Layers3, AlertCircle, CheckCircle2, Loader2 } from "lucide-react";
import { useEffect, useState } from "react";
import { auth } from "@/lib/firebase";

type AppliedProject = {
  id: string;
  title: string;
  employer_name: string;
  progress: number;
  days_remaining: number;
};

type PayoutStatus = "idle" | "loading" | "connected" | "not_connected";

export default function FreelancerWorkspaceIndexPage() {
  const [projects, setProjects] = useState<AppliedProject[]>([]);
  const [payoutStatus, setPayoutStatus] = useState<PayoutStatus>("idle");
  const [showForm, setShowForm] = useState(false);
  const [paypalEmail, setPaypalEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:9001/api";

  useEffect(() => {
    const raw = window.localStorage.getItem("freelancer:applied-projects");
    if (raw) {
      try { setProjects(JSON.parse(raw) as AppliedProject[]); } catch { setProjects([]); }
    }
    const user = auth.currentUser;
    if (user) checkPayoutStatus(user.uid);

    const params = new URLSearchParams(window.location.search);
    if (params.get("onboarding") === "complete") setPayoutStatus("connected");
  }, []);

  const checkPayoutStatus = async (uid: string) => {
    setPayoutStatus("loading");
    try {
      const res = await fetch(`${apiUrl}/paypal/payout-status/${uid}`);
      const data = await res.json();
      setPayoutStatus(data.connected ? "connected" : "not_connected");
    } catch {
      setPayoutStatus("not_connected");
    }
  };

  const handleSavePayPal = async (e: React.FormEvent) => {
    e.preventDefault();
    const user = auth.currentUser;
    if (!user) return;
    if (!paypalEmail.includes("@")) { setFormError("Enter a valid PayPal email"); return; }
    setSubmitting(true);
    setFormError(null);
    try {
      // Step 1: verify the PayPal account exists
      const verifyRes = await fetch(`${apiUrl}/paypal/verify-email`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: paypalEmail }),
      });
      const verify = await verifyRes.json();

      if (verify.mock) {
        setFormError("⚠️ PayPal keys not configured — skipping verification (dev mode).");
        // allow through in mock mode
      } else if (verify.warning) {
        setFormError(`⚠️ ${verify.warning}`);
        // allow through with warning
      } else if (!verify.exists) {
        setFormError(verify.error || "No PayPal account found for this email.");
        setSubmitting(false);
        return;
      }

      // Step 2: save to backend
      const res = await fetch(`${apiUrl}/paypal/freelancer-onboard`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ freelancer_id: user.uid, paypal_email: paypalEmail }),
      });
      const data = await res.json();
      if (data.connected) {
        setPayoutStatus("connected");
        setShowForm(false);
      } else {
        setFormError("Failed to save. Please try again.");
      }
    } catch {
      setFormError("Network error. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

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

        {/* PayPal payout setup */}
        {payoutStatus === "loading" && (
          <div className="flex items-center gap-3 rounded-[2rem] border border-border/60 bg-white/80 p-5 text-sm text-muted-foreground backdrop-blur">
            <Loader2 className="h-4 w-4 animate-spin" />
            Checking payout account...
          </div>
        )}

        {payoutStatus === "not_connected" && !showForm && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-[2rem] border border-amber-500/30 bg-amber-500/10 p-6"
          >
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-start gap-3">
                <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-amber-600" />
                <div>
                  <p className="font-medium text-amber-800 dark:text-amber-200">
                    Add your PayPal to receive payments
                  </p>
                  <p className="mt-1 text-sm text-amber-700/80 dark:text-amber-300/80">
                    Milestone payments are sent directly to your PayPal account when approved.
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowForm(true)}
                className="inline-flex shrink-0 items-center gap-2 rounded-xl bg-[#0070ba] px-5 py-2.5 text-sm font-medium text-white transition hover:bg-[#005ea6]"
              >
                Connect PayPal
              </button>
            </div>
          </motion.div>
        )}

        {payoutStatus === "not_connected" && showForm && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-[2rem] border border-border/60 bg-white/80 p-8 shadow-xl backdrop-blur dark:bg-zinc-900/70"
          >
            <p className="text-sm font-medium uppercase tracking-[0.24em] text-green-600">
              Payout setup
            </p>
            <h2 className="mt-2 text-2xl font-medium text-foreground">Your PayPal email</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Milestone payments will be sent to this PayPal account automatically.
            </p>

            <form onSubmit={handleSavePayPal} className="mt-6 space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">PayPal email address</label>
                <input
                  type="email"
                  value={paypalEmail}
                  onChange={(e) => setPaypalEmail(e.target.value)}
                  placeholder="you@example.com"
                  className="h-11 w-full rounded-xl border border-border/50 bg-background px-4 text-sm outline-none transition focus:border-green-500/60"
                />
              </div>

              {formError && (
                <p className="rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-2 text-sm text-red-600">
                  {formError}
                </p>
              )}

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="flex-1 rounded-xl border border-border/60 py-2.5 text-sm font-medium transition hover:bg-foreground/5"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-[#0070ba] py-2.5 text-sm font-medium text-white transition hover:bg-[#005ea6] disabled:opacity-60"
                >
                  {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                  {submitting ? "Saving..." : "Save PayPal email"}
                </button>
              </div>
            </form>
          </motion.div>
        )}

        {payoutStatus === "connected" && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center gap-3 rounded-[2rem] border border-green-500/30 bg-green-500/10 p-5 text-sm text-green-700 dark:text-green-300"
          >
            <CheckCircle2 className="h-5 w-5 shrink-0" />
            PayPal connected — milestone payments will be sent to your account automatically.
          </motion.div>
        )}

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
