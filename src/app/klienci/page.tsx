"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Plus } from "lucide-react";
import { pl } from "@/i18n/pl";

type Klient = {
  id: string;
  name: string;
  email?: string | null;
  phone?: string | null;
  serviceType?: string | null;
  createdAt: number;
};

export default function KlienciPage() {
  const [data, setData] = useState<{ clients: Klient[] } | null>(null);
  const [loading, setLoading] = useState(true);
  const [filterDeliveryOnly, setFilterDeliveryOnly] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const r = await fetch('/api/klienci');
        const json = await r.json();
        if (mounted) setData(json);
      } catch {
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
  <h1 className="text-2xl font-semibold">{pl.clients.listTitle}</h1>
        <div className="flex items-center gap-3">
          <label className="flex items-center gap-1 text-sm select-none">
            <input
              type="checkbox"
              checked={filterDeliveryOnly}
              onChange={(e) => setFilterDeliveryOnly(e.target.checked)}
            />
            Tylko dostawa
          </label>
          <Link
          href="/klienci/nowy"
          className="inline-flex h-9 items-center gap-2 rounded-md border border-black/15 px-4 text-sm hover:bg-black/5 dark:border-white/15 dark:hover:bg-white/10"
        >
          <Plus className="h-4 w-4" />
          {pl.clients.new}
        </Link>
        </div>
      </div>
      {loading ? (
  <p>{pl.common.loading}</p>
      ) : error ? (
  <p>{pl.common.loadError}</p>
      ) : (
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3">
          {(data?.clients ?? [])
            .filter(c => !filterDeliveryOnly || c.serviceType === 'delivery_only')
            .map((c: Klient) => (
            <Link key={c.id} href={`/klienci/${c.id}`} className="block">
              <Card className="p-3 hover:bg-black/5 dark:hover:bg-white/5">
                <div className="font-medium">{c.name}</div>
                <div className="text-sm opacity-70">{c.email || "—"} • {c.phone || "—"}</div>
                {c.serviceType && (
                  <div className="mt-1 text-[10px] inline-flex items-center rounded border border-black/15 bg-black/5 px-1.5 py-0.5 font-medium tracking-wide dark:border-white/15 dark:bg-white/10">
                    {c.serviceType === 'delivery_only' ? 'Tylko dostawa' : 'Z montażem'}
                  </div>
                )}
                <div className="mt-1 text-xs opacity-60">{pl.clients.createdAt}: {new Date(c.createdAt).toLocaleString()}</div>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
