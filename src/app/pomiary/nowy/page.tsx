import { Metadata } from 'next'

import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { requireSession } from '@/lib/auth'
import { listOrdersForSelect } from '@/lib/orders'
import { listProductsForSelect } from '@/lib/products'
import { getMeasurementsSnapshot } from '@/lib/measurements'
import { listUsersForSelect } from '@/lib/users'
import { Activity, CalendarClock, CheckCircle2, ClipboardList } from 'lucide-react'

import { MeasurementForm } from '../_components/measurement-form'
import { createMeasurementAction } from '../actions'

export const metadata: Metadata = {
  title: 'Nowy pomiar',
  description: 'Dodaj pomiar dla zlecenia montażowego, zsynchronizuj logistykę i plan montażu.',
}

type NewMeasurementPageProps = {
  searchParams?: Promise<{
    orderId?: string
  }>
}

export default async function NewMeasurementPage({ searchParams }: NewMeasurementPageProps) {
  await requireSession()
  
  const resolvedSearchParams = searchParams ? await searchParams : undefined
  const defaultOrderId = resolvedSearchParams?.orderId ?? undefined

  const [snapshot, orders, users, panelProducts] = await Promise.all([
    getMeasurementsSnapshot(),
    listOrdersForSelect({ stages: ['BEFORE_MEASUREMENT', 'BEFORE_QUOTE', 'BEFORE_DELIVERY', 'BEFORE_INSTALLATION', 'AWAITING_FINAL_PAYMENT', 'RECEIVED'] }),
    listUsersForSelect(),
    listProductsForSelect({ types: ['PANEL'] }),
  ])

  const formOrders = orders.map((order) => ({
    id: order.id,
    label: order.label,
    assignedInstallerId: order.assignedInstallerId ?? null,
  }))
  const formUsers = users.map((user) => ({ id: user.id, label: user.label }))
  const formProducts = panelProducts.map((product) => ({ id: product.id, label: product.label }))

  const { metrics } = snapshot

  return (
    <div className="flex flex-col gap-6 lg:gap-8">
      <section className="rounded-3xl border border-border/60 bg-gradient-to-br from-background via-background to-amber-200/20 p-6 shadow-sm lg:p-8">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
          <div className="space-y-3">
            <Badge variant="outline" className="rounded-full border-amber-500/50 text-amber-600">
              Nowy pomiar
            </Badge>
            <div className="space-y-2">
              <h1 className="text-3xl font-semibold tracking-tight text-foreground lg:text-4xl">
                Dodaj wizję lokalną i plan dostawy
              </h1>
              <p className="max-w-2xl text-sm text-muted-foreground lg:text-base">
                Przypisz pomiar do zlecenia, uzupełnij kluczowe parametry i zsynchronizuj logistykę dostaw z montażem. Dzięki temu zespół będzie miał pełny obraz sytuacji przed montażem.
              </p>
            </div>
          </div>
          <div className="grid w-full grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4 lg:w-auto">
            <Card className="rounded-2xl border-none bg-background/70 shadow-lg shadow-amber-500/10">
              <CardContent className="flex flex-col gap-1 p-4">
                <span className="text-xs uppercase text-muted-foreground">Pomiary łącznie</span>
                <span className="flex items-center gap-2 text-2xl font-semibold text-foreground">
                  <ClipboardList className="size-5 text-amber-600" aria-hidden />
                  {metrics.total}
                </span>
              </CardContent>
            </Card>
            <Card className="rounded-2xl border-none bg-amber-500/10 shadow-lg shadow-amber-500/20">
              <CardContent className="flex flex-col gap-1 p-4">
                <span className="text-xs uppercase text-amber-600">Zaplanowane</span>
                <span className="flex items-center gap-2 text-2xl font-semibold text-amber-600">
                  <CalendarClock className="size-5" aria-hidden />
                  {metrics.planned}
                </span>
              </CardContent>
            </Card>
            <Card className="rounded-2xl border-none bg-muted/60 shadow-lg shadow-muted/20">
              <CardContent className="flex flex-col gap-1 p-4">
                <span className="text-xs uppercase text-muted-foreground">Zrealizowane</span>
                <span className="flex items-center gap-2 text-2xl font-semibold text-foreground">
                  <CheckCircle2 className="size-5 text-emerald-600" aria-hidden />
                  {metrics.completed}
                </span>
              </CardContent>
            </Card>
            <Card className="rounded-2xl border-none bg-rose-500/10 shadow-lg shadow-rose-500/20">
              <CardContent className="flex flex-col gap-1 p-4">
                <span className="text-xs uppercase text-rose-600">Wymagające planu</span>
                <span className="flex items-center gap-2 text-2xl font-semibold text-rose-600">
                  <Activity className="size-5" aria-hidden />
                  {metrics.awaitingDeliveryPlan}
                </span>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      <MeasurementForm
        mode="create"
        orders={formOrders}
        users={formUsers}
        panelProducts={formProducts}
        actionFunction={createMeasurementAction}
        defaultOrderId={defaultOrderId}
      />
    </div>
  )
}
