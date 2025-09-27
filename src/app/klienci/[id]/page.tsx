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
import { TypeBadge, StatusBadge, OutcomeBadge } from "@/components/badges";
import { OrderSummaryCard } from "@/components/order-summary-card.client";
import { pl } from "@/i18n/pl";

type Klient = {
  id: string;
  name: string;
  clientNo?: number | null;
  phone?: string | null;
  email?: string | null;
  invoiceCity?: string | null;
  invoiceAddress?: string | null;
  deliveryCity?: string | null;
  deliveryAddress?: string | null;
  serviceType?: string | null;
  createdAt: number;
};

type Order = {
  id: string;
  clientId: string;
  type: string;
  status: string;
  outcome?: 'won'|'lost'|null;
  requiresMeasurement: number | boolean;
  scheduledDate?: number | null;
  archivedAt?: number | null;
  orderNo?: string | null;
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
        setOrders(jo.orders || []);
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

  return (
    <div className="mx-auto max-w-5xl p-6 space-y-6">
      <section className="relative overflow-hidden rounded-2xl border border-black/10 p-5 dark:border-white/10">
        <div className="absolute inset-0 -z-10 bg-[radial-gradient(50%_60%_at_0%_0%,_rgba(198,69,54,0.06),_transparent_60%),radial-gradient(40%_50%_at_100%_0%,_rgba(0,0,0,0.05),_transparent_60%)]" />
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <BackButton fallbackHref="/klienci" />
              <h1 className="text-2xl font-semibold">{client.name}</h1>
            </div>
            <div className="mt-1 text-xs opacity-70 flex items-center gap-3">
              {typeof client.clientNo === 'number' && (
                <Link className="underline" href={`/klienci/nr/${client.clientNo}`}>Nr klienta: {client.clientNo}</Link>
              )}
              <span>Utworzono: {new Date(client.createdAt).toLocaleString()}</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Link href={`/klienci/${id}/edytuj`} className="inline-flex h-9 items-center gap-1.5 rounded-md border border-black/15 px-3 text-sm hover:bg-black/5 dark:border-white/15 dark:hover:bg-white/10">
              <Pencil className="h-4 w-4" />
              {pl.clients.edit}
            </Link>
            <button onClick={() => setOpenDelete(true)} className="inline-flex h-9 items-center gap-1.5 rounded-md border border-red-300/40 px-3 text-sm text-red-700 hover:bg-red-50 dark:border-red-800/40 dark:text-red-300 dark:hover:bg-red-900/30">
              <Trash2 className="h-4 w-4" />
              {pl.clients.delete}
            </button>
          </div>
        </div>

        {/* Opcjonalne statystyki usunięte zgodnie z wymaganiem */}
      </section>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <Card>
          <CardHeader className="pb-2"><CardTitle>{pl.clients.contact}</CardTitle></CardHeader>
          <CardContent>
            <div className="text-sm">Telefon: {client.phone || '—'}</div>
            <div className="text-sm">Email: {client.email || '—'}</div>
            <div className="mt-2 text-xs opacity-60">Dodano: {new Date(client.createdAt).toLocaleString()}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle>{pl.clients.invoice}</CardTitle></CardHeader>
          <CardContent>
            <div className="text-sm">Miasto: {client.invoiceCity || '—'}</div>
            <div className="text-sm">Adres: {client.invoiceAddress || '—'}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle>{pl.clients.delivery}</CardTitle></CardHeader>
          <CardContent>
            <div className="text-sm">Miasto: {client.deliveryCity || '—'}</div>
            <div className="text-sm">Adres: {client.deliveryAddress || '—'}</div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="pb-2"><CardTitle>Zlecenia klienta</CardTitle></CardHeader>
        <CardContent>
          {orders.length === 0 ? (
            <div className="text-sm opacity-70">Brak zleceń</div>
          ) : (
            <div className="grid gap-3 grid-cols-1 md:grid-cols-2">
              {orders.map(o => (
                <OrderSummaryCard key={o.id}
                  id={o.id}
                  type={o.type as 'delivery'|'installation'}
                  status={o.status}
                  outcome={o.outcome as 'won'|'lost'|null}
                  createdAt={o.createdAt}
                  orderNo={o.orderNo}
                  flags={o.flags}
                />
              ))}
            </div>
          )}
        </CardContent>
      </Card>

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
