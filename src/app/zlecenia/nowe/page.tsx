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
  const [driver, setDriver] = useState<string>("admin"); // MVP: only one option
  const [note, setNote] = useState<string>("");
  const [submitting, setSubmitting] = useState(false);

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
    setPlannedAt("");
    setDriver("admin");
    setNote("");
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
      const createOrderRes = await fetch('/api/zlecenia', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ clientId: deliveryClientId, type: 'delivery', scheduledDate: scheduledTs }),
      });
      const created = await createOrderRes.json().catch(() => ({}));
      if (!createOrderRes.ok) throw new Error(created?.error || 'Nie udało się utworzyć zlecenia');
      const orderId: string | undefined = created?.id;
      if (!orderId) throw new Error('Brak identyfikatora zlecenia');

      // 2) Dodaj slot dostawy (MVP: kierowca = admin → wpiszemy w notatce + carrier="Własny")
      const body: Record<string, unknown> = {
        status: 'planned',
        plannedAt: scheduledTs,
        carrier: 'Własny',
        trackingNo: null,
        note: [note?.trim() || '', `Kierowca: ${driver}`].filter(Boolean).join(' | '),
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
              <label className="text-xs opacity-70">Data</label>
              <div className="mt-1">
                <DatePicker value={plannedAt} onChange={setPlannedAt} />
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
