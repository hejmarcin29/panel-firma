"use client";
import { useEffect, useState } from "react";
import { z } from "zod";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatusBadge } from "@/components/badges";
import { formatDate } from "@/lib/date";

type AssignedOrder = {
  id: string;
  clientId: string;
  clientName: string | null;
  installerId: string | null;
  installerEmail: string | null;
  installerName: string | null;
  status: string;
  preMeasurementSqm: number | null;
  scheduledDate: number | null;
  createdAt: number;
};

export default function ZleconeMontazePage() {
  const [orders, setOrders] = useState<AssignedOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [scope, setScope] = useState<"active" | "all">("active");
  const [installers, setInstallers] = useState<
    { id: string; name: string | null; email: string | null }[]
  >([]);
  const [installerId, setInstallerId] = useState<string>("");

  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        const qs = new URLSearchParams({
          scope,
          ...(installerId ? { installerId } : {}),
        }).toString();
        const r = await fetch(`/api/montaze/zlecone?${qs}`);
        const j = await r.json().catch(() => ({}));
        const Resp = z.object({
          orders: z
            .array(
              z.object({
                id: z.string(),
                clientId: z.string(),
                clientName: z.string().nullable().optional(),
                installerId: z.string().nullable(),
                installerEmail: z.string().nullable(),
                installerName: z.string().nullable(),
                status: z.string(),
                preMeasurementSqm: z.number().nullable(),
                scheduledDate: z.number().nullable(),
                createdAt: z.number(),
              }),
            )
            .optional(),
          error: z.string().optional(),
        });
        const parsed = Resp.safeParse(j);
        if (!r.ok)
          throw new Error(
            parsed.success ? parsed.data.error || "Błąd" : "Błąd",
          );
        const data = (
          parsed.success && parsed.data.orders ? parsed.data.orders : []
        ).map((o) => ({
          ...o,
          clientName: o.clientName ?? null,
        })) as AssignedOrder[];
        setOrders(data);
      } catch (e: unknown) {
        const msg = e instanceof Error ? e.message : "Błąd ładowania";
        setError(msg);
      } finally {
        setLoading(false);
      }
    })();
  }, [scope, installerId]);
  useEffect(() => {
    (async () => {
      try {
        const r = await fetch("/api/uzytkownicy?role=installer");
        const j = await r.json().catch(() => ({}));
        const Resp = z.object({
          users: z
            .array(
              z.object({
                id: z.string(),
                name: z.string().nullable(),
                email: z.string().nullable(),
              }),
            )
            .optional(),
        });
        const parsed = Resp.safeParse(j);
        if (parsed.success && parsed.data.users)
          setInstallers(parsed.data.users);
      } catch {}
    })();
  }, []);

  return (
    <div className="mx-auto max-w-5xl p-6 space-y-4">
      <h1 className="text-2xl font-semibold">Zlecone montaże</h1>
      <div className="flex items-center gap-2 flex-wrap">
        <button
          className={[
            "h-8 rounded-full border px-3 text-sm transition-colors",
            scope === "active"
              ? "bg-[var(--pp-primary)] text-white border-transparent"
              : "bg-[var(--pp-panel)] text-[var(--pp-text)] border-[var(--pp-border)] hover:bg-[var(--pp-primary-subtle-bg)]",
          ].join(" ")}
          onClick={() => setScope("active")}
        >
          Aktywne
        </button>
        <button
          className={[
            "h-8 rounded-full border px-3 text-sm transition-colors",
            scope === "all"
              ? "bg-[var(--pp-primary)] text-white border-transparent"
              : "bg-[var(--pp-panel)] text-[var(--pp-text)] border-[var(--pp-border)] hover:bg-[var(--pp-primary-subtle-bg)]",
          ].join(" ")}
          onClick={() => setScope("all")}
        >
          Wszystkie
        </button>
        <div className="flex items-center gap-2 ml-auto">
          <label className="text-sm opacity-70">Montażysta</label>
          <select
            value={installerId}
            onChange={(e) => setInstallerId(e.target.value)}
            className="h-8 rounded-md border px-2 text-sm"
            style={{ borderColor: "var(--pp-border)" }}
          >
            <option value="">Wszyscy</option>
            {installers.map((u) => (
              <option key={u.id} value={u.id}>
                {u.name || u.email || u.id.slice(0, 8)}
              </option>
            ))}
          </select>
        </div>
      </div>
      {loading && <div className="text-sm opacity-70">Ładowanie…</div>}
      {error && <div className="text-sm text-red-600">{error}</div>}
      {!loading && !error && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle>Przypisane montaże</CardTitle>
          </CardHeader>
          <CardContent>
            {orders.length === 0 ? (
              <div className="text-sm opacity-70">Brak wyników.</div>
            ) : (
              <div
                className="divide-y rounded border"
                style={{ borderColor: "var(--pp-border)" }}
              >
                {orders.map((o) => (
                  <div
                    key={o.id}
                    className="p-3 text-sm flex items-center justify-between"
                  >
                    <div>
                      <div className="font-medium">
                        {o.clientName || "Klient"}
                      </div>
                      <div className="text-xs opacity-70 mt-0.5 flex items-center gap-2 flex-wrap">
                        <span className="opacity-80">Status:</span>{" "}
                        <StatusBadge status={o.status} label={o.status} />
                        <span className="mx-1.5">•</span>
                        Montażysta: {o.installerName || o.installerEmail || "-"}
                        <span className="mx-1.5">•</span>
                        m2: {o.preMeasurementSqm ?? "-"}
                        <span className="mx-1.5">•</span>
                        Utworzono: {formatDate(o.createdAt, "—")}
                      </div>
                    </div>
                    <div>
                      <a
                        href={`/zlecenia/${o.id}`}
                        className="text-xs underline"
                      >
                        Szczegóły
                      </a>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
