import { db } from '@/db'
import { clients, orders, users } from '@/db/schema'
import { and, asc, desc, eq, like, isNull, isNotNull, sql } from 'drizzle-orm'
import type { SQL } from 'drizzle-orm'
import Link from 'next/link'
import { pl } from '@/i18n/pl'
import { OrderOutcomeButtons } from '../../components/order-outcome-buttons.client'
import { Wrench, Truck, Info } from 'lucide-react'
import { TypeBadge, OutcomeBadge, PipelineStageBadge } from '@/components/badges'
import { QuickChecklistBar } from '@/components/quick-checklist-bar.client'
import { FiltersDropdown } from '@/components/filters-dropdown.client'
import { formatDate, formatDayMonth } from '@/lib/date'

export const dynamic = 'force-dynamic'

type SearchParams = Promise<{ q?: string; type?: string; outcome?: string; page?: string; installer?: string; sort?: string; dir?: string; scope?: string }>

type Row = {
  id: string
  createdAt: number | Date
  type: string
  status: string
  pipelineStage: string | null
  outcome: 'won' | 'lost' | null | string | null
  clientId: string
  clientName: string | null
  nextDeliveryAt: number | null
  nextDeliveryStatus: string | null
  nextInstallationAt: number | null
  nextInstallationStatus: string | null
  installerName: string | null
  orderNo: string | null
  // checklist flags (0/1 or boolean, depending on driver)
  proforma?: number | boolean
  advance_invoice?: number | boolean
  final_invoice?: number | boolean
  post_delivery_invoice?: number | boolean
  quote?: number | boolean
  done?: number | boolean
  measurement?: number | boolean
  contract?: number | boolean
  advance_payment?: number | boolean
  installation?: number | boolean
  handover_protocol?: number | boolean
}

export default async function OrdersPage({ searchParams }: { searchParams: SearchParams }) {
  const { q = '', type = 'all', outcome = 'all', page = '1', installer = '', sort = 'created', dir = 'desc', scope = 'active' } = await searchParams
  const pageNum = Math.max(1, parseInt(page || '1', 10) || 1)
  const limit = 20
  const offset = (pageNum - 1) * limit

  const clauses: SQL[] = []
  if (q) clauses.push(like(clients.name, `%${q}%`) as unknown as SQL)
  if (type !== 'all') clauses.push(eq(orders.type, type) as unknown as SQL)
  if (installer) clauses.push(eq(orders.installerId, installer) as unknown as SQL)
  // outcome filter: active (no outcome), won, lost, all
  let outcomeExpr: SQL | null = null
  if (outcome === 'active') outcomeExpr = isNull(orders.outcome) as unknown as SQL
  else if (outcome === 'won') outcomeExpr = eq(orders.outcome, 'won') as unknown as SQL
  else if (outcome === 'lost') outcomeExpr = eq(orders.outcome, 'lost') as unknown as SQL

  const rows: Row[] = await db
    .select({
      id: orders.id,
      createdAt: orders.createdAt,
      type: orders.type,
      status: orders.status,
  pipelineStage: orders.pipelineStage,
      outcome: orders.outcome,
      clientId: orders.clientId,
      clientName: clients.name,
  // Checklist flags via EXISTS (SQLite returns 0/1)
  proforma: sql<number>`EXISTS(SELECT 1 FROM order_checklist_items oci WHERE oci.order_id = ${orders.id} AND oci.key = 'proforma' AND oci.done = 1)`,
  advance_invoice: sql<number>`EXISTS(SELECT 1 FROM order_checklist_items oci WHERE oci.order_id = ${orders.id} AND oci.key = 'advance_invoice' AND oci.done = 1)`,
  final_invoice: sql<number>`EXISTS(SELECT 1 FROM order_checklist_items oci WHERE oci.order_id = ${orders.id} AND oci.key = 'final_invoice' AND oci.done = 1)`,
  post_delivery_invoice: sql<number>`EXISTS(SELECT 1 FROM order_checklist_items oci WHERE oci.order_id = ${orders.id} AND oci.key = 'post_delivery_invoice' AND oci.done = 1)`,
  quote: sql<number>`EXISTS(SELECT 1 FROM order_checklist_items oci WHERE oci.order_id = ${orders.id} AND oci.key = 'quote' AND oci.done = 1)`,
  done: sql<number>`EXISTS(SELECT 1 FROM order_checklist_items oci WHERE oci.order_id = ${orders.id} AND oci.key = 'done' AND oci.done = 1)`,
  measurement: sql<number>`EXISTS(SELECT 1 FROM order_checklist_items oci WHERE oci.order_id = ${orders.id} AND oci.key = 'measurement' AND oci.done = 1)`,
  contract: sql<number>`EXISTS(SELECT 1 FROM order_checklist_items oci WHERE oci.order_id = ${orders.id} AND oci.key = 'contract' AND oci.done = 1)`,
  advance_payment: sql<number>`EXISTS(SELECT 1 FROM order_checklist_items oci WHERE oci.order_id = ${orders.id} AND oci.key = 'advance_payment' AND oci.done = 1)`,
  installation: sql<number>`EXISTS(SELECT 1 FROM order_checklist_items oci WHERE oci.order_id = ${orders.id} AND oci.key = 'installation' AND oci.done = 1)`,
  handover_protocol: sql<number>`EXISTS(SELECT 1 FROM order_checklist_items oci WHERE oci.order_id = ${orders.id} AND oci.key = 'handover_protocol' AND oci.done = 1)`,
      // Correlated subqueries for the nearest active delivery/installation
      nextDeliveryAt: sql<number>`(
        SELECT ds.planned_at
        FROM delivery_slots ds
        WHERE ds.order_id = ${orders.id} AND ds.status IN ('planned','confirmed')
        ORDER BY ds.planned_at ASC
        LIMIT 1
      )`,
      nextDeliveryStatus: sql<string>`(
        SELECT ds2.status
        FROM delivery_slots ds2
        WHERE ds2.order_id = ${orders.id} AND ds2.status IN ('planned','confirmed')
        ORDER BY ds2.planned_at ASC
        LIMIT 1
      )`,
      nextInstallationAt: sql<number>`(
        SELECT islots.planned_at
        FROM installation_slots islots
        WHERE islots.order_id = ${orders.id} AND islots.status IN ('planned','confirmed')
        ORDER BY islots.planned_at ASC
        LIMIT 1
      )`,
      nextInstallationStatus: sql<string>`(
        SELECT is2.status
        FROM installation_slots is2
        WHERE is2.order_id = ${orders.id} AND is2.status IN ('planned','confirmed')
        ORDER BY is2.planned_at ASC
        LIMIT 1
      )`,
      installerName: users.name,
      orderNo: orders.orderNo,
    })
    .from(orders)
    .leftJoin(clients, eq(orders.clientId, clients.id))
    .leftJoin(users, eq(orders.installerId, users.id))
  .where(
    and(
      // scope: active (default) → archivedAt IS NULL; archived → archivedAt IS NOT NULL; all → no constraint
      ...(scope === 'archived' ? [isNotNull(orders.archivedAt) as unknown as SQL] : scope === 'all' ? [] : [isNull(orders.archivedAt) as unknown as SQL]),
      ...(clauses.length ? [clauses.length === 1 ? clauses[0] : and(...clauses)] : []),
      ...(outcomeExpr ? [outcomeExpr] : [])
    )
  )
    .orderBy(
      // Sorting rules
      ...(sort === 'client' ? [dir === 'asc' ? asc(clients.name) : desc(clients.name)] : []),
      ...(sort === 'installer' ? [dir === 'asc' ? asc(users.name) : desc(users.name)] : []),
      ...(sort === 'delivery' ? [
        asc(sql`CASE WHEN nextDeliveryAt IS NULL THEN 1 ELSE 0 END`),
        dir === 'asc' ? asc(sql`nextDeliveryAt`) : desc(sql`nextDeliveryAt`)
      ] : []),
      ...(sort === 'installation' ? [
        asc(sql`CASE WHEN nextInstallationAt IS NULL THEN 1 ELSE 0 END`),
        dir === 'asc' ? asc(sql`nextInstallationAt`) : desc(sql`nextInstallationAt`)
      ] : []),
      ...(sort === 'created' || !sort ? [dir === 'asc' ? asc(orders.createdAt) : desc(orders.createdAt)] : [])
    )
    .limit(limit)
    .offset(offset)

  // Installer list for filter
  const installers = await db
    .select({ id: users.id, name: users.name })
    .from(users)
    .where(eq(users.role, 'installer'))

  // Krótsze etykiety statusów do listy (węższa kolumna)
  // status usunięty z UI – pokazujemy etap (pipelineStage)

  return (
    <div className="mx-auto max-w-none p-4 md:p-6">
      <section className="relative overflow-hidden rounded-2xl border bg-[var(--pp-panel)] mb-4" style={{ borderColor: 'var(--pp-border)' }}>
        <div className="pointer-events-none absolute inset-0 opacity-80" aria-hidden
             style={{ background: 'radial-gradient(1000px 360px at -10% -20%, color-mix(in oklab, var(--pp-primary) 14%, transparent), transparent 42%), linear-gradient(120deg, color-mix(in oklab, var(--pp-primary) 8%, transparent), transparent 65%)' }} />
        <div className="relative z-10 p-4 md:p-6 flex items-center justify-between gap-3">
          <h1 className="text-2xl md:text-3xl font-semibold">{pl.orders.title}</h1>
          <div className="flex gap-2 flex-wrap">
            <Link href="/zlecenia/nowe" className="inline-flex h-9 items-center rounded-md border px-3 text-sm hover:bg-[var(--pp-primary-subtle-bg)]" style={{ borderColor: 'var(--pp-border)' }}>{pl.orders.new}</Link>
            <Link href="/zlecenia/kalendarz" className="inline-flex h-9 items-center rounded-md border px-3 text-sm hover:bg-[var(--pp-primary-subtle-bg)]" style={{ borderColor: 'var(--pp-border)' }}>Kalendarz</Link>
            <Link href={`/zlecenia/kalendarz?date=${encodeURIComponent(new Date().toISOString().slice(0,10))}&view=dayGridMonth`}
              className="inline-flex h-9 items-center rounded-md border px-3 text-sm hover:bg-[var(--pp-primary-subtle-bg)]" style={{ borderColor: 'var(--pp-border)' }}>Dziś</Link>
            <Link href={`/zlecenia/kalendarz?range=week&date=${encodeURIComponent(new Date().toISOString().slice(0,10))}&view=dayGridWeek`}
              className="inline-flex h-9 items-center rounded-md border px-3 text-sm hover:bg-[var(--pp-primary-subtle-bg)]" style={{ borderColor: 'var(--pp-border)' }}>Tydzień</Link>
            <Link href="/zlecenia/archiwum" className="inline-flex h-9 items-center rounded-md border px-3 text-sm hover:bg-[var(--pp-primary-subtle-bg)]" style={{ borderColor: 'var(--pp-border)' }}>Archiwum</Link>
          </div>
        </div>
      </section>

      {/* Filters: collapsible on mobile */}
      <div className="md:hidden">
        <details className="rounded-md border border-black/10 dark:border-white/10 p-2">
          <summary className="cursor-pointer text-sm">Filtry</summary>
          <div className="mt-2">
            <Filters q={q} type={type} outcome={outcome} installer={installer} sort={sort} dir={dir} scope={scope} installers={installers} />
          </div>
        </details>
      </div>
      <div className="hidden md:block">
  <Filters q={q} type={type} outcome={outcome} installer={installer} sort={sort} dir={dir} scope={scope} installers={installers} />
      </div>

      <div className="mt-2 flex flex-wrap gap-2">
        {/* Szybkie filtrowanie typu */}
        <Link
          href={`/zlecenia?${new URLSearchParams({ q, outcome, installer, sort, dir, scope, type: type==='installation' ? 'all' : 'installation' }).toString()}`}
          className={`inline-flex h-8 items-center gap-1.5 rounded-md border px-2 text-xs ${type==='installation' ? 'bg-black text-white dark:bg-white dark:text-black border-black/15 dark:border-white/15' : 'border-black/15 hover:bg-black/5 dark:border-white/15 dark:hover:bg-white/10'}`}
        >
          <Wrench className="h-3.5 w-3.5" /> Pokaż tylko montaż
        </Link>
        <Link
          href={`/zlecenia?${new URLSearchParams({ q, outcome, installer, sort, dir, scope, type: type==='delivery' ? 'all' : 'delivery' }).toString()}`}
          className={`inline-flex h-8 items-center gap-1.5 rounded-md border px-2 text-xs ${type==='delivery' ? 'bg-black text-white dark:bg-white dark:text-black border-black/15 dark:border-white/15' : 'border-black/15 hover:bg-black/5 dark:border-white/15 dark:hover:bg-white/10'}`}
        >
          <Truck className="h-3.5 w-3.5" /> Pokaż tylko dostawa
        </Link>
        <Link
          href={`/zlecenia?${new URLSearchParams({ q, outcome, installer, sort, dir, scope, type: 'all' }).toString()}`}
          className={`inline-flex h-8 items-center gap-1.5 rounded-md border px-2 text-xs ${type==='all' ? 'bg-black text-white dark:bg-white dark:text-black border-black/15 dark:border-white/15' : 'border-black/15 hover:bg-black/5 dark:border-white/15 dark:hover:bg-white/10'}`}
        >
          Wszystkie
        </Link>
  <FiltersDropdown q={q} type={type} outcome={outcome} installer={installer} sort={sort} dir={dir} scope={scope} />
      </div>

      {/* Table for md+ */}
      <div className="mt-4 rounded-md border border-black/10 dark:border-white/10 hidden md:block overflow-x-auto">
        <table className="w-full text-sm min-w-[1120px]">
          <thead className="text-left bg-black/5 dark:bg-white/10">
            <tr>
              <th className="px-3 py-2 w-[120px]">Nr</th>
              <th className="px-3 py-2 w-[220px]">Klient</th>
              <th className="px-3 py-2 w-[90px]">Typ</th>
              <th className="px-3 py-2 w-[140px]">Etap</th>
              <th className="px-3 py-2 w-[170px]">Checklist</th>
              <th className="px-3 py-2 w-[120px]">Dostawa</th>
              <th className="px-3 py-2 w-[120px]">Montaż</th>
              <th className="px-3 py-2 w-[140px]">Montażysta</th>
              <th className="px-3 py-2 w-[90px]">Utw.</th>
              <th className="px-3 py-2 w-[90px]">Wynik</th>
              <th className="px-3 py-2 text-right w-[160px]">Akcje</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td colSpan={10} className="px-3 py-6 text-center opacity-70">{pl.orders.listEmpty}</td>
              </tr>
          ) : rows.map((r) => (
              <tr key={r.id} className="border-t border-black/10 hover:bg-black/5 dark:border-white/10 dark:hover:bg-white/10 anim-enter">
                <td className="px-3 py-2">
                  <Link className="hover:underline focus:underline focus:outline-none" href={r.orderNo ? `/zlecenia/nr/${r.orderNo}_${r.type === 'installation' ? 'm' : 'd'}` : `/zlecenia/${r.id}`}>
                    {r.orderNo ? `${r.orderNo}_${r.type === 'installation' ? 'm' : 'd'}` : r.id.slice(0,8)}
                  </Link>
                </td>
                <td className="px-3 py-2 max-w-[220px] truncate" title={r.clientName || r.clientId}>{r.clientName || r.clientId}</td>
                <td className="px-3 py-2"><TypeBadge type={r.type} /></td>
                <td className="px-3 py-2"><PipelineStageBadge stage={r.pipelineStage} /></td>
                <td className="px-3 py-2">
                  <QuickChecklistBar
                    orderId={r.id}
                    type={r.type as 'delivery'|'installation'}
                    items={(r.type === 'installation'
                      ? ['measurement','quote','contract','advance_payment','installation','handover_protocol','final_invoice','done']
                      : ['proforma','advance_invoice','final_invoice','post_delivery_invoice','quote','done']
                    ).map(k => ({ key: k, label: k, done: Boolean((r as Record<string, unknown>)[k]) }))}
                  />
                </td>
                <td className="px-3 py-2">
                  {r.nextDeliveryAt ? (
                    <span className="inline-flex items-center gap-1">
                      <span>{formatDayMonth(r.nextDeliveryAt, '—')}</span>
                      {r.nextDeliveryStatus ? (
                        <span className="rounded bg-black/10 px-1.5 py-0.5 text-[10px] uppercase tracking-wide dark:bg-white/10">{r.nextDeliveryStatus}</span>
                      ) : null}
                    </span>
                  ) : '—'}
                </td>
                <td className="px-3 py-2">
                  {r.nextInstallationAt ? (
                    <span className="inline-flex items-center gap-1">
                      <span>{formatDayMonth(r.nextInstallationAt, '—')}</span>
                      {r.nextInstallationStatus ? (
                        <span className="rounded bg-black/10 px-1.5 py-0.5 text-[10px] uppercase tracking-wide dark:bg-white/10">{r.nextInstallationStatus}</span>
                      ) : null}
                    </span>
                  ) : '—'}
                </td>
                <td className="px-3 py-2 max-w-[140px] truncate" title={r.installerName || '-'}>{r.installerName || '-'}</td>
                <td className="px-3 py-2">{formatDate(r.createdAt, '—')}</td>
                <td className="px-3 py-2">
                  <OutcomeBadge outcome={r.outcome as 'won'|'lost'|null|undefined} iconOnly />
                </td>
                <td className="px-3 py-2 text-right">
                  <div className="flex items-center gap-2 justify-end flex-wrap">
                    {/* Najpierw akcje wyniku */}
                    <OrderOutcomeButtons id={r.id} outcome={r.outcome as 'won'|'lost'|null} />
                    {/* Szczegóły na końcu */}
                    <Link className="inline-flex h-7 w-7 items-center justify-center rounded-md border border-black/15 text-xs hover:bg-black/5 dark:border-white/15 dark:hover:bg-white/10"
                      href={r.orderNo ? `/zlecenia/nr/${r.orderNo}_${r.type === 'installation' ? 'm' : 'd'}` : `/zlecenia/${r.id}`}
                      aria-label="Szczegóły" title="Szczegóły">
                      <Info className="h-3.5 w-3.5" />
                    </Link>
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
            const href = r.orderNo ? `/zlecenia/nr/${r.orderNo}_${r.type === 'installation' ? 'm' : 'd'}` : `/zlecenia/${r.id}`
            return (
              <div key={r.id} className="rounded-md border border-black/10 dark:border-white/10 p-3 anim-enter">
                <div className="flex items-center justify-between">
                  <Link className="font-medium hover:underline focus:underline focus:outline-none" href={href}>
                    {r.orderNo ? `${r.orderNo}_${r.type === 'installation' ? 'm' : 'd'}` : r.id.slice(0,8)}
                  </Link>
                  <div className="flex items-center gap-2">
                    <TypeBadge type={r.type} />
                    <PipelineStageBadge stage={r.pipelineStage} />
                  </div>
                </div>
                {/* Mini-kafelki checklisty na mobile */}
                <div className="mt-2">
                  <QuickChecklistBar
                    orderId={r.id}
                    type={r.type as 'delivery'|'installation'}
                    items={(r.type === 'installation'
                      ? ['measurement','quote','contract','advance_payment','installation','handover_protocol','final_invoice','done']
                      : ['proforma','advance_invoice','final_invoice','post_delivery_invoice','quote','done']
                    ).map(k => ({ key: k, label: k, done: Boolean((r as Record<string, unknown>)[k]) }))}
                  />
                </div>
                <div className="mt-1 text-sm">{r.clientName || r.clientId}</div>
                <div className="mt-1 grid grid-cols-2 gap-2 text-xs opacity-70">
                  <div>
                    <div className="opacity-70">Dostawa</div>
                    <div>{r.nextDeliveryAt ? formatDayMonth(r.nextDeliveryAt, '—') : '—'}</div>
                  </div>
                  <div>
                    <div className="opacity-70">Montaż</div>
                    <div>{r.nextInstallationAt ? formatDayMonth(r.nextInstallationAt, '—') : '—'}</div>
                  </div>
                </div>
                <div className="mt-1 text-xs opacity-70 flex justify-end">{formatDate(r.createdAt, '—')}</div>
                <div className="mt-2 flex items-center justify-between">
                  <OutcomeBadge outcome={r.outcome as 'won'|'lost'|null|undefined} iconOnly />
                  <div className="flex items-center gap-2">
                    <OrderOutcomeButtons id={r.id} outcome={r.outcome as 'won'|'lost'|null} size="md" />
                    <Link className="inline-flex h-9 items-center gap-1.5 rounded-md border border-black/15 px-3 text-sm hover:bg-black/5 dark:border-white/15 dark:hover:bg-white/10" href={href}>Szczegóły</Link>
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

function Filters({ q, type, outcome, installer, sort, dir, scope, installers }: { q: string; type: string; outcome: string; installer: string; sort: string; dir: string; scope: string; installers: { id: string; name: string | null }[] }) {
  return (
    <form className="flex flex-wrap gap-2 items-end">
      <input type="hidden" name="scope" value={scope} />
      <div className="flex flex-col">
        <label className="text-xs opacity-70">Szukaj klienta</label>
        <input name="q" defaultValue={q} placeholder={pl.orders.searchPlaceholder} className="h-9 rounded-md border border-black/15 bg-transparent px-3 text-sm outline-none dark:border-white/15" />
      </div>
      <div className="flex flex-col">
        <label className="text-xs opacity-70">Wynik</label>
        <select name="outcome" defaultValue={outcome} className="h-9 rounded-md border border-black/15 bg-transparent px-3 text-sm outline-none dark:border-white/15">
          <option value="all">Wszystkie</option>
          <option value="won">Wygrane</option>
          <option value="lost">Przegrane</option>
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
      <div className="flex flex-col">
        <label className="text-xs opacity-70">Montażysta</label>
        <select name="installer" defaultValue={installer} className="h-9 rounded-md border border-black/15 bg-transparent px-3 text-sm outline-none dark:border-white/15">
          <option value="">Wszyscy</option>
          {installers.map(i => (
            <option key={i.id} value={i.id}>{i.name || i.id.slice(0,8)}</option>
          ))}
        </select>
      </div>
      <div className="flex flex-col">
        <label className="text-xs opacity-70">Sortuj według</label>
        <select name="sort" defaultValue={sort} className="h-9 rounded-md border border-black/15 bg-transparent px-3 text-sm outline-none dark:border-white/15">
          <option value="created">Utworzono</option>
          <option value="client">Klient</option>
          <option value="installer">Montażysta</option>
          <option value="delivery">Dostawa</option>
          <option value="installation">Montaż</option>
        </select>
      </div>
      <div className="flex flex-col">
        <label className="text-xs opacity-70">Kierunek</label>
        <select name="dir" defaultValue={dir} className="h-9 rounded-md border border-black/15 bg-transparent px-3 text-sm outline-none dark:border-white/15">
          <option value="asc">Rosnąco</option>
          <option value="desc">Malejąco</option>
        </select>
      </div>
      <button type="submit" className="h-9 px-3 rounded-md border border-black/15 text-sm hover:bg-black/5 dark:border-white/15 dark:hover:bg-white/10">Filtruj</button>
    </form>
  )
}

// moved import to top
