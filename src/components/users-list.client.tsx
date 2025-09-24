"use client";
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useToast } from '@/components/ui/toaster';

type UserRow = { id: string; name: string | null; email: string; role: string };

export function UsersListClient({ initial }: { initial: UserRow[] }) {
  const [rows, setRows] = useState(initial);
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [pwdEditId, setPwdEditId] = useState<string | null>(null);
  const [pwdValue, setPwdValue] = useState<string>('');
  const router = useRouter();
  const { toast } = useToast();

  const changeRole = async (id: string, role: 'admin' | 'installer') => {
    setLoadingId(id);
    try {
      const r = await fetch(`/api/uzytkownicy/${id}/rola`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role }),
      });
      if (!r.ok) {
        const msg = (await r.json().catch(() => ({}))).error || 'Błąd zmiany roli';
        throw new Error(msg);
      }
      setRows((prev) => prev.map(u => u.id === id ? { ...u, role } : u));
      toast({ title: 'Zmieniono rolę', variant: 'success' });
      router.refresh();
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Błąd';
      toast({ title: 'Błąd', description: msg, variant: 'destructive' });
    } finally {
      setLoadingId(null);
    }
  };

  const changePassword = async (id: string) => {
    if (!pwdValue || pwdValue.length < 12) {
      toast({ title: 'Błąd', description: 'Hasło musi mieć minimum 12 znaków', variant: 'destructive' });
      return;
    }
    setLoadingId(id);
    try {
      const r = await fetch(`/api/uzytkownicy/${id}/haslo`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password: pwdValue }),
      });
      if (!r.ok) {
        const msg = (await r.json().catch(() => ({}))).error || 'Błąd zmiany hasła';
        throw new Error(msg);
      }
      toast({ title: 'Zmieniono hasło', variant: 'success' });
      setPwdEditId(null);
      setPwdValue('');
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Błąd';
      toast({ title: 'Błąd', description: msg, variant: 'destructive' });
    } finally {
      setLoadingId(null);
    }
  };

  return (
    <div className="divide-y divide-black/10 dark:divide-white/10 rounded border border-black/10 dark:border-white/10">
      {rows.map(u => (
        <div key={u.id} className="p-3 text-sm">
          <div className="flex items-center justify-between gap-3">
            <div>
              <div className="font-medium">{u.name || u.email}</div>
              <div className="text-xs opacity-70">{u.email}</div>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs rounded bg-black/5 dark:bg-white/10 px-2 py-0.5">{u.role}</span>
              {u.email.toLowerCase() === 'admin@primepodloga.pl' ? (
                <span className="text-xs rounded bg-black/5 dark:bg-white/10 px-2 py-0.5 opacity-70">Niezmienny Admin</span>
              ) : (
                <>
                  <button
                    onClick={() => changeRole(u.id, 'admin')}
                    disabled={loadingId === u.id}
                    className="inline-flex h-8 items-center rounded-md border border-black/15 px-2 text-xs dark:border-white/15 hover:bg-black/5 disabled:opacity-50 dark:hover:bg-white/10"
                  >Ustaw Admin</button>
                  <button
                    onClick={() => changeRole(u.id, 'installer')}
                    disabled={loadingId === u.id}
                    className="inline-flex h-8 items-center rounded-md border border-black/15 px-2 text-xs dark:border-white/15 hover:bg-black/5 disabled:opacity-50 dark:hover:bg-white/10"
                  >Ustaw Montażystę</button>
                </>
              )}
              <button
                onClick={() => { setPwdEditId(pwdEditId === u.id ? null : u.id); setPwdValue(''); }}
                className="inline-flex h-8 items-center rounded-md border border-black/15 px-2 text-xs dark:border-white/15 hover:bg-black/5 disabled:opacity-50 dark:hover:bg-white/10"
              >Hasło…</button>
            </div>
          </div>
          {pwdEditId === u.id && (
            <div className="mt-2 flex items-center gap-2 text-sm">
              <input
                type="password"
                value={pwdValue}
                onChange={(e) => setPwdValue(e.target.value)}
                placeholder="Nowe hasło (min 12 znaków)"
                className="h-8 w-72 rounded-md border border-black/15 bg-transparent px-2 text-sm outline-none dark:border-white/15"
              />
              <button
                onClick={() => changePassword(u.id)}
                disabled={loadingId === u.id}
                className="inline-flex h-8 items-center rounded-md border border-black/15 px-2 text-xs dark:border-white/15 hover:bg-black/5 disabled:opacity-50 dark:hover:bg-white/10"
              >Zapisz hasło</button>
              <button
                onClick={() => { setPwdEditId(null); setPwdValue(''); }}
                className="inline-flex h-8 items-center rounded-md border border-black/15 px-2 text-xs dark:border-white/15 hover:bg-black/5 disabled:opacity-50 dark:hover:bg-white/10"
              >Anuluj</button>
            </div>
          )}
        </div>
      ))}
      {rows.length === 0 && (
        <div className="p-3 text-sm opacity-70">Brak użytkowników.</div>
      )}
    </div>
  );
}
