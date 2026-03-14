"use client";

import { motion } from "framer-motion";
import {
  ChevronLeft,
  ChevronRight,
  CircleDollarSign,
  Clock,
  Gift,
  Info,
  Loader2,
} from "lucide-react";
import { useEffect, useState } from "react";
import {
  collection,
  doc,
  getDoc,
  getDocs,
  orderBy,
  query,
  setDoc,
  serverTimestamp,
} from "firebase/firestore";

import { db } from "@/lib/firebase";
import { onAuthChange } from "@/lib/auth";
import { cn } from "@/lib/utils";

type PayStatus = "Paid" | "Pending" | "Processing";

export type EarningEntry = {
  id: string;
  period: string;
  tasks: number | null;
  payout: number;
  account: string;
  status: PayStatus;
  createdAt: string;
};

const PAGE_SIZE = 8;

function currency(value: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
  }).format(value);
}

function StatusBadge({ status }: { status: PayStatus }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium",
        status === "Paid" && "bg-green-500/10 text-green-600 dark:text-green-400",
        status === "Pending" && "bg-amber-500/10 text-amber-600 dark:text-amber-400",
        status === "Processing" && "bg-blue-500/10 text-blue-600 dark:text-blue-400",
      )}
    >
      {status}
    </span>
  );
}

// ── Firestore helpers ─────────────────────────────────────────────────────────

async function fetchEarnings(uid: string): Promise<EarningEntry[]> {
  const q = query(
    collection(db, "users", uid, "earnings"),
    orderBy("createdAt", "desc"),
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }) as EarningEntry);
}

async function fetchUserMeta(uid: string) {
  const snap = await getDoc(doc(db, "users", uid));
  return snap.exists() ? snap.data() : null;
}

// Called externally (e.g. from milestone payment flow) to record a payout
export async function recordEarning(
  uid: string,
  entry: Omit<EarningEntry, "id" | "createdAt">,
) {
  const id = `earn_${Date.now()}`;
  await setDoc(doc(db, "users", uid, "earnings", id), {
    ...entry,
    createdAt: serverTimestamp(),
  });
}

type Tab = "earnings" | "payouts";

export default function EarningsPage() {
  const [earnings, setEarnings] = useState<EarningEntry[]>([]);
  const [paypalEmail, setPaypalEmail] = useState<string>("—");
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<Tab>("earnings");
  const [page, setPage] = useState(0);

  useEffect(() => {
    const unsub = onAuthChange(async (u) => {
      if (!u) { setLoading(false); return; }

      try {
        const [rows, meta] = await Promise.all([
          fetchEarnings(u.uid),
          fetchUserMeta(u.uid),
        ]);
        setEarnings(rows);
        setPaypalEmail(meta?.paypalEmail ?? "—");
      } catch (e) {
        console.error("Failed to load earnings", e);
      } finally {
        setLoading(false);
      }
    });
    return unsub;
  }, []);

  const totalEarnings = earnings.reduce((s, e) => s + e.payout, 0);
  const pendingEarnings = earnings
    .filter((e) => e.status === "Pending" || e.status === "Processing")
    .reduce((s, e) => s + e.payout, 0);

  const totalPages = Math.ceil(earnings.length / PAGE_SIZE);
  const visible = earnings.slice(page * PAGE_SIZE, page * PAGE_SIZE + PAGE_SIZE);

  return (
    <main className="min-h-[calc(100svh-3.5rem)] px-4 py-10 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-5xl space-y-6">

        {/* Header */}
        <motion.div
          whileHover={{ y: -2, transition: { duration: 0.2 } }}
          className="rounded-[2rem] border border-border/60 bg-white/80 p-8 shadow-xl shadow-slate-900/5 backdrop-blur dark:bg-zinc-900/70"
        >
          <p className="text-sm font-medium uppercase tracking-[0.24em] text-green-600 dark:text-green-400">
            Earnings
          </p>
          <h1 className="mt-2 text-4xl font-medium tracking-tight text-foreground">
            Your Payments
          </h1>

          <div className="mt-6 flex items-start gap-3 rounded-2xl border border-border/50 bg-background/60 p-4 text-sm text-muted-foreground">
            <Info className="mt-0.5 h-4 w-4 shrink-0 text-green-600 dark:text-green-400" />
            <span>Payments are made weekly on Tuesday night Pacific Time via PayPal.</span>
          </div>

          <div className="mt-6 grid gap-4 sm:grid-cols-3">
            <div className="rounded-2xl border border-border/50 bg-background/60 p-5">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <CircleDollarSign className="h-4 w-4" />
                Total Earned
              </div>
              {loading ? (
                <div className="mt-3 h-8 w-24 animate-pulse rounded-lg bg-foreground/10" />
              ) : (
                <p className="mt-3 text-3xl font-medium text-foreground">{currency(totalEarnings)}</p>
              )}
              <p className="mt-1 text-xs text-muted-foreground">all time</p>
            </div>

            <div className="rounded-2xl border border-border/50 bg-background/60 p-5">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Gift className="h-4 w-4" />
                Pending
              </div>
              {loading ? (
                <div className="mt-3 h-8 w-20 animate-pulse rounded-lg bg-foreground/10" />
              ) : (
                <p className="mt-3 text-3xl font-medium text-amber-600">{currency(pendingEarnings)}</p>
              )}
              <p className="mt-1 text-xs text-muted-foreground">awaiting payout</p>
            </div>

            <div className="rounded-2xl border border-border/50 bg-background/60 p-5">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <CircleDollarSign className="h-4 w-4" />
                Payout Account
              </div>
              <p className="mt-3 text-base font-medium text-foreground truncate">{paypalEmail}</p>
              <p className="mt-1 text-xs text-muted-foreground">PayPal</p>
            </div>
          </div>
        </motion.div>

        {/* Table */}
        <motion.div
          whileHover={{ y: -2, transition: { duration: 0.2 } }}
          className="rounded-[2rem] border border-border/60 bg-white/80 shadow-xl shadow-slate-900/5 backdrop-blur dark:bg-zinc-900/70"
        >
          <div className="flex border-b border-border/50 px-6 pt-6">
            {(["earnings", "payouts"] as Tab[]).map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => setTab(t)}
                className={cn(
                  "relative mr-6 pb-3 text-sm font-medium capitalize transition-colors",
                  tab === t ? "text-foreground" : "text-muted-foreground hover:text-foreground",
                )}
              >
                {t.charAt(0).toUpperCase() + t.slice(1)}
                {tab === t && (
                  <span className="absolute inset-x-0 -bottom-px h-0.5 rounded-full bg-green-500" />
                )}
              </button>
            ))}
          </div>

          <div className="border-b border-border/50 px-6 py-4">
            <p className="mb-2 text-xs font-medium uppercase tracking-widest text-muted-foreground">
              Important information
            </p>
            <ul className="space-y-1 text-sm text-muted-foreground">
              {[
                "Payments are made weekly on Tuesday night Pacific Time.",
                "PayPal payouts are typically deposited no later than Wednesday 11:59 PM PT.",
                "Failed payments will retry the next day and every Friday for 5 weeks.",
              ].map((item) => (
                <li key={item} className="flex items-start gap-2">
                  <Clock className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                  {item}
                </li>
              ))}
            </ul>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="h-6 w-6 animate-spin text-green-600" />
            </div>
          ) : earnings.length === 0 ? (
            <div className="py-16 text-center text-sm text-muted-foreground">
              No earnings yet. Complete a milestone to see your first payout here.
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border/50 text-left text-xs font-medium uppercase tracking-widest text-muted-foreground">
                      <th className="px-6 py-3">Pay Period</th>
                      <th className="px-6 py-3">Tasks</th>
                      <th className="px-6 py-3">Payout</th>
                      <th className="px-6 py-3">Account</th>
                      <th className="px-6 py-3">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/40">
                    {visible.map((row) => (
                      <tr key={row.id} className="transition-colors hover:bg-foreground/[0.02]">
                        <td className="px-6 py-4 font-medium text-foreground">{row.period}</td>
                        <td className="px-6 py-4 text-muted-foreground">
                          {row.tasks != null ? `${row.tasks} tasks` : "—"}
                        </td>
                        <td className="px-6 py-4 font-medium text-foreground">{currency(row.payout)}</td>
                        <td className="px-6 py-4 text-muted-foreground">{row.account}</td>
                        <td className="px-6 py-4">
                          <StatusBadge status={row.status} />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {totalPages > 1 && (
                <div className="flex items-center justify-between border-t border-border/50 px-6 py-4">
                  <p className="text-xs text-muted-foreground">
                    Page {page + 1} of {totalPages}
                  </p>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setPage((p) => Math.max(0, p - 1))}
                      disabled={page === 0}
                      className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-border/50 text-foreground/70 transition hover:bg-foreground/5 disabled:opacity-40"
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
                      disabled={page === totalPages - 1}
                      className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-border/50 text-foreground/70 transition hover:bg-foreground/5 disabled:opacity-40"
                    >
                      <ChevronRight className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </motion.div>
      </div>
    </main>
  );
}
