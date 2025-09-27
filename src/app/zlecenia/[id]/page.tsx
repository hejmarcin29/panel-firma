import { db } from '@/db'
import { clients, orders, users, deliverySlots, installationSlots, orderChecklistItems } from '@/db/schema'
import { eq, desc } from 'drizzle-orm'
import Link from 'next/link'
import { pl } from '@/i18n/pl'
import { OrderEditor } from '@/components/order-editor.client'
import { OrderStatusButtons } from '@/components/order-status-buttons.client'
import { OrderOutcomeButtons } from '@/components/order-outcome-buttons.client'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { BackButton } from '@/components/back-button'
import { OrderPrivateActions } from '@/components/order-private-actions.client'
import { TypeBadge, StatusBadge, OutcomeBadge } from '@/components/badges'
import { ScheduleDeliveryForm } from '@/components/schedule-delivery-form.client'
import { ScheduleInstallationForm } from '@/components/schedule-installation-form.client'
import { getSession } from '@/lib/auth-session'
import { DeliverySlotsList, InstallationSlotsList } from '../../../components/slots-list.client'
import { OrderPipeline } from '@/components/order-pipeline.client'
import { OrderChecklist } from '@/components/order-checklist.client'
import { QuickChecklistBar } from '@/components/quick-checklist-bar.client'
import { OrderArchiveButton } from '@/components/order-archive-button.client'
import { OrderUnarchiveButton } from '@/components/order-unarchive-button.client'
import { OrderOutcomeRevertButton } from '@/components/order-outcome-revert-button.client'

export default async function OrderDetailsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const session = await getSession()
  const isAdmin = (session?.user?.role === 'admin')
  const isInstaller = (session?.user?.role === 'installer')
  const [row] = await db
    .select({
      id: orders.id,
      type: orders.type,
      status: orders.status,
      pipelineStage: orders.pipelineStage,
      outcome: orders.outcome,
      outcomeAt: orders.outcomeAt,
      archivedAt: orders.archivedAt,
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

  // Load existing slots for this order
  const deliveries = await db
    .select({ id: deliverySlots.id, plannedAt: deliverySlots.plannedAt, windowStart: deliverySlots.windowStart, windowEnd: deliverySlots.windowEnd, status: deliverySlots.status, carrier: deliverySlots.carrier, trackingNo: deliverySlots.trackingNo, note: deliverySlots.note })
    .from(deliverySlots)
    .where(eq(deliverySlots.orderId, row.id))
    .orderBy(desc(deliverySlots.plannedAt))

  const installations = await db
    .select({ id: installationSlots.id, plannedAt: installationSlots.plannedAt, windowStart: installationSlots.windowStart, windowEnd: installationSlots.windowEnd, status: installationSlots.status, installerId: installationSlots.installerId, durationMinutes: installationSlots.durationMinutes, note: installationSlots.note, installerName: users.name })
    .from(installationSlots)
    .leftJoin(users, eq(installationSlots.installerId, users.id))
    .where(eq(installationSlots.orderId, row.id))
    .orderBy(desc(installationSlots.plannedAt))

  const checklist = await db
    .select({ key: orderChecklistItems.key, done: orderChecklistItems.done })
    .from(orderChecklistItems)
    .where(eq(orderChecklistItems.orderId, row.id))

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
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-3">
            <TypeBadge type={row.type} />
            <StatusBadge status={row.status} label={statusLabel} />
            <OutcomeBadge outcome={row.outcome as 'won'|'lost'|null|undefined} />
          </div>
          {isAdmin ? (
            <>
              <div className="h-6 w-px bg-black/10 dark:bg-white/10" />
              <div className="flex items-center gap-2">
                {row.outcome ? <OrderOutcomeRevertButton id={row.id} /> : null}
                {/* Archiwum: jeśli zarchiwizowane → cofnięcie; w przeciwnym razie → archiwizuj */}
                {row.archivedAt ? (
                  <OrderUnarchiveButton id={row.id} />
                ) : (
                  <OrderArchiveButton id={row.id} />
                )}
              </div>
            </>
          ) : null}
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
          <Card className="scroll-mt-16">
            <CardHeader className="pb-2"><CardTitle>Szczegóły typu</CardTitle></CardHeader>
            <CardContent>
              {row.type === 'installation' ? (
                <div className="space-y-3">
                  <InstallationSlotsList orderId={row.id} slots={installations} />
                  <ScheduleInstallationForm orderId={row.id} />
                </div>
              ) : (
                <div className="space-y-3">
                  <DeliverySlotsList orderId={row.id} slots={deliveries} />
                  <ScheduleDeliveryForm orderId={row.id} />
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2"><CardTitle>Etap i checklist</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              {/* Mini-kafelki (pasek) dla szybkiego podglądu */}
              <QuickChecklistBar orderId={row.id} type={row.type as 'delivery'|'installation'} items={checklist.map(i => ({ ...i, label: i.key }))} />
              <OrderPipeline orderId={row.id} type={row.type as 'delivery'|'installation'} stage={row.pipelineStage ?? null} />
              <OrderChecklist orderId={row.id} type={row.type as 'delivery'|'installation'} items={checklist} />
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
