"use client";
import * as React from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

function useQueryUpdater() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const setMany = React.useCallback((updates: Record<string, string | undefined>) => {
    const sp = new URLSearchParams(searchParams?.toString());
    Object.entries(updates).forEach(([k, v]) => {
      if (v === undefined || v === null || v === "") sp.delete(k);
      else sp.set(k, v);
    });
    router.push(`${pathname}?${sp.toString()}`);
  }, [router, pathname, searchParams]);
  return { setMany };
}

export function DataTableToolbar({
  q,
  size,
  searchPlaceholder = "Szukaj…",
  resultsLabel,
  right,
}: {
  q: string;
  size: number;
  searchPlaceholder?: string;
  resultsLabel?: string | React.ReactNode;
  right?: React.ReactNode;
}) {
  const { setMany } = useQueryUpdater();
  const [value, setValue] = React.useState(q);

  React.useEffect(() => {
    setValue(q);
  }, [q]);

  function submitSearch(e: React.FormEvent) {
    e.preventDefault();
    setMany({ q: value.trim() || undefined, page: "1" });
  }

  return (
    <div className="flex flex-wrap items-center justify-between gap-2 border rounded-md p-2" style={{ borderColor: "var(--pp-border)" }}>
      <form onSubmit={submitSearch} className="flex items-center gap-2">
        <input
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder={searchPlaceholder}
          className="h-9 w-64 rounded-md border border-black/15 bg-transparent px-3 text-sm outline-none dark:border-white/15"
        />
        <button
          type="submit"
          className="inline-flex h-9 items-center rounded-md border px-3 text-sm hover:bg-[var(--pp-primary-subtle-bg)]"
          style={{ borderColor: "var(--pp-border)" }}
        >
          Szukaj
        </button>
      </form>
      <div className="flex items-center gap-3">
        {resultsLabel ? <div className="text-sm opacity-70">{resultsLabel}</div> : null}
        <label className="text-sm opacity-70" htmlFor="dt-page-size">Na stronę:</label>
        <select
          id="dt-page-size"
          className="h-9 rounded-md border border-black/15 bg-transparent px-2 text-sm outline-none dark:border-white/15"
          value={size}
          onChange={(e) => setMany({ size: e.target.value, page: "1" })}
        >
          {[10, 20, 50, 100].map((sz) => (
            <option key={sz} value={sz}>{sz}</option>
          ))}
        </select>
        {right}
      </div>
    </div>
  );
}
