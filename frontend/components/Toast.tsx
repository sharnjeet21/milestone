"use client";

import { motion } from "framer-motion";
import { AlertTriangle, CheckCircle2, Info } from "lucide-react";

import { cn } from "@/lib/utils";

export type ToastType = "success" | "error" | "info";

export type ToastMessage = {
  id: string;
  type: ToastType;
  title: string;
  description?: string;
};

type ToastProps = {
  toast: ToastMessage;
  onDismiss?: () => void;
};

const toneStyles: Record<ToastType, { icon: typeof CheckCircle2; className: string }> = {
  success: {
    icon: CheckCircle2,
    className: "border-green-500/30 bg-green-500/10 text-green-700 dark:text-green-300",
  },
  error: {
    icon: AlertTriangle,
    className: "border-red-500/30 bg-red-500/10 text-red-700 dark:text-red-300",
  },
  info: {
    icon: Info,
    className: "border-blue-500/30 bg-blue-500/10 text-blue-700 dark:text-blue-300",
  },
};

export function Toast({ toast, onDismiss }: ToastProps) {
  const ToneIcon = toneStyles[toast.type].icon;

  return (
    <motion.div
      initial={{ opacity: 0, x: 24 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 24 }}
      onClick={onDismiss}
      className={cn(
        "pointer-events-auto flex gap-3 rounded-2xl border p-4 shadow-lg shadow-slate-950/10 backdrop-blur transition",
        "bg-background/95",
        toneStyles[toast.type].className,
      )}
    >
      <div className="mt-0.5 flex h-8 w-8 items-center justify-center rounded-full bg-white/70 text-current dark:bg-black/20">
        <ToneIcon className="h-4 w-4" />
      </div>
      <div className="min-w-0">
        <p className="text-sm font-semibold text-foreground">{toast.title}</p>
        {toast.description ? (
          <p className="mt-1 text-sm text-foreground/70">{toast.description}</p>
        ) : null}
      </div>
    </motion.div>
  );
}

export default Toast;
