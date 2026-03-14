"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { AnimatePresence } from "framer-motion";

import Toast, { type ToastMessage, type ToastType } from "@/components/Toast";

const TOAST_DURATION = 4000;
const MAX_TOASTS = 3;

type ToastContextValue = {
  toast: {
    success: (title: string, description?: string) => void;
    error: (title: string, description?: string) => void;
    info: (title: string, description?: string) => void;
  };
};

const ToastContext = createContext<ToastContextValue | undefined>(undefined);

function createToast(type: ToastType, title: string, description?: string): ToastMessage {
  return {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    type,
    title,
    description,
  };
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const dismiss = useCallback((id: string) => {
    setToasts((current) => current.filter((toast) => toast.id !== id));
  }, []);

  const pushToast = useCallback(
    (type: ToastType, title: string, description?: string) => {
      const nextToast = createToast(type, title, description);

      setToasts((current) => [...current, nextToast].slice(-MAX_TOASTS));

      window.setTimeout(() => {
        dismiss(nextToast.id);
      }, TOAST_DURATION);
    },
    [dismiss],
  );

  const value = useMemo(
    () => ({
      toast: {
        success: (title: string, description?: string) =>
          pushToast("success", title, description),
        error: (title: string, description?: string) =>
          pushToast("error", title, description),
        info: (title: string, description?: string) =>
          pushToast("info", title, description),
      },
    }),
    [pushToast],
  );

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className="pointer-events-none fixed bottom-4 right-4 z-[60] flex w-full max-w-sm flex-col gap-3 px-4 sm:px-0">
        <AnimatePresence initial={false}>
          {toasts.map((toast) => (
            <Toast key={toast.id} toast={toast} onDismiss={() => dismiss(toast.id)} />
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

export default ToastProvider;
