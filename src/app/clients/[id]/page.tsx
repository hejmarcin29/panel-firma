"use client";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { BackButton } from "@/components/back-button";
import { AlertDialog } from "@/components/ui/alert-dialog";
import { useToast } from "@/components/ui/toaster";

type Client = {
  id: string;
  name: string;
  phone?: string | null;
  email?: string | null;
  invoiceCity?: string | null;
  invoiceAddress?: string | null;
  deliveryCity?: string | null;
  deliveryAddress?: string | null;
  createdAt: number;
};

type Note = {
  id: string;
  content: string;
  createdAt: number;
  createdBy?: string | null;
};

export default function ClientPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { toast } = useToast();
  const [client, setClient] = useState<Client | null>(null);
  const [notes, setNotes] = useState<Note[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [newNote, setNewNote] = useState("");
  const [openDelete, setOpenDelete] = useState(false);

  const load = async () => {
    try {
      const r = await fetch(`/api/clients/${id}`);
      if (!r.ok) throw new Error('Błąd');
      const j = await r.json();
      setClient(j.client);
      setNotes(j.notes);
    } catch (e) {
      setError('Błąd ładowania');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, [id]);

  const addNote = async () => {
    const content = newNote.trim();
    if (!content) return;
    const r = await fetch(`/api/clients/${id}/notes`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content })
    });
    if (r.ok) {
      setNewNote("");
      await load();
    }
  };

  const del = async () => {
    const r = await fetch(`/api/clients/${id}`, { method: 'DELETE' });
    if (r.ok) {
      toast({ title: "Usunięto", description: "Klient został usunięty", variant: "success" });
      router.push('/clients');
    } else {
      toast({ title: "Błąd", description: "Nie udało się usunąć klienta", variant: "destructive" });
    }
  }

  if (loading) return <div className="p-6">Wczytywanie…</div>;
  if (error) return <div className="p-6">{error}</div>;
  if (!client) return <div className="p-6">Nie znaleziono</div>;

  return (
    <div className="mx-auto max-w-4xl p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <BackButton fallbackHref="/clients" />
          <h1 className="text-2xl font-semibold">{client.name}</h1>
        </div>
        <button onClick={() => setOpenDelete(true)} className="rounded border px-3 py-1.5 text-sm">Usuń klienta</button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="rounded border p-4">
          <h2 className="font-medium mb-2">Kontakt</h2>
          <div className="text-sm">Telefon: {client.phone || '—'}</div>
          <div className="text-sm">Email: {client.email || '—'}</div>
          <div className="text-xs opacity-60 mt-2">Dodano: {new Date(client.createdAt).toLocaleString()}</div>
        </div>
        <div className="rounded border p-4">
          <h2 className="font-medium mb-2">Faktura</h2>
          <div className="text-sm">Miasto: {client.invoiceCity || '—'}</div>
          <div className="text-sm">Adres: {client.invoiceAddress || '—'}</div>
        </div>
        <div className="rounded border p-4">
          <h2 className="font-medium mb-2">Dostawa</h2>
          <div className="text-sm">Miasto: {client.deliveryCity || '—'}</div>
          <div className="text-sm">Adres: {client.deliveryAddress || '—'}</div>
        </div>
      </div>

      <div className="rounded border p-4">
        <h2 className="font-medium mb-3">Notatki (Primepodloga)</h2>
        <div className="space-y-3 mb-3">
          {notes.length === 0 ? (
            <div className="text-sm opacity-70">Brak notatek</div>
          ) : (
            notes.map((n) => (
              <div key={n.id} className="rounded border p-2">
                <div className="text-sm whitespace-pre-wrap">{n.content}</div>
                <div className="text-xs opacity-60 mt-1">{new Date(n.createdAt).toLocaleString()} {n.createdBy ? `• ${n.createdBy}` : ''}</div>
              </div>
            ))
          )}
        </div>
        <div className="flex items-start gap-2">
          <textarea className="w-full rounded border px-3 py-2" rows={3} value={newNote} onChange={(e) => setNewNote(e.target.value)} placeholder="Dodaj notatkę" />
          <button onClick={addNote} className="rounded bg-black px-4 py-2 text-white">Dodaj</button>
        </div>
      </div>

      <AlertDialog
        open={openDelete}
        onOpenChange={setOpenDelete}
        title="Usunąć klienta?"
        description="Tej operacji nie można cofnąć. Zostaną usunięte także powiązane notatki."
        cancelText="Anuluj"
        confirmText="Usuń"
        confirmVariant="destructive"
        onConfirm={del}
      />
    </div>
  );
}
