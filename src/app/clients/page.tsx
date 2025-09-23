"use client";
import Link from "next/link";
import { useEffect, useState } from "react";

type Client = {
  id: string;
  name: string;
  email?: string | null;
  phone?: string | null;
  createdAt: number;
};

export default function ClientsPage() {
  const [data, setData] = useState<{ clients: Client[] } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const r = await fetch('/api/clients');
        const json = await r.json();
        if (mounted) setData(json);
      } catch (e) {
        if (mounted) setError('Błąd ładowania');
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => { mounted = false };
  }, []);

  return (
    <div className="mx-auto max-w-6xl p-6">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-semibold">Klienci</h1>
        <Link href="/clients/new" className="rounded border px-3 py-1.5 text-sm">Nowy klient</Link>
      </div>
      {loading ? (
        <p>Wczytywanie…</p>
      ) : error ? (
        <p>Błąd ładowania</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {(data?.clients ?? []).map((c: Client) => (
            <Link key={c.id} href={`/clients/${c.id}`} className="rounded border p-3 hover:bg-black/5 dark:hover:bg-white/5">
              <div className="font-medium">{c.name}</div>
              <div className="text-sm opacity-70">{c.email || "—"} • {c.phone || "—"}</div>
              <div className="text-xs opacity-60 mt-1">Dodano: {new Date(c.createdAt).toLocaleString()}</div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
