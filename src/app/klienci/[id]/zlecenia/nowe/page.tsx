"use client";
import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { BackButton } from '@/components/back-button';
import { pl } from '@/i18n/pl';
import { useToast } from '@/components/ui/toaster';

export default function NoweZleceniePage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { toast } = useToast();
  const [type, setType] = useState<'delivery' | 'installation'>('delivery');
  const [submitting, setSubmitting] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submitting) return;
    setSubmitting(true);
    try {
      const r = await fetch('/api/zlecenia', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ clientId: id, type })
      });
      if (!r.ok) throw new Error('fail');
      toast({ title: 'Utworzono zlecenie', variant: 'success' });
      router.push(`/klienci/${id}`);
      router.refresh();
    } catch {
      toast({ title: 'Błąd', description: 'Nie udało się utworzyć zlecenia', variant: 'destructive' });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="mx-auto max-w-xl p-6 space-y-6">
      <div className="flex items-center gap-2">
        <BackButton fallbackHref={`/klienci/${id}`} />
        <h1 className="text-2xl font-semibold">Nowe zlecenie</h1>
      </div>
      <form onSubmit={submit} className="space-y-6">
        <div>
          <div className="mb-2 text-sm font-medium">Typ</div>
          <div className="flex gap-6 text-sm">
            <label className="inline-flex items-center gap-1">
              <input type="radio" value="delivery" checked={type==='delivery'} onChange={() => setType('delivery')} /> Dostawa
            </label>
            <label className="inline-flex items-center gap-1">
              <input type="radio" value="installation" checked={type==='installation'} onChange={() => setType('installation')} /> Montaż
            </label>
          </div>
          {type === 'installation' && (
            <p className="mt-2 text-xs opacity-70">Zlecenie wymaga pomiaru przed zaplanowaniem montażu.</p>
          )}
        </div>
        <div className="flex items-center gap-2">
          <button disabled={submitting} className="inline-flex h-10 items-center gap-1.5 rounded-md bg-black px-5 text-sm font-medium text-white hover:bg-black/85 disabled:opacity-50 dark:bg-white dark:text-black dark:hover:bg-white/90">{pl.common.save}</button>
        </div>
      </form>
    </div>
  );
}