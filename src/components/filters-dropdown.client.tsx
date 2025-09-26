"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Filter } from "lucide-react";

type Props = {
  q: string;
  status: string;
  type: string;
  outcome: string;
  installer: string;
  sort: string;
  dir: string;
  scope: string;
};

export function FiltersDropdown({ q, status, type, outcome, installer, sort, dir, scope }: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [localScope, setLocalScope] = useState(scope || "active");
  const [localOutcome, setLocalOutcome] = useState(outcome && outcome !== "active" ? outcome : "all");
  const popoverRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    function onDocClick(e: MouseEvent) {
      if (!open) return;
      const t = e.target as Node | null;
      if (popoverRef.current && t && !popoverRef.current.contains(t)) {
        setOpen(false);
      }
    }
    function onKey(e: KeyboardEvent) {
      if (!open) return;
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", onDocClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDocClick);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  function apply(nextScope: string, nextOutcome: string) {
    const params = new URLSearchParams({ q, status, type, installer, sort, dir });
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
    const params = new URLSearchParams({ q, status, type, installer, sort, dir });
    params.set("outcome", "all");
    params.set("scope", "active");
    router.push(`${pathname}?${params.toString()}`);
    setOpen(false);
  }

  return (
    <div className="relative inline-block" ref={popoverRef}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className={`inline-flex h-8 items-center gap-1.5 rounded-md border px-2 text-xs ${open ? "bg-black text-white dark:bg-white dark:text-black border-black/15 dark:border-white/15" : "border-black/15 hover:bg-black/5 dark:border-white/15 dark:hover:bg-white/10"}`}
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-label="Filtry"
      >
        <Filter className="h-3.5 w-3.5" /> Filtry
      </button>
      {open && (
        <div
          role="dialog"
          aria-label="Filtry zleceń"
          className="absolute z-20 mt-1 w-72 rounded-md border border-black/15 bg-white p-3 text-sm shadow-lg dark:border-white/15 dark:bg-neutral-900"
        >
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
        </div>
      )}
    </div>
  );
}
