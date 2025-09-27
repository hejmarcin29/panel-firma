"use client";
import * as React from "react";
import * as Popover from "@radix-ui/react-popover";
import { Calendar } from "@/components/ui/calendar";

export function DatePicker({ value, onChange, placeholder = "Wybierz datę" }: { value?: string; onChange?: (next: string) => void; placeholder?: string }) {
  const [open, setOpen] = React.useState(false);
  const selected = React.useMemo(() => {
    if (!value) return undefined;
    const [y, m, d] = value.split("-").map((x) => parseInt(x, 10));
    return new Date(y, (m || 1) - 1, d || 1);
  }, [value]);

  function onSelect(day?: Date) {
    if (!day) return;
    const y = day.getFullYear();
    const m = String(day.getMonth() + 1).padStart(2, "0");
    const d = String(day.getDate()).padStart(2, "0");
    onChange?.(`${y}-${m}-${d}`);
    setOpen(false);
  }

  return (
    <Popover.Root open={open} onOpenChange={setOpen}>
      <Popover.Trigger asChild>
        <button type="button" className="h-9 w-52 rounded-md border border-black/15 bg-transparent px-3 text-left text-sm dark:border-white/15">
          {value ? value : <span className="opacity-60">{placeholder}</span>}
        </button>
      </Popover.Trigger>
      <Popover.Portal>
        <Popover.Content sideOffset={6} className="z-50 rounded-md border border-black/15 bg-white p-2 text-sm shadow-lg outline-none dark:border-white/15 dark:bg-neutral-900">
          <Calendar mode="single" selected={selected} onSelect={onSelect} />
        </Popover.Content>
      </Popover.Portal>
    </Popover.Root>
  );
}
