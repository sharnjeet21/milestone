"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { AnimatePresence, motion } from "framer-motion";

type Toast = {
  id: number;
  title: string;
  description?: string;
};

type ToastContextValue = {
  toast: (input: Omit<Toast, "id">) => void;
};

const ToastContext = createContext<ToastContextValue | undefined>(undefined);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const toast = useCallback((input: Omit<Toast, "id">) => {
    const id = Date.now();

    setToasts((current) => [...current, { id, ...input }]);

    window.setTimeout(() => {
      setToasts((current) => current.filter((item) => item.id !== id));
    }, 4000);
  }, []);

  const value = useMemo(() => ({ toast }), [toast]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className="pointer-events-none fixed bottom-4 right-4 z-[60] flex w-full max-w-sm flex-col gap-3 px-4 sm:px-0">
        <AnimatePresence>
          {toasts.map((item) => (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 12 }}
              className="pointer-events-auto rounded-2xl border border-border/60 bg-background/95 p-4 shadow-lg shadow-slate-950/10 backdrop-blur"
            >
              <p className="text-sm font-semibold text-foreground">{item.title}</p>
              {item.description ? (
                <p className="mt-1 text-sm text-foreground/70">
                  {item.description}
                </p>
              ) : null}
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);

  if (!context) {
    throw new Error("useToast must be used within a ToastProvider");
  }

  return context;
}
