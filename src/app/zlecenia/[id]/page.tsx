import { db } from '@/db'
import { clients, orders, users } from '@/db/schema'
import { eq } from 'drizzle-orm'
import Link from 'next/link'
import { pl } from '@/i18n/pl'
import { OrderEditor } from '@/components/order-editor.client'
import { OrderStatusButtons } from '@/components/order-status-buttons.client'

export default async function OrderDetailsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const [row] = await db
    .select({
      id: orders.id,
      type: orders.type,
      status: orders.status,
      clientId: orders.clientId,
      clientName: clients.name,
      installerId: orders.installerId,
      installerName: users.name,
      installerEmail: users.email,
      preMeasurementSqm: orders.preMeasurementSqm,
      scheduledDate: orders.scheduledDate,
      createdAt: orders.createdAt,
      orderNo: orders.orderNo,
    })
    .from(orders)
    .leftJoin(clients, eq(orders.clientId, clients.id))
    .leftJoin(users, eq(orders.installerId, users.id))
    .where(eq(orders.id, id))
    .limit(1)

  if (!row) {
    return (
      <div className="mx-auto max-w-3xl p-6">
        <div className="text-sm text-red-600">{pl.orders.notFound}</div>
        <div className="mt-4"><Link href="/" className="underline">Powrót</Link></div>
      </div>
    )
  }

  const statusLabel = (pl.orders.statuses as Record<string,string>)[row.status] || row.status
  const typeLabel = row.type === 'installation' ? pl.orders.typeInstallation : pl.orders.typeDelivery

  return (
    <div className="mx-auto max-w-3xl p-6 space-y-4">
      <div className="flex items-center justify-between">
  <h1 className="text-2xl font-semibold">Zlecenie #{row.orderNo ? `${row.orderNo}_${row.type === 'installation' ? 'm' : 'd'}` : row.id.slice(0,8)}</h1>
        <Link href="/" className="inline-flex h-8 items-center rounded-md border border-black/15 px-3 text-sm dark:border-white/15">Wróć</Link>
      </div>
      <div className="rounded border border-black/10 dark:border-white/10 p-4 space-y-2 text-sm">
        <div><span className="opacity-60">Klient:</span> {row.clientName || row.clientId}</div>
        <div><span className="opacity-60">Typ:</span> {typeLabel}</div>
        <div><span className="opacity-60">Status:</span> {statusLabel}</div>
        <div><span className="opacity-60">m2 przed pomiarem:</span> {row.preMeasurementSqm ?? '-'}</div>
  <div><span className="opacity-60">Planowana data:</span> {row.scheduledDate ? new Date(row.scheduledDate).toLocaleDateString() : '-'}</div>
        <div><span className="opacity-60">Montażysta:</span> {row.installerName || row.installerEmail || '-'}</div>
        <div><span className="opacity-60">Utworzono:</span> {new Date(row.createdAt).toLocaleString()}</div>
      </div>
      <div className="rounded border border-black/10 dark:border-white/10 p-4">
        <h2 className="text-sm font-medium mb-3">Edycja</h2>
        <OrderEditor orderId={row.id} defaults={{ note: null, preMeasurementSqm: row.preMeasurementSqm, installerId: row.installerId ?? null, scheduledDate: row.scheduledDate ? (row.scheduledDate as unknown as Date).getTime?.() ?? Number(row.scheduledDate) : null }} />
      </div>
      <div className="rounded border border-black/10 dark:border-white/10 p-4">
        <h2 className="text-sm font-medium mb-3">Szczegóły typu</h2>
        {row.type === 'installation' ? (
          <div className="text-sm opacity-70">Sekcja Montaż (szczegóły pojawią się w kolejnej iteracji).</div>
        ) : (
          <div className="text-sm opacity-70">Sekcja Dostawa (szczegóły pojawią się w kolejnej iteracji).</div>
        )}
      </div>
      <div className="rounded border border-black/10 dark:border-white/10 p-4">
        <h2 className="text-sm font-medium mb-3">Zmiana statusu</h2>
        <OrderStatusButtons id={row.id} status={row.status} />
      </div>
    </div>
  )
}
