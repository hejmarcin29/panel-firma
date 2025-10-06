import { AlertTriangle, CalendarDays, ClipboardList, HardHat, Package, Ruler, Truck, UserPlus2 } from 'lucide-react'

import Link from 'next/link'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from '@/components/ui/empty'
import { getDeliveriesSnapshot } from '@/lib/deliveries'
import { getInstallationsSnapshot } from '@/lib/installations'
import { getOrdersDashboardData } from '@/lib/orders'

import { ordersColumns } from './columns'
import { orderStageLabels } from '@/lib/order-stage'
import { OrdersTable } from './orders-table'
import { StageDistributionSwitcher, type StageDistributionGroup } from './_components/stage-distribution-switcher'

export const metadata = {
  title: 'Zlecenia',
  description: 'Zarządzaj pipeline’em zleceń montażowych i monitoruj statusy.',
}

export default async function OrdersPage() {
  const [{ metrics, stageDistribution, orders }, installationsSnapshot, deliveriesSnapshot] = await Promise.all([
    getOrdersDashboardData(50),
    getInstallationsSnapshot(5),
    getDeliveriesSnapshot(5),
  ])
  const totalOrders = metrics.totalOrders || 0

  const ordersDistribution = stageDistribution.map((bucket) => ({
    id: bucket.stage,
    label: orderStageLabels[bucket.stage],
    count: bucket.count,
  }))

  const ordersDistributionWithPercentages = ordersDistribution.map((bucket) => ({
    ...bucket,
    percentage: totalOrders > 0 ? Math.round((bucket.count / totalOrders) * 100) : 0,
  }))

  const highlightStage =
    totalOrders > 0 && ordersDistributionWithPercentages.length
      ? ordersDistributionWithPercentages.reduce((prev, current) =>
          current.percentage > prev.percentage ? current : prev
        )
      : null

  const stageDistributionGroups: StageDistributionGroup[] = [
    {
      id: 'installations',
      label: 'Montaże',
      description: 'Postęp realizacji montaży w harmonogramie.',
      items: installationsSnapshot.distribution.map((bucket) => ({
        id: bucket.stage,
        label: bucket.label,
        count: bucket.count,
      })),
      total: installationsSnapshot.metrics.total,
      emptyMessage: 'Dodaj montaż, aby zobaczyć rozkład statusów i zaplanować ekipę.',
    },
    {
      id: 'deliveries',
      label: 'Dostawy',
      description: 'Statusy logistyczne i fakturowe ostatnich dostaw.',
      items: deliveriesSnapshot.distribution.map((bucket) => ({
        id: bucket.stage,
        label: bucket.label,
        count: bucket.count,
      })),
      total: deliveriesSnapshot.metrics.total,
      emptyMessage: 'Dodaj dostawę, żeby śledzić etapy logistyki i dokumenty.',
    },
  ]

  const installationMetricCards = [
    { label: 'Łącznie montaży', value: installationsSnapshot.metrics.total },
    { label: 'Zaplanowane', value: installationsSnapshot.metrics.scheduled },
    { label: 'W realizacji', value: installationsSnapshot.metrics.inProgress },
    { label: 'Zakończone', value: installationsSnapshot.metrics.completed },
    { label: 'Wymaga interwencji', value: installationsSnapshot.metrics.requiringAttention },
  ]

  const deliveryMetricCards = [
    { label: 'Łącznie dostaw', value: deliveriesSnapshot.metrics.total },
    { label: 'Oczekuje na płatność', value: deliveriesSnapshot.metrics.awaitingPayment },
    { label: 'Transport zamówiony', value: deliveriesSnapshot.metrics.shippingOrdered },
    { label: 'Zamknięte', value: deliveriesSnapshot.metrics.completed },
    { label: 'Wymaga interwencji', value: deliveriesSnapshot.metrics.requiringAttention },
  ]

  const formatDate = (value: Date | null) =>
    value ? new Intl.DateTimeFormat('pl-PL', { dateStyle: 'medium' }).format(value) : null

  return (
    <div className="flex flex-col gap-6 lg:gap-8">
      <section className="flex flex-col gap-6 rounded-3xl border border-border/60 bg-gradient-to-br from-background via-background to-primary/10 p-6 shadow-sm lg:flex-row lg:items-center lg:justify-between lg:p-8">
        <div className="space-y-3">
          <Badge variant="outline" className="rounded-full border-primary/50 text-primary">
            Zlecenia
          </Badge>
          <div className="space-y-2">
            <h1 className="text-3xl font-semibold tracking-tight text-foreground lg:text-4xl">
              Pipeline operacyjny pod kontrolą
            </h1>
            <p className="max-w-2xl text-sm text-muted-foreground lg:text-base">
              Monitoruj statusy, priorytety i obciążenie zespołów. Ta sekcja łączy dane ze sprzedaży, pomiarów,
              montaży i dostaw, abyś mógł szybko reagować na wąskie gardła w całej firmie.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <Button asChild className="rounded-full bg-primary px-5 py-2 text-sm font-semibold text-primary-foreground shadow-lg shadow-primary/20 hover:bg-primary/90">
              <Link href="/montaze/nowy">Zaplanuj montaż</Link>
            </Button>
            <Button variant="outline" asChild className="rounded-full border-primary/50 px-5 py-2 text-sm font-semibold text-primary shadow-sm">
              <Link href="/dostawy/nowa">Zaplanuj dostawę</Link>
            </Button>
            <Button variant="ghost" asChild className="inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold text-muted-foreground hover:text-primary">
              <Link href="/klienci">
                <UserPlus2 className="size-4" aria-hidden />
                Dodaj klienta
              </Link>
            </Button>
          </div>
          {highlightStage ? (
            <div className="inline-flex items-center gap-2 rounded-full border border-primary/40 bg-primary/10 px-4 py-2 text-xs font-medium text-primary">
              Najwięcej zleceń znajduje się w etapie:{' '}
              <span className="font-semibold">{highlightStage.label}</span>
              <span className="opacity-70">({highlightStage.percentage}%)</span>
            </div>
          ) : null}
        </div>
        <div className="grid w-full grid-cols-2 gap-3 lg:w-auto lg:grid-cols-1">
          <Card className="rounded-2xl border-none bg-background/80 shadow-lg shadow-primary/10">
            <CardContent className="flex flex-col gap-1 p-4">
              <span className="text-xs uppercase text-muted-foreground">Otwarte zlecenia</span>
              <span className="text-2xl font-semibold text-foreground">{metrics.totalOrders}</span>
            </CardContent>
          </Card>
          <Card className="rounded-2xl border-none bg-amber-500/10 shadow-lg shadow-amber-500/20">
            <CardContent className="flex flex-col gap-1 p-4">
              <span className="text-xs uppercase text-amber-900/80 dark:text-amber-100/80">Wymaga uwagi</span>
              <span className="text-2xl font-semibold text-amber-900 dark:text-amber-100">
                {metrics.requiringAttention}
              </span>
            </CardContent>
          </Card>
        </div>
      </section>

      <section className="grid gap-4 lg:grid-cols-4">
        <Card className="rounded-3xl border border-border/60">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Nowe w tym tygodniu</CardTitle>
            <ClipboardList className="size-4 text-muted-foreground" aria-hidden />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-semibold text-foreground">{metrics.newThisWeek}</div>
            <p className="text-xs text-muted-foreground">Zlecenia utworzone w ostatnich 7 dniach.</p>
          </CardContent>
        </Card>

        <Card className="rounded-3xl border border-border/60">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Zaplanowane montaże</CardTitle>
            <CalendarDays className="size-4 text-muted-foreground" aria-hidden />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-semibold text-foreground">{metrics.scheduledInstallations}</div>
            <p className="text-xs text-muted-foreground">Status „Zaplanowano” z nadchodzącą datą.</p>
          </CardContent>
        </Card>

        <Card className="rounded-3xl border border-border/60">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Sumaryczna powierzchnia</CardTitle>
            <Ruler className="size-4 text-muted-foreground" aria-hidden />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-semibold text-foreground">
              {new Intl.NumberFormat('pl-PL', { maximumFractionDigits: 1 }).format(
                metrics.totalDeclaredFloorArea
              )}{' '}
              <span className="text-base font-normal text-muted-foreground">m²</span>
            </div>
            <p className="text-xs text-muted-foreground">Według zadeklarowanych danych wejściowych.</p>
          </CardContent>
        </Card>

        <Card className="rounded-3xl border border-border/60">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Alerty</CardTitle>
            <AlertTriangle className="size-4 text-muted-foreground" aria-hidden />
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="text-2xl font-semibold text-red-500 dark:text-red-300">
              {metrics.requiringAttention}
            </div>
            <p className="text-xs text-muted-foreground">
              Zlecenia oznaczone flagą „requires_admin_attention”. Rozważ przypisanie właściciela.
            </p>
          </CardContent>
        </Card>
      </section>
      <StageDistributionSwitcher groups={stageDistributionGroups} />

      <Card className="rounded-3xl border border-border/60">
        <CardContent className="p-6">
          <OrdersTable columns={ordersColumns} data={orders} />
        </CardContent>
      </Card>

      <section className="grid gap-6 lg:grid-cols-2">
        <Card className="rounded-3xl border border-border/60">
          <CardHeader className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="space-y-1">
              <CardTitle className="flex items-center gap-2 text-lg font-semibold text-foreground">
                <HardHat className="size-5 text-primary" aria-hidden />
                Przegląd montaży
              </CardTitle>
              <CardDescription>Zobacz status ostatnich montaży i zaplanuj kolejne działania.</CardDescription>
            </div>
            <Button asChild className="rounded-full bg-primary px-4 text-sm font-semibold text-primary-foreground shadow-primary/20">
              <Link href="/montaze/nowy">Dodaj montaż</Link>
            </Button>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              {installationMetricCards.map((metric) => (
                <div key={metric.label} className="rounded-2xl border border-border/60 bg-muted/40 p-4">
                  <p className="text-xs uppercase text-muted-foreground">{metric.label}</p>
                  <p className="text-2xl font-semibold text-foreground">{metric.value}</p>
                </div>
              ))}
            </div>

            <div className="space-y-4">
              {installationsSnapshot.recent.length ? (
                installationsSnapshot.recent.map((installation) => {
                  const installationHref = installation.orderId
                    ? `/zlecenia/${installation.orderId}`
                    : '/montaze'

                  return (
                    <Link
                      key={installation.id}
                      href={installationHref}
                      className="group flex flex-col gap-2 rounded-2xl border border-border/60 bg-background/60 p-4 shadow-sm transition hover:border-primary/50 hover:bg-primary/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
                      aria-label={`Przejdź do szczegółów montażu ${installation.installationNumber}`}
                    >
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div>
                          <p className="text-sm font-semibold text-foreground transition-colors group-hover:text-primary">
                            #{installation.installationNumber}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {installation.clientName ?? 'Klient nieznany'}
                            {installation.city ? ` · ${installation.city}` : ''}
                          </p>
                        </div>
                        <Badge variant="outline" className="rounded-full border-primary/40 text-xs font-medium text-primary">
                          {installation.statusLabel}
                        </Badge>
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {formatDate(installation.scheduledStartAt) ? (
                          <span>Planowany start: {formatDate(installation.scheduledStartAt)}</span>
                        ) : (
                          <span>Brak zaplanowanej daty</span>
                        )}
                      </div>
                    </Link>
                  )
                })
              ) : (
                <Empty className="border border-dashed border-border/60">
                  <EmptyMedia variant="icon">
                    <HardHat className="size-6 text-muted-foreground" aria-hidden />
                  </EmptyMedia>
                  <EmptyHeader>
                    <EmptyTitle>Brak montaży do wyświetlenia</EmptyTitle>
                    <EmptyDescription>Dodaj pierwszy montaż, aby śledzić harmonogram w tej sekcji.</EmptyDescription>
                  </EmptyHeader>
                  <Button asChild className="rounded-full bg-primary px-4 text-sm font-semibold text-primary-foreground">
                    <Link href="/montaze/nowy">Zaplanuj montaż</Link>
                  </Button>
                </Empty>
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-3xl border border-border/60">
          <CardHeader className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="space-y-1">
              <CardTitle className="flex items-center gap-2 text-lg font-semibold text-foreground">
                <Truck className="size-5 text-primary" aria-hidden />
                Przegląd dostaw
              </CardTitle>
              <CardDescription>Kontroluj logistykę materiałów i dokumenty wysyłkowe.</CardDescription>
            </div>
            <Button asChild className="rounded-full bg-primary px-4 text-sm font-semibold text-primary-foreground shadow-primary/20">
              <Link href="/dostawy/nowa">Dodaj dostawę</Link>
            </Button>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              {deliveryMetricCards.map((metric) => (
                <div key={metric.label} className="rounded-2xl border border-border/60 bg-muted/40 p-4">
                  <p className="text-xs uppercase text-muted-foreground">{metric.label}</p>
                  <p className="text-2xl font-semibold text-foreground">{metric.value}</p>
                </div>
              ))}
            </div>

            <div className="space-y-4">
              {deliveriesSnapshot.recent.length ? (
                deliveriesSnapshot.recent.map((delivery) => {
                  const deliveryHref = delivery.orderId
                    ? `/zlecenia/${delivery.orderId}`
                    : `/dostawy`

                  return (
                    <Link
                      key={delivery.id}
                      href={deliveryHref}
                      className="group flex flex-col gap-2 rounded-2xl border border-border/60 bg-background/60 p-4 shadow-sm transition hover:border-primary/50 hover:bg-primary/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
                      aria-label={`Przejdź do szczegółów dostawy ${delivery.deliveryNumber}`}
                    >
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div>
                          <p className="text-sm font-semibold text-foreground transition-colors group-hover:text-primary">
                            #{delivery.deliveryNumber}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {delivery.clientName ?? 'Klient nieznany'} · {delivery.typeLabel}
                          </p>
                        </div>
                        <Badge variant="outline" className="rounded-full border-primary/40 text-xs font-medium text-primary">
                          {delivery.stageLabel}
                        </Badge>
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {formatDate(delivery.scheduledDate) ? (
                          <span>Planowana data: {formatDate(delivery.scheduledDate)}</span>
                        ) : (
                          <span>Brak zaplanowanej daty</span>
                        )}
                      </div>
                    </Link>
                  )
                })
              ) : (
                <Empty className="border border-dashed border-border/60">
                  <EmptyMedia variant="icon">
                    <Package className="size-6 text-muted-foreground" aria-hidden />
                  </EmptyMedia>
                  <EmptyHeader>
                    <EmptyTitle>Brak dostaw do wyświetlenia</EmptyTitle>
                    <EmptyDescription>Dodaj dostawę, by kontrolować harmonogram wysyłek.</EmptyDescription>
                  </EmptyHeader>
                  <Button asChild className="rounded-full bg-primary px-4 text-sm font-semibold text-primary-foreground">
                    <Link href="/dostawy/nowa">Utwórz dostawę</Link>
                  </Button>
                </Empty>
              )}
            </div>
          </CardContent>
        </Card>
      </section>
    </div>
  )
}
