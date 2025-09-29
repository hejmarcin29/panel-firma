"use client";
import * as React from "react";
import * as Dialog from "@radix-ui/react-dialog";

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
  const hasActions = showCancelButton || showConfirmButton;

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />
        <Dialog.Content className="fixed left-1/2 top-1/2 z-50 w-full max-w-sm -translate-x-1/2 -translate-y-1/2 rounded-md border border-black/10 bg-white p-4 text-black shadow-lg outline-none dark:border-white/10 dark:bg-neutral-900 dark:text-white data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95">
          <Dialog.Title className="text-base font-semibold">
            {title}
          </Dialog.Title>
          {description && (
            <Dialog.Description asChild>
              <div className="mt-1 text-sm opacity-80 space-y-2">
                {description}
              </div>
            </Dialog.Description>
          )}
          {hasActions && (
            <div className="mt-4 flex justify-end gap-2">
              {showCancelButton && (
                <Dialog.Close asChild>
                  <button className="h-9 rounded-md border border-black/15 px-3 text-sm hover:bg-black/5 dark:border-white/15 dark:hover:bg-white/10">
                    {cancelText}
                  </button>
                </Dialog.Close>
              )}
              {showConfirmButton && (
                <Dialog.Close asChild>
                  <button
                    className={[
                      "h-9 rounded-md px-3 text-sm text-white",
                      confirmVariant === "destructive"
                        ? "bg-red-600 hover:bg-red-700"
                        : "bg-black hover:bg-black/85 dark:bg-white dark:text-black dark:hover:bg-white/90",
                    ].join(" ")}
                    onClick={async () => {
                      await onConfirm?.();
                    }}
                  >
                    {confirmText}
                  </button>
                </Dialog.Close>
              )}
            </div>
          )}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
