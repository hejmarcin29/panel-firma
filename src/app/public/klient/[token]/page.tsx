"use client";
import * as React from "react";
import Image from "next/image";
import { useParams } from "next/navigation";
import { formatDate } from "@/lib/date";
import { defaultPipelineStageLabels, defaultPipelineStages } from "@/lib/project-settings";

export default function PublicClientPortalPage() {
  const { token } = useParams<{ token: string }>();
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [data, setData] = React.useState<{
    client: {
      name: string | null;
      phone: string | null;
      email: string | null;
      buyerType: string | null;
      companyName: string | null;
      taxId: string | null;
      invoiceCity: string | null;
      invoicePostalCode: string | null;
      invoiceAddress: string | null;
      invoiceEmail: string | null;
      preferVatInvoice: boolean | null;
    };
    orders: Array<{
      id: string;
      type: string;
      pipelineStage: string | null;
      orderNo: string | null;
      scheduledDate: number | Date | null;
      locationCity: string | null;
      locationPostalCode: string | null;
      locationAddress: string | null;
      createdAt: number | Date;
      outcome: "won" | "lost" | null;
    }>;
    portal: { token: string; createdAt: number | Date };
  } | null>(null);

  React.useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const r = await fetch(`/api/public/klient/${encodeURIComponent(token)}`);
        if (!r.ok) throw new Error("not ok");
        const j = await r.json();
        if (mounted) setData(j);
      } catch {
        if (mounted) setError("Link nieaktywny lub wygasł");
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, [token]);

  const [stageLabels, setStageLabels] = React.useState<Record<string, string>>(defaultPipelineStageLabels);
  const [stageLists, setStageLists] = React.useState<typeof defaultPipelineStages>(defaultPipelineStages);
  React.useEffect(() => {
    (async () => {
      try {
        const r = await fetch("/api/ustawienia/projekt", { cache: "no-store" });
        if (r.ok) {
          const j = await r.json();
          if (j?.pipelineStageLabels) setStageLabels(j.pipelineStageLabels);
          if (j?.pipelineStages) setStageLists(j.pipelineStages);
        }
      } catch {
        /* ignore */
      }
    })();
  }, []);

  const buyerType = React.useMemo(() => {
    if (!data?.client) return "person";
    const bt = (data.client.buyerType as string | null) ?? (data.client.companyName || data.client.taxId ? "company" : "person");
    return bt;
  }, [data]);

  const invoiceAddressLine = React.useMemo(() => {
    if (!data?.client) return "—";
    const parts: string[] = [];
    if (data.client.invoiceAddress) parts.push(String(data.client.invoiceAddress));
    const cityLine = [data.client.invoicePostalCode, data.client.invoiceCity].filter(Boolean).join(" ");
    if (cityLine) parts.push(cityLine);
    return parts.join(", ");
  }, [data]);

  return (
    <div className="mx-auto max-w-none p-0 md:max-w-3xl md:p-6">
      <div className="flex flex-col items-center gap-4 py-6">
        <Image src="/logo.svg" alt="Prime Podłoga" width={128} height={64} className="h-12 md:h-16 w-auto" />
        <h1 className="text-xl md:text-2xl font-semibold text-center">Portal klienta</h1>
      </div>

      {loading ? (
        <div className="text-center py-12">Ładowanie…</div>
      ) : error ? (
        <div className="text-center py-12 text-red-600">{error}</div>
      ) : data ? (
        <div className="mx-auto max-w-2xl space-y-4">
          <section className="rounded-lg border p-4" style={{ borderColor: "var(--pp-border)" }}>
            <div className="text-sm font-medium opacity-70 mb-2">Twoje dane kontaktowe</div>
            <div className="text-sm space-y-1">
              <div>
                {buyerType === "company" ? "Nazwa firmy" : "Imię i nazwisko"}: {" "}
                <span className="font-medium">
                  {buyerType === "company" ? (data.client.companyName || data.client.name || "—") : (data.client.name || "—")}
                </span>
              </div>
              <div>
                Telefon: <span className="font-medium">{data.client.phone || "—"}</span>
              </div>
              <div>
                Email: <span className="font-medium">{data.client.email || "—"}</span>
              </div>
            </div>
            <div className="text-sm font-medium opacity-70 mt-4 mb-2">Dane do faktury</div>
            <div className="text-sm space-y-1">
              <div>
                Nabywca: <span className="font-medium">{buyerType === "company" ? "Firma" : "Osoba prywatna"}</span>
              </div>
              {(buyerType === "company" || data.client.taxId) && (
                <div>
                  NIP: <span className="font-medium">{data.client.taxId || "—"}</span>
                </div>
              )}
              <div>
                Adres (faktura): <span className="font-medium">{invoiceAddressLine || "—"}</span>
              </div>
              <div>
                Email do faktury: <span className="font-medium">{data.client.invoiceEmail || data.client.email || "—"}</span>
              </div>
              <div>
                Rodzaj faktury: <span className="font-medium">VAT</span>
              </div>
            </div>
          </section>

          <section className="rounded-lg border p-4" style={{ borderColor: "var(--pp-border)" }}>
            <div className="text-sm font-medium opacity-70 mb-2">Twoje zlecenia</div>
            {data.orders.length === 0 ? (
              <div className="text-sm opacity-70">Brak zleceń</div>
            ) : (
              <ul className="space-y-3">
                {data.orders.map((o) => {
                  const stages = o.type === "installation" ? stageLists.installation : stageLists.delivery;
                  const label = o.pipelineStage ? (stageLabels[o.pipelineStage] || o.pipelineStage) : "—";
                  const isCompleted = o.outcome === "won";
                  const isLost = o.outcome === "lost";
                  return (
                    <li key={o.id} className="rounded border p-3" style={{ borderColor: "var(--pp-border)" }}>
                      <div className="flex items-center justify-between gap-2">
                        <div className="text-sm font-medium">
                          {o.orderNo ? `Zlecenie #${o.orderNo}_${o.type === "installation" ? "m" : "d"}` : "Zlecenie"}
                        </div>
                        <div className="text-xs opacity-70">Utworzono: {formatDate(o.createdAt)}</div>
                      </div>
                      <div className="mt-1 text-sm">Etap: <span className="font-medium">{label}</span></div>
                      <div className="mt-1 text-sm">
                        Miejsce: <span className="font-medium">
                          {o.locationCity ? `${o.locationCity}${o.locationPostalCode ? ` ${o.locationPostalCode}` : ""}, ${o.locationAddress || ""}` : "—"}
                        </span>
                      </div>
                      {(isCompleted || isLost) && (
                        <div className="mt-2">
                          <span className={`rounded-md px-2 py-0.5 text-[10px] font-semibold tracking-wide ${isCompleted ? "bg-emerald-100 text-emerald-700" : "bg-red-100 text-red-700"}`}>
                            {isCompleted ? "WYGRANE" : "PRZEGRANE"}
                          </span>
                        </div>
                      )}
                      <div className="mt-3">
                        <div className="text-xs font-medium opacity-70 mb-1">Etapy</div>
                        <ul className="space-y-1">
                          {stages.map((s) => {
                            const isCurrent = s.key === o.pipelineStage;
                            return (
                              <li key={s.key} className="flex items-center gap-2 text-sm">
                                <span aria-hidden className={`inline-block h-2.5 w-2.5 rounded-full ${isCurrent ? "bg-black" : "bg-zinc-300"}`} />
                                <span className={isCurrent ? "font-semibold" : ""}>{s.label}</span>
                                {isCurrent ? (
                                  <span className="ml-2 rounded-md bg-zinc-100 px-2 py-0.5 text-[10px] font-medium tracking-wide text-zinc-700">AKTUALNY</span>
                                ) : null}
                              </li>
                            );
                          })}
                        </ul>
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </section>

          <div className="rounded-lg border p-4" style={{ borderColor: "var(--pp-border)" }}>
            <div className="text-sm opacity-70">Edycja danych w portalu będzie dostępna w kolejnej fazie.</div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
