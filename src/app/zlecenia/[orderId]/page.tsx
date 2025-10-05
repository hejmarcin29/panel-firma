import { notFound } from 'next/navigation'
import { format, formatDistanceToNow } from 'date-fns'
import { pl } from 'date-fns/locale'
import {
  AlertTriangle,
  CheckCircle2,
  Circle,
  ClipboardList,
  Clock,
  FileText,
  HardHat,
  ListChecks,
  Package,
  Paperclip,
  Ruler,
  ShieldAlert,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'

import { Badge } from '@/components/ui/badge'
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb'
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
import { Progress } from '@/components/ui/progress'
import { Separator } from '@/components/ui/separator'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { getOrderDetail } from '@/lib/orders'
import {
  getOrderStageIndex,
  orderStageBadgeClasses,
  orderStageDescriptions,
  orderStageLabels,
  orderStageSequence,
} from '@/lib/order-stage'

const numberFormatter = new Intl.NumberFormat('pl-PL', {
  maximumFractionDigits: 1,
})

const measurementTimingLabels: Record<'DAYS_BEFORE' | 'EXACT_DATE', string> = {
  DAYS_BEFORE: 'Liczba dni przed montażem',
  EXACT_DATE: 'Konkretny termin dostawy',
}

const taskStatusLabels: Record<'OPEN' | 'IN_PROGRESS' | 'BLOCKED' | 'DONE', string> = {
  OPEN: 'Otwarte',
  IN_PROGRESS: 'W toku',
  BLOCKED: 'Zablokowane',
  DONE: 'Zakończone',
}

const taskStatusBadgeClasses: Partial<Record<'OPEN' | 'IN_PROGRESS' | 'BLOCKED' | 'DONE', string>> = {
  OPEN: 'bg-muted text-foreground',
  IN_PROGRESS: 'bg-blue-500/10 text-blue-600 dark:text-blue-200',
  BLOCKED: 'bg-red-500/10 text-red-600 dark:text-red-300',
  DONE: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-200',
}

const formatDateTime = (value: Date | null | undefined, fallback = 'Brak danych') => {
  if (!value) {
    return fallback
  }

  return format(value, 'dd MMM yyyy, HH:mm', { locale: pl })
}

const formatDate = (value: Date | null | undefined, fallback = 'Nie określono') => {
  if (!value) {
    return fallback
  }

  return format(value, 'dd MMM yyyy', { locale: pl })
}

export async function generateMetadata({ params }: { params: { orderId: string } }) {
  const detail = await getOrderDetail(params.orderId)

  if (!detail) {
    return {
      title: 'Zlecenie',
      description: 'Szczegóły zlecenia montażowego',
    }
  }

  const reference = detail.order.orderNumber ?? detail.order.id.slice(0, 7).toUpperCase()

  return {
    title: `Zlecenie ${reference}`,
    description: `Status: ${orderStageLabels[detail.order.stage]}`,
  }
}

export default async function OrderDetailPage({ params }: { params: { orderId: string } }) {
  const detail = await getOrderDetail(params.orderId)

  if (!detail) {
    notFound()
  }

  const reference = detail.order.orderNumber ?? detail.order.id.slice(0, 7).toUpperCase()
  const stageBadge = orderStageBadgeClasses[detail.order.stage] ?? 'bg-muted text-foreground'
  const stageLabel = orderStageLabels[detail.order.stage]
  const stageChangedDistance = detail.order.stageChangedAt
    ? formatDistanceToNow(detail.order.stageChangedAt, { addSuffix: true, locale: pl })
    : 'brak danych'
  const currentStageIndex = getOrderStageIndex(detail.order.stage)
  const totalStages = orderStageSequence.length
  const stageProgress = Math.min(100, Math.round(((currentStageIndex + 1) / totalStages) * 100))
  const currentStageDescription = orderStageDescriptions[detail.order.stage] ?? null
  const now = new Date()
  const installationPendingStatuses = new Set(['PLANNED', 'SCHEDULED'])
  const deliveryCompletedStages = new Set(['DELIVERED', 'COMPLETED'])
  const installationChecklist = detail.checklists.installation
  const deliveryChecklist = detail.checklists.delivery

  type UpcomingEvent = {
    id: string
    date: Date
    label: string
    description: string | null
    icon: LucideIcon
    accentClass: string
  }

  type OverdueItem = {
    id: string
    dueDate: Date
    label: string
    description: string | null
    icon: LucideIcon
  }

  const upcomingEvents: UpcomingEvent[] = [
    ...detail.measurements
      .filter((measurement) => measurement.scheduledAt && measurement.scheduledAt > now)
      .map((measurement) => ({
        id: `measurement-${measurement.id}`,
        date: measurement.scheduledAt!,
        label: 'Umówiony pomiar',
        description: measurement.panelProductName
          ? `Produkt: ${measurement.panelProductName}`
          : measurement.additionalNotes,
        icon: Ruler,
        accentClass: 'bg-primary/15 text-primary border border-primary/30',
      })),
    ...detail.deliveries
      .filter((delivery) => delivery.scheduledDate && delivery.scheduledDate > now)
      .map((delivery) => ({
        id: `delivery-${delivery.id}`,
        date: delivery.scheduledDate!,
        label: delivery.type === 'FOR_INSTALLATION' ? 'Dostawa pod montaż' : 'Samodzielna dostawa',
        description: [delivery.panelProductName, delivery.baseboardProductName].filter(Boolean).join(' • ') || null,
        icon: Package,
        accentClass: 'bg-violet-100 text-violet-700 dark:bg-violet-500/20 dark:text-violet-100',
      })),
    ...detail.installations
      .filter((installation) => installation.scheduledStartAt && installation.scheduledStartAt > now)
      .map((installation) => ({
        id: `installation-${installation.id}`,
        date: installation.scheduledStartAt!,
        label: 'Rozpoczęcie montażu',
        description: installation.assignedInstallerName
          ? `Ekipa: ${installation.assignedInstallerName}`
          : installation.panelProductName,
        icon: HardHat,
        accentClass: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-500/20 dark:text-indigo-100',
      })),
    ...detail.tasks
      .filter((task) => task.dueDate && task.dueDate > now && task.status !== 'DONE')
      .map((task) => ({
        id: `task-${task.id}`,
        date: task.dueDate!,
        label: `Zadanie: ${task.title}`,
        description: task.assignedToName ? `Właściciel: ${task.assignedToName}` : null,
        icon: ClipboardList,
        accentClass: 'bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-100',
      })),
  ]
    .sort((a, b) => a.date.getTime() - b.date.getTime())
    .slice(0, 6)

  const overdueItems: OverdueItem[] = [
    ...detail.tasks
      .filter((task) => task.dueDate && task.dueDate < now && task.status !== 'DONE')
      .map((task) => ({
        id: `task-${task.id}`,
        dueDate: task.dueDate!,
        label: `Zadanie: ${task.title}`,
        description: task.assignedToName ? `Właściciel: ${task.assignedToName}` : null,
        icon: ListChecks,
      })),
    ...detail.deliveries
      .filter(
        (delivery) =>
          delivery.scheduledDate &&
          delivery.scheduledDate < now &&
          !deliveryCompletedStages.has(delivery.stage)
      )
      .map((delivery) => ({
        id: `delivery-overdue-${delivery.id}`,
        dueDate: delivery.scheduledDate!,
        label: delivery.type === 'FOR_INSTALLATION' ? 'Dostawa pod montaż (przeterminowana)' : 'Dostawa (przeterminowana)',
        description: [delivery.panelProductName, delivery.baseboardProductName]
          .filter(Boolean)
          .join(' • ') || null,
        icon: Package,
      })),
    ...detail.installations
      .filter(
        (installation) =>
          installation.scheduledStartAt &&
          installation.scheduledStartAt < now &&
          !installation.actualStartAt &&
          installationPendingStatuses.has(installation.status)
      )
      .map((installation) => ({
        id: `installation-overdue-${installation.id}`,
        dueDate: installation.scheduledStartAt!,
        label: 'Montaż (przeterminowany start)',
        description: installation.assignedInstallerName
          ? `Ekipa: ${installation.assignedInstallerName}`
          : installation.panelProductName,
        icon: HardHat,
      })),
  ].sort((a, b) => a.dueDate.getTime() - b.dueDate.getTime())

  return (
    <div className="flex flex-col gap-6 lg:gap-8">
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink href="/">Panel</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbLink href="/zlecenia">Zlecenia</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>Zlecenie #{reference}</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>
      <section className="flex flex-col gap-6 rounded-3xl border border-border/60 bg-gradient-to-br from-background via-background to-primary/10 p-6 shadow-sm lg:flex-row lg:items-center lg:justify-between lg:p-8">
        <div className="space-y-4">
          <div className="flex flex-wrap items-center gap-2 text-xs font-medium">
            <Badge variant="outline" className="rounded-full border-border/80 text-muted-foreground">
              Zlecenie #{reference}
            </Badge>
            <Badge className={`rounded-full px-3 py-1 text-xs ${stageBadge}`}>{stageLabel}</Badge>
            {detail.order.requiresAdminAttention ? (
              <Badge variant="outline" className="border-red-500/60 bg-red-500/10 text-red-500">
                <AlertTriangle className="mr-1 size-3.5" aria-hidden />
                Wymaga uwagi
              </Badge>
            ) : null}
          </div>
          <div className="space-y-2">
            <h1 className="text-3xl font-semibold tracking-tight text-foreground lg:text-4xl">
              {detail.order.title ?? 'Zarządzaj etapami realizacji'}
            </h1>
            <p className="max-w-2xl text-sm text-muted-foreground lg:text-base">
              Monitoruj status, harmonogram i zależne procesy dla tego zlecenia montażowego. Poniżej znajdziesz
              pomiary, montaże, dostawy oraz zadania przypisane do zespołu.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
            <span>Utworzone: {formatDateTime(detail.order.createdAt)}</span>
            <span>Ostatnia zmiana etapu: {stageChangedDistance}</span>
            {detail.order.stageNotes ? (
              <span className="inline-flex items-center gap-1 text-muted-foreground">
                <FileText className="size-3" aria-hidden />
                {detail.order.stageNotes}
              </span>
            ) : null}
          </div>
          <div className="space-y-3 rounded-2xl border border-border/50 bg-background/80 p-4">
            <div className="flex flex-wrap items-center justify-between gap-2 text-xs font-medium text-muted-foreground">
              <span>Postęp procesu</span>
              <span>
                Etap {currentStageIndex + 1} z {totalStages}
              </span>
            </div>
            <Progress value={stageProgress} className="h-2" aria-label="Postęp realizacji zlecenia" />
            <ol className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {orderStageSequence.map((stage, index) => {
                const isCompleted = index < currentStageIndex
                const isCurrent = index === currentStageIndex
                return (
                  <li key={stage} className="flex items-start gap-2">
                    <span
                      className={`mt-0.5 flex size-2.5 rounded-full ${
                        isCurrent
                          ? 'bg-primary shadow-[0_0_0_4px] shadow-primary/20'
                          : isCompleted
                            ? 'bg-primary'
                            : 'bg-border'
                      }`}
                      aria-hidden="true"
                    />
                    <div className="flex flex-col gap-1">
                      <span
                        className={`text-xs font-medium ${
                          isCurrent
                            ? 'text-foreground'
                            : isCompleted
                              ? 'text-muted-foreground'
                              : 'text-muted-foreground/70'
                        }`}
                      >
                        {orderStageLabels[stage]}
                      </span>
                      {isCurrent && currentStageDescription ? (
                        <span className="text-[11px] text-muted-foreground">{currentStageDescription}</span>
                      ) : null}
                    </div>
                  </li>
                )
              })}
            </ol>
          </div>
        </div>
        <div className="grid w-full grid-cols-2 gap-3 lg:w-auto lg:grid-cols-1">
          <Card className="rounded-2xl border-none bg-background/80 shadow-lg shadow-primary/10">
            <CardContent className="flex flex-col gap-1 p-4">
              <span className="text-xs uppercase text-muted-foreground">Otwarte zadania</span>
              <span className="text-2xl font-semibold text-foreground">{detail.summary.openTaskCount}</span>
            </CardContent>
          </Card>
          <Card className="rounded-2xl border-none bg-primary/10 shadow-lg shadow-primary/20">
            <CardContent className="flex flex-col gap-1 p-4">
              <span className="text-xs uppercase text-primary">Najbliższy montaż</span>
              <span className="text-2xl font-semibold text-primary">
                {detail.summary.upcomingInstallationDate
                  ? format(detail.summary.upcomingInstallationDate, 'dd MMM', { locale: pl })
                  : '—'}
              </span>
            </CardContent>
          </Card>
        </div>
      </section>

      {overdueItems.length > 0 ? (
        <Card className="rounded-3xl border border-red-500/40 bg-red-500/5 p-0">
          <CardHeader className="flex flex-col gap-1 border-b border-red-500/20 bg-red-500/10">
            <CardTitle className="flex items-center gap-2 text-red-600 dark:text-red-300">
              <ShieldAlert className="size-5" aria-hidden />
              Wymaga pilnej reakcji
            </CardTitle>
            <CardDescription className="text-red-600/80 dark:text-red-200/80">
              {overdueItems.length} {overdueItems.length === 1 ? 'aktywność' : overdueItems.length < 5 ? 'aktywności' : 'aktywności'} przekroczyło planowany termin.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 p-5">
            <ul className="space-y-3 text-sm">
              {overdueItems.map((item) => {
                const Icon = item.icon
                return (
                  <li key={item.id} className="flex items-start justify-between gap-4 rounded-2xl border border-red-500/20 bg-background/60 p-3">
                    <div className="flex items-start gap-3">
                      <span className="mt-1 inline-flex rounded-full bg-red-500/15 p-2 text-red-600 dark:text-red-300" aria-hidden="true">
                        <Icon className="size-4" />
                      </span>
                      <div className="flex flex-col gap-1">
                        <span className="font-semibold text-foreground">{item.label}</span>
                        {item.description ? (
                          <span className="text-xs text-muted-foreground">{item.description}</span>
                        ) : null}
                      </div>
                    </div>
                    <div className="flex flex-col items-end text-xs text-red-600 dark:text-red-300">
                      <span>{format(item.dueDate, 'dd MMM yyyy, HH:mm', { locale: pl })}</span>
                      <span>{formatDistanceToNow(item.dueDate, { addSuffix: true, locale: pl })}</span>
                    </div>
                  </li>
                )
              })}
            </ul>
          </CardContent>
        </Card>
      ) : null}

      <section className="grid gap-4 lg:grid-cols-4">
        <Card className="rounded-3xl border border-border/60">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Dokumenty</CardTitle>
            <Paperclip className="size-4 text-muted-foreground" aria-hidden />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-semibold text-foreground">{detail.summary.totalAttachments}</div>
            <p className="text-xs text-muted-foreground">Łącznie plików powiązanych ze zleceniem.</p>
          </CardContent>
        </Card>

        <Card className="rounded-3xl border border-border/60">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Pomiar</CardTitle>
            <Ruler className="size-4 text-muted-foreground" aria-hidden />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-semibold text-foreground">{detail.summary.totalMeasurements}</div>
            <p className="text-xs text-muted-foreground">Zarejestrowane protokoły pomiarowe.</p>
          </CardContent>
        </Card>

        <Card className="rounded-3xl border border-border/60">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Dostawy</CardTitle>
            <Package className="size-4 text-muted-foreground" aria-hidden />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-semibold text-foreground">{detail.summary.totalDeliveries}</div>
            <p className="text-xs text-muted-foreground">Planowane lub zrealizowane wysyłki.</p>
          </CardContent>
        </Card>

        <Card className="rounded-3xl border border-border/60">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Zadania zamknięte</CardTitle>
            <ListChecks className="size-4 text-muted-foreground" aria-hidden />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-semibold text-foreground">{detail.summary.closedTaskCount}</div>
            <p className="text-xs text-muted-foreground">Zadania oznaczone jako zakończone.</p>
          </CardContent>
        </Card>
      </section>

      <Tabs defaultValue="overview" className="flex flex-col gap-4">
        <TabsList className="flex w-full overflow-x-auto">
          <TabsTrigger value="overview">
            <ClipboardList className="size-4" aria-hidden />
            Przegląd
          </TabsTrigger>
          <TabsTrigger value="measurements">
            <Ruler className="size-4" aria-hidden />
            Pomiary
          </TabsTrigger>
          <TabsTrigger value="installations">
            <HardHat className="size-4" aria-hidden />
            Montaże
          </TabsTrigger>
          <TabsTrigger value="deliveries">
            <Package className="size-4" aria-hidden />
            Dostawy
          </TabsTrigger>
          <TabsTrigger value="tasks">
            <ListChecks className="size-4" aria-hidden />
            Zadania
          </TabsTrigger>
          <TabsTrigger value="documents">
            <Paperclip className="size-4" aria-hidden />
            Dokumenty
          </TabsTrigger>
          <TabsTrigger value="history">
            <Clock className="size-4" aria-hidden />
            Historia
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid gap-6 lg:grid-cols-3">
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle>Informacje o zleceniu</CardTitle>
                <CardDescription>Podstawowe dane deklarowane podczas tworzenia zlecenia.</CardDescription>
              </CardHeader>
              <CardContent>
                <dl className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-1">
                    <dt className="text-xs uppercase text-muted-foreground">Etap</dt>
                    <dd className="text-sm font-medium text-foreground">{stageLabel}</dd>
                  </div>
                  <div className="space-y-1">
                    <dt className="text-xs uppercase text-muted-foreground">Deklarowana powierzchnia</dt>
                    <dd className="text-sm font-medium text-foreground">
                      {detail.order.declaredFloorArea
                        ? `${numberFormatter.format(detail.order.declaredFloorArea)} m²`
                        : 'Brak danych'}
                    </dd>
                  </div>
                  <div className="space-y-1">
                    <dt className="text-xs uppercase text-muted-foreground">Deklarowana listwa</dt>
                    <dd className="text-sm font-medium text-foreground">
                      {detail.order.declaredBaseboardLength
                        ? `${numberFormatter.format(detail.order.declaredBaseboardLength)} mb`
                        : 'Brak danych'}
                    </dd>
                  </div>
                  <div className="space-y-1">
                    <dt className="text-xs uppercase text-muted-foreground">Typ budynku</dt>
                    <dd className="text-sm font-medium text-foreground">{detail.order.buildingType ?? 'Nie określono'}</dd>
                  </div>
                  <div className="space-y-1">
                    <dt className="text-xs uppercase text-muted-foreground">Preferencja paneli</dt>
                    <dd className="text-sm font-medium text-foreground">{detail.order.panelPreference ?? 'Brak'}</dd>
                  </div>
                  <div className="space-y-1">
                    <dt className="text-xs uppercase text-muted-foreground">Preferencja listew</dt>
                    <dd className="text-sm font-medium text-foreground">{detail.order.baseboardPreference ?? 'Brak'}</dd>
                  </div>
                </dl>
              </CardContent>
            </Card>

            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Klient</CardTitle>
                  <CardDescription>Dane kontaktowe i adresowe.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-2 text-sm">
                  {detail.client ? (
                    <>
                      <div className="font-semibold text-foreground">{detail.client.fullName}</div>
                      {detail.client.phone ? <div>Tel.: {detail.client.phone}</div> : null}
                      {detail.client.email ? <div>E-mail: {detail.client.email}</div> : null}
                      <div className="text-muted-foreground">
                        {[detail.client.street, detail.client.postalCode, detail.client.city]
                          .filter(Boolean)
                          .join(', ') || 'Adres nieuzupełniony'}
                      </div>
                    </>
                  ) : (
                    <p className="text-muted-foreground">Klient nie został powiązany.</p>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Partner</CardTitle>
                  <CardDescription>Relacja partnerska odpowiedzialna za zlecenie.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-2 text-sm">
                  {detail.partner ? (
                    <>
                      <div className="font-semibold text-foreground">{detail.partner.companyName}</div>
                      {detail.partner.contactName ? <div>Opiekun: {detail.partner.contactName}</div> : null}
                      {detail.partner.contactEmail ? <div>Email: {detail.partner.contactEmail}</div> : null}
                      {detail.partner.contactPhone ? <div>Tel.: {detail.partner.contactPhone}</div> : null}
                    </>
                  ) : (
                    <p className="text-muted-foreground">Brak przypisanego partnera.</p>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            <Card className="rounded-3xl border border-border/60">
              <CardHeader className="flex flex-col gap-1">
                <CardTitle>Najbliższe działania</CardTitle>
                <CardDescription>Zaplanuj kolejne kroki na podstawie harmonogramu i zadań.</CardDescription>
              </CardHeader>
              <CardContent>
                {upcomingEvents.length === 0 ? (
                  <Empty>
                    <EmptyMedia variant="icon">
                      <Clock className="size-6" aria-hidden />
                    </EmptyMedia>
                    <EmptyHeader>
                      <EmptyTitle>Brak zaplanowanych aktywności</EmptyTitle>
                      <EmptyDescription>Dodaj zadania, pomiar lub termin montażu, aby zbudować harmonogram.</EmptyDescription>
                    </EmptyHeader>
                  </Empty>
                ) : (
                  <ul className="space-y-4">
                    {upcomingEvents.map((event) => {
                      const Icon = event.icon
                      return (
                        <li key={event.id} className="flex items-start gap-3 rounded-2xl border border-border/50 p-3">
                          <span
                            className={`flex items-center justify-center rounded-full p-2 text-sm ${event.accentClass}`}
                            aria-hidden="true"
                          >
                            <Icon className="size-4" />
                          </span>
                          <div className="flex flex-col gap-1 text-sm">
                            <span className="font-semibold text-foreground">{event.label}</span>
                            <span className="text-xs text-muted-foreground">
                              {format(event.date, 'dd MMM yyyy, HH:mm', { locale: pl })} •{' '}
                              {formatDistanceToNow(event.date, { addSuffix: true, locale: pl })}
                            </span>
                            {event.description ? (
                              <span className="text-xs text-muted-foreground/90">{event.description}</span>
                            ) : null}
                          </div>
                        </li>
                      )
                    })}
                  </ul>
                )}
              </CardContent>
            </Card>

            <Card className="rounded-3xl border border-border/60">
              <CardHeader className="flex flex-col gap-1">
                <CardTitle>Checklisty etapów</CardTitle>
                <CardDescription>Monitoruj kluczowe działania finansowe i operacyjne.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-3">
                  <div>
                    <h3 className="text-sm font-semibold text-foreground">Montaż</h3>
                    <p className="text-xs text-muted-foreground">Wszystkie kroki związane z realizacją montażu.</p>
                  </div>
                  <ul className="space-y-2 text-sm">
                    {[
                      {
                        label: 'Wycena wysłana',
                        completed: installationChecklist.quoteSent,
                      },
                      {
                        label: 'Pomiar wykonany',
                        completed: installationChecklist.measurementCompleted,
                      },
                      {
                        label: 'Faktura zaliczkowa',
                        completed: installationChecklist.depositInvoiceIssued,
                      },
                      {
                        label: 'Faktura końcowa',
                        completed: installationChecklist.finalInvoiceIssued,
                      },
                      {
                        label: 'Protokół odbioru',
                        completed: installationChecklist.handoverProtocolSigned,
                      },
                      {
                        label: 'Opinia',
                        completed: installationChecklist.reviewReceived,
                      },
                    ].map((item) => (
                      <li key={item.label} className="flex items-center gap-3">
                        <span
                          className={`inline-flex size-6 items-center justify-center rounded-full border text-xs font-semibold ${
                            item.completed
                              ? 'border-emerald-500 bg-emerald-500/10 text-emerald-600 dark:text-emerald-300'
                              : 'border-border text-muted-foreground'
                          }`}
                          aria-hidden="true"
                        >
                          {item.completed ? <CheckCircle2 className="size-4" /> : <Circle className="size-3" />}
                        </span>
                        <span className={item.completed ? 'text-foreground' : 'text-muted-foreground'}>{item.label}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <Separator />

                <div className="space-y-3">
                  <div>
                    <h3 className="text-sm font-semibold text-foreground">Tylko dostawa</h3>
                    <p className="text-xs text-muted-foreground">Flagi dotyczące procesu logistycznego.</p>
                  </div>
                  <ul className="space-y-2 text-sm">
                    {[
                      {
                        label: 'Faktura proforma',
                        completed: deliveryChecklist.proformaIssued,
                      },
                      {
                        label: 'Faktura zaliczkowa/końcowa',
                        completed: deliveryChecklist.depositOrFinalInvoiceIssued,
                      },
                      {
                        label: 'Zlecono wysyłkę',
                        completed: deliveryChecklist.shippingOrdered,
                      },
                      {
                        label: 'Opinia',
                        completed: deliveryChecklist.reviewReceived,
                      },
                    ].map((item) => (
                      <li key={item.label} className="flex items-center gap-3">
                        <span
                          className={`inline-flex size-6 items-center justify-center rounded-full border text-xs font-semibold ${
                            item.completed
                              ? 'border-emerald-500 bg-emerald-500/10 text-emerald-600 dark:text-emerald-300'
                              : 'border-border text-muted-foreground'
                          }`}
                          aria-hidden="true"
                        >
                          {item.completed ? <CheckCircle2 className="size-4" /> : <Circle className="size-3" />}
                        </span>
                        <span className={item.completed ? 'text-foreground' : 'text-muted-foreground'}>{item.label}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </CardContent>
            </Card>
          </div>

        </TabsContent>

        <TabsContent value="measurements" className="space-y-4">
          {detail.measurements.length === 0 ? (
            <Card className="rounded-3xl border border-border/60">
              <CardContent className="p-6">
                <Empty>
                  <EmptyMedia variant="icon">
                    <Ruler className="size-6" aria-hidden />
                  </EmptyMedia>
                  <EmptyHeader>
                    <EmptyTitle>Brak pomiarów</EmptyTitle>
                    <EmptyDescription>Dodaj protokół z pomiaru, aby oszacować materiały i harmonogram.</EmptyDescription>
                  </EmptyHeader>
                </Empty>
              </CardContent>
            </Card>
          ) : (
            detail.measurements.map((measurement) => (
              <Card key={measurement.id} className="rounded-3xl border border-border/60">
                <CardHeader className="flex flex-col gap-1">
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <Ruler className="size-5 text-primary" aria-hidden />
                    Protokół pomiarowy
                  </CardTitle>
                  <CardDescription>
                    Zarejestrowano {formatDateTime(measurement.measuredAt, 'brak daty')}. Liczba korekt: {measurement.adjustmentsCount}.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4 text-sm text-muted-foreground">
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                      <div className="text-xs uppercase">Zmierzona powierzchnia</div>
                      <div className="text-foreground text-sm font-medium">
                        {measurement.measuredFloorArea
                          ? `${numberFormatter.format(measurement.measuredFloorArea)} m²`
                          : 'Brak danych'}
                      </div>
                    </div>
                    <div>
                      <div className="text-xs uppercase">Zmierzona listwa</div>
                      <div className="text-foreground text-sm font-medium">
                        {measurement.measuredBaseboardLength
                          ? `${numberFormatter.format(measurement.measuredBaseboardLength)} mb`
                          : 'Brak danych'}
                      </div>
                    </div>
                    <div>
                      <div className="text-xs uppercase">Docinki</div>
                      <div className="text-foreground text-sm font-medium">
                        {measurement.offcutPercent ? `${measurement.offcutPercent}%` : 'Nie określono'}
                      </div>
                    </div>
                    <div>
                      <div className="text-xs uppercase">Produkt paneli</div>
                      <div className="text-foreground text-sm font-medium">
                        {measurement.panelProductName ?? 'Brak'}
                      </div>
                    </div>
                  </div>
                  <Separator />
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                      <div className="text-xs uppercase">Timing dostawy</div>
                      <div className="text-foreground text-sm font-medium">
                        {measurementTimingLabels[measurement.deliveryTimingType]}
                      </div>
                    </div>
                    <div>
                      <div className="text-xs uppercase">Planowana dostawa</div>
                      <div className="text-foreground text-sm font-medium">
                        {measurement.deliveryTimingType === 'DAYS_BEFORE'
                          ? `${measurement.deliveryDaysBefore ?? '—'} dni przed montażem`
                          : formatDate(measurement.deliveryDate)}
                      </div>
                    </div>
                  </div>
                  {measurement.additionalNotes ? (
                    <div className="rounded-2xl bg-muted/60 p-4 text-sm text-muted-foreground">
                      {measurement.additionalNotes}
                    </div>
                  ) : null}
                  <div className="flex flex-wrap items-center gap-4 text-xs text-muted-foreground">
                    <span>Załączniki: {measurement.attachmentsCount}</span>
                    <span>Zarejestrowano: {formatDateTime(measurement.createdAt)}</span>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>

        <TabsContent value="installations" className="space-y-4">
          {detail.installations.length === 0 ? (
            <Card className="rounded-3xl border border-border/60">
              <CardContent className="p-6">
                <Empty>
                  <EmptyMedia variant="icon">
                    <HardHat className="size-6" aria-hidden />
                  </EmptyMedia>
                  <EmptyHeader>
                    <EmptyTitle>Brak harmonogramów montaży</EmptyTitle>
                    <EmptyDescription>Dodaj termin montażu, aby zsynchronizować pracę ekipy oraz dostawy.</EmptyDescription>
                  </EmptyHeader>
                </Empty>
              </CardContent>
            </Card>
          ) : (
            detail.installations.map((installation) => (
              <Card key={installation.id} className="rounded-3xl border border-border/60">
                <CardHeader className="flex flex-col gap-1">
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <HardHat className="size-5 text-primary" aria-hidden />
                    Harmonogram montażu
                  </CardTitle>
                  <CardDescription>Status: {installation.status}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4 text-sm text-muted-foreground">
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                      <div className="text-xs uppercase">Plan</div>
                      <div className="text-foreground text-sm font-medium">
                        {formatDate(installation.scheduledStartAt)} – {formatDate(installation.scheduledEndAt)}
                      </div>
                    </div>
                    <div>
                      <div className="text-xs uppercase">Realizacja</div>
                      <div className="text-foreground text-sm font-medium">
                        {installation.actualStartAt || installation.actualEndAt
                          ? `${formatDate(installation.actualStartAt, '—')} – ${formatDate(installation.actualEndAt, '—')}`
                          : 'Brak danych'}
                      </div>
                    </div>
                    <div>
                      <div className="text-xs uppercase">Przypisany monter</div>
                      <div className="text-foreground text-sm font-medium">
                        {installation.assignedInstallerName ?? 'Nie przypisano'}
                      </div>
                    </div>
                    <div>
                      <div className="text-xs uppercase">Produkty</div>
                      <div className="text-foreground text-sm font-medium space-y-1">
                        <div>Panel: {installation.panelProductName ?? 'Brak'}</div>
                        <div>Listwa: {installation.baseboardProductName ?? 'Brak'}</div>
                      </div>
                    </div>
                  </div>
                  {installation.additionalWork || installation.additionalInfo ? (
                    <div className="rounded-2xl bg-muted/60 p-4 text-sm text-muted-foreground space-y-2">
                      {installation.additionalWork ? <div>Prace dodatkowe: {installation.additionalWork}</div> : null}
                      {installation.additionalInfo ? <div>Uwagi: {installation.additionalInfo}</div> : null}
                    </div>
                  ) : null}
                  <div className="grid gap-2 text-xs text-muted-foreground sm:grid-cols-3">
                    <span>Protokół: {installation.handoverProtocolSigned ? 'podpisany' : 'brak'}</span>
                    <span>Opinia klienta: {installation.reviewReceived ? 'otrzymano' : 'brak'}</span>
                    <span>Załączniki: {installation.attachmentsCount}</span>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>

        <TabsContent value="deliveries" className="space-y-4">
          {detail.deliveries.length === 0 ? (
            <Card className="rounded-3xl border border-border/60">
              <CardContent className="p-6">
                <Empty>
                  <EmptyMedia variant="icon">
                    <Package className="size-6" aria-hidden />
                  </EmptyMedia>
                  <EmptyHeader>
                    <EmptyTitle>Brak dostaw</EmptyTitle>
                    <EmptyDescription>Dodaj wysyłkę, aby zsynchronizować logistykę materiałów.</EmptyDescription>
                  </EmptyHeader>
                </Empty>
              </CardContent>
            </Card>
          ) : (
            detail.deliveries.map((delivery) => (
              <Card key={delivery.id} className="rounded-3xl border border-border/60">
                <CardHeader className="flex flex-col gap-1">
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <Package className="size-5 text-primary" aria-hidden />
                    Dostawa ({delivery.type === 'FOR_INSTALLATION' ? 'pod montaż' : 'samodzielna'})
                  </CardTitle>
                  <CardDescription>Status: {delivery.stage}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4 text-sm text-muted-foreground">
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                      <div className="text-xs uppercase">Planowana data</div>
                      <div className="text-foreground text-sm font-medium">{formatDate(delivery.scheduledDate)}</div>
                    </div>
                    <div>
                      <div className="text-xs uppercase">Pakiet</div>
                      <div className="text-foreground text-sm font-medium space-y-1">
                        <div>Panele: {delivery.includePanels ? delivery.panelProductName ?? 'Tak' : 'Nie'}</div>
                        <div>Listwy: {delivery.includeBaseboards ? delivery.baseboardProductName ?? 'Tak' : 'Nie'}</div>
                      </div>
                    </div>
                  </div>
                  {delivery.notes ? (
                    <div className="rounded-2xl bg-muted/60 p-4 text-sm text-muted-foreground">{delivery.notes}</div>
                  ) : null}
                  <div className="flex flex-wrap items-center gap-4 text-xs text-muted-foreground">
                    <span>Załączniki: {delivery.attachmentsCount}</span>
                    <span>Wymaga uwagi: {delivery.requiresAdminAttention ? 'tak' : 'nie'}</span>
                    <span>Zarejestrowano: {formatDateTime(delivery.createdAt)}</span>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>

        <TabsContent value="tasks" className="space-y-4">
          {detail.tasks.length === 0 ? (
            <Card className="rounded-3xl border border-border/60">
              <CardContent className="p-6">
                <Empty>
                  <EmptyMedia variant="icon">
                    <ListChecks className="size-6" aria-hidden />
                  </EmptyMedia>
                  <EmptyHeader>
                    <EmptyTitle>Brak zadań</EmptyTitle>
                    <EmptyDescription>Dodaj zadania, aby przypisać właścicieli i terminy do kolejnych kroków.</EmptyDescription>
                  </EmptyHeader>
                </Empty>
              </CardContent>
            </Card>
          ) : (
            detail.tasks.map((task) => (
              <Card key={task.id} className="rounded-3xl border border-border/60">
                <CardHeader className="flex flex-row items-start justify-between gap-2">
                  <div>
                    <CardTitle>{task.title}</CardTitle>
                    <CardDescription>
                      Termin: {task.dueDate ? formatDate(task.dueDate) : 'nie ustawiono'} • Odpowiedzialny:{' '}
                      {task.assignedToName ?? 'nie przypisano'}
                    </CardDescription>
                  </div>
                  <Badge className={`rounded-full ${taskStatusBadgeClasses[task.status] ?? 'bg-muted text-foreground'}`}>
                    {taskStatusLabels[task.status]}
                  </Badge>
                </CardHeader>
                <CardContent className="text-xs text-muted-foreground">
                  Utworzone: {formatDateTime(task.createdAt)}
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>

        <TabsContent value="documents" className="space-y-4">
          <Card className="rounded-3xl border border-border/60">
            <CardHeader>
              <CardTitle>Załączniki zlecenia</CardTitle>
              <CardDescription>Lista dokumentów powiązanych bezpośrednio ze zleceniem.</CardDescription>
            </CardHeader>
            <CardContent>
              {detail.attachments.length === 0 ? (
                <Empty>
                  <EmptyMedia variant="icon">
                    <Paperclip className="size-6" aria-hidden />
                  </EmptyMedia>
                  <EmptyHeader>
                    <EmptyTitle>Brak plików</EmptyTitle>
                    <EmptyDescription>Dodaj umowy, protokoły lub zdjęcia w zakładce dokumentów.</EmptyDescription>
                  </EmptyHeader>
                </Empty>
              ) : (
                <ul className="space-y-3 text-sm text-muted-foreground">
                  {detail.attachments.map((file) => (
                    <li key={file.id} className="rounded-2xl border border-border/60 p-3">
                      <div className="flex items-center justify-between">
                        <span className="font-medium text-foreground">{file.fileName}</span>
                        <span className="text-xs">{file.fileSize ? `${Math.round(file.fileSize / 1024)} KB` : '—'}</span>
                      </div>
                      <div className="text-xs text-muted-foreground">
                        Dodano: {formatDateTime(file.createdAt)}
                        {file.description ? ` • ${file.description}` : ''}
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="history" className="space-y-4">
          <Card className="rounded-3xl border border-border/60">
            <CardHeader>
              <CardTitle>Historia etapów</CardTitle>
              <CardDescription>Chronologiczny zapis zmian statusu wraz z komentarzami.</CardDescription>
            </CardHeader>
            <CardContent>
              {detail.statusHistory.length === 0 ? (
                <Empty>
                  <EmptyMedia variant="icon">
                    <Clock className="size-6" aria-hidden />
                  </EmptyMedia>
                  <EmptyHeader>
                    <EmptyTitle>Brak zmian</EmptyTitle>
                    <EmptyDescription>Historia statusów pojawi się po pierwszej aktualizacji etapu.</EmptyDescription>
                  </EmptyHeader>
                </Empty>
              ) : (
                <ul className="space-y-4">
                  {detail.statusHistory.map((entry) => (
                    <li key={entry.id} className="flex flex-col gap-1 rounded-2xl border border-border/60 p-4">
                      <div className="flex flex-wrap items-center gap-2 text-sm">
                        <Badge variant="outline" className="rounded-full border-border/70 text-muted-foreground">
                          {orderStageLabels[entry.toStage]}
                        </Badge>
                        <span className="text-xs text-muted-foreground">
                          {formatDateTime(entry.changedAt)} ({formatDistanceToNow(entry.changedAt, { addSuffix: true, locale: pl })})
                        </span>
                      </div>
                      {entry.note ? (
                        <div className="text-sm text-foreground">{entry.note}</div>
                      ) : null}
                      <div className="text-xs text-muted-foreground">
                        Wykonał: {entry.changedByName ?? 'nieznany użytkownik'}
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
