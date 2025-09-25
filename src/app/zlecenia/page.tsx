import { db } from '@/db'
import { clients, orders, users } from '@/db/schema'
import { and, desc, eq, like, isNull } from 'drizzle-orm'
import type { SQL } from 'drizzle-orm'
import Link from 'next/link'
import { pl } from '@/i18n/pl'
import { OrderOutcomeButtons } from '../../components/order-outcome-buttons.client'
import { Wrench, Truck, Info } from 'lucide-react'
import { TypeBadge, StatusBadge, OutcomeBadge } from '@/components/badges'

export const dynamic = 'force-dynamic'

type SearchParams = Promise<{ q?: string; status?: string; type?: string; outcome?: string; page?: string }>

export default async function OrdersPage({ searchParams }: { searchParams: SearchParams }) {
  const { q = '', status = 'all', type = 'all', outcome = 'active', page = '1' } = await searchParams
  const pageNum = Math.max(1, parseInt(page || '1', 10) || 1)
  const limit = 20
  const offset = (pageNum - 1) * limit

  const clauses: SQL[] = []
  if (q) clauses.push(like(clients.name, `%${q}%`) as unknown as SQL)
  if (status !== 'all') clauses.push(eq(orders.status, status) as unknown as SQL)
  if (type !== 'all') clauses.push(eq(orders.type, type) as unknown as SQL)
  // outcome filter: active (no outcome), won, lost, all
  let outcomeExpr: SQL | null = null
  if (outcome === 'active') outcomeExpr = isNull(orders.outcome) as unknown as SQL
  else if (outcome === 'won') outcomeExpr = eq(orders.outcome, 'won') as unknown as SQL
  else if (outcome === 'lost') outcomeExpr = eq(orders.outcome, 'lost') as unknown as SQL

  const rows = await db
    .select({
      id: orders.id,
      createdAt: orders.createdAt,
      type: orders.type,
      status: orders.status,
      outcome: orders.outcome,
      clientId: orders.clientId,
      clientName: clients.name,
      scheduledDate: orders.scheduledDate,
      installerName: users.name,
      orderNo: orders.orderNo,
    })
    .from(orders)
    .leftJoin(clients, eq(orders.clientId, clients.id))
    .leftJoin(users, eq(orders.installerId, users.id))
  .where(
    and(
      isNull(orders.archivedAt),
      ...(clauses.length ? [clauses.length === 1 ? clauses[0] : and(...clauses)] : []),
      ...(outcomeExpr ? [outcomeExpr] : [])
    )
  )
    .orderBy(desc(orders.createdAt))
    .limit(limit)
    .offset(offset)

  return (
    <div className="mx-auto max-w-none p-4 md:p-6">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-semibold">{pl.orders.title}</h1>
        <div className="flex gap-2">
          <Link href="/zlecenia/nowe" className="inline-flex h-9 items-center rounded-md border border-black/15 px-3 text-sm hover:bg-black/5 dark:border-white/15 dark:hover:bg-white/10">{pl.orders.new}</Link>
          <Link href="/zlecenia/archiwum" className="inline-flex h-9 items-center rounded-md border border-black/15 px-3 text-sm hover:bg-black/5 dark:border-white/15 dark:hover:bg-white/10">Archiwum</Link>
        </div>
      </div>

      {/* Filters: collapsible on mobile */}
      <div className="md:hidden">
        <details className="rounded-md border border-black/10 dark:border-white/10 p-2">
          <summary className="cursor-pointer text-sm">Filtry</summary>
          <div className="mt-2">
            <Filters q={q} status={status} type={type} outcome={outcome} />
          </div>
        </details>
      </div>
      <div className="hidden md:block">
        <Filters q={q} status={status} type={type} outcome={outcome} />
      </div>

      <div className="mt-2 flex flex-wrap gap-2">
        {/* Szybkie filtrowanie typu */}
        <Link
          href={`/zlecenia?${new URLSearchParams({ q, status, outcome, type: 'installation' }).toString()}`}
          className={`inline-flex h-8 items-center gap-1.5 rounded-md border px-2 text-xs ${type==='installation' ? 'bg-black text-white dark:bg-white dark:text-black border-black/15 dark:border-white/15' : 'border-black/15 hover:bg-black/5 dark:border-white/15 dark:hover:bg-white/10'}`}
        >
          <Wrench className="h-3.5 w-3.5" /> Pokaż tylko montaż
        </Link>
        <Link
          href={`/zlecenia?${new URLSearchParams({ q, status, outcome, type: 'delivery' }).toString()}`}
          className={`inline-flex h-8 items-center gap-1.5 rounded-md border px-2 text-xs ${type==='delivery' ? 'bg-black text-white dark:bg-white dark:text-black border-black/15 dark:border-white/15' : 'border-black/15 hover:bg-black/5 dark:border-white/15 dark:hover:bg-white/10'}`}
        >
          <Truck className="h-3.5 w-3.5" /> Pokaż tylko dostawa
        </Link>
      </div>

      {/* Table for md+ */}
      <div className="mt-4 rounded-md border border-black/10 dark:border-white/10 hidden md:block">
        <table className="w-full text-sm">
          <thead className="text-left bg-black/5 dark:bg-white/10">
            <tr>
              <th className="px-3 py-2">Nr zlecenia</th>
              <th className="px-3 py-2">Klient</th>
              <th className="px-3 py-2">Typ</th>
              <th className="px-3 py-2">Status</th>
              <th className="px-3 py-2">Wynik</th>
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
                  <Link className="underline" href={r.orderNo ? `/zlecenia/nr/${r.orderNo}_${r.type === 'installation' ? 'm' : 'd'}` : `/zlecenia/${r.id}`}>
                    {r.orderNo ? `${r.orderNo}_${r.type === 'installation' ? 'm' : 'd'}` : r.id.slice(0,8)}
                  </Link>
                </td>
                <td className="px-3 py-2">{r.clientName || r.clientId}</td>
                <td className="px-3 py-2"><TypeBadge type={r.type} /></td>
                <td className="px-3 py-2"><StatusBadge status={r.status} label={(pl.orders.statuses as Record<string,string>)[r.status] || r.status} /></td>
                <td className="px-3 py-2"><OutcomeBadge outcome={r.outcome as 'won'|'lost'|null|undefined} /></td>
                <td className="px-3 py-2">{r.scheduledDate ? new Date(r.scheduledDate).toLocaleDateString() : '-'}</td>
                <td className="px-3 py-2">{r.installerName || '-'}</td>
                <td className="px-3 py-2">{new Date(r.createdAt).toLocaleString()}</td>
                <td className="px-3 py-2 text-right">
                  <div className="flex items-center gap-2 justify-end flex-wrap">
                    <Link
                      className="inline-flex h-7 items-center gap-1.5 rounded-md border border-black/15 px-2 text-xs hover:bg-black/5 dark:border-white/15 dark:hover:bg-white/10"
                      href={r.orderNo ? `/zlecenia/nr/${r.orderNo}_${r.type === 'installation' ? 'm' : 'd'}` : `/zlecenia/${r.id}`}
                    >
                      <Info className="h-3.5 w-3.5" /> Szczegóły
                    </Link>
                    <OrderOutcomeButtons id={r.id} outcome={r.outcome as 'won'|'lost'|null} />
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {/* Mobile cards */}
      <div className="mt-4 space-y-2 md:hidden">
        {rows.length === 0 ? (
          <div className="px-3 py-6 text-center opacity-70">{pl.orders.listEmpty}</div>
        ) : (
          rows.map((r) => {
            const statusLabel = (pl.orders.statuses as Record<string,string>)[r.status] || r.status
            const href = r.orderNo ? `/zlecenia/nr/${r.orderNo}_${r.type === 'installation' ? 'm' : 'd'}` : `/zlecenia/${r.id}`
            return (
              <div key={r.id} className="rounded-md border border-black/10 dark:border-white/10 p-3">
                <div className="flex items-center justify-between">
                  <Link className="font-medium underline" href={href}>
                    {r.orderNo ? `${r.orderNo}_${r.type === 'installation' ? 'm' : 'd'}` : r.id.slice(0,8)}
                  </Link>
                  <div className="flex items-center gap-2">
                    <TypeBadge type={r.type} />
                    <StatusBadge status={r.status} label={statusLabel} />
                  </div>
                </div>
                <div className="mt-1 text-sm">{r.clientName || r.clientId}</div>
                <div className="mt-1 flex items-center justify-between text-xs opacity-70">
                  <span>{r.scheduledDate ? new Date(r.scheduledDate).toLocaleDateString() : '-'}</span>
                  <span>{new Date(r.createdAt).toLocaleString()}</span>
                </div>
                <div className="mt-2 flex items-center justify-between">
                  <OutcomeBadge outcome={r.outcome as 'won'|'lost'|null|undefined} />
                  <div className="flex items-center gap-2">
                    <Link className="inline-flex h-9 items-center gap-1.5 rounded-md border border-black/15 px-3 text-sm hover:bg-black/5 dark:border-white/15 dark:hover:bg-white/10" href={href}>Szczegóły</Link>
                    <OrderOutcomeButtons id={r.id} outcome={r.outcome as 'won'|'lost'|null} size="md" />
                  </div>
                </div>
              </div>
            )
          })
        )}
      </div>
      {/* TODO: pagination controls */}
    </div>
  )
}

function Filters({ q, status, type, outcome }: { q: string; status: string; type: string; outcome: string }) {
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
        <label className="text-xs opacity-70">Wynik</label>
        <select name="outcome" defaultValue={outcome} className="h-9 rounded-md border border-black/15 bg-transparent px-3 text-sm outline-none dark:border-white/15">
          <option value="active">Aktywne</option>
          <option value="won">Wygrane</option>
          <option value="lost">Przegrane</option>
          <option value="all">Wszystkie</option>
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
