"use client";

import { motion } from "framer-motion";
import { ChevronLeft, ChevronRight, CircleDollarSign, Clock, Gift, Info } from "lucide-react";
import { useState } from "react";

import { cn } from "@/lib/utils";

type PayStatus = "Paid" | "Pending" | "Processing";

type PayPeriod = {
  period: string;
  tasks: number | null;
  payout: number;
  account: string;
  status: PayStatus;
};

const PAST_EARNINGS: PayPeriod[] = [
  { period: "Current Earnings", tasks: null, payout: 0.0, account: "—", status: "Pending" },
  { period: "May 13 – May 20, 2025", tasks: null, payout: 0.07, account: "PayPal", status: "Paid" },
  { period: "Apr 29 – May 6, 2025", tasks: 48, payout: 30.0, account: "PayPal", status: "Paid" },
  { period: "Mar 4 – Mar 11, 2025", tasks: 6, payout: 75.96, account: "PayPal", status: "Paid" },
  { period: "Feb 25 – Mar 4, 2025", tasks: 8, payout: 109.81, account: "PayPal", status: "Paid" },
  { period: "Feb 18 – Feb 25, 2025", tasks: 6, payout: 61.04, account: "PayPal", status: "Paid" },
  { period: "Feb 4 – Feb 11, 2025", tasks: 7, payout: 82.84, account: "PayPal", status: "Paid" },
  { period: "Jan 28 – Feb 4, 2025", tasks: 6, payout: 43.44, account: "PayPal", status: "Paid" },
  { period: "Jan 21 – Jan 28, 2025", tasks: 4, payout: 13.93, account: "PayPal", status: "Paid" },
  { period: "Dec 31 – Jan 7, 2025", tasks: 10, payout: 445.04, account: "PayPal", status: "Paid" },
  { period: "Dec 24 – Dec 31, 2024", tasks: 2, payout: 54.47, account: "PayPal", status: "Paid" },
];

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
    <span className={cn(
      "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium",
      status === "Paid" && "bg-green-500/10 text-green-600 dark:text-green-400",
      status === "Pending" && "bg-amber-500/10 text-amber-600 dark:text-amber-400",
      status === "Processing" && "bg-blue-500/10 text-blue-600 dark:text-blue-400",
    )}>
      {status}
    </span>
  );
}

type Tab = "earnings" | "payouts";

export default function EarningsPage() {
  const [tab, setTab] = useState<Tab>("earnings");
  const [page, setPage] = useState(0);

  const totalEarnings = PAST_EARNINGS.reduce((sum, p) => sum + p.payout, 0);
  const rewardEarnings = 203.5;
  const thisPayPeriod = 0;

  const totalPages = Math.ceil(PAST_EARNINGS.length / PAGE_SIZE);
  const visible = PAST_EARNINGS.slice(page * PAGE_SIZE, page * PAGE_SIZE + PAGE_SIZE);

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

          {/* Info banner */}
          <div className="mt-6 flex items-start gap-3 rounded-2xl border border-border/50 bg-background/60 p-4 text-sm text-muted-foreground">
            <Info className="mt-0.5 h-4 w-4 shrink-0 text-green-600 dark:text-green-400" />
            <span>Payments are made weekly on Tuesday night Pacific Time.</span>
          </div>

          {/* Stats */}
          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            <div className="rounded-2xl border border-border/50 bg-background/60 p-5">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <CircleDollarSign className="h-4 w-4" />
                Total Earnings
              </div>
              <p className="mt-3 text-3xl font-medium text-foreground">{currency(totalEarnings)}</p>
              <p className="mt-1 text-sm text-muted-foreground">
                {currency(thisPayPeriod)} this pay period
              </p>
            </div>

            <div className="rounded-2xl border border-border/50 bg-background/60 p-5">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Gift className="h-4 w-4" />
                Reward Earnings
              </div>
              <p className="mt-3 text-3xl font-medium text-foreground">{currency(rewardEarnings)}</p>
              <p className="mt-1 text-sm text-muted-foreground">
                {currency(thisPayPeriod)} this pay period
              </p>
            </div>
          </div>
        </motion.div>

        {/* Past Earnings table */}
        <motion.div
          whileHover={{ y: -2, transition: { duration: 0.2 } }}
          className="rounded-[2rem] border border-border/60 bg-white/80 shadow-xl shadow-slate-900/5 backdrop-blur dark:bg-zinc-900/70"
        >
          {/* Tabs */}
          <div className="flex border-b border-border/50 px-6 pt-6">
            {(["earnings", "payouts"] as Tab[]).map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => setTab(t)}
                className={cn(
                  "relative mr-6 pb-3 text-sm font-medium capitalize transition-colors",
                  tab === t
                    ? "text-foreground"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                {t.charAt(0).toUpperCase() + t.slice(1)}
                {tab === t && (
                  <span className="absolute inset-x-0 -bottom-px h-0.5 rounded-full bg-green-500" />
                )}
              </button>
            ))}
          </div>

          {/* Important info */}
          <div className="border-b border-border/50 px-6 py-4">
            <p className="mb-2 text-xs font-medium uppercase tracking-widest text-muted-foreground">
              Important information
            </p>
            <ul className="space-y-1 text-sm text-muted-foreground">
              <li className="flex items-start gap-2">
                <Clock className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                Payments are made weekly on Tuesday night Pacific Time.
              </li>
              <li className="flex items-start gap-2">
                <Clock className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                PayPal and AirTM payouts are typically deposited no later than Wednesday 11:59 PM PT.
              </li>
              <li className="flex items-start gap-2">
                <Clock className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                Bank transfers take 3–5 days to arrive.
              </li>
              <li className="flex items-start gap-2">
                <Clock className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                Failed payments will retry the next day and every Friday for 5 weeks.
              </li>
            </ul>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border/50 text-left text-xs font-medium uppercase tracking-widest text-muted-foreground">
                  <th className="px-6 py-3">Pay Period</th>
                  <th className="px-6 py-3">Tasks Completed</th>
                  <th className="px-6 py-3">Payout</th>
                  <th className="px-6 py-3">Payment Account</th>
                  <th className="px-6 py-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/40">
                {visible.map((row, i) => (
                  <tr
                    key={i}
                    className="transition-colors hover:bg-foreground/[0.02]"
                  >
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

          {/* Pagination */}
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
        </motion.div>

      </div>
    </main>
  );
}
