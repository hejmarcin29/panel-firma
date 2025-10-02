"use client";
import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { BackButton } from "@/components/back-button";
import { useToast } from "@/components/ui/toaster";
import { DatePicker } from "@/components/ui/date-picker";
import { Input } from "@/components/ui/input";

type Klient = { id: string; name: string };

// Helpers extracted to module scope to keep useEffect deps clean
function toISODate(d: Date) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}
function addBusinessDays(from: string, days: number) {
  if (!from) return "";
  const year = new Date().getFullYear();
  const fixed = (y: number) => [
    `${y}-01-01`,
    `${y}-01-06`,
    `${y}-05-01`,
    `${y}-05-03`,
    `${y}-08-15`,
    `${y}-11-01`,
    `${y}-11-11`,
    `${y}-12-25`,
    `${y}-12-26`,
  ];
  const holidays = new Set([...fixed(year), ...fixed(year + 1)]);
  const d = new Date(from + "T00:00:00");
  let added = 0;
  while (added < days) {
    d.setDate(d.getDate() + 1);
    const iso = toISODate(d);
    const dow = d.getDay();
    const isWeekend = dow === 0 || dow === 6;
    const isHoliday = holidays.has(iso);
    if (!isWeekend && !isHoliday) added++;
  }
  return toISODate(d);
}

export default function NewDeliveryPage() {
  const router = useRouter();
  const sp = useSearchParams();
  const preselectedClientId = sp.get("clientId") || "";
  const { toast } = useToast();

  const [clients, setClients] = useState<Klient[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [clientId, setClientId] = useState<string>(preselectedClientId);
  const [orderPlacedAt, setOrderPlacedAt] = useState<string>("");
  const [plannedAt, setPlannedAt] = useState<string>("");
  const [plannedTouched, setPlannedTouched] = useState(false);
  const [driver, setDriver] = useState<string>("admin");
  const [note, setNote] = useState<string>("");
  const [items, setItems] = useState<Array<{ name: string; sqm: string; packs: string }>>([
    { name: "", sqm: "", packs: "" },
  ]);
  const [sameAsInvoice, setSameAsInvoice] = useState(true);
  const [delPostalCode, setDelPostalCode] = useState("");
  const [delCity, setDelCity] = useState("");
  const [delAddress, setDelAddress] = useState("");
  const [invPostalCode, setInvPostalCode] = useState("");
  const [invCity, setInvCity] = useState("");
  const [invAddress, setInvAddress] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // Helpers moved above

  const canSubmit = useMemo(() => !!clientId && !!plannedAt && !!driver, [clientId, plannedAt, driver]);

  useEffect(() => {
    (async () => {
      try {
        const r = await fetch("/api/klienci");
        if (!r.ok) throw new Error("Błąd");
        const j = await r.json();
        setClients(j.clients || []);
      } catch {
        setError("Błąd ładowania");
      } finally {
        setLoading(false);
      }
    })();
    // Defaults for dates
    const today = toISODate(new Date());
    setOrderPlacedAt(today);
    setPlannedAt(addBusinessDays(today, 5));
  }, []);

  // Load invoice address for selected client (for greyed preview)
  useEffect(() => {
    if (!clientId) {
      setInvPostalCode("");
      setInvCity("");
      setInvAddress("");
      return;
    }
    (async () => {
      try {
        const r = await fetch(`/api/klienci/${clientId}`);
        type ClientResp = { client?: { invoicePostalCode?: string | null; invoiceCity?: string | null; invoiceAddress?: string | null } };
        const j = (await r.json().catch(() => null)) as ClientResp | null;
        if (r.ok && j?.client) {
          setInvPostalCode(j.client.invoicePostalCode || "");
          setInvCity(j.client.invoiceCity || "");
          setInvAddress(j.client.invoiceAddress || "");
        }
      } catch {
        // ignore
      }
    })();
  }, [clientId]);

  async function onSubmit() {
    if (!canSubmit) return;
    setSubmitting(true);
    try {
      const scheduledTs = new Date(plannedAt + "T00:00:00").getTime();
      const placedTs = orderPlacedAt ? new Date(orderPlacedAt + "T00:00:00").getTime() : undefined;
      const orderBody: Record<string, unknown> = {
        clientId,
        type: "delivery",
        scheduledDate: scheduledTs,
        orderPlacedAt: placedTs,
      };
      if (!sameAsInvoice) {
        orderBody.locationPostalCode = delPostalCode.trim() || undefined;
        orderBody.locationCity = delCity.trim() || undefined;
        orderBody.locationAddress = delAddress.trim() || undefined;
      }
      const createOrderRes = await fetch("/api/zlecenia", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(orderBody),
      });
      const created = await createOrderRes.json().catch(() => ({}));
      if (!createOrderRes.ok) throw new Error(created?.error || "Nie udało się utworzyć zlecenia");
      const orderId: string | undefined = created?.id;
      if (!orderId) throw new Error("Brak identyfikatora zlecenia");

      const lines = items
        .filter((it) => it.name.trim())
        .map((it) => `• ${it.name.trim()}${it.sqm ? ` – ${it.sqm} m²` : ""}${it.packs ? ` (${it.packs} op.)` : ""}`);
      const slotBody: Record<string, unknown> = {
        status: "planned",
        plannedAt: scheduledTs,
        carrier: "Własny",
        trackingNo: null,
        note: [note?.trim() || "", lines.length ? `Produkty:\n${lines.join("\n")}` : "", `Kierowca: ${driver}`]
          .filter(Boolean)
          .join(" | "),
        items: items
          .filter((it) => it.name.trim())
          .map((it) => ({ name: it.name.trim(), sqm: it.sqm.trim(), packs: it.packs.trim() })),
      };
      const slotRes = await fetch(`/api/zlecenia/${orderId}/dostawy`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(slotBody),
      });
      const slotJson = await slotRes.json().catch(() => ({}));
      if (!slotRes.ok) throw new Error(slotJson?.error || "Nie udało się dodać dostawy");

      toast({ title: "Dodano dostawę", variant: "success" });
      router.push(`/dostawa/${orderId}`);
      router.refresh();
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Coś poszło nie tak";
      toast({ title: "Błąd", description: msg, variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) return <div className="p-6 text-sm">Wczytywanie…</div>;
  if (error) return <div className="p-6 text-sm text-red-600">{error}</div>;

  return (
    <div className="mx-auto max-w-none md:max-w-3xl p-0 md:p-6 space-y-6">
      <div className="flex items-center gap-2">
        <BackButton fallbackHref="/klienci" />
        <h1 className="text-2xl font-semibold">Dodaj dostawę</h1>
      </div>
      <div className="grid gap-4">
        {/* Klient */}
        {preselectedClientId ? (
          <div>
            <label className="text-sm opacity-70">Klient</label>
            <div className="mt-1 h-9 w-full rounded-md border border-black/15 px-3 text-sm flex items-center dark:border-white/15">
              {clients.find((c) => c.id === preselectedClientId)?.name || "Wybrany klient"}
            </div>
          </div>
        ) : (
          <div>
            <label className="text-sm opacity-70" htmlFor="client">Klient</label>
            <select
              id="client"
              value={clientId}
              onChange={(e) => setClientId(e.currentTarget.value)}
              className="mt-1 h-9 w-full rounded-md border border-black/15 bg-transparent px-3 text-sm outline-none dark:border-white/15"
            >
              <option value="">-- wybierz klienta --</option>
              {clients.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>
        )}

        {/* Daty */}
        <div>
          <label className="text-sm opacity-70">Data złożenia zamówienia</label>
          <div className="mt-1">
            <DatePicker
              value={orderPlacedAt}
              onChange={(v) => {
                setOrderPlacedAt(v);
                if (!plannedTouched) {
                  setPlannedAt(addBusinessDays(v, 5));
                }
              }}
            />
          </div>
        </div>
        <div>
          <label className="text-sm opacity-70">Data dostawy</label>
          <div className="mt-1">
            <DatePicker
              value={plannedAt}
              onChange={(v) => {
                setPlannedAt(v);
                setPlannedTouched(true);
              }}
            />
          </div>
        </div>

        {/* Produkty */}
        <div>
          <label className="text-sm opacity-70">Pozycje (produkt)</label>
          <div className="mt-1 space-y-2">
            {items.map((it, idx) => (
              <div key={idx} className="grid grid-cols-1 md:grid-cols-6 gap-2">
                <input
                  className="md:col-span-3 h-9 w-full rounded-md border border-black/15 bg-transparent px-3 text-sm outline-none dark:border-white/15"
                  placeholder="Nazwa produktu"
                  value={it.name}
                  onChange={(e) => {
                    const v = e.currentTarget.value;
                    setItems((prev) => prev.map((p, i) => (i === idx ? { ...p, name: v } : p)));
                  }}
                />
                <input
                  className="md:col-span-1 h-9 w-full rounded-md border border-black/15 bg-transparent px-3 text-sm outline-none dark:border-white/15"
                  placeholder="m²"
                  inputMode="decimal"
                  value={it.sqm}
                  onChange={(e) => {
                    const v = e.currentTarget.value.replace(/[^0-9.,]/g, "");
                    setItems((prev) => prev.map((p, i) => (i === idx ? { ...p, sqm: v } : p)));
                  }}
                />
                <input
                  className="md:col-span-1 h-9 w-full rounded-md border border-black/15 bg-transparent px-3 text-sm outline-none dark:border-white/15"
                  placeholder="op."
                  inputMode="numeric"
                  value={it.packs}
                  onChange={(e) => {
                    const v = e.currentTarget.value.replace(/\D/g, "");
                    setItems((prev) => prev.map((p, i) => (i === idx ? { ...p, packs: v } : p)));
                  }}
                />
                <button
                  onClick={(e) => {
                    e.preventDefault();
                    setItems((prev) => prev.filter((_, i) => i !== idx));
                  }}
                  className="md:col-span-1 h-9 rounded-md border border-black/15 px-3 text-sm hover:bg-black/5 dark:border-white/15 dark:hover:bg-white/10"
                  disabled={items.length === 1}
                >
                  Usuń
                </button>
              </div>
            ))}
            <button
              onClick={(e) => {
                e.preventDefault();
                setItems((prev) => [...prev, { name: "", sqm: "", packs: "" }]);
              }}
              className="h-8 rounded-md border border-black/15 px-3 text-xs hover:bg-black/5 dark:border-white/15 dark:hover:bg-white/10"
            >
              Dodaj pozycję
            </button>
          </div>
        </div>

        {/* Adres */}
        <div>
          <div className="flex items-center gap-2">
            <input
              id="sameAsInvoice"
              type="checkbox"
              className="h-4 w-4"
              checked={sameAsInvoice}
              onChange={(e) => setSameAsInvoice(e.currentTarget.checked)}
            />
            <label htmlFor="sameAsInvoice" className="text-sm opacity-70">
              Adres dostawy taki sam jak do faktury
            </label>
          </div>
          <div className="mt-2 grid grid-cols-1 md:grid-cols-3 gap-2">
            {/** Display invoice address in grey when checked; keep user's own values when unchecked */}
            <input
              className={`h-9 w-full rounded-md border px-3 text-sm outline-none ${sameAsInvoice ? "opacity-60 cursor-not-allowed border-black/10 dark:border-white/10 bg-black/5 dark:bg-white/5" : "border-black/15 bg-transparent dark:border-white/15"}`}
              placeholder="Kod (00-000)"
              inputMode="numeric"
              value={sameAsInvoice ? invPostalCode : delPostalCode}
              disabled={sameAsInvoice}
              onChange={(e) => {
                const digits = e.currentTarget.value.replace(/\D/g, "").slice(0, 5);
                const fm = digits.length <= 2 ? digits : `${digits.slice(0, 2)}-${digits.slice(2)}`;
                setDelPostalCode(fm);
              }}
            />
            <input
              className={`h-9 w-full rounded-md border px-3 text-sm outline-none ${sameAsInvoice ? "opacity-60 cursor-not-allowed border-black/10 dark:border-white/10 bg-black/5 dark:bg-white/5" : "border-black/15 bg-transparent dark:border-white/15"}`}
              placeholder="Miejscowość"
              value={sameAsInvoice ? invCity : delCity}
              disabled={sameAsInvoice}
              onChange={(e) => setDelCity(e.currentTarget.value)}
            />
            <input
              className={`h-9 w-full rounded-md border px-3 text-sm outline-none ${sameAsInvoice ? "opacity-60 cursor-not-allowed border-black/10 dark:border-white/10 bg-black/5 dark:bg-white/5" : "border-black/15 bg-transparent dark:border-white/15"}`}
              placeholder="Adres (ulica i numer, opcjonalnie lokal/piętro)"
              value={sameAsInvoice ? invAddress : delAddress}
              disabled={sameAsInvoice}
              onChange={(e) => setDelAddress(e.currentTarget.value)}
            />
          </div>
          <p className="text-[11px] opacity-60 mt-1">Zaznaczone = użyjemy adresu z faktury; pola są podglądowe i wyłączone.</p>
        </div>

        {/* Kierowca + Notatka */}
        <div>
          <label className="text-sm opacity-70">Kierowca</label>
          <select
            value={driver}
            onChange={(e) => setDriver(e.currentTarget.value)}
            className="mt-1 h-9 w-full rounded-md border border-black/15 bg-transparent px-3 text-sm outline-none dark:border-white/15"
          >
            <option value="admin">admin</option>
          </select>
          <p className="mt-1 text-[11px] opacity-60">MVP: na razie tylko Ty jeździsz, więc lista zawiera jedną opcję.</p>
        </div>
        <div>
          <label className="text-sm opacity-70">Notatka (opcjonalnie)</label>
          <Input
            value={note}
            onChange={(e) => setNote(e.currentTarget.value)}
            placeholder="np. dostawa po 16:00"
          />
        </div>

        {/* Akcje */}
        <div className="flex items-center gap-2 pt-2">
          <button
            onClick={(e) => {
              e.preventDefault();
              onSubmit();
            }}
            disabled={!canSubmit || submitting}
            className="inline-flex h-10 items-center rounded-md border px-4 text-sm text-white"
            style={{ background: "var(--pp-primary)", borderColor: "var(--pp-primary)" }}
          >
            {submitting ? "Zapisywanie…" : "Utwórz dostawę"}
          </button>
          <Link
            href={preselectedClientId ? `/klienci/${preselectedClientId}` : "/klienci"}
            className="inline-flex h-10 items-center rounded-md border px-4 text-sm hover:bg-[var(--pp-primary-subtle-bg)]"
            style={{ borderColor: "var(--pp-border)" }}
          >
            Anuluj
          </Link>
        </div>
      </div>
    </div>
  );
}
