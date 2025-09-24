import { db } from '@/db';
import { users as usersTable } from '@/db/schema';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { pl } from '@/i18n/pl';
import Link from 'next/link';
import { UsersListClient } from '@/components/users-list.client';

export default async function UsersPage() {
  const users = await db
    .select({ id: usersTable.id, name: usersTable.name, email: usersTable.email, role: usersTable.role, createdAt: usersTable.createdAt })
    .from(usersTable)
    .limit(100);

  return (
    <div className="mx-auto max-w-5xl p-6 space-y-6">
      <div className="text-sm opacity-70"><Link className="underline" href="/">{pl.nav.dashboard}</Link> &rsaquo; <Link className="underline" href="/ustawienia">{pl.nav.settings}</Link> &rsaquo; <span>{pl.settings.usersSection}</span></div>
      <h1 className="text-2xl font-semibold">{pl.settings.usersSection}</h1>
      <div className="flex items-center justify-between">
        <div></div>
        <Link href="/ustawienia/uzytkownicy/nowy" className="inline-flex h-9 items-center rounded-md border border-black/15 px-3 text-sm dark:border-white/15 hover:bg-black/5 dark:hover:bg-white/10">Dodaj użytkownika</Link>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Lista użytkowników</CardTitle>
        </CardHeader>
        <CardContent>
          <UsersListClient initial={users} />
        </CardContent>
      </Card>
    </div>
  );
}
