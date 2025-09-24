"use client";
import * as React from "react";

type AlertDialogProps = {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  title?: string;
  description?: React.ReactNode;
  cancelText?: string;
  confirmText?: string;
  confirmVariant?: "default" | "destructive";
  onConfirm?: () => void | Promise<void>;
  showCancelButton?: boolean;
  showConfirmButton?: boolean;
};

export function AlertDialog({
  open,
  onOpenChange,
  title = "Potwierdzenie",
  description,
  cancelText = "Anuluj",
  confirmText = "Potwierdź",
  confirmVariant = "default",
  onConfirm,
  showCancelButton = true,
  showConfirmButton = true,
}: AlertDialogProps) {
  const dialogRef = React.useRef<HTMLDivElement>(null);
  const cancelRef = React.useRef<HTMLButtonElement>(null);
  const confirmRef = React.useRef<HTMLButtonElement>(null);
  const prevActive = React.useRef<HTMLElement | null>(null);

  React.useEffect(() => {
    if (open) {
      prevActive.current = document.activeElement as HTMLElement | null;
      const focusTarget = showCancelButton
        ? cancelRef.current
        : showConfirmButton
        ? confirmRef.current
        : null;
      setTimeout(() => focusTarget?.focus(), 0);
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
      prevActive.current?.focus?.();
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [open, showCancelButton, showConfirmButton]);

  React.useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (!open) return;
      if (e.key === "Escape") onOpenChange(false);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onOpenChange]);

  if (!open) return null;

  const hasActions = showCancelButton || showConfirmButton;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      aria-modal
      role="dialog"
      aria-labelledby="alert-title"
      aria-describedby={description ? "alert-desc" : undefined}
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onOpenChange(false);
      }}
    >
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
      <div
        ref={dialogRef}
        className="relative z-10 w-full max-w-sm rounded-md border border-black/10 bg-white p-4 text-black shadow-lg dark:border-white/10 dark:bg-neutral-900 dark:text-white"
      >
        <h2 id="alert-title" className="text-base font-semibold">
          {title}
        </h2>
        {description && (
          <div id="alert-desc" className="mt-1 text-sm opacity-80 space-y-2">
            {description}
          </div>
        )}
        {hasActions && (
          <div className="mt-4 flex justify-end gap-2">
            {showCancelButton && (
              <button
                ref={cancelRef}
                className="h-9 rounded-md border border-black/15 px-3 text-sm hover:bg-black/5 dark:border-white/15 dark:hover:bg-white/10"
                onClick={() => onOpenChange(false)}
              >
                {cancelText}
              </button>
            )}
            {showConfirmButton && (
              <button
                ref={confirmRef}
                className={[
                  "h-9 rounded-md px-3 text-sm text-white",
                  confirmVariant === "destructive"
                    ? "bg-red-600 hover:bg-red-700"
                    : "bg-black hover:bg-black/85 dark:bg-white dark:text-black dark:hover:bg-white/90",
                ].join(" ")}
                onClick={async () => {
                  await onConfirm?.();
                  onOpenChange(false);
                }}
              >
                {confirmText}
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
