"use client";
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { BackButton } from '@/components/back-button';
import { pl } from '@/i18n/pl';

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

  useEffect(() => {
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

  return (
    <div className="mx-auto max-w-4xl p-6 space-y-6">
      <div className="flex items-center gap-2">
        <BackButton fallbackHref="/klienci" />
        <h1 className="text-2xl font-semibold">{pl.orders?.new || 'Nowe zlecenie'}</h1>
      </div>
      <p className="text-sm opacity-70">Wybierz klienta, a następnie rodzaj zlecenia (placeholder – wkrótce pełna logika).</p>
      {loading && <div className="text-sm">{pl.common.loading}</div>}
      {error && <div className="text-sm text-red-600">{error}</div>}
      {!loading && !error && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <h2 className="text-sm font-medium uppercase tracking-wide opacity-70">Klienci (ostatni)</h2>
            <div>
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder={pl.orders?.searchPlaceholder || 'Szukaj...'}
                className="w-full mb-2 rounded border border-black/15 bg-transparent px-3 py-2 text-sm dark:border-white/15 focus:outline-none focus:ring-2 focus:ring-black/30 dark:focus:ring-white/30"
              />
            </div>
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
                    <span className="text-[10px] opacity-60">{new Date(c.createdAt).toLocaleDateString()}</span>
                  </div>
                </button>
              ))}
              {clients.length === 0 && (
                <div className="px-3 py-4 text-xs opacity-60">Brak klientów</div>
              )}
            </div>
            <Link href="/klienci/nowy" className="inline-flex h-8 items-center rounded-md border border-black/15 px-3 text-xs hover:bg-black/5 dark:border-white/15 dark:hover:bg-white/10">Dodaj klienta</Link>
          </div>
          <div className="space-y-4">
            <h2 className="text-sm font-medium uppercase tracking-wide opacity-70">Akcje</h2>
            {selectedClient ? (
              <div className="space-y-3">
                <div className="text-xs opacity-70">Wybrano klienta:</div>
                <div className="rounded border border-black/10 dark:border-white/10 p-2 text-sm">{selectedClient.name}</div>
                <div className="space-y-2">
                  <Link href={`/zlecenia/montaz/nowy?clientId=${selectedClient.id}`} className="block w-full text-center inline-flex h-10 items-center justify-center rounded-md border border-black/15 hover:bg-black/5 text-sm dark:border-white/15 dark:hover:bg-white/10">Dodaj montaż</Link>
                  <button disabled className="w-full inline-flex h-10 items-center justify-center rounded-md border border-black/15 bg-black/5 text-sm opacity-60 dark:border-white/15 dark:bg-white/10">Dodaj dostawę (wkrótce)</button>
                </div>
                <p className="text-[11px] opacity-60">Montaż: start od statusu „oczekuje na pomiar”.</p>
              </div>
            ) : (
              <div className="text-xs opacity-60">Najpierw wybierz klienta z listy obok.</div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
