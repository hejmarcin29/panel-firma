"use client";
import * as React from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { saveDailyGoal } from "@/app/actions/settings";

type Props = { triggerClassName?: string };

export function DailyGoalDialog({ triggerClassName }: Props) {
  const [open, setOpen] = React.useState(false);
  const [value, setValue] = React.useState("");
  const [pending, setPending] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setPending(true);
    setError(null);
    try {
      const fd = new FormData();
      fd.set("dailyGoal", value);
      const res = await saveDailyGoal(fd);
      if (!res.ok) {
        setError(res.error);
        return;
      }
      setOpen(false);
    } finally {
      setPending(false);
    }
  };

  return (
    <Dialog.Root open={open} onOpenChange={setOpen}>
      <Dialog.Trigger asChild>
        <button
          className={
            triggerClassName ||
            "text-xs underline opacity-80 hover:opacity-100 focus:outline-none"
          }
        >
          Zmień
        </button>
      </Dialog.Trigger>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />
        <Dialog.Content className="fixed left-1/2 top-1/2 z-50 w-full max-w-sm -translate-x-1/2 -translate-y-1/2 rounded-md border border-black/10 bg-white p-4 text-black shadow-lg outline-none dark:border-white/10 dark:bg-neutral-900 dark:text-white">
          <Dialog.Title className="text-base font-semibold">Ustaw cel dzienny</Dialog.Title>
          <form onSubmit={onSubmit} className="mt-3 space-y-3">
            <div>
              <label htmlFor="dailyGoal" className="block text-sm mb-1">
                Cel (na dzień)
              </label>
              <input
                id="dailyGoal"
                value={value}
                onChange={(e) => setValue(e.target.value)}
                inputMode="numeric"
                className="w-40 rounded-md border px-3 py-2 bg-transparent"
                style={{ borderColor: "var(--pp-border)" }}
              />
              <div className="text-xs opacity-70 mt-1">Podaj liczbę 1–100.</div>
              {error && (
                <div className="text-xs text-red-600 mt-1">{error}</div>
              )}
            </div>
            <div className="flex justify-end gap-2">
              <Dialog.Close asChild>
                <button
                  type="button"
                  className="h-9 rounded-md border border-black/15 px-3 text-sm hover:bg-black/5 dark:border-white/15 dark:hover:bg-white/10"
                >
                  Anuluj
                </button>
              </Dialog.Close>
              <button
                type="submit"
                disabled={pending}
                className="h-9 rounded-md px-3 text-sm text-white bg-black hover:bg-black/85 dark:bg-white dark:text-black dark:hover:bg-white/90 disabled:opacity-60"
              >
                Zapisz
              </button>
            </div>
          </form>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
