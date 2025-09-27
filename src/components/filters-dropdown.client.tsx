"use client";

import { useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Filter } from "lucide-react";
import * as Popover from "@radix-ui/react-popover";

type Props = {
  q: string;
  type: string;
  outcome: string;
  installer: string;
  sort: string;
  dir: string;
  scope: string;
};

export function FiltersDropdown({ q, type, outcome, installer, sort, dir, scope }: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [localScope, setLocalScope] = useState(scope || "active");
  const [localOutcome, setLocalOutcome] = useState(outcome && outcome !== "active" ? outcome : "all");

  function apply(nextScope: string, nextOutcome: string) {
    const params = new URLSearchParams({ q, type, installer, sort, dir });
    if (nextScope && nextScope !== "all") params.set("scope", nextScope); else params.delete("scope");
    if (!nextOutcome || nextOutcome === "all") params.set("outcome", "all"); else params.set("outcome", nextOutcome);
    router.push(`${pathname}?${params.toString()}`);
    setOpen(false);
  }

  function onApply() {
    apply(localScope, localOutcome);
  }

  function onReset() {
    setLocalScope("active");
    setLocalOutcome("all");
    const params = new URLSearchParams({ q, type, installer, sort, dir });
    params.set("outcome", "all");
    params.set("scope", "active");
    router.push(`${pathname}?${params.toString()}`);
    setOpen(false);
  }

  return (
    <Popover.Root open={open} onOpenChange={setOpen}>
      <Popover.Trigger asChild>
        <button
          type="button"
          className={`inline-flex h-8 items-center gap-1.5 rounded-md border px-2 text-xs ${open ? "bg-black text-white dark:bg-white dark:text-black border-black/15 dark:border-white/15" : "border-black/15 hover:bg-black/5 dark:border-white/15 dark:hover:bg-white/10"}`}
          aria-label="Filtry"
        >
          <Filter className="h-3.5 w-3.5" /> Filtry
        </button>
      </Popover.Trigger>
      <Popover.Portal>
        <Popover.Content sideOffset={6} className="z-20 w-72 rounded-md border border-black/15 bg-white p-3 text-sm shadow-lg outline-none dark:border-white/15 dark:bg-neutral-900 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0">
          {/* Zakres */}
          <div>
            <div className="mb-1 text-xs opacity-70">Zakres</div>
            <div className="grid grid-cols-2 gap-2">
              {[
                { v: "active", l: "Aktywne" },
                { v: "all", l: "Wszystkie" },
                { v: "archived", l: "Archiwalne" },
              ].map((o) => (
                <label key={o.v} className="inline-flex items-center gap-2 rounded border border-black/10 px-2 py-1 hover:bg-black/5 dark:border-white/10 dark:hover:bg-white/10">
                  <input
                    type="radio"
                    name="scope"
                    value={o.v}
                    checked={localScope === o.v}
                    onChange={() => setLocalScope(o.v)}
                  />
                  <span>{o.l}</span>
                </label>
              ))}
            </div>
          </div>

          <div className="my-3 h-px bg-black/10 dark:bg-white/10" />

          {/* Wynik */}
          <div>
            <div className="mb-1 text-xs opacity-70">Wynik</div>
            <div className="grid grid-cols-2 gap-2">
              {[
                { v: "all", l: "Wszystkie" },
                { v: "won", l: "Wygrane" },
                { v: "lost", l: "Przegrane" },
              ].map((o) => (
                <label key={o.v} className="inline-flex items-center gap-2 rounded border border-black/10 px-2 py-1 hover:bg-black/5 dark:border-white/10 dark:hover:bg-white/10">
                  <input
                    type="radio"
                    name="outcome"
                    value={o.v}
                    checked={localOutcome === o.v}
                    onChange={() => setLocalOutcome(o.v)}
                  />
                  <span>{o.l}</span>
                </label>
              ))}
            </div>
          </div>

          <div className="mt-3 flex items-center justify-between">
            <button type="button" onClick={onReset} className="h-8 rounded-md border border-black/15 px-2 text-xs hover:bg-black/5 dark:border-white/15 dark:hover:bg-white/10">Reset</button>
            <button type="button" onClick={onApply} className="h-8 rounded-md border border-black/15 px-3 text-xs hover:bg-black/5 dark:border-white/15 dark:hover:bg-white/10">Zastosuj</button>
          </div>
        </Popover.Content>
      </Popover.Portal>
    </Popover.Root>
  );
}
