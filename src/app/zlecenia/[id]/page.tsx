import { db } from '@/db'
import { clients, orders, users, orderChecklistItems, clientNotes, deliverySlots } from '@/db/schema'
import { eq, desc, and, isNotNull } from 'drizzle-orm'
import Link from 'next/link'
import { pl } from '@/i18n/pl'
import { OrderEditor } from '@/components/order-editor.client'
// status UI usunięty – używamy pipeline stage + archiwum
import { OrderOutcomeButtons } from '@/components/order-outcome-buttons.client'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { BackButton } from '@/components/back-button'
import { OrderPrivateActions } from '@/components/order-private-actions.client'
import { TypeBadge, OutcomeBadge, PipelineStageBadge } from '@/components/badges'
// import { ScheduleDeliveryForm } from '@/components/schedule-delivery-form.client'
// import { ScheduleInstallationForm } from '@/components/schedule-installation-form.client'
import { getSession } from '@/lib/auth-session'
// Usunięto sekcję planowania (sloty) — plan przy tworzeniu zlecenia
import { OrderPipeline } from '@/components/order-pipeline.client'
import { OrderChecklist } from '@/components/order-checklist.client'
import { QuickChecklistBar } from '@/components/quick-checklist-bar.client'
import { OrderArchiveButton } from '@/components/order-archive-button.client'
import { OrderUnarchiveButton } from '@/components/order-unarchive-button.client'
import { OrderOutcomeRevertButton } from '@/components/order-outcome-revert-button.client'
import { formatDate } from '@/lib/date'
import { DeliveryItems } from '@/components/delivery-items.client'

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
  clientInvoicePostalCode: clients.invoicePostalCode,
      clientInvoiceAddress: clients.invoiceAddress,
      locationCity: orders.locationCity,
  locationPostalCode: orders.locationPostalCode,
      locationAddress: orders.locationAddress,
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

  // status (techniczy) nie pokazywany w UI – zamiast tego etap (pipelineStage)

  // Sloty montażu/dostawy nie są wyświetlane na szczegółach zlecenia (upraszczamy widok)

  // Pobierz najnowszy (planowany lub potwierdzony) slot dostawy do podglądu pozycji
  const latestDelivery = await db
    .select({ id: deliverySlots.id })
    .from(deliverySlots)
    .where(and(eq(deliverySlots.orderId, row.id), isNotNull(deliverySlots.plannedAt)))
    .orderBy(desc(deliverySlots.plannedAt))
    .limit(1)

  const checklist = await db
    .select({ key: orderChecklistItems.key, done: orderChecklistItems.done })
    .from(orderChecklistItems)
    .where(eq(orderChecklistItems.orderId, row.id))

  // Client notes (visible for installer in order view)
  const notes = await db
    .select()
    .from(clientNotes)
    .where(eq(clientNotes.clientId, row.clientId))
    .orderBy(desc(clientNotes.createdAt))

  return (
    <div className="mx-auto max-w-6xl p-6 space-y-6">
      {/* Hero */}
      <section className="relative overflow-hidden rounded-2xl border bg-[var(--pp-panel)]" style={{ borderColor: 'var(--pp-border)' }}>
        <div className="pointer-events-none absolute inset-0 opacity-80" aria-hidden
             style={{ background: 'radial-gradient(1200px 420px at -10% -20%, color-mix(in oklab, var(--pp-primary) 16%, transparent), transparent 40%), linear-gradient(120deg, color-mix(in oklab, var(--pp-primary) 10%, transparent), transparent 65%)' }} />
        <div className="relative z-10 p-4 md:p-6">
          <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <BackButton fallbackHref="/zlecenia" />
                <h1 className="truncate text-2xl md:text-3xl font-semibold">
                  Zlecenie #{row.orderNo ? `${row.orderNo}_${row.type === 'installation' ? 'm' : 'd'}` : row.id.slice(0,8)}
                </h1>
              </div>
              <div className="mt-2 flex flex-wrap items-center gap-2 text-sm">
                <TypeBadge type={row.type} />
                <PipelineStageBadge stage={row.pipelineStage} />
                <OutcomeBadge outcome={row.outcome as 'won'|'lost'|null|undefined} />
                <div className="h-4 w-px bg-black/10 dark:bg-white/10" />
                <span className="opacity-70">Klient:</span>
                <Link className="hover:underline focus:underline focus:outline-none" href={`/klienci/${row.clientId}`}>{row.clientName || row.clientId}</Link>
                <div className="h-4 w-px bg-black/10 dark:bg-white/10" />
                <span className="opacity-70">Utworzono:</span>
                <span>{formatDate(row.createdAt)}</span>
              </div>
            </div>
            <div className="flex flex-col items-stretch gap-2 md:items-end">
              {/* Pipeline (biznesowy etap) */}
              <div className="flex items-end gap-2">
                <OrderPipeline orderId={row.id} type={row.type as 'delivery'|'installation'} stage={row.pipelineStage ?? null} />
              </div>
              {/* Akcje biznesowe */}
              {isAdmin ? (
                <div className="flex flex-wrap items-center justify-end gap-2">
                  {!row.outcome ? <OrderOutcomeButtons id={row.id} outcome={row.outcome as 'won'|'lost'|null} /> : <OrderOutcomeRevertButton id={row.id} />}
                  {row.archivedAt ? (
                    <OrderUnarchiveButton id={row.id} />
                  ) : (
                    <OrderArchiveButton id={row.id} />
                  )}
                </div>
              ) : null}
            </div>
          </div>
        </div>
      </section>

      {/* Main grid */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {/* Left column */}
        <div className="space-y-4">
          <Card id="order-info" className="scroll-mt-16">
            <CardHeader className="pb-2"><CardTitle>Podstawowe informacje</CardTitle></CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div><span className="opacity-60">Klient:</span> {row.clientName || row.clientId}</div>
              <div><span className="opacity-60">m2 przed pomiarem:</span> {row.preMeasurementSqm ?? '-'}</div>
              <div><span className="opacity-60">Planowana data:</span> {row.scheduledDate ? formatDate(row.scheduledDate) : '-'}</div>
              <div><span className="opacity-60">Montażysta:</span> {row.installerName || row.installerEmail || '-'}</div>
              <div><span className="opacity-60">Utworzono:</span> {formatDate(row.createdAt)}</div>
              {row.outcome && (
                <div><span className="opacity-60">Wynik:</span> {row.outcome === 'won' ? 'Wygrane' : 'Przegrane'} {row.outcomeAt ? `(${formatDate(row.outcomeAt)})` : ''}</div>
              )}
              {/* Edycja zlecenia (połączona z informacjami) */}
              <div className="pt-2 border-t" style={{ borderColor: 'var(--pp-border)' }}>
                <OrderEditor orderId={row.id} defaults={{ note: null, preMeasurementSqm: row.preMeasurementSqm, installerId: row.installerId ?? null, scheduledDate: row.scheduledDate ? (row.scheduledDate as unknown as Date).getTime?.() ?? Number(row.scheduledDate) : null }} />
              </div>
            </CardContent>
          </Card>

          {/* Wynik przeniesiony do Hero (przyciski/odwracanie) */}

            {/* Sekcja zmiany statusu usunięta – preferujemy archiwizację/przywracanie oraz etap (pipeline) */}
        </div>

        {/* Right column */}
        <div className="space-y-4">
          {/* Karta planu usunięta */}

          <Card>
            <CardHeader className="pb-2"><CardTitle>Etap i checklist</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              {/* Mini-kafelki (pasek) dla szybkiego podglądu */}
              <QuickChecklistBar orderId={row.id} type={row.type as 'delivery'|'installation'} items={checklist.map(i => ({ ...i, label: i.key }))} />
              <OrderChecklist orderId={row.id} type={row.type as 'delivery'|'installation'} items={checklist} />
            </CardContent>
          </Card>

          {latestDelivery?.[0]?.id ? (
            <Card>
              <CardHeader className="pb-2"><CardTitle>Pozycje dostawy</CardTitle></CardHeader>
              <CardContent>
                <DeliveryItems orderId={row.id} slotId={latestDelivery[0].id} />
              </CardContent>
            </Card>
          ) : null}

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
              <div><span className="opacity-60">Faktura:</span> {row.clientInvoiceCity ? `${row.clientInvoiceCity}${row.clientInvoicePostalCode ? ` ${row.clientInvoicePostalCode}` : ''}, ${row.clientInvoiceAddress || ''}` : '—'}</div>
              <div><span className="opacity-60">Miejsce realizacji:</span> {row.locationCity ? `${row.locationCity}${row.locationPostalCode ? ` ${row.locationPostalCode}` : ''}, ${row.locationAddress || ''}` : '—'}</div>
              <div>
                <Link href={`/klienci/${row.clientId}`} className="text-xs hover:underline focus:underline focus:outline-none">Wejdź do klienta</Link>
              </div>
            </CardContent>
          </Card>

          {/* Notatki klienta – widoczne również dla montażysty */}
          <Card>
            <CardHeader className="pb-2"><CardTitle>{pl.clients.notesTitle}</CardTitle></CardHeader>
            <CardContent>
              {notes.length === 0 ? (
                <div className="text-sm opacity-70">{pl.clients.noNotes}</div>
              ) : (
                <div className="space-y-2">
                  {notes.map(n => (
                    <div key={n.id} className="rounded border border-black/10 p-2 dark:border-white/10">
                      <div className="text-sm whitespace-pre-wrap">{n.content}</div>
                      <div className="text-xs opacity-60 mt-1">{formatDate(n.createdAt)} {n.createdBy ? `• ${n.createdBy}` : ''}</div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
