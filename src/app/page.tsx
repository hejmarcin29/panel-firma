import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function Home() {
  return (
    <div className="mx-auto max-w-6xl p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-semibold">Dashboard</h1>
        <a href="/clients/new" className="rounded border px-3 py-1.5 text-sm">Dodaj klienta</a>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader>
            <CardTitle>Szybkie akcje</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="text-sm space-y-1">
              <li><a className="underline" href="/clients/new">Dodaj klienta</a></li>
              <li><span className="opacity-60">Dodaj montaż (wkrótce)</span></li>
              <li><span className="opacity-60">Dodaj dostawę (wkrótce)</span></li>
            </ul>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Ostatni klienci</CardTitle>
          </CardHeader>
          <CardContent>
            <RecentClients />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Stan systemu</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-600">Wersja: 0.1.0 • Baza: SQLite</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
        <Card>
          <CardHeader>
            <CardTitle>Ostatnie zmiany</CardTitle>
          </CardHeader>
          <CardContent>
            <RecentChanges />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Zlecenia (montaż/dostawa)</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-600">Placeholder — wkrótce lista nadchodzących zleceń.</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

import { db } from "@/db";
import { clients as clientsTable, clientNotes as clientNotesTable } from "@/db/schema";
import { desc } from "drizzle-orm";

async function RecentClients() {
  const list = await db
    .select({ id: clientsTable.id, name: clientsTable.name, email: clientsTable.email, createdAt: clientsTable.createdAt })
    .from(clientsTable)
    .orderBy(desc(clientsTable.createdAt))
    .limit(5);
  if (list.length === 0) return <p className="text-sm text-gray-600">Brak klientów. <a className="underline" href="/clients/new">Dodaj pierwszego</a>.</p>;
  return (
    <ul className="text-sm space-y-1">
      {list.map((c) => (
        <li key={c.id} className="flex items-center justify-between">
          <a className="underline" href={`/clients/${c.id}`}>{c.name}</a>
          <span className="opacity-60">{new Date(c.createdAt).toLocaleDateString()}</span>
        </li>
      ))}
      <li className="mt-2"><a className="underline" href="/clients">Zobacz wszystkich</a></li>
    </ul>
  );
}

async function RecentChanges() {
  const notes = await db
    .select({ id: clientNotesTable.id, content: clientNotesTable.content, createdAt: clientNotesTable.createdAt })
    .from(clientNotesTable)
    .orderBy(desc(clientNotesTable.createdAt))
    .limit(5);
  if (notes.length === 0) return <p className="text-sm text-gray-600">Brak zmian.</p>;
  return (
    <ul className="text-sm space-y-1">
      {notes.map((n) => (
        <li key={n.id} className="flex items-center justify-between">
          <span className="truncate max-w-[70%]">{n.content}</span>
          <span className="opacity-60">{new Date(n.createdAt).toLocaleDateString()}</span>
        </li>
      ))}
    </ul>
  );
}
