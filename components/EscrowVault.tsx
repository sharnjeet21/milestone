"use client";

import { ArrowDownLeft, ArrowUpRight, AlertTriangle } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

import { cn } from "@/lib/utils";

type VaultTransaction = {
  id: string;
  type: "IN" | "OUT" | "REF";
  description: string;
  amount: number;
  date?: string;
};

type EscrowVaultProps = {
  totalAmount: number;
  releasedAmount: number;
  lockedAmount: number;
  transactions: VaultTransaction[];
  className?: string;
};

function currency(value: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(value);
}

export function EscrowVault({
  totalAmount,
  releasedAmount,
  lockedAmount,
  transactions,
  className,
}: EscrowVaultProps) {
  const [expanded, setExpanded] = useState(false);
  const [fillHeight, setFillHeight] = useState(0);

  useEffect(() => {
    const percentage =
      totalAmount > 0 ? Math.max(0, Math.min((lockedAmount / totalAmount) * 100, 100)) : 0;
    const timeoutId = window.setTimeout(() => setFillHeight(percentage), 50);

    return () => window.clearTimeout(timeoutId);
  }, [lockedAmount, totalAmount]);

  const visibleTransactions = useMemo(
    () => (expanded ? transactions : transactions.slice(0, 5)),
    [expanded, transactions],
  );

  return (
    <div
      className={cn(
        "rounded-[2rem] border border-border/60 bg-white/85 p-6 shadow-xl shadow-slate-900/5 backdrop-blur dark:bg-zinc-900/70",
        className,
      )}
    >
      <h3 className="text-lg font-medium text-foreground">Escrow Vault</h3>

      <div className="mt-6 flex items-center gap-6">
        <div className="relative h-52 w-16 overflow-hidden rounded-full border border-border/60 bg-zinc-100 dark:bg-zinc-950">
          <div
            className="absolute bottom-0 left-0 w-full rounded-full bg-gradient-to-t from-green-600 via-green-500 to-emerald-300 transition-[height] duration-700 ease-out"
            style={{ height: `${fillHeight}%` }}
          />
        </div>

        <div className="space-y-2">
          <p className="text-3xl font-medium text-foreground">{currency(lockedAmount)}</p>
          <p className="text-sm text-muted-foreground">secured in vault</p>
          <div className="pt-2 text-sm text-muted-foreground">
            <p>Released: {currency(releasedAmount)}</p>
            <p>Total: {currency(totalAmount)}</p>
          </div>
        </div>
      </div>

      <div className="mt-8">
        <div className="flex items-center justify-between gap-4">
          <p className="text-sm font-medium text-foreground">Transaction feed</p>
          {transactions.length > 5 ? (
            <button
              type="button"
              onClick={() => setExpanded((current) => !current)}
              className="text-sm font-medium text-green-700 transition hover:text-green-800 dark:text-green-300 dark:hover:text-green-200"
            >
              {expanded ? "View less" : "View all"}
            </button>
          ) : null}
        </div>

        <div className="mt-4 space-y-3">
          {visibleTransactions.map((transaction) => (
            <div
              key={transaction.id}
              className="flex items-center justify-between rounded-xl bg-zinc-50 px-4 py-3 dark:bg-zinc-950"
            >
              <div className="flex items-center gap-3">
                <span
                  className={cn(
                    "inline-flex items-center gap-1 rounded-full px-2 py-1 text-[11px] font-medium",
                    transaction.type === "IN"
                      ? "bg-green-500/10 text-green-700 dark:text-green-300"
                      : transaction.type === "OUT"
                        ? "bg-blue-500/10 text-blue-700 dark:text-blue-300"
                        : "bg-red-500/10 text-red-700 dark:text-red-300",
                  )}
                >
                  {transaction.type === "IN" ? (
                    <ArrowDownLeft className="h-3 w-3" />
                  ) : transaction.type === "OUT" ? (
                    <ArrowUpRight className="h-3 w-3" />
                  ) : (
                    <AlertTriangle className="h-3 w-3" />
                  )}
                  {transaction.type}
                </span>
                <div>
                  <p className="text-sm text-foreground/90">{transaction.description}</p>
                  {transaction.date ? (
                    <p className="text-xs text-muted-foreground">{transaction.date}</p>
                  ) : null}
                </div>
              </div>
              <span className="text-sm font-medium text-foreground">
                {currency(transaction.amount)}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default EscrowVault;
