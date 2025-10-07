'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { format } from 'date-fns'
import { pl } from 'date-fns/locale'
import { Activity, AlertTriangle, CalendarClock, CheckCircle2, Filter, Search } from 'lucide-react'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { ButtonGroup, ButtonGroupText } from '@/components/ui/button-group'
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from '@/components/ui/empty'
import { Input } from '@/components/ui/input'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { cn } from '@/lib/utils'
import type { MeasurementListItem } from '@/lib/measurements'
import { deliveryTimingLabels, measurementStatusBadgeClasses, measurementStatusLabels } from '@/lib/measurements/constants'

const STATUS_FILTERS = [
  { value: 'ALL', label: 'Wszystkie', icon: Activity },
  { value: 'PENDING', label: 'Do potwierdzenia', icon: AlertTriangle },
  { value: 'PLANNED', label: 'Zaplanowane', icon: CalendarClock },
  { value: 'OVERDUE', label: 'Po terminie', icon: AlertTriangle },
  { value: 'COMPLETED', label: 'Zrealizowane', icon: CheckCircle2 },
] as const

type StatusFilter = (typeof STATUS_FILTERS)[number]['value']

function parseDate(value: string | Date | null | undefined) {
  if (!value) {
    return null
  }
  if (value instanceof Date) {
    return value
  }
  const parsed = new Date(value)
  return Number.isNaN(parsed.getTime()) ? null : parsed
}

function formatDateTime(value: string | Date | null | undefined) {
  const date = parseDate(value)
  if (!date) {
    return '—'
  }
  return format(date, 'dd MMM yyyy HH:mm', { locale: pl })
}

type MeasurementsTableProps = {
  measurements: MeasurementListItem[]
}

export function MeasurementsTable({ measurements }: MeasurementsTableProps) {
  const [query, setQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('ALL')
  const router = useRouter()

  const statusCounts = useMemo(() => {
    return measurements.reduce(
      (acc, measurement) => {
        acc.ALL += 1
        acc[measurement.status] = (acc[measurement.status] ?? 0) + 1
        return acc
      },
      {
        ALL: 0,
        PENDING: 0,
        PLANNED: 0,
        OVERDUE: 0,
        COMPLETED: 0,
      } as Record<StatusFilter | 'PENDING' | 'PLANNED' | 'OVERDUE' | 'COMPLETED', number>,
    )
  }, [measurements])

  const filteredMeasurements = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase()
    return measurements.filter((measurement) => {
      const matchesStatus = statusFilter === 'ALL' ? true : measurement.status === statusFilter

      if (!matchesStatus) {
        return false
      }

      if (!normalizedQuery) {
        return true
      }

      const tokens = [
        measurement.orderReference,
        measurement.clientName,
        measurement.clientCity ?? '',
        measurement.panelProductName ?? '',
      ]
        .filter(Boolean)
        .map((value) => value.toLowerCase())

      return tokens.some((token) => token.includes(normalizedQuery))
    })
  }, [measurements, query, statusFilter])

  const handleNavigate = (orderId: string) => {
    router.push(`/zlecenia/${orderId}?highlight=pomiary`)
  }

  return (
    <section className="flex flex-col gap-4">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h2 className="text-lg font-semibold text-foreground">Lista pomiarów</h2>
          <p className="text-sm text-muted-foreground">Filtruj po statusie lub kliencie, by znaleźć interesujące Cię zlecenie.</p>
        </div>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-end">
          <div className="flex flex-col gap-1">
            <ButtonGroupText className="text-xs uppercase tracking-wide text-muted-foreground">
              <Filter className="size-3.5" aria-hidden /> Status
            </ButtonGroupText>
            <ButtonGroup className="rounded-full border border-border/60 bg-muted/40 p-1">
              {STATUS_FILTERS.map((option) => {
                const Icon = option.icon
                return (
                  <Button
                    key={option.value}
                    type="button"
                    size="sm"
                    variant="ghost"
                    onClick={() => setStatusFilter(option.value)}
                    className={cn(
                      'rounded-full px-4 text-sm font-medium transition',
                      statusFilter === option.value
                        ? 'bg-amber-500 text-amber-50 shadow-sm hover:bg-amber-500/90'
                        : 'text-muted-foreground hover:bg-background/60',
                    )}
                  >
                    <Icon className="mr-2 size-3.5" aria-hidden />
                    <span>{option.label}</span>
                    <span className="ml-2 text-xs font-semibold opacity-70">
                      {statusCounts[option.value as keyof typeof statusCounts] ?? 0}
                    </span>
                  </Button>
                )
              })}
            </ButtonGroup>
          </div>
          <div className="relative w-full sm:w-72">
            <Search className="text-muted-foreground absolute left-3 top-1/2 size-4 -translate-y-1/2" aria-hidden />
            <Input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Szukaj po kliencie, zleceniu, produkcie..."
              className="pl-9"
            />
          </div>
        </div>
      </div>

      <div className="rounded-3xl border border-border/60 bg-card shadow-sm">
        {filteredMeasurements.length === 0 ? (
          <Empty className="border-0">
            <EmptyMedia variant="icon">
              <Search className="size-6" aria-hidden />
            </EmptyMedia>
            <EmptyHeader>
              <EmptyTitle>Brak pomiarów pasujących do kryteriów</EmptyTitle>
              <EmptyDescription>
                Zmień filtr statusu lub wyszukiwane hasło, aby zobaczyć inne wpisy.
              </EmptyDescription>
            </EmptyHeader>
            <EmptyContent>
              <Input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Wyczyść filtr" className="max-w-xs" />
            </EmptyContent>
          </Empty>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Zlecenie</TableHead>
                <TableHead>Klient</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Terminy</TableHead>
                <TableHead>Parametry</TableHead>
                <TableHead className="text-right">Załączniki</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredMeasurements.map((measurement) => (
                <TableRow
                  key={measurement.id}
                  className="cursor-pointer transition hover:bg-muted/50"
                  onClick={() => handleNavigate(measurement.orderId)}
                >
                  <TableCell className="space-y-1">
                    <div className="font-medium text-foreground">{measurement.orderReference}</div>
                    <div className="text-xs text-muted-foreground">
                      Dodano {formatDateTime(measurement.createdAt)}
                    </div>
                  </TableCell>
                  <TableCell className="space-y-1">
                    <div className="text-sm font-medium text-foreground">{measurement.clientName}</div>
                    <div className="text-xs text-muted-foreground">
                      {measurement.clientCity ? `${measurement.clientCity} • ` : ''}
                      {measurement.measuredBy ? `Pomiar: ${measurement.measuredBy}` : 'Pomiar: nie przypisano'}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge className={cn('rounded-full px-3 py-0.5 text-xs font-semibold', measurementStatusBadgeClasses[measurement.status])}>
                      {measurementStatusLabels[measurement.status]}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground">
                    <div>Plan: {formatDateTime(measurement.scheduledAt)}</div>
                    <div>Zrealizowano: {formatDateTime(measurement.measuredAt)}</div>
                    <div>
                      Dostawa: {renderDeliveryPlan(measurement.deliveryTimingType, measurement.deliveryDaysBefore, measurement.deliveryDate)}
                    </div>
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground">
                    <div>Pow. {measurement.measuredFloorArea ? `${measurement.measuredFloorArea.toFixed(1)} m²` : '—'}</div>
                    <div>Listwy {measurement.measuredBaseboardLength ? `${measurement.measuredBaseboardLength.toFixed(1)} mb` : '—'}</div>
                    <div>Docinki {measurement.offcutPercent ? `${measurement.offcutPercent.toFixed(0)}%` : '—'}</div>
                  </TableCell>
                  <TableCell className="text-right text-sm font-medium text-foreground">
                    {measurement.attachmentsCount}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-dashed border-border/60 bg-muted/40 p-4 text-xs text-muted-foreground">
        <span>
          Kliknięcie w wiersz przenosi do szczegółów zlecenia z wyróżnioną sekcją pomiarów. W zakładce zlecenia możesz dodawać korekty i załączniki.
        </span>
        <Button asChild size="sm" variant="secondary" className="rounded-full">
          <Link href="/pomiary/nowy">Dodaj nowy pomiar</Link>
        </Button>
      </div>
    </section>
  )
}

function renderDeliveryPlan(
  type: MeasurementListItem['deliveryTimingType'],
  daysBefore: MeasurementListItem['deliveryDaysBefore'],
  deliveryDate: MeasurementListItem['deliveryDate'],
) {
  if (type === 'DAYS_BEFORE') {
    if (typeof daysBefore === 'number' && Number.isFinite(daysBefore)) {
      return `Dni przed montażem: ${daysBefore}`
    }
    return `${deliveryTimingLabels.DAYS_BEFORE} — brak danych`
  }

  const formatted = formatDateTime(deliveryDate)
  return `${deliveryTimingLabels.EXACT_DATE}: ${formatted}`
}
