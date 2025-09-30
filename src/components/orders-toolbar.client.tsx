"use client";
import * as React from "react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

type Installer = { id: string; name: string | null };

function useQueryUpdater() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const setMany = React.useCallback(
    (updates: Record<string, string | undefined>) => {
      const sp = new URLSearchParams(searchParams?.toString());
      Object.entries(updates).forEach(([k, v]) => {
        if (v === undefined || v === null || v === "") sp.delete(k);
        else sp.set(k, v);
      });
      router.push(`${pathname}?${sp.toString()}`);
    },
    [router, pathname, searchParams],
  );

  return { setMany };
}

export function OrdersToolbar({
  q,
  type,
  outcome,
  installer,
  sort,
  dir,
  scope,
  installers,
  size,
}: {
  q: string;
  type: string;
  outcome: string;
  installer: string;
  sort: string;
  dir: string;
  scope: string;
  installers: Installer[];
  size: number;
}) {
  const { setMany } = useQueryUpdater();

  const isType = (t: string) => type === t;
  const isOutcome = (o: string) => outcome === o;

  const [searchValue, setSearchValue] = React.useState(q);

  React.useEffect(() => setSearchValue(q), [q]);

  const today = new Date().toISOString().slice(0, 10);

  return (
    <div className="mt-2 flex flex-col gap-2">
      {/* Pasek: Szukaj + Na stronę + Akcje (Nowe/Kalendarz/Dziś/Tydzień/Archiwum) */}
      <div className="flex flex-wrap items-center justify-between gap-2 border rounded-md p-2" style={{ borderColor: "var(--pp-border)" }}>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            setMany({ q: searchValue || undefined, page: "1" });
          }}
          className="flex items-center gap-2"
        >
          <input
            value={searchValue}
            onChange={(e) => setSearchValue(e.target.value)}
            placeholder="Szukaj klienta…"
            className="h-9 w-72 rounded-md border border-black/15 bg-transparent px-3 text-sm outline-none dark:border-white/15"
          />
          <button
            type="submit"
            className="inline-flex h-9 items-center rounded-md border px-3 text-sm hover:bg-[var(--pp-primary-subtle-bg)]"
            style={{ borderColor: "var(--pp-border)" }}
          >
            Szukaj
          </button>
        </form>
        <div className="flex flex-wrap items-center gap-2">
          <label className="text-sm opacity-70" htmlFor="orders-page-size">Na stronę:</label>
          <select
            id="orders-page-size"
            className="h-9 rounded-md border border-black/15 bg-transparent px-2 text-sm outline-none dark:border-white/15"
            value={size}
            onChange={(e) => setMany({ size: e.target.value, page: "1" })}
          >
            {[10,20,50,100].map((n) => (
              <option key={n} value={n}>{n}</option>
            ))}
          </select>
          {/* Akcje: kolorystycznie rozróżnione */}
          <Link
            href="/zlecenia/nowe"
            className="inline-flex h-9 items-center rounded-md px-3 text-sm text-white"
            style={{ background: "var(--pp-primary)", borderColor: "var(--pp-primary)" }}
          >
            Nowe zlecenie
          </Link>
          <Link
            href="/zlecenia/kalendarz"
            className="inline-flex h-9 items-center rounded-md border px-3 text-sm hover:bg-[var(--pp-primary-subtle-bg)]"
            style={{ borderColor: "var(--pp-border)" }}
          >
            Kalendarz
          </Link>
          <Link
            href={`/zlecenia/kalendarz?date=${encodeURIComponent(today)}&view=dayGridMonth`}
            className="inline-flex h-9 items-center rounded-md border px-3 text-sm"
            style={{
              borderColor: "var(--pp-border)",
              background: "color-mix(in oklab, var(--pp-primary) 8%, transparent)",
            }}
            title="Pokaż miesiąc (dziś)"
          >
            Dziś
          </Link>
          <Link
            href={`/zlecenia/kalendarz?range=week&date=${encodeURIComponent(today)}&view=dayGridWeek`}
            className="inline-flex h-9 items-center rounded-md border px-3 text-sm"
            style={{
              borderColor: "var(--pp-border)",
              background: "color-mix(in oklab, var(--pp-primary) 8%, transparent)",
            }}
            title="Pokaż tydzień"
          >
            Tydzień
          </Link>
          <Link
            href="/zlecenia/archiwum"
            className="inline-flex h-9 items-center rounded-md border px-3 text-sm"
            style={{ borderColor: "var(--pp-border)" }}
          >
            Archiwum
          </Link>
        </div>
      </div>

      {/* Filtry szybkie (typ/outcome/installer/sort/dir) */}
      <div className="flex flex-wrap items-end gap-2">
      {/* Typ: installation/delivery/all */}
      <div className="flex items-center gap-2">
        <button
          type="button"
          className={`inline-flex h-8 items-center gap-1.5 rounded-md border px-2 text-xs ${isType("installation") ? "bg-black text-white dark:bg-white dark:text-black border-black/15 dark:border-white/15" : "border-black/15 hover:bg-black/5 dark:border-white/15 dark:hover:bg-white/10"}`}
          onClick={() => setMany({ type: isType("installation") ? "all" : "installation", page: "1" })}
        >
          Montaż
        </button>
        <button
          type="button"
          className={`inline-flex h-8 items-center gap-1.5 rounded-md border px-2 text-xs ${isType("delivery") ? "bg-black text-white dark:bg-white dark:text-black border-black/15 dark:border-white/15" : "border-black/15 hover:bg-black/5 dark:border-white/15 dark:hover:bg-white/10"}`}
          onClick={() => setMany({ type: isType("delivery") ? "all" : "delivery", page: "1" })}
        >
          Dostawa
        </button>
        <button
          type="button"
          className={`inline-flex h-8 items-center gap-1.5 rounded-md border px-2 text-xs ${isType("all") ? "bg-black text-white dark:bg-white dark:text-black border-black/15 dark:border-white/15" : "border-black/15 hover:bg-black/5 dark:border-white/15 dark:hover:bg-white/10"}`}
          onClick={() => setMany({ type: "all", page: "1" })}
        >
          Wszystkie
        </button>
      </div>

      {/* Wynik: active/won/lost */}
      <div className="flex items-center gap-2">
        <button
          type="button"
          className={`inline-flex h-8 items-center gap-1.5 rounded-md border px-2 text-xs ${isOutcome("active") ? "bg-black text-white dark:bg-white dark:text-black border-black/15 dark:border-white/15" : "border-black/15 hover:bg-black/5 dark:border-white/15 dark:hover:bg-white/10"}`}
          onClick={() => setMany({ outcome: isOutcome("active") ? "all" : "active", page: "1" })}
        >
          Aktywne
        </button>
        <button
          type="button"
          className={`inline-flex h-8 items-center gap-1.5 rounded-md border px-2 text-xs ${isOutcome("won") ? "bg-black text-white dark:bg-white dark:text-black border-black/15 dark:border-white/15" : "border-black/15 hover:bg-black/5 dark:border-white/15 dark:hover:bg-white/10"}`}
          onClick={() => setMany({ outcome: isOutcome("won") ? "all" : "won", page: "1" })}
        >
          Wygrane
        </button>
        <button
          type="button"
          className={`inline-flex h-8 items-center gap-1.5 rounded-md border px-2 text-xs ${isOutcome("lost") ? "bg-black text-white dark:bg-white dark:text-black border-black/15 dark:border-white/15" : "border-black/15 hover:bg-black/5 dark:border-white/15 dark:hover:bg-white/10"}`}
          onClick={() => setMany({ outcome: isOutcome("lost") ? "all" : "lost", page: "1" })}
        >
          Przegrane
        </button>
      </div>

      {/* Montażysta */}
      <div className="flex items-center gap-2">
        <label className="text-xs opacity-70" htmlFor="installer-select">Montażysta</label>
        <select
          id="installer-select"
          className="h-8 rounded-md border border-black/15 bg-transparent px-2 text-xs outline-none dark:border-white/15"
          value={installer}
          onChange={(e) => setMany({ installer: e.target.value || undefined, page: "1" })}
        >
          <option value="">Wszyscy</option>
          {installers.map((i) => (
            <option key={i.id} value={i.id}>
              {i.name || i.id.slice(0, 8)}
            </option>
          ))}
        </select>
      </div>

      {/* Sort + kierunek */}
      <div className="flex items-center gap-2">
        <label className="text-xs opacity-70" htmlFor="sort-select">Sortuj</label>
        <select
          id="sort-select"
          className="h-8 rounded-md border border-black/15 bg-transparent px-2 text-xs outline-none dark:border-white/15"
          value={sort}
          onChange={(e) => setMany({ sort: e.target.value, page: "1" })}
        >
          <option value="created">Utworzono</option>
          <option value="client">Klient</option>
          <option value="installer">Montażysta</option>
          <option value="delivery">Dostawa</option>
          <option value="installation">Montaż</option>
        </select>
        <button
          type="button"
          className="inline-flex h-8 items-center rounded-md border border-black/15 px-2 text-xs dark:border-white/15"
          onClick={() => setMany({ dir: dir === "asc" ? "desc" : "asc", page: "1" })}
          aria-label="Przełącz kierunek sortowania"
          title="Przełącz kierunek sortowania"
        >
          {dir === "asc" ? "Rosnąco" : "Malejąco"}
        </button>
      </div>
      {/* zamknięcie wrappera filtrów */}
      </div>
    </div>
  );
}
