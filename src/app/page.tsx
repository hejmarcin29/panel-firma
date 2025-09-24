import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus } from "lucide-react";
import { pl } from "@/i18n/pl";
import { SystemStatusInfo } from "@/components/system-status-info";
import Link from "next/link";
export default function Home() {
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
            <ul className="space-y-1 text-sm">
              <li><Link className="underline" href="/klienci/nowy">{pl.clients.add}</Link></li>
              <li><span className="opacity-60">Dodaj montaż (wkrótce)</span></li>
              <li><span className="opacity-60">Dodaj dostawę (wkrótce)</span></li>
            </ul>
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
            <CardTitle>{pl.dashboard.systemStatus}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm opacity-70">Wersja: 0.1.0 • Baza: SQLite</p>
            <div className="mt-3">
              <SystemStatusInfo />
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
            <p className="text-sm text-gray-600">{pl.dashboard.jobsPlaceholder}</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

import { db } from "@/db";
import { clients as clientsTable, clientNotes as clientNotesTable } from "@/db/schema";
import { desc, eq } from "drizzle-orm";

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

