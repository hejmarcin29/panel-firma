"use client";
import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { BackButton } from '@/components/back-button';
import { pl } from '@/i18n/pl';
import { AlertDialog } from '@/components/ui/alert-dialog';
import { Input } from '@/components/ui/input';
import { DatePicker } from '@/components/ui/date-picker';
import { useToast } from '@/components/ui/toaster';
import { formatDate } from '@/lib/date';

type Klient = {
  id: string;
  name: string;
  createdAt: number;
};

export default function NoweZlecenieSelectPage() {
  const [clients, setClients] = useState<Klient[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedClient, setSelectedClient] = useState<Klient | null>(null);
  const [query, setQuery] = useState('');
  const [fromClientId, setFromClientId] = useState<string | null>(null);
  const router = useRouter();
  const { toast } = useToast();

  // Modal state (MVP "Dodaj dostawę")
  const [deliveryModalOpen, setDeliveryModalOpen] = useState(false);
  const [deliveryClientId, setDeliveryClientId] = useState<string | null>(null);
  const [plannedAt, setPlannedAt] = useState<string>("");
  const [plannedTouched, setPlannedTouched] = useState(false);
  const [driver, setDriver] = useState<string>("admin"); // MVP: only one option
  const [note, setNote] = useState<string>("");
  const [submitting, setSubmitting] = useState(false);
  // Data złożenia zamówienia (domyślnie dziś)
  const [orderPlacedAt, setOrderPlacedAt] = useState<string>('');

  // Helpers
  function toISODate(d: Date) {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  }
  function addBusinessDays(from: string, days: number) {
    if (!from) return '';
    // Prosta lista świąt PL (ustawowe) na bieżący i następny rok; bez świąt ruchomych (Wielkanoc/Boże Ciało) w MVP
    const year = new Date().getFullYear();
    const fixed = (y: number) => [
      `${y}-01-01`, // Nowy Rok
      `${y}-01-06`, // Trzech Króli
      `${y}-05-01`, // Święto Pracy
      `${y}-05-03`, // Święto Konstytucji 3 Maja
      `${y}-08-15`, // Wniebowzięcie NMP
      `${y}-11-01`, // Wszystkich Świętych
      `${y}-11-11`, // Święto Niepodległości
      `${y}-12-25`, // Boże Narodzenie (1)
      `${y}-12-26`, // Boże Narodzenie (2)
    ];
    const holidays = new Set([...fixed(year), ...fixed(year + 1)]);

  const d = new Date(from + 'T00:00:00');
    let added = 0;
    while (added < days) {
      d.setDate(d.getDate() + 1);
      const iso = toISODate(d);
      const dow = d.getDay(); // 0=Sun,6=Sat
      const isWeekend = (dow === 0 || dow === 6);
      const isHoliday = holidays.has(iso);
      if (!isWeekend && !isHoliday) added++;
    }
    return toISODate(d);
  }
  // Pozycje produktów (MVP: w notatce do slotu, ale od razu zbieramy ustrukturyzowane dane)
  const [items, setItems] = useState<Array<{ name: string; sqm: string; packs: string }>>([
    { name: '', sqm: '', packs: '' },
  ]);
  // Adres dostawy
  const [sameAsInvoice, setSameAsInvoice] = useState(true);
  const [delPostalCode, setDelPostalCode] = useState('');
  const [delCity, setDelCity] = useState('');
  const [delAddress, setDelAddress] = useState('');

  const canSubmitDelivery = useMemo(() => {
    return Boolean(deliveryClientId && plannedAt && driver);
  }, [deliveryClientId, plannedAt, driver]);

  useEffect(() => {
    const sp = new URLSearchParams(window.location.search);
    const cid = sp.get('clientId');
    if (cid) setFromClientId(cid);
    (async () => {
      try {
        const r = await fetch('/api/klienci');
        if (!r.ok) throw new Error('Błąd');
        const j = await r.json();
        setClients(j.clients || []);
      } catch {
        setError('Błąd ładowania');
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  function openDeliveryModal(clientId: string) {
    setDeliveryClientId(clientId);
    const today = toISODate(new Date());
    const defaultPlanned = addBusinessDays(today, 5);
    setOrderPlacedAt(today);
    setPlannedAt(defaultPlanned);
    setPlannedTouched(false);
    setDriver("admin");
    setNote("");
    setItems([{ name: '', sqm: '', packs: '' }]);
    setSameAsInvoice(true);
    setDelPostalCode(''); setDelCity(''); setDelAddress('');
    setDeliveryModalOpen(true);
  }

  async function handleCreateDelivery() {
    if (!deliveryClientId) return;
    if (!plannedAt) {
      toast({ title: 'Błąd', description: 'Podaj datę dostawy', variant: 'destructive' });
      return;
    }
    setSubmitting(true);
    try {
      // 1) Utwórz zlecenie typu "delivery"
  const scheduledTs = new Date(plannedAt + 'T00:00:00').getTime();
      const placedTs = orderPlacedAt ? new Date(orderPlacedAt + 'T00:00:00').getTime() : undefined
      const orderBody: Record<string, unknown> = { clientId: deliveryClientId, type: 'delivery', scheduledDate: scheduledTs, orderPlacedAt: placedTs }
      if (!sameAsInvoice) {
        orderBody.locationPostalCode = delPostalCode.trim() || undefined
        orderBody.locationCity = delCity.trim() || undefined
        orderBody.locationAddress = delAddress.trim() || undefined
      }
      const createOrderRes = await fetch('/api/zlecenia', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(orderBody),
      });
      const created = await createOrderRes.json().catch(() => ({}));
      if (!createOrderRes.ok) throw new Error(created?.error || 'Nie udało się utworzyć zlecenia');
      const orderId: string | undefined = created?.id;
      if (!orderId) throw new Error('Brak identyfikatora zlecenia');

      // 2) Dodaj slot dostawy (MVP: kierowca = admin → wpiszemy w notatce + carrier="Własny")
      const lines = items
        .filter((it) => it.name.trim())
        .map((it) => `• ${it.name.trim()}${it.sqm ? ` – ${it.sqm} m²` : ''}${it.packs ? ` (${it.packs} op.)` : ''}`)
      const body: Record<string, unknown> = {
        status: 'planned',
        plannedAt: scheduledTs,
        carrier: 'Własny',
        trackingNo: null,
        note: [
          note?.trim() || '',
          lines.length ? `Produkty:\n${lines.join('\n')}` : '',
          `Kierowca: ${driver}`,
        ].filter(Boolean).join(' | '),
        items: items
          .filter((it) => it.name.trim())
          .map((it) => ({ name: it.name.trim(), sqm: it.sqm.trim(), packs: it.packs.trim() })),
      };
      const slotRes = await fetch(`/api/zlecenia/${orderId}/dostawy`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const slotJson = await slotRes.json().catch(() => ({}));
      if (!slotRes.ok) throw new Error(slotJson?.error || 'Nie udało się dodać dostawy');

      toast({ title: 'Dodano dostawę', variant: 'success' });
      setDeliveryModalOpen(false);
      router.push(`/zlecenia/${orderId}`);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Coś poszło nie tak';
      toast({ title: 'Błąd', description: msg, variant: 'destructive' });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="mx-auto max-w-4xl p-6 space-y-6">
      <div className="flex items-center gap-2">
        <BackButton fallbackHref="/klienci" />
        <h1 className="text-2xl font-semibold">{pl.orders?.new || 'Nowe zlecenie'}</h1>
      </div>
  <p className="text-sm opacity-70">{fromClientId ? 'Wybierz rodzaj zlecenia dla tego klienta' : 'Wybierz klienta, a następnie rodzaj zlecenia'}.</p>
      {loading && <div className="text-sm">{pl.common.loading}</div>}
      {error && <div className="text-sm text-red-600">{error}</div>}
      {!loading && !error && (
        <div className={fromClientId ? 'mx-auto max-w-3xl' : 'grid grid-cols-1 md:grid-cols-2 gap-4'}>
          <div className="space-y-2">
            <h2 className="text-sm font-medium uppercase tracking-wide opacity-70">{fromClientId ? 'Rodzaj zlecenia' : 'Klienci (ostatni)'}</h2>
            {fromClientId ? (
              <div className="rounded border border-black/10 dark:border-white/10 p-3 text-sm">
                <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                  <Link href={`/zlecenia/montaz/nowy?clientId=${fromClientId}`} className="group flex items-center justify-center rounded-lg border p-6 text-center transition hover:shadow-sm hover:scale-[1.01] dark:border-white/15" style={{ borderColor: 'var(--pp-border)' }}>
                    <div className="space-y-1">
                      <div className="text-lg font-medium">Z montażem</div>
                      <div className="text-xs opacity-60">Utwórz zlecenie montażu</div>
                    </div>
                  </Link>
                  <button
                    onClick={() => openDeliveryModal(fromClientId)}
                    className="group flex items-center justify-center rounded-lg border p-6 text-center transition hover:shadow-sm hover:scale-[1.01] dark:border-white/15"
                    style={{ borderColor: 'var(--pp-border)' }}
                  >
                    <div className="space-y-1">
                      <div className="text-lg font-medium">Tylko dostawa</div>
                      <div className="text-xs opacity-60">Utwórz zlecenie dostawy</div>
                    </div>
                  </button>
                </div>
              </div>
            ) : (
            <div>
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder={pl.orders?.searchPlaceholder || 'Szukaj...'}
                className="w-full mb-2 rounded border border-black/15 bg-transparent px-3 py-2 text-sm dark:border-white/15 focus:outline-none focus:ring-2 focus:ring-black/30 dark:focus:ring-white/30"
              />
            </div>
            )}
            {!fromClientId && (
            <div className="max-h-[420px] overflow-auto rounded border border-black/10 dark:border-white/10 divide-y divide-black/10 dark:divide-white/10 text-sm">
              {clients
                .filter(c => {
                  if (!query.trim()) return true;
                  const q = query.trim().toLowerCase();
                  return c.name.toLowerCase().includes(q);
                })
                .map(c => (
                <button
                  key={c.id}
                  onClick={() => setSelectedClient(c)}
                  className={`w-full text-left px-3 py-2 hover:bg-black/5 dark:hover:bg-white/10 transition ${selectedClient?.id===c.id ? 'bg-black/10 dark:bg-white/20 font-medium' : ''}`}
                >
                  <div className="flex items-center justify-between">
                    <span>{c.name}</span>
                    <span className="text-[10px] opacity-60">{formatDate(c.createdAt)}</span>
                  </div>
                </button>
              ))}
              {clients.length === 0 && (
                <div className="px-3 py-4 text-xs opacity-60">Brak klientów</div>
              )}
            </div>
            )}
            <Link href="/klienci/nowy" className="inline-flex h-8 items-center rounded-md border border-black/15 px-3 text-xs hover:bg-black/5 dark:border-white/15 dark:hover:bg-white/10">Dodaj klienta</Link>
          </div>
          {!fromClientId && (
            <div className="space-y-4">
              <h2 className="text-sm font-medium uppercase tracking-wide opacity-70">Akcje</h2>
              {selectedClient ? (
                <div className="space-y-3">
                  <div className="text-xs opacity-70">Wybrano klienta:</div>
                  <div className="rounded border border-black/10 dark:border-white/10 p-2 text-sm">{selectedClient.name}</div>
                  <div className="space-y-2">
                    <Link href={`/zlecenia/montaz/nowy?clientId=${selectedClient.id}`} className="block w-full text-center inline-flex h-10 items-center justify-center rounded-md border border-black/15 hover:bg-black/5 text-sm dark:border-white/15 dark:hover:bg-white/10">Dodaj montaż</Link>
                    <button
                      onClick={() => openDeliveryModal(selectedClient.id)}
                      className="w-full inline-flex h-10 items-center justify-center rounded-md border border-black/15 text-sm hover:bg-black/5 dark:border-white/15 dark:hover:bg-white/10"
                    >
                      Dodaj dostawę
                    </button>
                  </div>
                  <p className="text-[11px] opacity-60">Montaż: start od statusu „oczekuje na pomiar”.</p>
                </div>
              ) : (
                <div className="text-xs opacity-60">Najpierw wybierz klienta z listy obok.</div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Modal: Dodaj dostawę (MVP) */}
      <AlertDialog
        open={deliveryModalOpen}
        onOpenChange={setDeliveryModalOpen}
        title="Dodaj dostawę"
        description={(
          <div className="space-y-3 pt-2">
            <div>
              <label className="text-xs opacity-70">Data złożenia zamówienia</label>
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
              <label className="text-xs opacity-70">Data</label>
              <div className="mt-1">
                <DatePicker value={plannedAt} onChange={(v) => { setPlannedAt(v); setPlannedTouched(true); }} />
              </div>
            </div>
            <div>
              <label className="text-xs opacity-70">Pozycje (produkt)</label>
              <div className="mt-1 space-y-2">
                {items.map((it, idx) => (
                  <div key={idx} className="grid grid-cols-1 md:grid-cols-6 gap-2">
                    <input
                      className="md:col-span-3 h-9 w-full rounded-md border border-black/15 bg-transparent px-3 text-sm outline-none dark:border-white/15"
                      placeholder="Nazwa produktu"
                      value={it.name}
                      onChange={(e) => {
                        const v = e.currentTarget.value; setItems(prev => prev.map((p,i) => i===idx ? { ...p, name: v } : p))
                      }}
                    />
                    <input
                      className="md:col-span-1 h-9 w-full rounded-md border border-black/15 bg-transparent px-3 text-sm outline-none dark:border-white/15"
                      placeholder="m²"
                      inputMode="decimal"
                      value={it.sqm}
                      onChange={(e) => {
                        const v = e.currentTarget.value.replace(/[^0-9.,]/g,''); setItems(prev => prev.map((p,i) => i===idx ? { ...p, sqm: v } : p))
                      }}
                    />
                    <input
                      className="md:col-span-1 h-9 w-full rounded-md border border-black/15 bg-transparent px-3 text-sm outline-none dark:border-white/15"
                      placeholder="op."
                      inputMode="numeric"
                      value={it.packs}
                      onChange={(e) => {
                        const v = e.currentTarget.value.replace(/\D/g,''); setItems(prev => prev.map((p,i) => i===idx ? { ...p, packs: v } : p))
                      }}
                    />
                    <button
                      onClick={(e) => { e.preventDefault(); setItems(prev => prev.filter((_,i) => i!==idx)) }}
                      className="md:col-span-1 h-9 rounded-md border border-black/15 px-3 text-sm hover:bg-black/5 dark:border-white/15 dark:hover:bg-white/10"
                      disabled={items.length === 1}
                    >Usuń</button>
                  </div>
                ))}
                <button
                  onClick={(e) => { e.preventDefault(); setItems(prev => [...prev, { name: '', sqm: '', packs: '' }]) }}
                  className="h-8 rounded-md border border-black/15 px-3 text-xs hover:bg-black/5 dark:border-white/15 dark:hover:bg-white/10"
                >Dodaj pozycję</button>
              </div>
            </div>
            <div>
              <label className="text-xs opacity-70">Kierowca</label>
              <select value={driver} onChange={(e) => setDriver(e.currentTarget.value)} className="mt-1 h-9 w-full rounded-md border border-black/15 bg-transparent px-3 text-sm outline-none dark:border-white/15">
                <option value="admin">admin</option>
              </select>
              <p className="mt-1 text-[11px] opacity-60">MVP: na razie tylko Ty jeździsz, więc lista zawiera jedną opcję.</p>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <input id="sameAsInvoice" type="checkbox" className="h-4 w-4" checked={sameAsInvoice} onChange={(e) => setSameAsInvoice(e.currentTarget.checked)} />
                <label htmlFor="sameAsInvoice" className="text-xs opacity-70">Adres dostawy taki sam jak do faktury</label>
              </div>
              {!sameAsInvoice && (
                <div className="mt-2 grid grid-cols-1 md:grid-cols-3 gap-2">
                  <input
                    className="h-9 w-full rounded-md border border-black/15 bg-transparent px-3 text-sm outline-none dark:border-white/15"
                    placeholder="Kod (00-000)"
                    inputMode="numeric"
                    value={delPostalCode}
                    onChange={(e) => {
                      const digits = e.currentTarget.value.replace(/\D/g, '').slice(0,5); const fm = digits.length <= 2 ? digits : `${digits.slice(0,2)}-${digits.slice(2)}`; setDelPostalCode(fm)
                    }}
                  />
                  <input
                    className="h-9 w-full rounded-md border border-black/15 bg-transparent px-3 text-sm outline-none dark:border-white/15"
                    placeholder="Miejscowość"
                    value={delCity}
                    onChange={(e) => setDelCity(e.currentTarget.value)}
                  />
                  <input
                    className="h-9 w-full rounded-md border border-black/15 bg-transparent px-3 text-sm outline-none dark:border-white/15"
                    placeholder="Adres (ulica i numer, opcjonalnie lokal/piętro)"
                    value={delAddress}
                    onChange={(e) => setDelAddress(e.currentTarget.value)}
                  />
                </div>
              )}
            </div>
            <div>
              <label className="text-xs opacity-70">Notatka (opcjonalnie)</label>
              <Input value={note} onChange={(e) => setNote(e.currentTarget.value)} placeholder="np. dostawa po 16:00" />
            </div>
          </div>
        )}
        confirmText={submitting ? 'Zapisywanie…' : 'Utwórz'}
        onConfirm={async () => { if (!submitting && canSubmitDelivery) await handleCreateDelivery(); }}
        showCancelButton
        showConfirmButton
      />
    </div>
  );
}
