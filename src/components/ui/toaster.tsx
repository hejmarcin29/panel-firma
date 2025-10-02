"use client";
import React, { createContext, useContext, useMemo } from "react";
import { Toaster as SonnerToaster, toast as sonnerToast } from "sonner";

type ToastVariant = "default" | "success" | "destructive";

type ToastInput = {
  title?: string;
  description?: string;
  variant?: ToastVariant;
  durationMs?: number;
};

type ToastContextValue = {
  toast: (t: ToastInput) => void;
};

const ToastContext = createContext<ToastContextValue | null>(null);

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used within <ToastProvider>");
  return ctx;
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const toast = (t: ToastInput) => {
    const { title, description, variant = "default", durationMs } = t;
    const duration = durationMs ?? 2500;
    // Map our variants to sonner styles
    if (variant === "destructive") {
      sonnerToast.error(title ?? "Błąd", { description, duration });
      return;
    }
    if (variant === "success") {
      sonnerToast.success(title ?? "Sukces", { description, duration });
      return;
    }
    sonnerToast(title ?? "", { description, duration });
  };

  const value = useMemo(() => ({ toast }), []);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <SonnerToaster
        position="top-right"
        richColors
        expand
        theme="light"
        toastOptions={{
          classNames: {
            toast: "border shadow-md border-[var(--pp-border)] bg-[var(--pp-surface)]",
            success: "!bg-emerald-600 !text-white",
            error: "!bg-rose-600 !text-white",
            description: "opacity-90",
          },
        }}
      />
    </ToastContext.Provider>
  );
}
