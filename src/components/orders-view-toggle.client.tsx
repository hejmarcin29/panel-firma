"use client";
import * as React from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

type Props = { view: "table" | "pipeline" };

export function OrdersViewToggle({ view }: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const sp = useSearchParams();

  const setView = React.useCallback(
    (next: "table" | "pipeline") => {
      const qs = new URLSearchParams(sp?.toString());
      if (next === "table") qs.delete("view");
      else qs.set("view", next);
      // Reset page for consistency
      qs.set("page", "1");
      router.push(`${pathname}?${qs.toString()}`);
    },
    [router, pathname, sp],
  );

  const baseBtn =
    "inline-flex h-9 items-center rounded-md border px-3 text-sm hover:bg-[var(--pp-primary-subtle-bg)]";

  return (
    <div className="flex items-center gap-2">
      <button
        type="button"
        onClick={() => setView("table")}
        className={baseBtn}
        style={{
          borderColor: "var(--pp-border)",
          background: view === "table" ? "color-mix(in oklab, var(--pp-primary) 10%, transparent)" : undefined,
        }}
        aria-pressed={view === "table"}
      >
        Tabela
      </button>
      <button
        type="button"
        onClick={() => setView("pipeline")}
        className={baseBtn}
        style={{
          borderColor: "var(--pp-border)",
          background: view === "pipeline" ? "color-mix(in oklab, var(--pp-primary) 10%, transparent)" : undefined,
        }}
        aria-pressed={view === "pipeline"}
      >
        Pipeline
      </button>
    </div>
  );
}
