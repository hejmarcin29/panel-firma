import { db } from '@/db'
import { clients, orders, users } from '@/db/schema'
import { and, desc, eq, like, isNull } from 'drizzle-orm'
import Link from 'next/link'
import { pl } from '@/i18n/pl'
import { OrderArchiveButton } from '../../components/order-archive-button.client'

export const dynamic = 'force-dynamic'

type SearchParams = Promise<{ q?: string; status?: string; type?: string; page?: string }>

export default async function OrdersPage({ searchParams }: { searchParams: SearchParams }) {
  const { q = '', status = 'all', type = 'all', page = '1' } = await searchParams
  const pageNum = Math.max(1, parseInt(page || '1', 10) || 1)
  const limit = 20
  const offset = (pageNum - 1) * limit

  const where = [] as any[]
  if (q) where.push(like(clients.name, `%${q}%`))
  if (status !== 'all') where.push(eq(orders.status, status))
  if (type !== 'all') where.push(eq(orders.type, type))

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
    })
    .from(orders)
    .leftJoin(clients, eq(orders.clientId, clients.id))
    .leftJoin(users, eq(orders.installerId, users.id))
    .where(and(isNull(orders.archivedAt), ...(where.length ? [and(...where)] : [])))
    .orderBy(desc(orders.createdAt))
    .limit(limit)
    .offset(offset)

  return (
    <div className="mx-auto max-w-6xl p-6">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-semibold">{pl.orders.title}</h1>
        <div className="flex gap-2">
          <Link href="/zlecenia/nowe" className="inline-flex h-9 items-center rounded-md border border-black/15 px-3 text-sm hover:bg-black/5 dark:border-white/15 dark:hover:bg-white/10">{pl.orders.new}</Link>
          <Link href="/zlecenia/archiwum" className="inline-flex h-9 items-center rounded-md border border-black/15 px-3 text-sm hover:bg-black/5 dark:border-white/15 dark:hover:bg-white/10">Archiwum</Link>
        </div>
      </div>

      <Filters q={q} status={status} type={type} />

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
              <th className="px-3 py-2">Utworzono</th>
              <th className="px-3 py-2 text-right">Akcje</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td colSpan={8} className="px-3 py-6 text-center opacity-70">{pl.orders.listEmpty}</td>
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
                <td className="px-3 py-2">{new Date(r.createdAt).toLocaleString()}</td>
                <td className="px-3 py-2 text-right">
                  <OrderArchiveButton id={r.id} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {/* TODO: pagination controls */}
    </div>
  )
}

function Filters({ q, status, type }: { q: string; status: string; type: string }) {
  return (
    <form className="flex flex-wrap gap-2 items-end">
      <div className="flex flex-col">
        <label className="text-xs opacity-70">Szukaj klienta</label>
        <input name="q" defaultValue={q} placeholder={pl.orders.searchPlaceholder} className="h-9 rounded-md border border-black/15 bg-transparent px-3 text-sm outline-none dark:border-white/15" />
      </div>
      <div className="flex flex-col">
        <label className="text-xs opacity-70">Status</label>
        <select name="status" defaultValue={status} className="h-9 rounded-md border border-black/15 bg-transparent px-3 text-sm outline-none dark:border-white/15">
          <option value="all">Wszystkie</option>
          {Object.entries(pl.orders.statuses).map(([k, v]) => (
            <option key={k} value={k}>{v}</option>
          ))}
        </select>
      </div>
      <div className="flex flex-col">
        <label className="text-xs opacity-70">Typ</label>
        <select name="type" defaultValue={type} className="h-9 rounded-md border border-black/15 bg-transparent px-3 text-sm outline-none dark:border-white/15">
          <option value="all">Wszystkie</option>
          <option value="installation">{pl.orders.typeInstallation}</option>
          <option value="delivery">{pl.orders.typeDelivery}</option>
        </select>
      </div>
      <button type="submit" className="h-9 px-3 rounded-md border border-black/15 text-sm hover:bg-black/5 dark:border-white/15 dark:hover:bg-white/10">Filtruj</button>
    </form>
  )
}

// moved import to top
