"use client";
import * as React from "react";
import Link from "next/link";
import {
  ColumnDef,
  SortingState,
  getCoreRowModel,
  getSortedRowModel,
  useReactTable,
  flexRender,
} from "@tanstack/react-table";
import { Info } from "lucide-react";
import { TypeBadge, OutcomeBadge } from "@/components/badges";
import { OrderPipeline } from "@/components/order-pipeline.client";
import { QuickChecklistBar } from "@/components/quick-checklist-bar.client";
import { OrderOutcomeButtons } from "@/components/order-outcome-buttons.client";
import { formatDate, formatDayMonth } from "@/lib/date";
import { useContainerMode } from "@/lib/use-container-mode";

export type OrderRow = {
  id: string;
  createdAt: number | Date;
  type: string; // 'installation' | 'delivery'
  status: string;
  pipelineStage: string | null;
  outcome: "won" | "lost" | null | string | null;
  clientId: string;
  clientName: string | null;
  nextDeliveryAt: number | null;
  nextDeliveryStatus: string | null;
  nextInstallationAt: number | null;
  nextInstallationStatus: string | null;
  installerName: string | null;
  orderNo: string | null;
  // checklist flags
  proforma?: number | boolean;
  advance_invoice?: number | boolean;
  final_invoice?: number | boolean;
  post_delivery_invoice?: number | boolean;
  quote?: number | boolean;
  done?: number | boolean;
  measurement?: number | boolean;
  contract?: number | boolean;
  advance_payment?: number | boolean;
  installation?: number | boolean;
  handover_protocol?: number | boolean;
};

export function OrdersTable({ data }: { data: OrderRow[] }) {
  const [sorting, setSorting] = React.useState<SortingState>([]);
  const { ref: containerRef, mode } = useContainerMode<HTMLDivElement>();
  const onRowNav = (href: string) => (e: React.MouseEvent | React.KeyboardEvent) => {
    const isInteractive = (el: HTMLElement | null, stopAt?: HTMLElement | null): boolean => {
      let cur: HTMLElement | null = el;
      while (cur) {
        if (stopAt && cur === stopAt) break;
        const tag = cur.tagName;
        if (tag === "A" || tag === "BUTTON" || tag === "INPUT" || tag === "SELECT" || tag === "TEXTAREA") return true;
        const role = cur.getAttribute("role");
        if (role === "button" || role === "link") return true;
        if ((cur as HTMLElement).dataset?.noRowNav) return true;
        cur = cur.parentElement;
      }
      return false;
    };
    if ("key" in e) {
      const ke = e as React.KeyboardEvent;
      if (ke.key !== "Enter" && ke.key !== " ") return;
      ke.preventDefault();
      window.location.href = href;
      return;
    }
    const me = e as React.MouseEvent;
    if (me.defaultPrevented) return;
    if (isInteractive(me.target as HTMLElement, me.currentTarget as HTMLElement)) return;
    window.location.href = href;
  };

  const columns = React.useMemo<ColumnDef<OrderRow>[]>(
    () => [
      {
        header: "Nr",
        accessorKey: "orderNo",
        cell: ({ row }) => {
          const r = row.original;
          const href = r.orderNo
            ? `/zlecenia/nr/${r.orderNo}_${r.type === "installation" ? "m" : "d"}`
            : `/zlecenia/${r.id}`;
          const label = r.orderNo
            ? `${r.orderNo}_${r.type === "installation" ? "m" : "d"}`
            : r.id.slice(0, 8);
          return (
            <Link className="hover:underline focus:underline focus:outline-none" href={href}>
              {label}
            </Link>
          );
        },
      },
      {
        header: "Klient",
        accessorFn: (r) => r.clientName || r.clientId,
        cell: ({ row }) => {
          const r = row.original;
          return (
            <span className="block max-w-[220px] truncate" title={r.clientName || r.clientId}>
              {r.clientName || r.clientId}
            </span>
          );
        },
      },
      {
        header: "Typ",
        accessorKey: "type",
        cell: ({ row }) => <TypeBadge type={row.original.type} />,
      },
      {
        header: "Etap",
        accessorKey: "pipelineStage",
        cell: ({ row }) => (
          <OrderPipeline
            orderId={row.original.id}
            type={row.original.type as "delivery" | "installation"}
            stage={row.original.pipelineStage}
          />
        ),
      },
      {
        header: "Checklist",
        id: "checklist",
        cell: ({ row }) => {
          const r = row.original;
          const keys = r.type === "installation"
            ? [
                "measurement",
                "quote",
                "contract",
                "advance_payment",
                "installation",
                "handover_protocol",
                "final_invoice",
                "done",
              ]
            : [
                "proforma",
                "advance_invoice",
                "final_invoice",
                "post_delivery_invoice",
                "quote",
                "done",
              ];
          return (
            <QuickChecklistBar
              orderId={r.id}
              type={r.type as "delivery" | "installation"}
              items={keys.map((k) => ({
                key: k as string,
                label: k,
                done: Boolean((r as Record<string, unknown>)[k]),
              }))}
            />
          );
        },
      },
      {
        header: "Dostawa",
        accessorKey: "nextDeliveryAt",
        cell: ({ row }) => {
          const r = row.original;
          return r.nextDeliveryAt ? (
            <span className="inline-flex items-center gap-1">
              <span>{formatDayMonth(r.nextDeliveryAt, "—")}</span>
              {r.nextDeliveryStatus ? (
                <span className="rounded bg-black/10 px-1.5 py-0.5 text-[10px] uppercase tracking-wide dark:bg-white/10">
                  {r.nextDeliveryStatus}
                </span>
              ) : null}
            </span>
          ) : (
            <>—</>
          );
        },
      },
      {
        header: "Montaż",
        accessorKey: "nextInstallationAt",
        cell: ({ row }) => {
          const r = row.original;
          return r.nextInstallationAt ? (
            <span className="inline-flex items-center gap-1">
              <span>{formatDayMonth(r.nextInstallationAt, "—")}</span>
              {r.nextInstallationStatus ? (
                <span className="rounded bg-black/10 px-1.5 py-0.5 text-[10px] uppercase tracking-wide dark:bg-white/10">
                  {r.nextInstallationStatus}
                </span>
              ) : null}
            </span>
          ) : (
            <>—</>
          );
        },
      },
      {
        header: "Montażysta",
        accessorKey: "installerName",
        cell: ({ row }) => (
          <span className="block max-w-[140px] truncate" title={row.original.installerName || "-"}>
            {row.original.installerName || "-"}
          </span>
        ),
      },
      {
        header: "Utw.",
        accessorKey: "createdAt",
        cell: ({ row }) => <>{formatDate(row.original.createdAt, "—")}</>,
      },
      {
        header: "Wynik",
        accessorKey: "outcome",
        cell: ({ row }) => (
          <OutcomeBadge outcome={row.original.outcome as "won" | "lost" | null | undefined} iconOnly />
        ),
      },
      {
        header: () => <span className="sr-only">Akcje</span>,
        id: "actions",
        cell: ({ row }) => {
          const r = row.original;
          const href = r.orderNo
            ? `/zlecenia/nr/${r.orderNo}_${r.type === "installation" ? "m" : "d"}`
            : `/zlecenia/${r.id}`;
          return (
            <div className="flex items-center gap-2 justify-end">
              <OrderOutcomeButtons id={r.id} outcome={r.outcome as "won" | "lost" | null} />
              <Link
                className="inline-flex h-7 w-7 items-center justify-center rounded-md border border-black/15 text-xs hover:bg-black/5 dark:border-white/15 dark:hover:bg-white/10"
                href={href}
                aria-label="Szczegóły"
                title="Szczegóły"
              >
                <Info className="h-3.5 w-3.5" />
              </Link>
            </div>
          );
        },
      },
    ],
    [],
  );

  const table = useReactTable({
    data,
    columns,
    state: { sorting },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
  });

  const rows = table.getRowModel().rows;

  // Compute column visibility based on container mode.
  // Priority tiers: critical (Nr, Klient, Typ, Etap, Akcje), high (Montaż, Dostawa),
  // medium (Montażysta), low (Utw., Wynik), and Checklist shown only in wide.
  const colVisibility: Record<string, boolean> = {
    // id-based or accessor IDs from column defs
    orderNo: true,
    type: true,
    pipelineStage: true,
    actions: true,
  };
  // We will refer by header ids we set or accessorKey names
  const isWide = mode === "wide";
  const isCondensed = mode === "condensed";
  // Base visibility: show all in wide
  if (isWide) {
    // all visible
  } else if (isCondensed) {
    // hide low priority and heavy checklist
    colVisibility["checklist"] = false;
    colVisibility["createdAt"] = false;
    colVisibility["outcome"] = false;
  } else {
    // compact: hide medium too
    colVisibility["checklist"] = false;
    colVisibility["createdAt"] = false;
    colVisibility["outcome"] = false;
    colVisibility["installerName"] = false;
  }

  // Apply visibility by filtering headers/cells render-time (TanStack supports state.columnVisibility
  // but we avoid adding more state by simple conditional rendering of specific cells/headers).

  return (
    <div ref={containerRef} className="rounded-md border border-black/10 dark:border-white/10 overflow-x-auto">
      <table className={`w-full text-sm ${isWide ? "" : "min-w-0"}`}>
        <thead className="text-left bg-black/5 dark:bg-white/10">
          {table.getHeaderGroups().map((hg) => (
            <tr key={hg.id}>
              {hg.headers.map((h) => {
                const id = h.column.id;
                if (id in colVisibility && colVisibility[id] === false) return null;
                const thPad = isWide ? "px-3 py-2" : isCondensed ? "px-2.5 py-1.5" : "px-2 py-1.5";
                const isActions = id === "actions";
                return (
                  <th key={h.id} className={`${thPad} ${isActions ? "text-right" : ""}`}>
                    {h.isPlaceholder ? null : (
                      <button
                        type="button"
                        onClick={h.column.getToggleSortingHandler()}
                        className="inline-flex items-center gap-1 hover:underline"
                      >
                        {flexRender(h.column.columnDef.header, h.getContext())}
                        {{ asc: "▲", desc: "▼" }[h.column.getIsSorted() as string] ?? ""}
                      </button>
                    )}
                  </th>
                );
              })}
            </tr>
          ))}
        </thead>
        <tbody>
          {rows.length === 0 ? (
            <tr>
              <td
                colSpan={table
                  .getHeaderGroups()[0]
                  .headers.filter((h) => !(h.column.id in colVisibility && colVisibility[h.column.id] === false)).length}
                className="px-3 py-6 text-center opacity-70"
              >
                Brak zleceń
              </td>
            </tr>
          ) : (
            rows.map((row) => {
              const r = row.original;
              const href = r.orderNo
                ? `/zlecenia/nr/${r.orderNo}_${r.type === "installation" ? "m" : "d"}`
                : `/zlecenia/${r.id}`;
              return (
              <tr
                key={row.id}
                role="link"
                tabIndex={0}
                onClick={onRowNav(href)}
                onKeyDown={onRowNav(href)}
                className="cursor-pointer border-t border-black/10 hover:bg-black/5 focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--pp-primary)] dark:border-white/10 dark:hover:bg-white/10 anim-enter"
              >
                {row.getVisibleCells().map((cell) => {
                  const id = cell.column.id;
                  if (id in colVisibility && colVisibility[id] === false) return null;
                  const tdPad = isWide ? "px-3 py-2" : isCondensed ? "px-2.5 py-1.5" : "px-2 py-1.5";
                  const isActions = id === "actions";
                  return (
                    <td key={cell.id} className={`${tdPad} ${isActions ? "text-right" : ""}`}>
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </td>
                  );
                })}
              </tr>
            );})
          )}
        </tbody>
      </table>
    </div>
  );
}
