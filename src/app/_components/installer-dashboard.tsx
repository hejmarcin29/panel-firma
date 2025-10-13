import Link from 'next/link'
import { format } from 'date-fns'
import { pl } from 'date-fns/locale'
import {
  CalendarClock,
  CheckCircle2,
  HardHat,
  Package,
  Plus,
  Ruler,
  Truck,
} from 'lucide-react'

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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from '@/components/ui/empty'

import type { getInstallationsSnapshot } from '@/lib/installations'
import type { getMeasurementsSnapshot } from '@/lib/measurements'
import type { getInstallationDeliveriesSnapshot } from '@/lib/installation-deliveries'
import { installationStatusLabels } from '@/lib/installations/constants'

type InstallerDashboardProps = {
  userName: string
  installations: Awaited<ReturnType<typeof getInstallationsSnapshot>>
  measurements: Awaited<ReturnType<typeof getMeasurementsSnapshot>>
  deliveries: Awaited<ReturnType<typeof getInstallationDeliveriesSnapshot>>
}

export function InstallerDashboard({
  userName,
  installations,
  measurements,
  deliveries,
}: InstallerDashboardProps) {
  const activeInstallations = installations.recent.filter(
    (i) => i.status === 'PLANNED' || i.status === 'SCHEDULED' || i.status === 'IN_PROGRESS'
  )
  const completedThisMonth = installations.recent.filter((i) => {
    if (i.status !== 'COMPLETED' || !i.scheduledStartAt) return false
    const now = new Date()
    const completedDate = new Date(i.scheduledStartAt)
    return (
      completedDate.getMonth() === now.getMonth() &&
      completedDate.getFullYear() === now.getFullYear()
    )
  }).length

  const pendingMeasurements = measurements.recent.filter((m) => !m.measuredAt)

  const upcomingDeliveries = deliveries.recent.filter((d) => {
    if (!d.scheduledDate) return false
    const deliveryDate = new Date(d.scheduledDate)
    const now = new Date()
    const weekFromNow = new Date()
    weekFromNow.setDate(weekFromNow.getDate() + 7)
    return deliveryDate >= now && deliveryDate <= weekFromNow
  })

  const nextInstallation = activeInstallations
    .filter((i) => i.scheduledStartAt)
    .sort((a, b) => {
      const dateA = a.scheduledStartAt ? new Date(a.scheduledStartAt).getTime() : Infinity
      const dateB = b.scheduledStartAt ? new Date(b.scheduledStartAt).getTime() : Infinity
      return dateA - dateB
    })[0]

  return (
    <div className="flex flex-col gap-6 lg:gap-8">
      {/* Hero sekcja */}
      <section className="flex flex-col gap-6 rounded-3xl border border-border/60 bg-gradient-to-br from-emerald-50/50 via-background to-emerald-100/30 p-6 shadow-sm dark:from-emerald-950/20 dark:to-emerald-900/10 lg:p-8">
        <div className="space-y-3">
          <Badge variant="outline" className="rounded-full border-emerald-500/50 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300">
            <HardHat className="mr-1.5 size-3.5" />
            Panel Montera
          </Badge>
          <div className="space-y-2">
            <h1 className="text-3xl font-semibold tracking-tight text-foreground lg:text-4xl">
              Witaj, {userName}! 👋
            </h1>
            <p className="max-w-2xl text-sm text-muted-foreground lg:text-base">
              Przegląd Twoich aktywnych montaży, pomiarów i dostaw. Wszystko w jednym miejscu.
            </p>
          </div>

          {nextInstallation && (
            <div className="inline-flex items-start gap-3 rounded-2xl border border-emerald-500/30 bg-emerald-500/5 p-4">
              <CalendarClock className="mt-0.5 size-5 text-emerald-600 dark:text-emerald-400" />
              <div className="flex flex-col gap-1">
                <span className="text-sm font-semibold text-foreground">Najbliższy montaż</span>
                <span className="text-xs text-muted-foreground">
                  {nextInstallation.orderReference && `${nextInstallation.orderReference} • `}
                  {nextInstallation.scheduledStartAt &&
                    format(new Date(nextInstallation.scheduledStartAt), 'd MMMM yyyy', { locale: pl })}
                </span>
              </div>
            </div>
          )}

          <div className="flex flex-wrap items-center gap-3">
            <Button asChild className="rounded-full bg-emerald-600 px-5 py-2 text-sm font-semibold text-white shadow-lg shadow-emerald-500/20 hover:bg-emerald-700">
              <Link href="/pomiary/nowy">
                <Plus className="mr-2 size-4" />
                Dodaj pomiar
              </Link>
            </Button>
            <Button variant="outline" asChild className="rounded-full border-emerald-500/50 px-5 py-2 text-sm font-semibold text-emerald-700 dark:text-emerald-300">
              <Link href="/montaze">
                <HardHat className="mr-2 size-4" />
                Zobacz wszystkie montaże
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* KPI Cards */}
      <section className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="rounded-3xl border border-border/60">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Aktywne montaże</CardTitle>
            <HardHat className="size-4 text-emerald-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-semibold text-foreground">{activeInstallations.length}</div>
            <p className="text-xs text-muted-foreground">Zaplanowane, w toku</p>
          </CardContent>
        </Card>

        <Card className="rounded-3xl border border-border/60">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Przypisane pomiary</CardTitle>
            <Ruler className="size-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-semibold text-foreground">{pendingMeasurements.length}</div>
            <p className="text-xs text-muted-foreground">Nieukończone</p>
          </CardContent>
        </Card>

        <Card className="rounded-3xl border border-border/60">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Dostawy w tym tygodniu</CardTitle>
            <Truck className="size-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-semibold text-foreground">{upcomingDeliveries.length}</div>
            <p className="text-xs text-muted-foreground">Nadchodzące</p>
          </CardContent>
        </Card>

        <Card className="rounded-3xl border border-emerald-500/30 bg-emerald-500/5">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-emerald-900 dark:text-emerald-100">
              Zrealizowane w tym miesiącu
            </CardTitle>
            <CheckCircle2 className="size-4 text-emerald-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-semibold text-emerald-900 dark:text-emerald-100">
              {completedThisMonth}
            </div>
            <p className="text-xs text-emerald-700 dark:text-emerald-300">Świetna robota!</p>
          </CardContent>
        </Card>
      </section>

      {/* Aktywne montaże */}
      <section>
        <Card className="rounded-3xl border border-border/60">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-lg font-semibold">Twoje aktywne montaże</CardTitle>
                <CardDescription>Najbliższe i trwające zlecenia montażowe</CardDescription>
              </div>
              <Button asChild variant="ghost" size="sm" className="rounded-full">
                <Link href="/montaze">Zobacz wszystkie</Link>
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {activeInstallations.length === 0 ? (
              <Empty>
                <EmptyMedia>
                  <HardHat className="size-12 text-muted-foreground/50" />
                </EmptyMedia>
                <EmptyHeader>
                  <EmptyTitle>Brak aktywnych montaży</EmptyTitle>
                  <EmptyDescription>Nie masz obecnie zaplanowanych montaży.</EmptyDescription>
                </EmptyHeader>
              </Empty>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Zlecenie</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Data rozpoczęcia</TableHead>
                    <TableHead>Data zakończenia</TableHead>
                    <TableHead className="text-right">Akcje</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {activeInstallations.slice(0, 5).map((installation) => (
                    <TableRow key={installation.id}>
                      <TableCell>
                        <div className="flex flex-col gap-1">
                          <span className="font-medium">
                            {installation.orderReference || installation.orderId.slice(0, 8)}
                          </span>
                          {installation.clientName && (
                            <span className="text-xs text-muted-foreground">{installation.clientName}</span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant="secondary"
                          className="bg-muted text-foreground"
                        >
                          {installationStatusLabels[installation.status]}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {installation.scheduledStartAt
                          ? format(new Date(installation.scheduledStartAt), 'd MMM yyyy', { locale: pl })
                          : '-'}
                      </TableCell>
                      <TableCell>
                        -
                      </TableCell>
                      <TableCell className="text-right">
                        <Button asChild variant="ghost" size="sm" className="rounded-full">
                          <Link href={`/zlecenia/${installation.orderId}`}>Szczegóły</Link>
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </section>

      {/* Oczekujące pomiary i nadchodzące dostawy w dwóch kolumnach */}
      <section className="grid gap-6 lg:grid-cols-2">
        {/* Pomiary */}
        <Card className="rounded-3xl border border-border/60">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-lg font-semibold">Przypisane pomiary</CardTitle>
                <CardDescription>Twoje pomiary do wykonania</CardDescription>
              </div>
              <Button asChild variant="ghost" size="sm" className="rounded-full">
                <Link href="/pomiary">Zobacz wszystkie</Link>
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {pendingMeasurements.length === 0 ? (
              <Empty>
                <EmptyMedia>
                  <Ruler className="size-10 text-muted-foreground/50" />
                </EmptyMedia>
                <EmptyHeader>
                  <EmptyTitle>Brak przypisanych pomiarów</EmptyTitle>
                  <EmptyDescription>Wszystkie pomiary wykonane ✓</EmptyDescription>
                </EmptyHeader>
              </Empty>
            ) : (
              <div className="space-y-3">
                {pendingMeasurements.slice(0, 5).map((measurement) => (
                  <div
                    key={measurement.id}
                    className="flex items-center justify-between rounded-xl border border-border/60 p-3 transition hover:bg-accent/50"
                  >
                    <div className="flex flex-col gap-1">
                      <span className="text-sm font-medium">
                        {measurement.orderReference || measurement.orderId.slice(0, 8)}
                      </span>
                      {measurement.scheduledAt && (
                        <span className="text-xs text-muted-foreground">
                          Zaplanowano: {format(new Date(measurement.scheduledAt), 'd MMM yyyy', { locale: pl })}
                        </span>
                      )}
                    </div>
                    <Button asChild variant="ghost" size="sm" className="rounded-full">
                      <Link href={`/zlecenia/${measurement.orderId}`}>Szczegóły</Link>
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Dostawy */}
        <Card className="rounded-3xl border border-border/60">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-lg font-semibold">Dostawy w tym tygodniu</CardTitle>
                <CardDescription>Nadchodzące materiały</CardDescription>
              </div>
              <Button asChild variant="ghost" size="sm" className="rounded-full">
                <Link href="/dostawy-pod-montaz">Zobacz wszystkie</Link>
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {upcomingDeliveries.length === 0 ? (
              <Empty>
                <EmptyMedia>
                  <Package className="size-10 text-muted-foreground/50" />
                </EmptyMedia>
                <EmptyHeader>
                  <EmptyTitle>Brak dostaw w tym tygodniu</EmptyTitle>
                  <EmptyDescription>Żadne materiały nie są spodziewane</EmptyDescription>
                </EmptyHeader>
              </Empty>
            ) : (
              <div className="space-y-3">
                {upcomingDeliveries.slice(0, 5).map((delivery) => (
                  <div
                    key={delivery.id}
                    className="flex items-center justify-between rounded-xl border border-border/60 p-3 transition hover:bg-accent/50"
                  >
                    <div className="flex flex-col gap-1">
                      <span className="text-sm font-medium">
                        {delivery.installationNumber || delivery.installationId?.slice(0, 8) || 'Brak numeru'}
                      </span>
                      {delivery.scheduledDate && (
                        <span className="text-xs text-muted-foreground">
                          Oczekiwana: {format(new Date(delivery.scheduledDate), 'd MMM yyyy', { locale: pl })}
                        </span>
                      )}
                    </div>
                    <Button asChild variant="ghost" size="sm" className="rounded-full">
                      <Link href={`/dostawy-pod-montaz`}>Szczegóły</Link>
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </section>
    </div>
  )
}
