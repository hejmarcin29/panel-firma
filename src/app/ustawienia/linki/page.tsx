"use client";
import React from "react";
import { useRouter } from "next/navigation";
import { formatDate } from "@/lib/date";
import { useToast } from "@/components/ui/toaster";

type InviteRow = {
  id: string;
  token?: string;
  purpose: string;
  createdBy: string | null;
  createdAt: number | Date;
  expiresAt: number | Date | null;
  usedAt: number | Date | null;
  remainingDays: number | null;
  clientId?: string | null;
  resultClientId: string | null;
  resultClientName: string | null;
};

export default function PublicInvitesSettingsPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [data, setData] = React.useState<{ invites: InviteRow[] } | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [busyId, setBusyId] = React.useState<string | null>(null);

  React.useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const r = await fetch("/api/ustawienia/public-invites");
        if (!r.ok) throw new Error("not ok");
        const j = (await r.json()) as { invites: InviteRow[] };
        if (mounted) setData(j);
      } catch {
        if (mounted) setError("Błąd ładowania");
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  return (
    <div className="mx-auto max-w-5xl min-w-0 p-4 md:p-6">
      <h1 className="text-2xl md:text-3xl font-semibold">Historia linków publicznych</h1>
      <p className="mt-1 text-sm opacity-80">Zestawienie wygenerowanych linków (typ, klient, stan, pozostałe dni ważności).</p>
      {loading ? (
        <div className="mt-4">Ładowanie…</div>
      ) : error ? (
        <div className="mt-4">{error}</div>
      ) : (
        <>
          {/* Mobile / narrow: stacked list */}
          <div className="mt-4 space-y-3 md:hidden">
            {(!data || data.invites.length === 0) ? (
              <div className="px-3 py-6 text-center opacity-70">Brak wyników</div>
            ) : (
              data.invites.map((i) => {
                const typeLabel = i.purpose === "onboarding" ? "Onboarding" : i.purpose === "portal" ? "Portal" : (i.purpose === "new_client" ? "Nowy klient" : i.purpose);
                const status = i.purpose === "onboarding"
                  ? (i.usedAt ? "Użyty" : (i.expiresAt ? "Aktywny" : "Wygasły"))
                  : (i.purpose === "portal" ? "Portal (aktyw.)" : (i.expiresAt ? "Aktywny" : "—"));
                const days = i.remainingDays == null ? "—" : `${i.remainingDays} d`;
                const client = i.resultClientName || (i.resultClientId ? i.resultClientId : "—");
                const createdAt = i.createdAt instanceof Date ? i.createdAt.getTime() : (i.createdAt as number);
                const url = i.purpose === "portal" && i.token ? `${location.origin}/public/klient/${i.token}` : null;
                const cid = (i.resultClientId || i.clientId) as string | undefined;
                return (
                  <div key={i.id} className="rounded-lg border p-3" style={{ borderColor: "var(--pp-border)" }}>
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0 text-sm font-medium truncate">{typeLabel}</div>
                      <div className="text-xs opacity-70">{status}</div>
                    </div>
                    <div className="mt-1 text-sm">
                      Klient: <span className="font-medium break-words">{client}</span>
                    </div>
                    <div className="mt-1 text-xs opacity-70">Utworzono: {formatDate(createdAt)}</div>
                    <div className="mt-1 text-xs opacity-70">Wygasa za: {days}{i.expiresAt ? ` (do ${formatDate(i.expiresAt instanceof Date ? i.expiresAt.getTime() : (i.expiresAt as number))})` : ""}</div>
                    <div className="mt-1 text-xs opacity-70">Autor: {i.createdBy ?? "—"}</div>
                    {url ? (
                      <div className="mt-2">
                        <div className="text-xs font-medium opacity-70 mb-1">Link</div>
                        <a href={url} target="_blank" rel="noreferrer" className="block text-sm hover:underline break-all">
                          {url}
                        </a>
                      </div>
                    ) : null}
                    {i.purpose === "portal" && cid ? (
                      <div className="mt-2 flex flex-wrap gap-2">
                        {url ? (
                          <button
                            type="button"
                            className="inline-flex h-8 items-center rounded-md border px-2 text-xs hover:bg-[var(--pp-primary-subtle-bg)]"
                            style={{ borderColor: "var(--pp-border)" }}
                            onClick={async () => {
                              try {
                                if (url) await navigator.clipboard.writeText(url);
                                toast({ variant: "success", title: "Skopiowano link portalu" });
                              } catch {
                                toast({ variant: "destructive", title: "Nie udało się skopiować" });
                              }
                            }}
                          >
                            Kopiuj
                          </button>
                        ) : null}
                        <button
                          type="button"
                          className="inline-flex h-8 items-center rounded-md border px-2 text-xs hover:bg-[var(--pp-primary-subtle-bg)]"
                          style={{ borderColor: "var(--pp-border)" }}
                          onClick={async () => {
                            const r = await fetch(`/api/public/klient/portal/${encodeURIComponent(cid)}?rotate=1`, { method: "POST" });
                            if (r.ok) {
                              toast({ variant: "success", title: "Zrotowano link" });
                              location.reload();
                            } else {
                              toast({ variant: "destructive", title: "Nie udało się zrotować" });
                            }
                          }}
                        >
                          Rotuj
                        </button>
                        <button
                          type="button"
                          className="inline-flex h-8 items-center rounded-md border px-2 text-xs hover:bg-[var(--pp-primary-subtle-bg)]"
                          style={{ borderColor: "var(--pp-border)" }}
                          onClick={async () => {
                            const r = await fetch(`/api/public/klient/portal/${encodeURIComponent(cid)}`, { method: "DELETE" });
                            if (r.ok) {
                              toast({ variant: "success", title: "Unieważniono link" });
                              location.reload();
                            } else {
                              toast({ variant: "destructive", title: "Nie udało się unieważnić" });
                            }
                          }}
                        >
                          Unieważnij
                        </button>
                      </div>
                    ) : null}
                  </div>
                );
              })
            )}
          </div>

          {/* Desktop / wide: table */}
          <div className="mt-4 hidden md:block overflow-x-auto rounded-lg border" style={{ borderColor: "var(--pp-border)" }}>
          <table className="w-full text-sm">
            <thead className="bg-[var(--pp-table-header-bg)]">
              <tr className="text-left">
                <th className="px-3 py-2 font-medium">Typ linku</th>
                <th className="px-3 py-2 font-medium">Klient</th>
                <th className="px-3 py-2 font-medium">Link</th>
                <th className="px-3 py-2 font-medium">Status</th>
                <th className="px-3 py-2 font-medium whitespace-nowrap">Wygasa za</th>
                <th className="px-3 py-2 font-medium whitespace-nowrap">Utworzono</th>
                <th className="px-3 py-2 font-medium">Utworzył(a)</th>
                <th className="px-3 py-2 font-medium">Akcje</th>
              </tr>
            </thead>
            <tbody>
              {data && data.invites.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-3 py-6 text-center opacity-70">Brak wyników</td>
                </tr>
              ) : (
                data?.invites.map((i) => {
                  const status = i.purpose === "onboarding"
                    ? (i.usedAt ? "Użyty" : (i.expiresAt ? "Aktywny" : "Wygasły"))
                    : (i.purpose === "portal" ? "Portal (aktyw.)" : (i.expiresAt ? "Aktywny" : "—"));
                  const days = i.remainingDays == null ? "—" : `${i.remainingDays} d`;
                  const client = i.resultClientName || (i.resultClientId ? i.resultClientId : "—");
                  const createdAt = i.createdAt instanceof Date ? i.createdAt.getTime() : (i.createdAt as number);
                  const url = i.purpose === "portal" && i.token ? `${location.origin}/public/klient/${i.token}` : null;
                  return (
                    <tr key={i.id} className="border-t" style={{ borderColor: "var(--pp-border)" }}>
                      <td className="px-3 py-2">{i.purpose === "onboarding" ? "Onboarding" : i.purpose === "portal" ? "Portal" : (i.purpose === "new_client" ? "Nowy klient" : i.purpose)}</td>
                      <td className="px-3 py-2">{client}</td>
                      <td className="px-3 py-2 whitespace-nowrap">
                        {url ? (
                          <a
                            href={url}
                            title={url}
                            target="_blank"
                            rel="noreferrer"
                            className="text-blue-600 dark:text-blue-400 hover:underline font-medium"
                          >
                            LINK
                          </a>
                        ) : (
                          <span>—</span>
                        )}
                      </td>
                      <td className="px-3 py-2">{status}</td>
                      <td className="px-3 py-2 whitespace-nowrap">{days}{i.expiresAt ? ` (do ${formatDate(i.expiresAt instanceof Date ? i.expiresAt.getTime() : (i.expiresAt as number))})` : ""}</td>
                      <td className="px-3 py-2 text-muted-foreground whitespace-nowrap">{formatDate(createdAt)}</td>
                      <td className="px-3 py-2">{i.createdBy ?? "—"}</td>
                      <td className="px-3 py-2">
                        {(i.purpose === "portal" && (i.resultClientId || i.clientId)) ? (
                          <div className="flex flex-wrap gap-2">
                            <button
                              type="button"
                              className="inline-flex h-8 items-center rounded-md border px-2 text-xs hover:bg-[var(--pp-primary-subtle-bg)]"
                              style={{ borderColor: "var(--pp-border)" }}
                              disabled={busyId === i.id}
                              aria-busy={busyId === i.id}
                              onClick={async () => {
                                const clientId = (i.resultClientId || i.clientId)!;
                                const r = await fetch(`/api/public/klient/portal/${encodeURIComponent(clientId)}?rotate=1`, { method: "POST" });
                                if (r.ok) { try { toast({ variant: "success", title: "Zrotowano link" }); } catch {} location.reload(); }
                              }}
                            >
                              Rotuj
                            </button>
                            <button
                              type="button"
                              className="inline-flex h-8 items-center rounded-md border px-2 text-xs hover:bg-[var(--pp-primary-subtle-bg)]"
                              style={{ borderColor: "var(--pp-border)" }}
                              disabled={busyId === i.id}
                              aria-busy={busyId === i.id}
                              onClick={async () => {
                                const clientId = (i.resultClientId || i.clientId)!;
                                const r = await fetch(`/api/public/klient/portal/${encodeURIComponent(clientId)}`, { method: "DELETE" });
                                if (r.ok) { try { toast({ variant: "success", title: "Unieważniono link" }); } catch {} location.reload(); }
                              }}
                            >
                              Unieważnij
                            </button>
                            <button
                              type="button"
                              className="inline-flex h-8 items-center rounded-md border px-2 text-xs hover:bg-[var(--pp-primary-subtle-bg)]"
                              style={{ borderColor: "var(--pp-border)" }}
                              disabled={busyId === i.id}
                              aria-busy={busyId === i.id}
                              onClick={async () => {
                                setBusyId(i.id);
                                const r = await fetch(`/api/ustawienia/public-invites/${encodeURIComponent(i.id)}`, { method: "DELETE" });
                                if (r.ok) { toast({ variant: "success", title: "Usunięto" }); location.reload(); } else { toast({ variant: "destructive", title: "Nie udało się usunąć" }); }
                                setBusyId(null);
                              }}
                            >
                              Usuń
                            </button>
                          </div>
                        ) : (
                          <div className="flex flex-wrap gap-2">
                            <button
                              type="button"
                              className="inline-flex h-8 items-center rounded-md border px-2 text-xs hover:bg-[var(--pp-primary-subtle-bg)]"
                              style={{ borderColor: "var(--pp-border)" }}
                              disabled={busyId === i.id}
                              aria-busy={busyId === i.id}
                              onClick={async () => {
                                setBusyId(i.id);
                                const r = await fetch(`/api/ustawienia/public-invites/${encodeURIComponent(i.id)}`, { method: "DELETE" });
                                if (r.ok) { toast({ variant: "success", title: "Usunięto" }); location.reload(); } else { toast({ variant: "destructive", title: "Nie udało się usunąć" }); }
                                setBusyId(null);
                              }}
                            >
                              Usuń
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
          </div>
        </>
      )}
      <div className="mt-4">
        <button
          type="button"
          className="inline-flex h-9 items-center rounded-md border px-3 text-sm hover:bg-[var(--pp-primary-subtle-bg)]"
          style={{ borderColor: "var(--pp-border)" }}
          onClick={() => router.back()}
        >
          Wstecz
        </button>
      </div>
    </div>
  );
}
