import Link from 'next/link'
import { notFound } from 'next/navigation'
import { format, formatDistanceToNow } from 'date-fns'
import { pl } from 'date-fns/locale'
import {
  AlertTriangle,
  CheckCircle2,
  Circle,
  ClipboardEdit,
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
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Separator } from '@/components/ui/separator'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { getOrderDetail } from '@/lib/orders'
import { listProductsForSelect } from '@/lib/products'
import { listClientAttachments } from '@/lib/r2'
import {
  orderStageBadgeClasses,
  orderStageDescriptions,
  orderStageLabels,
  orderStageSequence,
} from '@/lib/order-stage'
import {
  deliveryStageBadgeClasses,
  deliveryStageDescriptions,
  deliveryStageLabels,
  deliveryStageSequence,
} from '@/lib/deliveries'
import {
  deliveryTimingLabels,
  measurementStatusBadgeClasses,
  measurementStatusLabels,
  resolveMeasurementStatus,
} from '@/lib/measurements/constants'
import { OrderParametersDialog } from './_components/order-parameters-dialog'
import { OrderClientAttachmentsCard } from './_components/order-client-attachments-card'

const numberFormatter = new Intl.NumberFormat('pl-PL', {
  maximumFractionDigits: 1,
})

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

const executionModeLabels = {
  INSTALLATION_ONLY: 'Montaż + logistyka',
  DELIVERY_ONLY: 'Tylko dostawa',
} as const

const executionModeBadgeClasses: Record<keyof typeof executionModeLabels, string> = {
  INSTALLATION_ONLY: 'border border-emerald-500/60 bg-emerald-500/10 text-emerald-600 dark:text-emerald-200',
  DELIVERY_ONLY: 'border border-amber-500/60 bg-amber-500/10 text-amber-600 dark:text-amber-200',
}

const executionModeTaglines: Record<keyof typeof executionModeLabels, string> = {
  INSTALLATION_ONLY: 'Śledzimy pełny proces pomiaru, dostaw i montażu.',
  DELIVERY_ONLY: 'Skupiamy się na logistyce, transportach i dokumentach dostawy.',
}

const measurementStatusOrder = ['PENDING', 'PLANNED', 'OVERDUE', 'COMPLETED'] as const

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

type OrderDetailPageParams = Promise<{ orderId: string }>

export async function generateMetadata({ params }: { params: OrderDetailPageParams }) {
  const resolvedParams = await params
  const detail = await getOrderDetail(resolvedParams.orderId)

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

export default async function OrderDetailPage({ params }: { params: OrderDetailPageParams }) {
  const resolvedParams = await params
  const detail = await getOrderDetail(resolvedParams.orderId)

  if (!detail) {
    notFound()
  }

  const clientAttachments = detail.client
    ? await listClientAttachments(detail.client.id, {
        fullName: detail.client.fullName,
        limit: 20,
      })
    : []

  const serializedClientAttachments = clientAttachments.map((attachment) => ({
    key: attachment.key,
    fileName: attachment.fileName,
    size: attachment.size,
    lastModified: attachment.lastModified?.toISOString() ?? null,
  }))

  const planInstallationHref = detail.client ? `/montaze/nowy?clientId=${detail.client.id}` : '/montaze/nowy'
  const addDeliverySearch = new URLSearchParams()
  addDeliverySearch.set('type', 'STANDALONE')
  addDeliverySearch.set('orderId', detail.order.id)
  if (detail.client?.id) {
    addDeliverySearch.set('clientId', detail.client.id)
  }
  const addDeliveryHref = `/dostawy/nowa?${addDeliverySearch.toString()}`

  const activeInstallationForDelivery = detail.installations.find((installation) =>
    installation.status === 'SCHEDULED' || installation.status === 'IN_PROGRESS'
  )
  const fallbackInstallationForDelivery = detail.installations.length === 1 ? detail.installations[0] : null
  const preselectedInstallationForDelivery = activeInstallationForDelivery ?? fallbackInstallationForDelivery ?? null
  const addInstallationDeliverySearch = new URLSearchParams()
  addInstallationDeliverySearch.set('orderId', detail.order.id)
  if (preselectedInstallationForDelivery) {
    addInstallationDeliverySearch.set('installationId', preselectedInstallationForDelivery.id)
  }
  const addInstallationDeliveryHref = `/montaze/nowa-dostawa?${addInstallationDeliverySearch.toString()}`

  const reference = detail.order.orderNumber ?? detail.order.id.slice(0, 7).toUpperCase()
  const executionModeLabel = executionModeLabels[detail.order.executionMode]
  const executionModeBadge = executionModeBadgeClasses[detail.order.executionMode]
  const executionModeTagline = executionModeTaglines[detail.order.executionMode]
  const isDeliveryOnly = detail.order.executionMode === 'DELIVERY_ONLY'
  const now = new Date()
  const installationPendingStatuses = new Set(['PLANNED', 'SCHEDULED'])
  const deliveryCompletedStages = new Set(['DELIVERED', 'COMPLETED'])
  const installationChecklist = detail.checklists.installation
  const deliveryChecklist = detail.checklists.delivery

  const deliveriesForView = detail.deliveries.filter((delivery) =>
    isDeliveryOnly ? delivery.type === 'STANDALONE' : delivery.type === 'FOR_INSTALLATION'
  )

  const activeDelivery = isDeliveryOnly ? deliveriesForView[0] ?? null : null
  let panelProductOptions: Array<{ id: string; label: string }> = []
  let baseboardProductOptions: Array<{ id: string; label: string }> = []

  if (!isDeliveryOnly) {
    const [panelProducts, baseboardProducts] = await Promise.all([
      listProductsForSelect({ types: ['PANEL'] }),
      listProductsForSelect({ types: ['BASEBOARD'] }),
    ])

    panelProductOptions = panelProducts.map(({ id, label }) => ({ id, label }))
    baseboardProductOptions = baseboardProducts.map(({ id, label }) => ({ id, label }))
  }
  const stageSequence = isDeliveryOnly && activeDelivery ? deliveryStageSequence : orderStageSequence
  const stageLabelsRecord = ((isDeliveryOnly && activeDelivery ? deliveryStageLabels : orderStageLabels) as Record<string, string>)
  const stageDescriptionsRecord = ((isDeliveryOnly && activeDelivery ? deliveryStageDescriptions : orderStageDescriptions) as Record<string, string | undefined>)
  const stageBadgeRecord = ((isDeliveryOnly && activeDelivery ? deliveryStageBadgeClasses : orderStageBadgeClasses) as Record<string, string | undefined>)
  const currentStageValue = (isDeliveryOnly && activeDelivery ? activeDelivery.stage : detail.order.stage) as string
  const stageBadge = stageBadgeRecord[currentStageValue] ?? 'bg-muted text-foreground'
  const stageLabel = stageLabelsRecord[currentStageValue] ?? 'Brak etapu'
  const currentStageIndexRaw = stageSequence.findIndex((stage) => stage === currentStageValue)
  const currentStageIndex = currentStageIndexRaw >= 0 ? currentStageIndexRaw : 0
  const totalStages = stageSequence.length
  const stageProgress = totalStages > 0 ? Math.min(100, Math.round(((currentStageIndex + 1) / totalStages) * 100)) : 0
  const currentStageDescription = stageDescriptionsRecord[currentStageValue] ?? null
  const stageChangedDistance = (() => {
    if (isDeliveryOnly && activeDelivery?.createdAt) {
      return formatDistanceToNow(activeDelivery.createdAt, { addSuffix: true, locale: pl })
    }

    if (detail.order.stageChangedAt) {
      return formatDistanceToNow(detail.order.stageChangedAt, { addSuffix: true, locale: pl })
    }

    return 'brak danych'
  })()
  const heroDescription = isDeliveryOnly
    ? 'Monitoruj logistykę, status płatności i dokumenty dla zlecenia w trybie „Tylko dostawa”.'
    : 'Monitoruj status, harmonogram i zależne procesy dla tego zlecenia montażowego. Poniżej znajdziesz pomiary, montaże, dostawy oraz zadania przypisane do zespołu.'

  const documentFlags = [
    {
      key: 'quoteSent',
      label: 'Wycena wysłana',
      active: detail.order.quoteSent,
    },
    {
      key: 'depositInvoiceIssued',
      label: 'Faktura zaliczkowa',
      active: detail.order.depositInvoiceIssued,
    },
    {
      key: 'finalInvoiceIssued',
      label: 'Faktura końcowa',
      active: detail.order.finalInvoiceIssued,
    },
  ] as const

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
    ...deliveriesForView
      .filter((delivery) => delivery.scheduledDate && delivery.scheduledDate > now)
      .map((delivery) => ({
        id: `delivery-${delivery.id}`,
        date: delivery.scheduledDate!,
  label: delivery.type === 'FOR_INSTALLATION' ? 'Dostawa pod montaż' : 'Tylko dostawa',
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
    ...deliveriesForView
      .filter(
        (delivery) =>
          delivery.scheduledDate &&
          delivery.scheduledDate < now &&
          !deliveryCompletedStages.has(delivery.stage)
      )
      .map((delivery) => ({
        id: `delivery-overdue-${delivery.id}`,
        dueDate: delivery.scheduledDate!,
  label: delivery.type === 'FOR_INSTALLATION' ? 'Dostawa pod montaż (przeterminowana)' : 'Tylko dostawa (przeterminowana)',
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

  const nextUpcomingEvent = upcomingEvents[0] ?? null

  const measurementEntries = detail.measurements.map((measurement) => {
    const status = resolveMeasurementStatus({
      scheduledAt: measurement.scheduledAt ?? null,
      measuredAt: measurement.measuredAt ?? null,
      now,
    })

    return {
      ...measurement,
      status,
    }
  })

  const measurementStatusSummary = measurementEntries.reduce(
    (acc, measurement) => {
      acc[measurement.status] = (acc[measurement.status] ?? 0) + 1
      return acc
    },
    {
      PENDING: 0,
      PLANNED: 0,
      OVERDUE: 0,
      COMPLETED: 0,
    } as Record<'PENDING' | 'PLANNED' | 'OVERDUE' | 'COMPLETED', number>,
  )

  const measurementModuleHref = '/pomiary'
  const measurementCreateHref = `/pomiary/nowy?orderId=${detail.order.id}`

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
            <Badge className={`rounded-full px-3 py-1 text-xs ${executionModeBadge}`}>{executionModeLabel}</Badge>
            {detail.order.assignedInstallerName ? (
              <Badge className="rounded-full border border-primary/50 bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
                Monter: {detail.order.assignedInstallerName}
              </Badge>
            ) : null}
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
              {heroDescription}
            </p>
            <p className="text-xs font-medium text-muted-foreground/80">
              {executionModeTagline}
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
          <div className="flex flex-wrap items-center gap-3">
            {detail.order.executionMode === 'INSTALLATION_ONLY' ? (
              <>
                <Button asChild className="rounded-full bg-primary px-5 py-2 text-sm font-semibold text-primary-foreground shadow-lg shadow-primary/20">
                  <Link href={planInstallationHref}>Zaplanuj montaż</Link>
                </Button>
                <Button
                  asChild
                  variant="outline"
                  className="inline-flex items-center gap-2 rounded-full border-amber-500/60 text-sm font-semibold text-amber-600 shadow-sm hover:border-amber-500 hover:text-amber-600"
                >
                  <Link href={addInstallationDeliveryHref}>
                    <Package className="size-4" aria-hidden />
                    Dodaj dostawę pod montaż
                  </Link>
                </Button>
              </>
            ) : null}
            {detail.order.executionMode === 'DELIVERY_ONLY' ? (
              <Button
                asChild
                className="rounded-full bg-amber-500 px-5 py-2 text-sm font-semibold text-amber-950 shadow-lg shadow-amber-500/30 hover:bg-amber-500/90"
              >
                <Link href={addDeliveryHref}>Dodaj dostawę</Link>
              </Button>
            ) : null}
            <Button
              variant="ghost"
              asChild
              className="inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold text-muted-foreground hover:text-primary"
            >
              <Link href={`/zlecenia/${detail.order.id}/edytuj`}>
                <ClipboardEdit className="size-4" aria-hidden />
                Edytuj zlecenie
              </Link>
            </Button>
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
              {stageSequence.map((stage, index) => {
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
                        {stageLabelsRecord[stage] ?? stage}
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
              <span className="text-[11px] text-muted-foreground">Wymagają reakcji zespołu.</span>
            </CardContent>
          </Card>
          <Card className="rounded-2xl border-none bg-primary/10 shadow-lg shadow-primary/20">
            <CardContent className="flex flex-col gap-1 p-4">
              <span className="text-xs uppercase text-primary/80">Nadchodzący krok</span>
              {nextUpcomingEvent ? (
                <>
                  <span className="text-sm font-semibold text-foreground">{nextUpcomingEvent.label}</span>
                  <span className="text-xl font-semibold text-primary">
                    {format(nextUpcomingEvent.date, 'dd MMM yyyy', { locale: pl })}
                  </span>
                  {nextUpcomingEvent.description ? (
                    <span className="text-[11px] text-primary/80">{nextUpcomingEvent.description}</span>
                  ) : null}
                </>
              ) : (
                <span className="text-sm text-primary/80">Brak zaplanowanych terminów.</span>
              )}
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
          {!isDeliveryOnly ? (
            <>
              <TabsTrigger value="measurements">
                <Ruler className="size-4" aria-hidden />
                Pomiary
              </TabsTrigger>
              <TabsTrigger value="installations">
                <HardHat className="size-4" aria-hidden />
                Montaże
              </TabsTrigger>
            </>
          ) : null}
          <TabsTrigger value="deliveries">
            <Package className="size-4" aria-hidden />
            {isDeliveryOnly ? 'Dostawy' : 'Dostawa pod montaż'}
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
              <CardHeader className="flex flex-col gap-3">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <CardTitle>Parametry inwestycji</CardTitle>
                    <CardDescription>
                      Kluczowe informacje liczbowe i preferencje materiałowe. Edytuj je w locie bez opuszczania karty.
                    </CardDescription>
                  </div>
                  {!isDeliveryOnly ? (
                    <OrderParametersDialog
                      detail={detail}
                      panelProducts={panelProductOptions}
                      baseboardProducts={baseboardProductOptions}
                    />
                  ) : null}
                </div>
                {isDeliveryOnly ? (
                  <p className="text-xs text-muted-foreground/80">
                    Parametry montażowe są ukryte, ponieważ zlecenie działa w trybie dostawy.
                  </p>
                ) : null}
              </CardHeader>
              <CardContent>
                {isDeliveryOnly ? (
                  <div className="flex flex-col items-center justify-center gap-2 rounded-2xl border border-dashed border-border/70 bg-muted/30 p-6 text-center">
                    <ClipboardList className="size-6 text-muted-foreground" aria-hidden />
                    <p className="text-sm text-muted-foreground">
                      Tryb „Tylko dostawa” ukrywa parametry inwestycji. Przełącz na pełny montaż, aby edytować dane.
                    </p>
                  </div>
                ) : (
                  <dl className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                    <div className="space-y-1">
                      <dt className="text-xs uppercase text-muted-foreground">Deklarowana powierzchnia</dt>
                      <dd className="text-sm font-medium text-foreground">
                        {detail.order.declaredFloorArea
                          ? `${numberFormatter.format(detail.order.declaredFloorArea)} m²`
                          : 'Brak danych'}
                      </dd>
                    </div>
                    <div className="space-y-1">
                      <dt className="text-xs uppercase text-muted-foreground">Deklarowane listwy</dt>
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
                      <dt className="text-xs uppercase text-muted-foreground">Preferencje paneli</dt>
                      <dd className="text-sm font-medium text-foreground">
                        {detail.order.panelPreference ?? 'Brak danych'}
                      </dd>
                    </div>
                    <div className="space-y-1">
                      <dt className="text-xs uppercase text-muted-foreground">Preferencje listew</dt>
                      <dd className="text-sm font-medium text-foreground">
                        {detail.order.baseboardPreference ?? 'Brak danych'}
                      </dd>
                    </div>
                    <div className="space-y-1">
                      <dt className="text-xs uppercase text-muted-foreground">Preferowany produkt paneli</dt>
                      <dd className="text-sm font-medium text-foreground">
                        {detail.order.preferredPanelProductName ?? 'Nie wybrano'}
                      </dd>
                    </div>
                    <div className="space-y-1">
                      <dt className="text-xs uppercase text-muted-foreground">Preferowany produkt listew</dt>
                      <dd className="text-sm font-medium text-foreground">
                        {detail.order.preferredBaseboardProductName ?? 'Nie wybrano'}
                      </dd>
                    </div>
                    <div className="space-y-1">
                      <dt className="text-xs uppercase text-muted-foreground">Status dokumentów</dt>
                      <dd className="flex flex-wrap gap-2">
                        {documentFlags.map((flag) => (
                          <Badge
                            key={flag.key}
                            className={
                              'rounded-full px-3 py-1 text-xs font-semibold ' +
                              (flag.active
                                ? 'border border-emerald-500/50 bg-emerald-500/10 text-emerald-600'
                                : 'border border-border text-muted-foreground')
                            }
                          >
                            {flag.label}
                          </Badge>
                        ))}
                      </dd>
                    </div>
                    <div className="space-y-1">
                      <dt className="text-xs uppercase text-muted-foreground">Etap procesu</dt>
                      <dd className="text-sm font-medium text-foreground">{stageLabel}</dd>
                    </div>
                  </dl>
                )}
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

              <Card>
                <CardHeader>
                  <CardTitle>Właściciel procesu</CardTitle>
                  <CardDescription>Osoba odpowiedzialna operacyjnie za zlecenie.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-1 text-sm text-muted-foreground">
                  <div className="font-semibold text-foreground">
                    {detail.order.ownerName ?? 'Nie przypisano'}
                  </div>
                  {detail.order.ownerPhone ? <div>Tel.: {detail.order.ownerPhone}</div> : null}
                  {detail.order.ownerEmail ? <div>{detail.order.ownerEmail}</div> : null}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Przypisany monter</CardTitle>
                  <CardDescription>Ekipę możesz zmienić w edycji zlecenia.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-1 text-sm text-muted-foreground">
                  <div className="font-semibold text-foreground">
                    {detail.order.assignedInstallerName ?? 'Nie przypisano'}
                  </div>
                  {detail.order.assignedInstallerPhone ? <div>Tel.: {detail.order.assignedInstallerPhone}</div> : null}
                  {detail.order.assignedInstallerEmail ? <div>{detail.order.assignedInstallerEmail}</div> : null}
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
                <CardTitle>{isDeliveryOnly ? 'Checklist logistyki dostaw' : 'Checklist montażu'}</CardTitle>
                <CardDescription>
                  {isDeliveryOnly
                    ? 'Kontroluj kroki finansowe i operacyjne związane z trybem „Tylko dostawa”.'
                    : 'Monitoruj kolejne działania związane z realizacją montażu.'}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {isDeliveryOnly ? (
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
                          label: 'Opinia klienta',
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
                ) : (
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
                          label: 'Opinia klienta',
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
                )}
              </CardContent>
            </Card>
          </div>

        </TabsContent>

        {!isDeliveryOnly ? (
          <>
            <TabsContent value="measurements" className="space-y-6">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h3 className="text-base font-semibold text-foreground">Pomiary i wizje lokalne</h3>
                  <p className="text-sm text-muted-foreground">Synchronizuj harmonogram pomiaru z dostawami i montażem.</p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <Button
                    asChild
                    size="sm"
                    className="rounded-full bg-amber-500 px-4 py-2 text-sm font-semibold text-amber-950 shadow-sm shadow-amber-500/30 hover:bg-amber-500/90"
                  >
                    <Link href={measurementCreateHref}>Dodaj pomiar</Link>
                  </Button>
                  <Button
                    asChild
                    variant="ghost"
                    size="sm"
                    className="rounded-full text-sm font-semibold text-muted-foreground hover:text-primary"
                  >
                    <Link href={measurementModuleHref}>Przegląd modułu</Link>
                  </Button>
                </div>
              </div>

              {measurementEntries.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {measurementStatusOrder.map((status) => (
                    <Badge
                      key={status}
                      className={`rounded-full px-3 py-1 text-xs font-semibold ${
                        measurementStatusBadgeClasses[status] ?? 'bg-muted text-muted-foreground'
                      }`}
                    >
                      {measurementStatusLabels[status]}: {measurementStatusSummary[status] ?? 0}
                    </Badge>
                  ))}
                </div>
              ) : null}

              {measurementEntries.length === 0 ? (
                <Card className="rounded-3xl border border-border/60">
                  <CardContent className="p-6">
                    <Empty>
                      <EmptyMedia variant="icon">
                        <Ruler className="size-6" aria-hidden />
                      </EmptyMedia>
                      <EmptyHeader>
                        <EmptyTitle>Brak pomiarów</EmptyTitle>
                        <EmptyDescription>Zaplanuj pomiar, aby zsynchronizować przygotowanie materiałów.</EmptyDescription>
                      </EmptyHeader>
                    </Empty>
                  </CardContent>
                </Card>
              ) : (
                measurementEntries.map((measurement) => {
                  const measurementReference = measurement.id.slice(0, 6).toUpperCase()
                  const statusBadge = measurementStatusBadgeClasses[measurement.status] ?? 'bg-muted text-muted-foreground'
                  const statusLabel = measurementStatusLabels[measurement.status]
                  const measurementModuleLink = `/pomiary?measurement=${measurement.id}`
                  const deliveryTimingLabel = measurement.deliveryTimingType
                    ? deliveryTimingLabels[measurement.deliveryTimingType]
                    : 'Nie określono'
                  const plannedDelivery =
                    measurement.deliveryTimingType === 'DAYS_BEFORE'
                      ? typeof measurement.deliveryDaysBefore === 'number'
                        ? `${measurement.deliveryDaysBefore} dni przed montażem`
                        : 'Nie określono'
                      : measurement.deliveryDate
                        ? formatDate(measurement.deliveryDate)
                        : 'Nie określono'

                  return (
                    <Card key={measurement.id} className="rounded-3xl border border-border/60">
                      <CardHeader className="flex flex-col gap-3">
                        <div className="flex flex-wrap items-start justify-between gap-3">
                          <CardTitle className="flex items-center gap-2 text-lg">
                            <Ruler className="size-5 text-primary" aria-hidden />
                            Pomiar
                            <span className="rounded-full bg-muted px-2 py-0.5 text-xs font-semibold text-muted-foreground">
                              #{measurementReference}
                            </span>
                          </CardTitle>
                          <div className="flex flex-wrap items-center gap-2">
                            <Badge className={`rounded-full px-3 py-1 text-xs font-semibold ${statusBadge}`}>
                              {statusLabel}
                            </Badge>
                            <Button
                              asChild
                              variant="outline"
                              size="sm"
                              className="rounded-full border-amber-400/40 text-amber-600 shadow-sm hover:border-amber-500 hover:text-amber-600"
                            >
                              <Link href={measurementModuleLink}>Otwórz moduł pomiarów</Link>
                            </Button>
                          </div>
                        </div>
                        <CardDescription className="text-sm text-muted-foreground">
                          {measurement.measuredAt
                            ? `Zarejestrowano ${formatDateTime(measurement.measuredAt, 'brak daty')}`
                            : measurement.scheduledAt
                              ? `Plan na ${formatDateTime(measurement.scheduledAt)}`
                              : 'Brak terminu pomiaru'}
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-4 text-sm text-muted-foreground">
                        <div className="grid gap-4 sm:grid-cols-2">
                          <div>
                            <div className="text-xs uppercase">Planowany termin</div>
                            <div className="text-foreground text-sm font-medium">
                              {formatDateTime(measurement.scheduledAt, 'Nie ustalono')}
                            </div>
                          </div>
                          <div>
                            <div className="text-xs uppercase">Data pomiaru</div>
                            <div className="text-foreground text-sm font-medium">
                              {formatDateTime(measurement.measuredAt, 'Nie wykonano')}
                            </div>
                          </div>
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
                        </div>
                        <Separator />
                        <div className="grid gap-4 sm:grid-cols-2">
                          <div>
                            <div className="text-xs uppercase">Docinki</div>
                            <div className="text-foreground text-sm font-medium">
                              {typeof measurement.offcutPercent === 'number'
                                ? `${measurement.offcutPercent}%`
                                : 'Nie określono'}
                            </div>
                          </div>
                          <div>
                            <div className="text-xs uppercase">Produkt paneli</div>
                            <div className="text-foreground text-sm font-medium">
                              {measurement.panelProductName ?? 'Brak'}
                            </div>
                          </div>
                          <div>
                            <div className="text-xs uppercase">Plan dostawy</div>
                            <div className="text-foreground text-sm font-medium">{deliveryTimingLabel}</div>
                          </div>
                          <div>
                            <div className="text-xs uppercase">Szczegóły dostawy</div>
                            <div className="text-foreground text-sm font-medium">{plannedDelivery}</div>
                          </div>
                        </div>
                        {measurement.additionalNotes ? (
                          <div className="rounded-2xl bg-muted/60 p-4 text-sm text-muted-foreground">
                            {measurement.additionalNotes}
                          </div>
                        ) : null}
                        <div className="flex flex-wrap items-center gap-4 text-xs text-muted-foreground">
                          <span>Załączniki: {measurement.attachmentsCount}</span>
                          <span>Korekty: {measurement.adjustmentsCount}</span>
                          <span>Zarejestrowano: {formatDateTime(measurement.createdAt)}</span>
                        </div>
                      </CardContent>
                    </Card>
                  )
                })
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
                detail.installations.map((installation) => {
                  const installationReference = installation.installationNumber ?? installation.id.slice(0, 6).toUpperCase()
                  const installationModuleHref = {
                    pathname: '/montaze',
                    query: { q: installationReference },
                  } as const

                  return (
                    <Card key={installation.id} className="rounded-3xl border border-border/60">
                      <CardHeader className="flex flex-col gap-3">
                        <div className="flex flex-wrap items-start justify-between gap-3">
                          <CardTitle className="flex flex-wrap items-center gap-2 text-lg">
                            <HardHat className="size-5 text-primary" aria-hidden />
                            Harmonogram montażu
                            <span className="rounded-full bg-muted px-2 py-0.5 text-xs font-semibold text-muted-foreground">
                              #{installationReference}
                            </span>
                          </CardTitle>
                          <Button
                            asChild
                            variant="outline"
                            size="sm"
                            className="rounded-full border-primary/40 text-primary shadow-sm hover:border-primary hover:text-primary"
                          >
                            <Link href={installationModuleHref}>Otwórz w module montaży</Link>
                          </Button>
                        </div>
                        <CardDescription>Status: {installation.statusLabel}</CardDescription>
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
                  )
                })
              )}
            </TabsContent>
          </>
        ) : null}

        <TabsContent value="deliveries" className="space-y-4">
          {deliveriesForView.length === 0 ? (
            <Card className="rounded-3xl border border-border/60">
              <CardContent className="p-6">
                <Empty>
                  <EmptyMedia variant="icon">
                    <Package className="size-6" aria-hidden />
                  </EmptyMedia>
                  <EmptyHeader>
                    <EmptyTitle>Brak dostaw</EmptyTitle>
                    <EmptyDescription>
                      {isDeliveryOnly
                        ? 'Dodaj dostawę w trybie „Tylko dostawa”, aby kontrolować przepływ towaru.'
                        : 'Dodaj transport powiązany z montażem, aby zsynchronizować logistykę materiałów.'}
                    </EmptyDescription>
                  </EmptyHeader>
                </Empty>
              </CardContent>
            </Card>
          ) : (
            deliveriesForView.map((delivery) => {
              const deliveryReference = delivery.deliveryNumber ?? delivery.id.slice(0, 6).toUpperCase()
              const deliveriesModuleHref =
                delivery.type === 'FOR_INSTALLATION'
                  ? `/dostawy-pod-montaz?delivery=${deliveryReference}`
                  : `/dostawy?delivery=${deliveryReference}`
              const moduleButtonLabel =
                delivery.type === 'FOR_INSTALLATION'
                  ? 'Otwórz moduł dostaw pod montaż'
                  : 'Otwórz moduł dostaw'
              const deliveryStageIndex = Math.max(0, deliveryStageSequence.indexOf(delivery.stage))
              const deliveryStageTotal = deliveryStageSequence.length
              const deliveryStageProgress = Math.round(
                ((deliveryStageIndex + 1) / deliveryStageTotal) * 100
              )
              const deliveryAddressParts = [
                delivery.shippingAddressStreet,
                delivery.shippingAddressPostalCode,
                delivery.shippingAddressCity,
              ].filter(Boolean)
              const deliveryStatusFlags = [
                {
                  label: 'Faktura proforma',
                  completed: delivery.proformaIssued,
                },
                {
                  label: 'Faktura zaliczkowa/końcowa',
                  completed: delivery.depositOrFinalInvoiceIssued,
                },
                {
                  label: 'Transport zlecony',
                  completed: delivery.shippingOrdered,
                },
                {
                  label: 'Opinia klienta',
                  completed: delivery.reviewReceived,
                },
              ]

              return (
                <Card key={delivery.id} className="rounded-3xl border border-border/60">
                  <CardHeader className="flex flex-col gap-3">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <CardTitle className="flex flex-wrap items-center gap-2 text-lg">
                        <Package className="size-5 text-primary" aria-hidden />
                        {delivery.type === 'FOR_INSTALLATION' ? 'Dostawa pod montaż' : 'Tylko dostawa'}
                        <span className="rounded-full bg-muted px-2 py-0.5 text-xs font-semibold text-muted-foreground">
                          #{deliveryReference}
                        </span>
                      </CardTitle>
                      <Button
                        asChild
                        variant="outline"
                        size="sm"
                        className="rounded-full border-amber-400/40 text-amber-600 shadow-sm hover:border-amber-500 hover:text-amber-600"
                      >
                        <Link href={deliveriesModuleHref}>{moduleButtonLabel}</Link>
                      </Button>
                    </div>
                    <CardDescription>Status: {delivery.stageLabel}</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-5 text-sm text-muted-foreground">
                    <div className="space-y-3 rounded-2xl border border-border/60 bg-background/60 p-4">
                      <div className="flex flex-wrap items-center justify-between text-xs font-medium text-muted-foreground">
                        <span>Postęp procesu dostawy</span>
                        <span>
                          Etap {deliveryStageIndex + 1} z {deliveryStageTotal}
                        </span>
                      </div>
                      <Progress
                        value={deliveryStageProgress}
                        className="h-2"
                        aria-label={`Postęp dostawy ${deliveryReference}`}
                      />
                      <ol className="space-y-2">
                        {deliveryStageSequence.map((stage, index) => {
                          const isCompleted = index < deliveryStageIndex
                          const isCurrent = index === deliveryStageIndex
                          const StageIcon = isCompleted ? CheckCircle2 : isCurrent ? Clock : Circle

                          return (
                            <li
                              key={stage}
                              className="flex items-start gap-3 rounded-2xl border border-border/40 bg-background/80 p-3"
                            >
                              <span
                                className={`mt-0.5 inline-flex items-center justify-center rounded-full p-1 ${
                                  isCompleted
                                    ? 'bg-emerald-500/15 text-emerald-600'
                                    : isCurrent
                                      ? 'bg-primary/15 text-primary'
                                      : 'bg-muted text-muted-foreground'
                                }`}
                                aria-hidden="true"
                              >
                                <StageIcon className="size-4" />
                              </span>
                              <div className="flex flex-col gap-1">
                                <span
                                  className={`text-sm font-medium ${
                                    isCurrent
                                      ? 'text-foreground'
                                      : isCompleted
                                        ? 'text-muted-foreground'
                                        : 'text-muted-foreground/80'
                                  }`}
                                >
                                  {deliveryStageLabels[stage]}
                                </span>
                                {deliveryStageDescriptions[stage] ? (
                                  <span className="text-xs text-muted-foreground/80">
                                    {deliveryStageDescriptions[stage]}
                                  </span>
                                ) : null}
                              </div>
                            </li>
                          )
                        })}
                      </ol>
                    </div>

                    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                      <div className="space-y-3 rounded-2xl border border-border/60 bg-muted/30 p-4">
                        <h4 className="text-xs uppercase text-muted-foreground">Harmonogram</h4>
                        <dl className="space-y-2">
                          <div>
                            <dt className="text-xs text-muted-foreground/80">Planowana data</dt>
                            <dd className="text-sm font-medium text-foreground">
                              {formatDate(delivery.scheduledDate)}
                            </dd>
                          </div>
                          <div>
                            <dt className="text-xs text-muted-foreground/80">Zarejestrowano</dt>
                            <dd className="text-sm font-medium text-foreground">
                              {formatDateTime(delivery.createdAt)}
                            </dd>
                          </div>
                          <div>
                            <dt className="text-xs text-muted-foreground/80">Wymaga uwagi</dt>
                            <dd className="text-sm font-medium text-foreground">
                              {delivery.requiresAdminAttention ? 'Tak' : 'Nie'}
                            </dd>
                          </div>
                        </dl>
                      </div>

                      <div className="space-y-3 rounded-2xl border border-border/60 bg-muted/30 p-4">
                        <h4 className="text-xs uppercase text-muted-foreground">Pakiet i adres</h4>
                        <dl className="space-y-2">
                          <div>
                            <dt className="text-xs text-muted-foreground/80">Panele</dt>
                            <dd className="text-sm font-medium text-foreground">
                              {delivery.includePanels ? delivery.panelProductName ?? 'Tak' : 'Nie'}
                            </dd>
                          </div>
                          <div>
                            <dt className="text-xs text-muted-foreground/80">Listwy</dt>
                            <dd className="text-sm font-medium text-foreground">
                              {delivery.includeBaseboards ? delivery.baseboardProductName ?? 'Tak' : 'Nie'}
                            </dd>
                          </div>
                          <div>
                            <dt className="text-xs text-muted-foreground/80">Adres wysyłki</dt>
                            <dd className="text-sm font-medium text-foreground">
                              {deliveryAddressParts.length
                                ? deliveryAddressParts.join(', ')
                                : 'Nie ustawiono'}
                            </dd>
                          </div>
                        </dl>
                      </div>

                      <div className="space-y-3 rounded-2xl border border-border/60 bg-muted/30 p-4">
                        <h4 className="text-xs uppercase text-muted-foreground">Dokumenty i feedback</h4>
                        <ul className="space-y-2">
                          {deliveryStatusFlags.map((item) => (
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
                              <span className={item.completed ? 'text-foreground' : 'text-muted-foreground'}>
                                {item.label}
                              </span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>

                    {delivery.notes ? (
                      <div className="rounded-2xl bg-muted/60 p-4 text-sm text-muted-foreground">
                        {delivery.notes}
                      </div>
                    ) : null}

                    <div className="flex flex-wrap items-center gap-4 text-xs text-muted-foreground">
                      <span>Załączniki: {delivery.attachmentsCount}</span>
                      {delivery.requiresAdminAttention ? (
                        <span className="text-red-600">Flaga administracyjna aktywna</span>
                      ) : null}
                    </div>
                  </CardContent>
                </Card>
              )
            })
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
          {detail.client ? (
            <OrderClientAttachmentsCard
              clientId={detail.client.id}
              clientFullName={detail.client.fullName}
              orderId={detail.order.id}
              attachments={serializedClientAttachments}
            />
          ) : (
            <Card className="rounded-3xl border border-border/60">
              <CardHeader>
                <CardTitle>Załączniki klienta</CardTitle>
                <CardDescription>Przypisz klienta do zlecenia, aby dodać dokumenty do jego repozytorium.</CardDescription>
              </CardHeader>
              <CardContent className="text-sm text-muted-foreground">
                To zlecenie nie ma przypisanego klienta, dlatego nie ma dostępu do folderu z dokumentami klienta.
              </CardContent>
            </Card>
          )}
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
