"use client";
import Link from "next/link";
import React from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { Plus, Truck, FileText } from "lucide-react";
import { pl } from "@/i18n/pl";
import {
  ColumnDef,
  SortingState,
  getSortedRowModel,
  getCoreRowModel,
  useReactTable,
  flexRender,
} from "@tanstack/react-table";
import { formatDate } from "@/lib/date";

type Klient = {
  id: string;
  name: string;
  email?: string | null;
  phone?: string | null;
  deliveryCity?: string | null;
  invoiceCity?: string | null;
  createdAt: number;
  clientNo?: number | null;
  _activeOrders?: number;
  _nextInstallationAt?: number | null;
  _nextDeliveryAt?: number | null;
};

export default function KlienciPage() {
  const [data, setData] = React.useState<{ clients: Klient[] } | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [showArchived, setShowArchived] = React.useState(false);

  React.useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const r = await fetch(`/api/klienci${showArchived ? "?archived=1" : ""}`);
        const json = await r.json();
        if (mounted) setData(json);
      } catch {
        if (mounted) setError("Błąd ładowania");
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, [showArchived]);

  // Sortowanie + szybki filtr
  const [q, setQ] = React.useState("");
  const [sorting, setSorting] = React.useState<SortingState>([]);
  const [pageSize, setPageSize] = React.useState(20);
  const [page, setPage] = React.useState(1);

  const filteredClients = React.useMemo(() => {
    const src = data?.clients ?? [];
    if (!q) return src;
    const qq = q.toLowerCase();
    return src.filter((c) => {
      const city = (c.deliveryCity || c.invoiceCity || "").toLowerCase();
      return c.name.toLowerCase().includes(qq) || city.includes(qq);
    });
  }, [data, q]);

  React.useEffect(() => {
    setPage(1);
  }, [q]);

  const columns: ColumnDef<Klient>[] = [
    {
      header: "Nr",
      accessorKey: "clientNo",
      cell: ({ getValue }) => (
        <span className="text-muted-foreground">{getValue<number | null>() ?? "—"}</span>
      ),
    },
    {
      header: "Klient",
      accessorKey: "name",
      cell: ({ row }) => (
        <Link href={`/klienci/${row.original.id}`} className="font-medium hover:underline">
          {row.original.name}
        </Link>
      ),
    },
    {
      header: "Miasto",
      accessorFn: (row) => row.deliveryCity || row.invoiceCity || "",
      cell: ({ row }) => {
        const c = row.original;
        const city = c.deliveryCity || c.invoiceCity;
        return (
          <span className="inline-flex items-center gap-1.5 text-muted-foreground">
            {c.deliveryCity ? (
              <span className="inline-flex items-center" title="Miasto dostawy">
                <Truck className="h-4 w-4 opacity-70" aria-hidden="true" />
                <span className="sr-only">Dostawa</span>
              </span>
            ) : c.invoiceCity ? (
              <span className="inline-flex items-center" title="Miasto faktury">
                <FileText className="h-4 w-4 opacity-70" aria-hidden="true" />
                <span className="sr-only">Faktura</span>
              </span>
            ) : null}
            <span>{city ?? <span className="opacity-60">—</span>}</span>
          </span>
        );
      },
    },
    {
      header: "Aktywne zlecenia",
      accessorFn: (row) => row._activeOrders ?? 0,
      cell: ({ row }) => row.original._activeOrders ?? 0,
    },
    {
      header: "Najbliższy montaż",
      accessorFn: (row) => row._nextInstallationAt ?? 0,
      cell: ({ row }) =>
        row.original._nextInstallationAt ? (
          formatDate(row.original._nextInstallationAt)
        ) : (
          <span className="opacity-60">—</span>
        ),
    },
    {
      header: "Najbliższa dostawa",
      accessorFn: (row) => row._nextDeliveryAt ?? 0,
      cell: ({ row }) =>
        row.original._nextDeliveryAt ? (
          formatDate(row.original._nextDeliveryAt)
        ) : (
          <span className="opacity-60">—</span>
        ),
    },
    {
      header: pl.clients.createdAt,
      accessorKey: "createdAt",
      cell: ({ row }) => (
        <span className="text-muted-foreground">{formatDate(row.original.createdAt)}</span>
      ),
    },
  ];

  const table = useReactTable({
    data: filteredClients,
    columns,
    state: { sorting },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
  });

  const total = filteredClients.length;
  const pageCount = Math.max(1, Math.ceil(total / pageSize));
  const start = (page - 1) * pageSize;
  const pagedRows = table.getRowModel().rows.slice(start, start + pageSize);
  const rowsToRender =
    pagedRows.length === 0 && total > 0
      ? table.getRowModel().rows.slice(0, Math.min(pageSize, total))
      : pagedRows;

  return (
    <div className="mx-auto max-w-6xl p-4 md:p-6">
      <section
        className="relative overflow-hidden rounded-2xl border bg-[var(--pp-panel)] mb-4 overflow-x-hidden"
        style={{ borderColor: "var(--pp-border)" }}
      >
        <div
          className="pointer-events-none absolute inset-0 opacity-80"
          aria-hidden
          style={{
            background:
              "radial-gradient(1000px 360px at -10% -20%, color-mix(in oklab, var(--pp-primary) 14%, transparent), transparent 42%), linear-gradient(120deg, color-mix(in oklab, var(--pp-primary) 8%, transparent), transparent 65%)",
          }}
        />
        <div className="relative z-10 p-4 md:p-6 flex flex-col md:flex-row md:items-center md:justify-between gap-3">
          <h1 className="text-2xl md:text-3xl font-semibold">{pl.clients.listTitle}</h1>
          <div className="flex flex-wrap items-center gap-3 mt-1 md:mt-0">
            <label className="inline-flex items-center gap-1 select-none cursor-pointer opacity-90">
              <input
                type="checkbox"
                checked={showArchived}
                onChange={(e) => setShowArchived(e.target.checked)}
              />
              <span>Pokaż archiwalne</span>
            </label>
            <Link
              href="/klienci/nowy"
              className="inline-flex h-9 items-center gap-2 rounded-md border px-4 text-sm hover:bg-[var(--pp-primary-subtle-bg)]"
              style={{ borderColor: "var(--pp-border)" }}
            >
              <Plus className="h-4 w-4" /> {pl.clients.new}
            </Link>
          </div>
        </div>
      </section>

      {loading ? (
        <div className="space-y-2">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="p-3 border border-black/10 dark:border-white/10 rounded">
              <Skeleton className="h-4 w-40 mb-2" />
              <Skeleton className="h-3 w-full" />
            </div>
          ))}
        </div>
      ) : error ? (
        <p>{pl.common.loadError}</p>
      ) : (
        <>
          {/* Desktop table */}
          <div className="hidden md:block overflow-x-auto rounded-lg border" style={{ borderColor: "var(--pp-border)" }}>
            <div className="p-2 border-b flex flex-col gap-2 md:flex-row md:items-center md:justify-between" style={{ borderColor: "var(--pp-border)" }}>
              <input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Szukaj po nazwie/miastach…"
                className="h-9 w-full md:w-80 rounded-md border border-black/15 bg-transparent px-3 text-sm outline-none dark:border-white/15"
              />
              <div className="flex items-center gap-2 text-sm">
                <span className="opacity-70">Wyniki:</span>
                <span className="font-medium">{total}</span>
                <span className="mx-1 opacity-40">•</span>
                <label className="opacity-70" htmlFor="pageSize">
                  Na stronę:
                </label>
                <select
                  id="pageSize"
                  className="h-9 rounded-md border border-black/15 bg-transparent px-2 text-sm outline-none dark:border-white/15"
                  value={pageSize}
                  onChange={(e) => {
                    setPageSize(parseInt(e.target.value, 10));
                    setPage(1);
                  }}
                >
                  {[10, 20, 50, 100].map((sz) => (
                    <option key={sz} value={sz}>
                      {sz}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <table className="w-full text-sm">
              <thead className="bg-[var(--pp-table-header-bg)]">
                {table.getHeaderGroups().map((hg) => (
                  <tr key={hg.id} className="text-left">
                    {hg.headers.map((h) => (
                      <th key={h.id} className="px-3 py-2 font-medium select-none">
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
                    ))}
                  </tr>
                ))}
              </thead>
              <tbody>
                {total === 0 ? (
                  <tr>
                    <td colSpan={columns.length} className="px-3 py-6 text-center opacity-70">
                      Brak wyników
                    </td>
                  </tr>
                ) : (
                  rowsToRender.map((row) => (
                    <tr key={row.id} className="border-t hover:bg-[var(--pp-table-row-hover)] anim-enter" style={{ borderColor: "var(--pp-border)" }}>
                      {row.getVisibleCells().map((cell) => (
                        <td key={cell.id} className="px-3 py-2">
                          {flexRender(cell.column.columnDef.cell, cell.getContext())}
                        </td>
                      ))}
                    </tr>
                  ))
                )}
              </tbody>
            </table>
            <div className="flex items-center justify-between gap-2 border-t p-2 text-sm" style={{ borderColor: "var(--pp-border)" }}>
              <div>
                Strona {page} z {pageCount}
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  className="inline-flex h-8 items-center rounded-md border border-black/15 px-2 text-xs disabled:opacity-50 dark:border-white/15"
                  onClick={() => setPage(1)}
                  disabled={page === 1}
                >
                  « Pierwsza
                </button>
                <button
                  type="button"
                  className="inline-flex h-8 items-center rounded-md border border-black/15 px-2 text-xs disabled:opacity-50 dark:border-white/15"
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                >
                  ‹ Poprzednia
                </button>
                <button
                  type="button"
                  className="inline-flex h-8 items-center rounded-md border border-black/15 px-2 text-xs disabled:opacity-50 dark:border-white/15"
                  onClick={() => setPage((p) => Math.min(pageCount, p + 1))}
                  disabled={page === pageCount}
                >
                  Następna ›
                </button>
                <button
                  type="button"
                  className="inline-flex h-8 items-center rounded-md border border-black/15 px-2 text-xs disabled:opacity-50 dark:border-white/15"
                  onClick={() => setPage(pageCount)}
                  disabled={page === pageCount}
                >
                  Ostatnia »
                </button>
              </div>
            </div>
          </div>

          {/* Mobile cards */}
          <div className="md:hidden">
            <div className="p-2 flex flex-col gap-2">
              <input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Szukaj po nazwie/miastach…"
                className="h-9 w-full rounded-md border border-black/15 bg-transparent px-3 text-sm outline-none dark:border-white/15"
              />
              <div className="text-sm opacity-70">
                Wyniki: <span className="font-medium">{total}</span>
              </div>
            </div>
            <div className="mt-2 space-y-2">
              {total === 0 ? (
                <div className="px-3 py-6 text-center opacity-70">Brak wyników</div>
              ) : (
                rowsToRender.map((row) => {
                  const c = row.original;
                  const city = c.deliveryCity || c.invoiceCity || "—";
                  return (
                    <div key={c.id} className="rounded-md border border-black/10 dark:border-white/10 p-3 anim-enter">
                      <div className="flex items-center justify-between">
                        <div className="font-medium">{c.clientNo ?? "—"}</div>
                        <Link
                          className="inline-flex h-8 items-center rounded-md border border-black/15 px-3 text-xs hover:bg-black/5 dark:border-white/15 dark:hover:bg-white/10"
                          href={`/klienci/${c.id}`}
                        >
                          Szczegóły
                        </Link>
                      </div>
                      <div className="mt-1 text-sm">{c.name}</div>
                      <div className="mt-1 grid grid-cols-2 gap-2 text-xs opacity-70">
                        <div>
                          <div className="opacity-70">Miasto</div>
                          <div className="inline-flex items-center gap-1.5">
                            {c.deliveryCity ? (
                              <Truck className="h-3.5 w-3.5 opacity-70" />
                            ) : c.invoiceCity ? (
                              <FileText className="h-3.5 w-3.5 opacity-70" />
                            ) : null}
                            <span>{city}</span>
                          </div>
                        </div>
                        <div>
                          <div className="opacity-70">Utworzono</div>
                          <div>{formatDate(c.createdAt)}</div>
                        </div>
                      </div>
                      <div className="mt-2 grid grid-cols-2 gap-2 text-xs opacity-70">
                        <div>
                          <div className="opacity-70">Najbliższy montaż</div>
                          <div>{c._nextInstallationAt ? formatDate(c._nextInstallationAt) : "—"}</div>
                        </div>
                        <div>
                          <div className="opacity-70">Najbliższa dostawa</div>
                          <div>{c._nextDeliveryAt ? formatDate(c._nextDeliveryAt) : "—"}</div>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
            {/* Pagination (mobile) */}
            <div className="mt-2 flex flex-wrap items-center justify-between gap-2 border-t p-2 text-sm" style={{ borderColor: "var(--pp-border)" }}>
              <div>
                Strona {page} z {pageCount}
              </div>
              <div className="flex items-center gap-2 flex-wrap justify-end w-full sm:w-auto">
                <button
                  type="button"
                  className="inline-flex h-8 items-center rounded-md border border-black/15 px-2 text-xs disabled:opacity-50 dark:border-white/15"
                  onClick={() => setPage(1)}
                  disabled={page === 1}
                >
                  « Pierwsza
                </button>
                <button
                  type="button"
                  className="inline-flex h-8 items-center rounded-md border border-black/15 px-2 text-xs disabled:opacity-50 dark:border-white/15"
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                >
                  ‹ Poprzednia
                </button>
                <button
                  type="button"
                  className="inline-flex h-8 items-center rounded-md border border-black/15 px-2 text-xs disabled:opacity-50 dark:border-white/15"
                  onClick={() => setPage((p) => Math.min(pageCount, p + 1))}
                  disabled={page === pageCount}
                >
                  Następna ›
                </button>
                <button
                  type="button"
                  className="inline-flex h-8 items-center rounded-md border border-black/15 px-2 text-xs disabled:opacity-50 dark:border-white/15"
                  onClick={() => setPage(pageCount)}
                  disabled={page === pageCount}
                >
                  Ostatnia »
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
