"use client";
import { useEffect, useState } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { pl } from "@/i18n/pl";
import { StatusBadge } from "@/components/badges";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { formatDate } from "@/lib/date";

type MyOrder = {
  id: string;
  clientId: string;
  clientName: string;
  status: string;
  preMeasurementSqm: number | null;
  scheduledDate: number | null;
  createdAt: number;
};

export default function PanelMontazysty() {
  const [invoiceInfo, setInvoiceInfo] = useState<string>("");
  const [canEditInvoice, setCanEditInvoice] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const r = await fetch("/api/ustawienia/projekt");
        const j = await r.json().catch(() => ({}));
        if (typeof j.invoiceInfoText === "string") setInvoiceInfo(j.invoiceInfoText);
        // simple role check from session endpoint (optional lightweight)
        const s = await fetch("/api/auth/session");
        const sj = await s.json().catch(() => ({}));
        const role = sj?.user?.role as string | undefined;
        setCanEditInvoice(role === "admin");
      } catch {}
    })();
  }, []);
  const [orders, setOrders] = useState<MyOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [scope, setScope] = useState<"active" | "all">("active");
  const [rules, setRules] = useState<{
    id: string;
    title: string;
    contentMd: string;
    version: number;
    requiresAck: boolean;
  } | null>(null);
  const [ack, setAck] = useState<boolean>(true);

  useEffect(() => {
    (async () => {
      try {
        const r = await fetch(`/api/montazysta/moje?scope=${scope}`);
        const j = await r.json().catch(() => ({}));
        const RespSchema = z.object({
          orders: z
            .array(
              z.object({
                id: z.string(),
                clientId: z.string(),
                clientName: z.string().optional().default(""),
                status: z.string(),
                preMeasurementSqm: z.number().nullable(),
                scheduledDate: z.number().nullable(),
                createdAt: z.number(),
              }),
            )
            .optional(),
          error: z.string().optional(),
        });
        const parsed = RespSchema.safeParse(j);
        if (!r.ok)
          throw new Error(
            parsed.success ? parsed.data.error || "Błąd" : "Błąd",
          );
        setOrders(
          parsed.success && parsed.data.orders ? parsed.data.orders : [],
        );
      } catch (e: unknown) {
        const msg = e instanceof Error ? e.message : "Błąd ładowania";
        setError(msg);
      } finally {
        setLoading(false);
      }
    })();
  }, [scope]);

  useEffect(() => {
    (async () => {
      try {
        const r = await fetch("/api/zasady-wspolpracy?active=1&includeAck=1");
        const j = await r.json().catch(() => ({}));
        const RuleSchema = z.object({
          rule: z
            .object({
              id: z.string(),
              title: z.string(),
              contentMd: z.string(),
              version: z.number(),
              requiresAck: z.boolean(),
            })
            .nullable(),
          ack: z.object({ acknowledged: z.boolean() }).optional(),
        });
        const parsed = RuleSchema.safeParse(j);
        if (parsed.success) {
          setRules(parsed.data.rule);
          setAck(parsed.data.ack?.acknowledged ?? true);
        }
      } catch {
        // ignore banner on failure
      }
    })();
  }, []);

  return (
    <div className="mx-auto max-w-4xl p-6 space-y-4">
      <h1 className="text-2xl font-semibold">Moje montaże</h1>
      {/* Dane do faktury — widoczne dla montażystów na dashboardzie */}
      <Card>
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between gap-2">
            <CardTitle>Dane do faktury</CardTitle>
            {canEditInvoice && (
              <a
                href="/ustawienia"
                className="text-xs hover:underline focus:underline focus:outline-none"
                title="Edytuj w Ustawieniach"
              >
                Edytuj
              </a>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-sm leading-relaxed whitespace-pre-line">
            {invoiceInfo || "—"}
          </div>
        </CardContent>
      </Card>
      <div className="flex items-center gap-2">
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
      </div>
      {loading && (
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div
              key={i}
              className="rounded border border-black/10 p-3 dark:border-white/10"
            >
              <Skeleton className="h-4 w-40 mb-2" />
              <Skeleton className="h-3 w-64" />
            </div>
          ))}
        </div>
      )}
      {error && <div className="text-sm text-red-600">{error}</div>}
      {!loading && !error && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle>Przypisane zlecenia montażu</CardTitle>
          </CardHeader>
          <CardContent>
            {rules && rules.requiresAck && !ack && (
              <div className="mb-4 rounded-md border border-amber-300 bg-amber-50 p-3 text-amber-900 dark:border-amber-700 dark:bg-amber-900/20 dark:text-amber-100">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <div className="font-medium">
                      Zasady współpracy – wersja {rules.version}
                    </div>
                    <div className="text-xs opacity-80">
                      Prosimy o zapoznanie się i potwierdzenie.
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <a
                      href="#zasady"
                      className="text-xs hover:underline focus:underline focus:outline-none"
                    >
                      Otwórz
                    </a>
                    <Button
                      size="sm"
                      onClick={async () => {
                        try {
                          const res = await fetch(
                            `/api/zasady-wspolpracy/${rules.id}/akceptuj`,
                            { method: "POST" },
                          );
                          if (!res.ok) throw new Error("Błąd");
                          setAck(true);
                        } catch {}
                      }}
                    >
                      Potwierdzam
                    </Button>
                  </div>
                </div>
              </div>
            )}
            {orders.length === 0 ? (
              <div className="text-sm opacity-70">
                Brak przypisanych montaży.
              </div>
            ) : (
              <div
                className="divide-y rounded border brand-border"
                style={{ borderColor: "var(--pp-border)" }}
              >
                {orders.map((o) => {
                  const statusLabel =
                    (pl.orders.statuses as Record<string, string>)[o.status] ||
                    o.status;
                  return (
                    <div
                      key={o.id}
                      className="p-3 text-sm flex items-center justify-between"
                    >
                      <div>
                        <div className="font-medium">
                          {o.clientName || "Klient"}
                        </div>
                        <div className="text-xs opacity-70 mt-0.5 flex items-center gap-1.5">
                          <span className="opacity-80">Status:</span>{" "}
                          <StatusBadge status={o.status} label={statusLabel} />
                          <span className="mx-1.5">•</span>
                          m2: {o.preMeasurementSqm ?? "-"}
                          <span className="mx-1.5">•</span>
                          Utworzono: {formatDate(o.createdAt)}
                        </div>
                      </div>
                      <div>
                        <a
                          href={`/montaz/${o.id}`}
                          className="text-xs hover:underline focus:underline focus:outline-none"
                        >
                          Szczegóły
                        </a>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      )}
      {rules && (
        <Card id="zasady" className="scroll-mt-16">
          <CardHeader className="pb-1">
            <CardTitle>Zasady współpracy</CardTitle>
            <div className="text-xs opacity-70">Wersja {rules.version}</div>
          </CardHeader>
          <CardContent>
            <pre className="whitespace-pre-wrap text-sm">{rules.contentMd}</pre>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
