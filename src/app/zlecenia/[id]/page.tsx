import { db } from '@/db'
import { clients, orders, users } from '@/db/schema'
import { eq } from 'drizzle-orm'
import Link from 'next/link'
import { pl } from '@/i18n/pl'
import { OrderEditor } from '@/components/order-editor.client'
import { OrderStatusButtons } from '@/components/order-status-buttons.client'
import { OrderOutcomeButtons } from '@/components/order-outcome-buttons.client'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { BackButton } from '@/components/back-button'
import { OrderPrivateActions } from '@/components/order-private-actions.client'
import { TypeBadge, StatusBadge, OutcomeBadge } from '@/components/badges'
import { getSession } from '@/lib/auth-session'

export default async function OrderDetailsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const session = await getSession()
  const isInstaller = (session?.user?.role === 'installer')
  const [row] = await db
    .select({
      id: orders.id,
      type: orders.type,
      status: orders.status,
      outcome: orders.outcome,
      outcomeAt: orders.outcomeAt,
      clientId: orders.clientId,
      clientName: clients.name,
      clientPhone: clients.phone,
      clientEmail: clients.email,
      clientInvoiceCity: clients.invoiceCity,
      clientInvoiceAddress: clients.invoiceAddress,
      clientDeliveryCity: clients.deliveryCity,
      clientDeliveryAddress: clients.deliveryAddress,
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
  <div className="mt-4"><Link href="/" className="hover:underline focus:underline focus:outline-none">Powrót</Link></div>
      </div>
    )
  }

  const statusLabel = (pl.orders.statuses as Record<string,string>)[row.status] || row.status

  return (
    <div className="mx-auto max-w-6xl p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <BackButton fallbackHref="/zlecenia" />
          <h1 className="text-2xl font-semibold">
            Zlecenie #{row.orderNo ? `${row.orderNo}_${row.type === 'installation' ? 'm' : 'd'}` : row.id.slice(0,8)}
          </h1>
        </div>
        <div className="flex items-center gap-2">
          <TypeBadge type={row.type} />
          <StatusBadge status={row.status} label={statusLabel} />
          <OutcomeBadge outcome={row.outcome as 'won'|'lost'|null|undefined} />
        </div>
      </div>

      {/* Main grid */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {/* Left column */}
        <div className="space-y-4">
          <Card id="order-info" className="scroll-mt-16">
            <CardHeader className="pb-2"><CardTitle>Podstawowe informacje</CardTitle></CardHeader>
            <CardContent className="space-y-1 text-sm">
              <div><span className="opacity-60">Klient:</span> {row.clientName || row.clientId}</div>
              <div><span className="opacity-60">m2 przed pomiarem:</span> {row.preMeasurementSqm ?? '-'}</div>
              <div><span className="opacity-60">Planowana data:</span> {row.scheduledDate ? new Date(row.scheduledDate).toLocaleDateString() : '-'}</div>
              <div><span className="opacity-60">Montażysta:</span> {row.installerName || row.installerEmail || '-'}</div>
              <div><span className="opacity-60">Utworzono:</span> {new Date(row.createdAt).toLocaleString()}</div>
              {row.outcome && (
                <div><span className="opacity-60">Wynik:</span> {row.outcome === 'won' ? 'Wygrane' : 'Przegrane'} {row.outcomeAt ? `(${new Date(row.outcomeAt).toLocaleString()})` : ''}</div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2"><CardTitle>Edycja</CardTitle></CardHeader>
            <CardContent>
              <OrderEditor orderId={row.id} defaults={{ note: null, preMeasurementSqm: row.preMeasurementSqm, installerId: row.installerId ?? null, scheduledDate: row.scheduledDate ? (row.scheduledDate as unknown as Date).getTime?.() ?? Number(row.scheduledDate) : null }} />
            </CardContent>
          </Card>

          {!row.outcome ? (
            <Card>
              <CardHeader className="pb-2"><CardTitle>Wynik</CardTitle></CardHeader>
              <CardContent>
                <OrderOutcomeButtons id={row.id} outcome={row.outcome as 'won'|'lost'|null} />
              </CardContent>
            </Card>
          ) : null}

          {!row.outcome ? (
            <Card>
              <CardHeader className="pb-2"><CardTitle>Zmiana statusu</CardTitle></CardHeader>
              <CardContent>
                <OrderStatusButtons id={row.id} status={row.status} />
              </CardContent>
            </Card>
          ) : null}
        </div>

        {/* Right column */}
        <div className="space-y-4">
          <Card id="order-details" className="scroll-mt-16">
            <CardHeader className="pb-2"><CardTitle>Szczegóły typu</CardTitle></CardHeader>
            <CardContent>
              {row.type === 'installation' ? (
                <div className="text-sm opacity-70">Sekcja Montaż (szczegóły pojawią się w kolejnej iteracji).</div>
              ) : (
                <div className="text-sm opacity-70">Sekcja Dostawa (szczegóły pojawią się w kolejnej iteracji).</div>
              )}
            </CardContent>
          </Card>

          {isInstaller ? (
            <Card>
              <CardHeader className="pb-2"><CardTitle>Prywatne (montażysta)</CardTitle></CardHeader>
              <CardContent>
                <OrderPrivateActions orderId={row.id} />
              </CardContent>
            </Card>
          ) : null}

          <Card>
            <CardHeader className="pb-2"><CardTitle>Podstawowe dane klienta</CardTitle></CardHeader>
            <CardContent className="grid grid-cols-1 gap-1 text-sm">
              <div><span className="opacity-60">Nazwa:</span> {row.clientName || row.clientId}</div>
              <div><span className="opacity-60">Telefon:</span> {row.clientPhone || '—'}</div>
              <div><span className="opacity-60">Email:</span> {row.clientEmail || '—'}</div>
              <div><span className="opacity-60">Faktura:</span> {row.clientInvoiceCity ? `${row.clientInvoiceCity}, ${row.clientInvoiceAddress || ''}` : '—'}</div>
              <div><span className="opacity-60">Dostawa:</span> {row.clientDeliveryCity ? `${row.clientDeliveryCity}, ${row.clientDeliveryAddress || ''}` : '—'}</div>
              <div>
                <Link href={`/klienci/${row.clientId}`} className="text-xs hover:underline focus:underline focus:outline-none">Wejdź do klienta</Link>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
