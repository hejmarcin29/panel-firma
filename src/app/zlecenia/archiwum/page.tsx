import { db } from '@/db'
import { clients, orders, users } from '@/db/schema'
import { desc, eq, isNotNull } from 'drizzle-orm'
import Link from 'next/link'
import { pl } from '@/i18n/pl'

export default async function OrdersArchivePage() {
  const rows = await db
    .select({
      id: orders.id,
      createdAt: orders.createdAt,
      type: orders.type,
      status: orders.status,
      clientId: orders.clientId,
      clientName: clients.name,
      scheduledDate: orders.scheduledDate,
      installerName: users.name,
      archivedAt: orders.archivedAt,
    })
    .from(orders)
    .leftJoin(clients, eq(orders.clientId, clients.id))
    .leftJoin(users, eq(orders.installerId, users.id))
    .where(isNotNull(orders.archivedAt))
    .orderBy(desc(orders.archivedAt))
    .limit(50)

  return (
    <div className="mx-auto max-w-6xl p-6">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-semibold">Archiwum zleceń</h1>
        <Link href="/zlecenia" className="underline">Powrót do listy</Link>
      </div>

      <div className="mt-4 overflow-x-auto rounded-md border border-black/10 dark:border-white/10">
        <table className="w-full text-sm">
          <thead className="text-left bg-black/5 dark:bg-white/10">
            <tr>
              <th className="px-3 py-2">ID</th>
              <th className="px-3 py-2">Klient</th>
              <th className="px-3 py-2">Typ</th>
              <th className="px-3 py-2">Status</th>
              <th className="px-3 py-2">Planowana data</th>
              <th className="px-3 py-2">Montażysta</th>
              <th className="px-3 py-2">Zarchiwizowano</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-3 py-6 text-center opacity-70">Brak pozycji w archiwum</td>
              </tr>
            ) : rows.map((r) => (
              <tr key={r.id} className="border-t border-black/10 hover:bg-black/5 dark:border-white/10 dark:hover:bg-white/10">
                <td className="px-3 py-2">
                  <Link className="underline" href={`/zlecenia/${r.id}`}>{r.id.slice(0,8)}</Link>
                </td>
                <td className="px-3 py-2">{r.clientName || r.clientId}</td>
                <td className="px-3 py-2">{r.type === 'installation' ? pl.orders.typeInstallation : pl.orders.typeDelivery}</td>
                <td className="px-3 py-2">{(pl.orders.statuses as Record<string,string>)[r.status] || r.status}</td>
                <td className="px-3 py-2">{r.scheduledDate ? new Date(r.scheduledDate).toLocaleDateString() : '-'}</td>
                <td className="px-3 py-2">{r.installerName || '-'}</td>
                <td className="px-3 py-2">{r.archivedAt ? new Date(r.archivedAt).toLocaleString() : '-'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
