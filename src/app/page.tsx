import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus } from "lucide-react";
import { pl } from "@/i18n/pl";
import Link from "next/link";
import { getSession } from "@/lib/auth-session";
import { redirect } from "next/navigation";
import { orders as ordersTable, clients as clientsTbl } from "@/db/schema";
import { and, gte, lte, eq as deq, asc, desc, ne, eq, isNull } from "drizzle-orm";

export default async function Home() {
  const session = await getSession();
  const role = session?.user?.role as string | undefined;
  if (role !== 'admin') {
    redirect('/panel/montazysta');
  }
  return (
    <div className="mx-auto max-w-6xl p-6">
      <div className="flex items-center justify-between mb-6">
  <h1 className="text-2xl font-semibold">{pl.dashboard.title}</h1>
        <Link
          href="/klienci/nowy"
          className="inline-flex h-9 items-center gap-2 rounded-md border border-black/15 px-4 text-sm hover:bg-black/5 dark:border-white/15 dark:hover:bg-white/10"
        >
          <Plus className="h-4 w-4" />
          {pl.clients.add}
        </Link>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader>
            <CardTitle>{pl.dashboard.quickActions}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col gap-2">
              <Link
                href="/klienci/nowy"
                className="inline-flex h-9 items-center justify-center rounded-md bg-black px-3 text-sm font-medium text-white hover:bg-black/85 dark:bg-white dark:text-black dark:hover:bg-white/90"
              >
                + {pl.clients.add}
              </Link>
              <Link
                href="/zlecenia/nowe"
                className="inline-flex h-9 items-center justify-center rounded-md border border-black/15 bg-black/5 px-3 text-sm hover:bg-black/10 dark:border-white/15 dark:bg-white/10 dark:hover:bg-white/20"
              >
                Nowe zlecenie (wybór klienta)
              </Link>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>{pl.dashboard.recentClients}</CardTitle>
          </CardHeader>
          <CardContent>
            <RecentClients />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>{pl.nav?.settings || 'Ustawienia'}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm opacity-70">Zarządzanie aplikacją i ustawienia systemowe.</p>
            <div className="mt-3 flex flex-col gap-2">
              <Link href="/ustawienia" className="underline">Przejdź do ustawień</Link>
              <Link href="/ustawienia/uzytkownicy" className="underline">Użytkownicy</Link>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
        <Card>
          <CardHeader>
            <CardTitle>{pl.dashboard.recentChanges}</CardTitle>
          </CardHeader>
          <CardContent>
            <RecentChanges />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>{pl.dashboard.jobsTitle}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <div className="mb-2 text-sm font-medium">Najbliższe</div>
                <UpcomingOrders />
              </div>
              <div>
                <div className="mb-2 text-sm font-medium">Ostatnio zakończone</div>
                <RecentCompletedOrders />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

import { db } from "@/db";
import { clients as clientsTable, clientNotes as clientNotesTable } from "@/db/schema";

async function RecentClients() {
  const list = await db
    .select({ id: clientsTable.id, name: clientsTable.name, email: clientsTable.email, createdAt: clientsTable.createdAt })
    .from(clientsTable)
    .orderBy(desc(clientsTable.createdAt))
    .limit(5);
  if (list.length === 0) return <p className="text-sm opacity-70">{pl.dashboard.noneClients} <Link className="underline" href="/klienci/nowy">{pl.dashboard.addFirst}</Link>.</p>;
  return (
  <ul className="space-y-1 text-sm">
      {list.map((c) => (
        <li key={c.id} className="flex items-center justify-between">
          <Link className="underline" href={`/klienci/${c.id}`}>{c.name}</Link>
          <span className="opacity-60">{new Date(c.createdAt).toLocaleDateString()}</span>
        </li>
      ))}
  <li className="mt-2"><Link className="underline" href="/klienci">{pl.dashboard.seeAll}</Link></li>
    </ul>
  );
}

async function RecentChanges() {
  const notes = await db
    .select({ id: clientNotesTable.id, clientId: clientNotesTable.clientId, content: clientNotesTable.content, createdAt: clientNotesTable.createdAt })
    .from(clientNotesTable)
    .orderBy(desc(clientNotesTable.createdAt))
    .limit(5);
  if (notes.length === 0) return <p className="text-sm opacity-70">Brak zmian.</p>;
  // Fetch client names for each note (simple approach; for SQLite short list it's fine)
  const nameById = new Map<string, string>();
  for (const n of notes) {
    if (!nameById.has(n.clientId)) {
      const row = await db
        .select({ name: clientsTable.name })
        .from(clientsTable)
        .where(eq(clientsTable.id, n.clientId))
        .limit(1);
      if (row[0]?.name) nameById.set(n.clientId, row[0].name);
    }
  }
  return (
    <ul className="space-y-1 text-sm">
      {notes.map((n) => (
        <li key={n.id} className="flex items-center justify-between gap-3">
          <span className="truncate max-w-[70%]">
            <span className="opacity-70">{nameById.get(n.clientId) || 'Klient'}</span>
            <span className="opacity-50"> • </span>
            <span className="">{n.content}</span>
          </span>
          <span className="opacity-60">{new Date(n.createdAt).toLocaleDateString()}</span>
        </li>
      ))}
    </ul>
  );
}

async function UpcomingOrders() {
  // Normalize today to local midnight
  const now = new Date()
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0)
  const rows = await db
    .select({ id: ordersTable.id, clientId: ordersTable.clientId, scheduledDate: ordersTable.scheduledDate, status: ordersTable.status, clientName: clientsTbl.name, type: ordersTable.type, orderNo: ordersTable.orderNo })
    .from(ordersTable)
    .leftJoin(clientsTbl, deq(ordersTable.clientId, clientsTbl.id))
    .where(and(
      gte(ordersTable.scheduledDate, todayStart),
      ne(ordersTable.status, 'completed'),
      ne(ordersTable.status, 'cancelled'),
      isNull(ordersTable.archivedAt)
    ))
    .orderBy(asc(ordersTable.scheduledDate))
    .limit(5)

  if (!rows || rows.length === 0) return <p className="text-sm text-gray-600">{pl.dashboard.jobsPlaceholder}</p>
  return (
    <ul className="space-y-1 text-sm">
      {rows.map(r => (
        <li key={r.id} className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Link className="underline" href={r.orderNo ? `/zlecenia/nr/${r.orderNo}_${r.type === 'installation' ? 'm' : 'd'}` : `/zlecenia/${r.id}`}>{r.clientName || r.clientId}</Link>
            <span className="text-xs rounded bg-black/5 px-1.5 py-0.5 dark:bg-white/10">{r.type === 'installation' ? 'Montaż' : 'Dostawa'}</span>
          </div>
          <span className="opacity-60">{r.scheduledDate ? new Date(r.scheduledDate).toLocaleDateString() : '-'}</span>
        </li>
      ))}
    </ul>
  )
}

async function RecentCompletedOrders() {
  const now = new Date()
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0)
  const rows = await db
    .select({ id: ordersTable.id, clientId: ordersTable.clientId, scheduledDate: ordersTable.scheduledDate, status: ordersTable.status, clientName: clientsTbl.name, type: ordersTable.type, orderNo: ordersTable.orderNo })
    .from(ordersTable)
    .leftJoin(clientsTbl, deq(ordersTable.clientId, clientsTbl.id))
    .where(and(
      deq(ordersTable.status, 'completed'),
      lte(ordersTable.scheduledDate, todayStart),
      isNull(ordersTable.archivedAt)
    ))
    .orderBy(desc(ordersTable.scheduledDate))
    .limit(5)

  if (!rows || rows.length === 0) return <p className="text-sm text-gray-600">Brak zakończonych.</p>
  return (
    <ul className="space-y-1 text-sm">
      {rows.map(r => (
        <li key={r.id} className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Link className="underline" href={r.orderNo ? `/zlecenia/nr/${r.orderNo}_${r.type === 'installation' ? 'm' : 'd'}` : `/zlecenia/${r.id}`}>{r.clientName || r.clientId}</Link>
            <span className="text-xs rounded bg-black/5 px-1.5 py-0.5 dark:bg-white/10">{r.type === 'installation' ? 'Montaż' : 'Dostawa'}</span>
          </div>
          <span className="opacity-60">{r.scheduledDate ? new Date(r.scheduledDate).toLocaleDateString() : '-'}</span>
        </li>
      ))}
    </ul>
  )
}

