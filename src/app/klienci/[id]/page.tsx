"use client";
import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { BackButton } from "@/components/back-button";
import { AlertDialog } from "@/components/ui/alert-dialog";
import { useToast } from "@/components/ui/toaster";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Trash2, Plus, Pencil } from "lucide-react";
import { TypeBadge, OutcomeBadge, PipelineStageBadge } from "@/components/badges";
import { OrderPipeline } from "@/components/order-pipeline.client";
// status UI usunięty – używamy pipeline stage + archiwum
import { OrderOutcomeButtons } from "@/components/order-outcome-buttons.client";
import { OrderOutcomeRevertButton } from "@/components/order-outcome-revert-button.client";
import { OrderArchiveButton } from "@/components/order-archive-button.client";
import { OrderUnarchiveButton } from "@/components/order-unarchive-button.client";
import { QuickChecklistBar } from "@/components/quick-checklist-bar.client";
import { OrderChecklist } from "@/components/order-checklist.client";
import { OrderEditor } from "@/components/order-editor.client";
// Usunięto karty planowania (montaż/dostawa) na życzenie — planujemy przy tworzeniu zlecenia
import { OrderSummaryCard } from "@/components/order-summary-card.client";
import { pl } from "@/i18n/pl";

type Klient = {
  id: string;
  name: string;
  clientNo?: number | null;
  phone?: string | null;
  email?: string | null;
  taxId?: string | null;
  invoiceCity?: string | null;
  invoicePostalCode?: string | null;
  invoiceAddress?: string | null;
  serviceType?: string | null;
  createdAt: number;
};

type Order = {
  id: string;
  clientId: string;
  type: string;
  status: string;
  pipelineStage?: string | null;
  outcome?: 'won'|'lost'|null;
  requiresMeasurement: number | boolean;
  scheduledDate?: number | null;
  archivedAt?: number | null;
  orderNo?: string | null;
  locationCity?: string | null;
  locationPostalCode?: string | null;
  locationAddress?: string | null;
  preMeasurementSqm?: number | null;
  installerId?: string | null;
  outcomeAt?: number | null;
  createdAt: number;
  // dodatkowe flagi checklisty (opcjonalne, gdy withFlags=1)
  flags?: Record<string, boolean>;
};

type Note = {
  id: string;
  content: string;
  createdAt: number;
  createdBy?: string | null;
};

export default function KlientPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { toast } = useToast();
  const [client, setClient] = useState<Klient | null>(null);
  const [notes, setNotes] = useState<Note[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [newNote, setNewNote] = useState("");
  const [openDelete, setOpenDelete] = useState(false);
  const [orders, setOrders] = useState<Order[]>([]);
  // Sloty montażu/dostawy niewyświetlane na stronie klienta (upraszczamy widok)

  const load = useCallback(async () => {
    try {
      const r = await fetch(`/api/klienci/${id}`);
      if (!r.ok) throw new Error('Błąd');
      const j = await r.json();
      setClient(j.client);
      setNotes(j.notes);
      const ro = await fetch(`/api/zlecenia?clientId=${id}&withFlags=1`);
      if (ro.ok) {
        const jo = await ro.json();
        const list: Order[] = jo.orders || []
        setOrders(list);
        // brak dodatkowego pobierania slotów — karty planu usunięte
      }
    } catch {
      setError('Błąd ładowania');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => { load(); }, [load]);

  const addNote = async () => {
    const content = newNote.trim();
    if (!content) return;
    const r = await fetch(`/api/klienci/${id}/notatki`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content })
    });
    if (r.ok) {
      setNewNote("");
  toast({ title: 'Dodano notatkę', variant: 'success' });
      await load();
    } else {
      toast({ title: 'Błąd', description: 'Nie udało się dodać notatki', variant: 'destructive' });
    }
  };

  const del = async () => {
    const r = await fetch(`/api/klienci/${id}`, { method: 'DELETE' });
    if (r.ok) {
  toast({ title: "Usunięto", description: "Klient został usunięty", variant: "success" });
      router.push('/klienci');
    } else {
      toast({ title: "Błąd", description: "Nie udało się usunąć klienta", variant: "destructive" });
    }
  };

  if (loading) return (
    <div className="mx-auto max-w-4xl p-6 space-y-4">
      <div className="flex items-center gap-2">
        <Skeleton className="h-6 w-6 rounded-full" />
        <Skeleton className="h-6 w-64" />
      </div>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="p-3 border border-black/10 dark:border-white/10 rounded">
            <Skeleton className="h-4 w-40 mb-2" />
            <Skeleton className="h-3 w-56 mb-2" />
            <Skeleton className="h-3 w-24" />
          </div>
        ))}
      </div>
      <div className="p-3 border border-black/10 dark:border-white/10 rounded">
        <Skeleton className="h-4 w-40 mb-2" />
        <Skeleton className="h-3 w-full" />
        <Skeleton className="h-3 w-1/2 mt-2" />
      </div>
    </div>
  );
  if (error) return <div className="p-6">{error}</div>;
  if (!client) return <div className="p-6">{pl.clients.notFound}</div>;

  const stageLabels: Record<string, string> = {
    // delivery
    offer_sent: 'Wysłana oferta',
    awaiting_payment: 'Czeka na wpłatę',
    delivery: 'Dostawa',
    final_invoice_issued: 'Wystawiona faktura końcowa',
    // installation
    awaiting_measurement: 'Czeka na pomiar',
    awaiting_quote: 'Czeka na wycenę',
    before_contract: 'Przed umową',
    before_advance: 'Przed zaliczką',
    before_installation: 'Przed montażem',
    before_final_invoice: 'Przed fakturą końcową',
    done: 'Koniec',
  }

  return (
    <div className="mx-auto max-w-5xl p-6 space-y-6">
      <section className="relative overflow-hidden rounded-2xl border bg-[var(--pp-panel)]" style={{ borderColor: 'var(--pp-border)' }}>
        <div className="pointer-events-none absolute inset-0 opacity-80" aria-hidden
             style={{ background: 'radial-gradient(1000px 360px at -10% -20%, color-mix(in oklab, var(--pp-primary) 14%, transparent), transparent 42%), linear-gradient(120deg, color-mix(in oklab, var(--pp-primary) 8%, transparent), transparent 65%)' }} />
        <div className="relative z-10 p-4 md:p-6">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <BackButton fallbackHref="/klienci" />
                <h1 className="truncate text-2xl md:text-3xl font-semibold">{client.name}</h1>
              </div>
              <div className="mt-1 text-xs opacity-80 flex flex-wrap items-center gap-3">
                {typeof client.clientNo === 'number' && (
                  <Link className="hover:underline focus:underline focus:outline-none" href={`/klienci/nr/${client.clientNo}`}>Nr klienta: {client.clientNo}</Link>
                )}
                <div className="h-4 w-px bg-black/10 dark:bg-white/10" />
                <span>Utworzono: {new Date(client.createdAt).toLocaleString()}</span>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Link href={`/klienci/${id}/edytuj`} className="inline-flex h-9 items-center gap-1.5 rounded-md border px-3 text-sm hover:bg-[var(--pp-primary-subtle-bg)]" style={{ borderColor: 'var(--pp-border)' }}>
                <Pencil className="h-4 w-4" />
                {pl.clients.edit}
              </Link>
              <Link href={`/zlecenia/nowe?clientId=${id}`} className="inline-flex h-9 items-center gap-1.5 rounded-md border px-3 text-sm hover:bg-[var(--pp-primary-subtle-bg)]" style={{ borderColor: 'var(--pp-border)' }}>
                <Plus className="h-4 w-4" />
                Nowe zlecenie
              </Link>
              <button onClick={() => setOpenDelete(true)} className="inline-flex h-9 items-center gap-1.5 rounded-md border px-3 text-sm text-[var(--pp-primary)] hover:bg-[var(--pp-primary-subtle-bg)]" style={{ borderColor: 'var(--pp-primary-subtle-border)' }}>
                <Trash2 className="h-4 w-4" />
                {pl.clients.delete}
              </button>
            </div>
          </div>
        </div>
      </section>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <Card>
          <CardHeader className="pb-2"><CardTitle>{pl.clients.invoice}</CardTitle></CardHeader>
          <CardContent className="text-sm space-y-1">
            <div><span className="opacity-60">NIP:</span> {client.taxId || '—'}</div>
            <div><span className="opacity-60">Miasto:</span> {client.invoiceCity || '—'}</div>
            <div><span className="opacity-60">Kod pocztowy:</span> {client.invoicePostalCode || '—'}</div>
            <div><span className="opacity-60">Adres:</span> {client.invoiceAddress || '—'}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle>{pl.clients.contact}</CardTitle></CardHeader>
          <CardContent>
            <div className="text-sm">Telefon: {client.phone || '—'}</div>
            <div className="text-sm">Email: {client.email || '—'}</div>
            <div className="mt-2 text-xs opacity-60">Dodano: {new Date(client.createdAt).toLocaleString()}</div>
          </CardContent>
        </Card>
      </div>

      {/* Notatki klienta – bliżej danych kontaktowych */}
      <Card>
        <CardHeader className="pb-2"><CardTitle>{pl.clients.notesTitle}</CardTitle></CardHeader>
        <CardContent>
          <div className="mb-3 space-y-3">
            {notes.length === 0 ? (
              <div className="text-sm opacity-70">{pl.clients.noNotes}</div>
            ) : (
              notes.map((n) => (
                <div key={n.id} className="rounded border border-black/10 p-2 dark:border-white/10">
                  <div className="text-sm whitespace-pre-wrap">{n.content}</div>
                  <div className="text-xs opacity-60 mt-1">{new Date(n.createdAt).toLocaleString()} {n.createdBy ? `• ${n.createdBy}` : ''}</div>
                </div>
              ))
            )}
          </div>
          <div className="flex items-start gap-2">
            <textarea className="w-full rounded border border-black/15 px-3 py-2 dark:border-white/15" rows={3} value={newNote} onChange={(e) => setNewNote(e.target.value)} placeholder={pl.clients.notePlaceholder} />
            <button onClick={addNote} className="inline-flex h-10 items-center gap-1.5 rounded-md bg-black px-4 text-white hover:bg-black/85 dark:bg-white dark:text-black dark:hover:bg-white/90">
              <Plus className="h-4 w-4" />
              {pl.clients.addNote}
            </button>
          </div>
        </CardContent>
      </Card>

      {/* Zlecenia klienta / wbudowany widok pojedynczego zlecenia */}
      {orders.length === 0 ? (
        <Card>
          <CardHeader className="pb-2"><CardTitle>Zlecenia klienta</CardTitle></CardHeader>
          <CardContent><div className="text-sm opacity-70">Brak zleceń</div></CardContent>
        </Card>
      ) : orders.length === 1 ? (
        (() => {
          const o = orders[0]
          const checklistItems = (type: 'delivery'|'installation') => {
            const orderKeys = type === 'delivery'
              ? ['proforma','advance_invoice','final_invoice','post_delivery_invoice','quote','done']
              : ['measurement','quote','contract','advance_payment','installation','handover_protocol','final_invoice','done']
            const flags = o.flags || {}
            return orderKeys.map(k => ({ key: k, label: k, done: Boolean((flags as Record<string, boolean>)[k]) }))
          }
          return (
            <section className="space-y-4">
              <Card>
                <CardHeader className="pb-2"><CardTitle>
                  Zlecenie #{o.orderNo ? `${o.orderNo}_${o.type === 'installation' ? 'm' : 'd'}` : o.id.slice(0,8)}
                </CardTitle></CardHeader>
                <CardContent>
                  <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2 text-sm">
                        <TypeBadge type={o.type} />
                        <PipelineStageBadge stage={o.pipelineStage} />
                        <OutcomeBadge outcome={o.outcome as 'won'|'lost'|null|undefined} />
                        <div className="h-4 w-px bg-black/10 dark:bg-white/10" />
                        <span className="opacity-70">Utworzono:</span>
                        <span>{new Date(o.createdAt).toLocaleDateString()}</span>
                        <div className="h-4 w-px bg-black/10 dark:bg-white/10" />
                        <span className="opacity-70">Miejsce realizacji:</span>
                        <span>{o.locationCity ? `${o.locationCity}${o.locationPostalCode ? ` ${o.locationPostalCode}` : ''}${o.locationAddress ? `, ${o.locationAddress}` : ''}` : '—'}</span>
                      </div>
                    </div>
                    <div className="flex flex-col items-stretch gap-2 md:items-end">
                      <OrderPipeline orderId={o.id} type={o.type as 'delivery'|'installation'} stage={o.pipelineStage ?? null} />
                      <div className="flex flex-wrap items-center justify-end gap-2">
                        {!o.outcome ? <OrderOutcomeButtons id={o.id} outcome={o.outcome as 'won'|'lost'|null} /> : <OrderOutcomeRevertButton id={o.id} />}
                        {o.archivedAt ? (
                          <OrderUnarchiveButton id={o.id} />
                        ) : (
                          <OrderArchiveButton id={o.id} />
                        )}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                {/* Lewa kolumna */}
                <div className="space-y-4">
                  <Card>
                    <CardHeader className="pb-2"><CardTitle>Podstawowe informacje</CardTitle></CardHeader>
                    <CardContent className="space-y-3 text-sm">
                      <div><span className="opacity-60">m2 przed pomiarem:</span> {o.preMeasurementSqm ?? '-'}</div>
                      <div><span className="opacity-60">Planowana data:</span> {o.scheduledDate ? new Date(o.scheduledDate).toLocaleDateString() : '-'}</div>
                      {/* Edycja zlecenia (połączone z informacjami) */}
                      <div className="pt-2 border-t" style={{ borderColor: 'var(--pp-border)' }}>
                        <OrderEditor orderId={o.id} defaults={{ note: null, preMeasurementSqm: o.preMeasurementSqm ?? null, installerId: (o.installerId as string | null) ?? null, scheduledDate: o.scheduledDate ?? null }} />
                      </div>
                    </CardContent>
                  </Card>

                  {/* Sekcja zmiany statusu usunięta – preferujemy archiwizację/przywracanie oraz etap (pipeline) */}
                </div>

                {/* Prawa kolumna */}
                <div className="space-y-4">
                  <Card>
                    <CardHeader className="pb-2"><CardTitle>Etap i checklist</CardTitle></CardHeader>
                    <CardContent className="space-y-4">
                      <QuickChecklistBar orderId={o.id} type={o.type as 'delivery'|'installation'} items={checklistItems(o.type as 'delivery'|'installation')} />
                      <OrderChecklist orderId={o.id} type={o.type as 'delivery'|'installation'} items={checklistItems(o.type as 'delivery'|'installation')} />
                    </CardContent>
                  </Card>
                </div>
              </div>
            </section>
          )
        })()
      ) : (
        <Card>
          <CardHeader className="pb-2"><CardTitle>Zlecenia klienta</CardTitle></CardHeader>
          <CardContent>
            <div className="overflow-x-auto rounded border" style={{ borderColor: 'var(--pp-border)' }}>
              <table className="min-w-full text-sm">
                <thead className="bg-[var(--pp-table-header-bg)]">
                  <tr className="text-left">
                    <th className="px-3 py-2 font-medium">Typ</th>
                    <th className="px-3 py-2 font-medium">Etap</th>
                    <th className="px-3 py-2 font-medium">Najbliższy termin</th>
                    <th className="px-3 py-2 font-medium">Miasto</th>
                    <th className="px-3 py-2 font-medium">Szczegóły</th>
                  </tr>
                </thead>
                <tbody>
                  {orders.map((o) => (
                    <tr key={o.id} className="border-t" style={{ borderColor: 'var(--pp-border)' }}>
                      <td className="px-3 py-2">{o.type === 'installation' ? 'Montaż' : 'Dostawa'}</td>
                      <td className="px-3 py-2">{o.pipelineStage ? (stageLabels[o.pipelineStage] || o.pipelineStage) : '-'}</td>
                      <td className="px-3 py-2">{o.scheduledDate ? new Date(o.scheduledDate).toLocaleString() : '-'}</td>
                      <td className="px-3 py-2">{o.locationCity || '-'}</td>
                      <td className="px-3 py-2">
                        <Link href={o.orderNo ? `/zlecenia/nr/${o.orderNo}_${o.type === 'installation' ? 'm' : 'd'}` : `/zlecenia/${o.id}`} className="inline-flex h-8 items-center rounded-md border px-2 text-xs hover:bg-[var(--pp-primary-subtle-bg)]" style={{ borderColor: 'var(--pp-border)' }}>Szczegóły</Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      

      <AlertDialog
        open={openDelete}
        onOpenChange={setOpenDelete}
        title={pl.clients.deleteConfirmTitle}
        description={pl.clients.deleteConfirmDesc}
        cancelText={pl.clients.cancel}
        confirmText={pl.clients.deleteConfirm}
        confirmVariant="destructive"
        onConfirm={del}
      />
    </div>
  );
}
