"use client";
import React, { createContext, useCallback, useContext, useMemo, useRef, useState } from "react";

type ToastItem = {
  id: number;
  title?: string;
  description?: string;
  variant?: "default" | "success" | "destructive";
  durationMs?: number;
};

type ToastContextValue = {
  toast: (t: Omit<ToastItem, "id">) => void;
};

const ToastContext = createContext<ToastContextValue | null>(null);

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used within <ToastProvider>");
  return ctx;
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const nextId = useRef(1);

  const remove = useCallback((id: number) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const toast = useCallback((t: Omit<ToastItem, "id">) => {
    const id = nextId.current++;
    const item: ToastItem = { id, durationMs: 2500, ...t };
    setToasts((prev) => [...prev, item]);
    const duration = item.durationMs ?? 2500;
    window.setTimeout(() => remove(id), duration);
  }, [remove]);

  const value = useMemo(() => ({ toast }), [toast]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      {/* container */}
      <div className="fixed top-3 right-3 z-50 flex w-full max-w-sm flex-col gap-2">
        {toasts.map((t) => (
          <div
            key={t.id}
            role="status"
            className={[
              "rounded-md border px-3 py-2 text-sm shadow-md backdrop-blur",
              t.variant === "destructive"
                ? "border-red-300/40 bg-red-50/80 text-red-900 dark:border-red-800/40 dark:bg-red-900/40 dark:text-red-50"
                : t.variant === "success"
                ? "border-emerald-300/40 bg-emerald-50/80 text-emerald-900 dark:border-emerald-800/40 dark:bg-emerald-900/40 dark:text-emerald-50"
                : "border-black/10 bg-white/80 text-black dark:border-white/10 dark:bg-black/40 dark:text-white",
            ].join(" ")}
          >
            {t.title && <div className="font-medium">{t.title}</div>}
            {t.description && (
              <div className="opacity-80">{t.description}</div>
            )}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}
