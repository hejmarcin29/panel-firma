"use client";
import * as React from "react";
import Image from "next/image";
import { useParams, useRouter } from "next/navigation";
import { formatDate } from "@/lib/date";
import { formatCityPostalAddress } from "@/lib/address";
import { defaultPipelineStageLabels, defaultPipelineStages } from "@/lib/project-settings";

export default function PublicOrderPreviewPage() {
  const { token } = useParams<{ token: string }>();
  const router = useRouter();
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [data, setData] = React.useState<{
    order: {
      id: string;
      type: string;
      pipelineStage: string | null;
      orderNo: string | null;
      scheduledDate: number | Date | null;
      locationCity: string | null;
      locationPostalCode: string | null;
      locationAddress: string | null;
    };
    client:
      | ({
          name: string | null;
          phone: string | null;
          email: string | null;
        } & {
          companyName: string | null;
          buyerType: string | null; // 'person' | 'company'
          taxId: string | null;
          invoiceCity: string | null;
          invoicePostalCode: string | null;
          invoiceAddress: string | null;
          invoiceEmail: string | null;
          preferVatInvoice: boolean | null;
        })
      | null;
    allowEdit: boolean;
    expiresAt: number | Date | null;
  } | null>(null);

  React.useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const r = await fetch(`/api/public/zlecenia/${encodeURIComponent(token)}`);
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

  const headline = React.useMemo(() => {
    if (!data?.order) return "Podgląd zlecenia";
    const suffix = data.order.type === "installation" ? "m" : "d";
    return data.order.orderNo ? `Zlecenie #${data.order.orderNo}_${suffix}` : "Podgląd zlecenia";
  }, [data]);

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

  return (
    <div className="mx-auto max-w-none p-0 md:max-w-2xl md:p-6">
      <div className="flex flex-col items-center gap-4 py-6">
        <Image src="/logo.svg" alt="Prime Podłoga" width={128} height={64} className="h-12 md:h-16 w-auto" />
        <h1 className="text-xl md:text-2xl font-semibold text-center">{headline}</h1>
      </div>

      {loading ? (
        <div className="text-center py-12">Ładowanie…</div>
      ) : error ? (
        <div className="text-center py-12 text-red-600">{error}</div>
      ) : data ? (
        <div className="mx-auto max-w-xl space-y-4">
          <section className="rounded-lg border p-4" style={{ borderColor: "var(--pp-border)" }}>
            <div className="text-sm font-medium opacity-70 mb-2">Twoje dane kontaktowe</div>
            {(() => {
              const bt = (data.client?.buyerType as string | null) ?? (data.client?.companyName || data.client?.taxId ? "company" : "person");
              const nameLabel = bt === "company" ? "Nazwa firmy" : "Imię i nazwisko";
              const displayName = bt === "company" ? (data.client?.companyName || data.client?.name || "—") : (data.client?.name || "—");
              const invoiceDisplayName = bt === "company" ? (data.client?.companyName || data.client?.name || "—") : (data.client?.name || "—");
              const addrParts: string[] = [];
              if (data.client?.invoiceAddress) addrParts.push(String(data.client.invoiceAddress));
              const cityLine = [data.client?.invoicePostalCode, data.client?.invoiceCity].filter(Boolean).join(" ");
              if (cityLine) addrParts.push(cityLine);
              const addr = addrParts.join(", ");
              const showNip = bt === "company" || !!data.client?.taxId;
              return (
                <>
                  <div className="text-sm space-y-1">
                    <div>
                      {nameLabel}: <span className="font-medium">{displayName}</span>
                    </div>
                    <div>
                      Telefon: <span className="font-medium">{data.client?.phone || "—"}</span>
                    </div>
                    <div>
                      Email: <span className="font-medium">{data.client?.email || "—"}</span>
                    </div>
                  </div>
                  <div className="text-sm font-medium opacity-70 mt-4 mb-2">Dane do faktury</div>
                  <div className="text-sm space-y-1">
                    <div>
                      Nazwa do faktury: <span className="font-medium">{invoiceDisplayName}</span>
                    </div>
                    <div>
                      Nabywca: <span className="font-medium">{bt === "company" ? "Firma" : "Osoba prywatna"}</span>
                    </div>
                    {showNip ? (
                      <div>
                        NIP: <span className="font-medium">{data.client?.taxId || "—"}</span>
                      </div>
                    ) : null}
                    <div>
                      Adres (faktura): <span className="font-medium">{addr || "—"}</span>
                    </div>
                    <div>
                      Email do faktury: <span className="font-medium">{data.client?.invoiceEmail || data.client?.email || "—"}</span>
                    </div>
                    <div>
                      Rodzaj faktury: <span className="font-medium">VAT</span>
                    </div>
                  </div>
                </>
              );
            })()}
          </section>
          <section className="rounded-lg border p-4" style={{ borderColor: "var(--pp-border)" }}>
            <div className="text-sm font-medium opacity-70 mb-2">Szczegóły zlecenia</div>
            <div className="text-sm space-y-1">
              <div>
                Typ: <span className="font-medium">{data.order.type === "installation" ? "Montaż" : "Dostawa"}</span>
              </div>
              <div>
                Etap: <span className="font-medium">{data.order.pipelineStage ? (stageLabels[data.order.pipelineStage] || data.order.pipelineStage) : "—"}</span>
              </div>
              <div>
                Planowana data: <span className="font-medium">{data.order.scheduledDate ? formatDate(data.order.scheduledDate) : "—"}</span>
              </div>
              <div>
                Miejsce realizacji: <span className="font-medium">{formatCityPostalAddress(data.order.locationCity, data.order.locationPostalCode, data.order.locationAddress)}</span>
              </div>
            </div>
          </section>
          <section className="rounded-lg border p-4" style={{ borderColor: "var(--pp-border)" }}>
            <div className="text-sm font-medium opacity-70 mb-2">Etapy</div>
            <ul className="space-y-2">
              {(data.order.type === "installation" ? stageLists.installation : stageLists.delivery).map((s) => {
                const isCurrent = s.key === data.order.pipelineStage;
                return (
                  <li key={s.key} className="flex items-center gap-2 text-sm">
                    <span
                      aria-hidden
                      className={`inline-block h-2.5 w-2.5 rounded-full ${isCurrent ? "bg-black" : "bg-zinc-300"}`}
                    />
                    <span className={isCurrent ? "font-semibold" : ""}>{s.label}</span>
                    {isCurrent ? (
                      <span className="ml-2 rounded-md bg-zinc-100 px-2 py-0.5 text-[10px] font-medium tracking-wide text-zinc-700">
                        AKTUALNY
                      </span>
                    ) : null}
                  </li>
                );
              })}
            </ul>
          </section>
          {data.allowEdit ? (
            <div className="rounded-lg border p-4" style={{ borderColor: "var(--pp-border)" }}>
              <div className="text-sm opacity-70">Edycja danych będzie dostępna w kolejnej fazie.</div>
            </div>
          ) : null}
          <div className="pt-2">
            <button
              type="button"
              className="inline-flex h-9 items-center rounded-md border px-3 text-sm hover:bg-[var(--pp-primary-subtle-bg)]"
              style={{ borderColor: "var(--pp-border)" }}
              onClick={() => router.push("/public/dziekujemy")}
            >
              Zamknij
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
