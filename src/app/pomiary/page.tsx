import Link from 'next/link'
import { Metadata } from 'next'
import { formatDistanceToNow } from 'date-fns'
import { pl } from 'date-fns/locale'

import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { cn } from '@/lib/utils'
import { getMeasurementsSnapshot, getMeasurementsList } from '@/lib/measurements'
import { deliveryTimingLabels, measurementStatusBadgeClasses, measurementStatusLabels } from '@/lib/measurements/constants'
import { CalendarClock, CheckCircle2, ClipboardList, LucideIcon, Plus, UploadCloud } from 'lucide-react'

import { MeasurementsTable } from './_components/measurements-table'

export const metadata: Metadata = {
  title: 'Pomiary',
  description: 'Monitoruj status pomiarów oraz zsynchronizuj je z harmonogramem montaży i dostaw.',
}

type StatCardProps = {
  label: string
  value: number
  icon: LucideIcon
  tone?: 'default' | 'accent' | 'success' | 'warning'
}

const STAT_CARD_CLASSES: Record<'default' | 'accent' | 'success' | 'warning', string> = {
  default: 'bg-background/70 text-foreground shadow-amber-500/10',
  accent: 'bg-amber-500/10 text-amber-600 shadow-amber-500/20',
  success: 'bg-emerald-500/10 text-emerald-600 shadow-emerald-500/20',
  warning: 'bg-rose-500/10 text-rose-600 shadow-rose-500/20',
}

export default async function MeasurementsPage() {
  const [snapshot, measurements] = await Promise.all([getMeasurementsSnapshot(), getMeasurementsList(40)])

  const { metrics, recent, distribution } = snapshot

  return (
    <div className="flex flex-col gap-8">
      <section className="rounded-3xl border border-border/60 bg-gradient-to-br from-background via-background to-amber-200/20 p-6 shadow-sm lg:p-8">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
          <div className="space-y-3">
            <Badge variant="outline" className="rounded-full border-amber-500/50 text-amber-600">
              Dashboard pomiarów
            </Badge>
            <div className="space-y-2">
              <h1 className="text-3xl font-semibold tracking-tight text-foreground lg:text-4xl">
                Aktualny stan wizji lokalnych
              </h1>
              <p className="max-w-2xl text-sm text-muted-foreground lg:text-base">
                Kontroluj, które pomiary są zaplanowane, po terminie lub wymagają uzupełnienia planu dostawy. Z tego miejsca przejdziesz do detali zlecenia.
              </p>
            </div>
          </div>
          <div className="flex shrink-0 flex-col gap-3 sm:flex-row sm:items-center">
            <Button asChild size="lg" className="gap-2 rounded-full px-6">
              <Link href="/pomiary/nowy">
                <Plus className="size-5" aria-hidden />
                Dodaj pomiar
              </Link>
            </Button>
            <Button asChild variant="ghost" className="gap-2 rounded-full px-6 text-muted-foreground">
              <Link href="/zlecenia">
                <ClipboardList className="size-5" aria-hidden />
                Przejdź do zleceń
              </Link>
            </Button>
          </div>
        </div>

        <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
          <StatCard label="Łącznie" value={metrics.total} icon={ClipboardList} tone="default" />
          <StatCard label="Zaplanowane" value={metrics.planned} icon={CalendarClock} tone="accent" />
          <StatCard label="Zrealizowane" value={metrics.completed} icon={CheckCircle2} tone="success" />
          <StatCard label="Bez planu dostawy" value={metrics.awaitingDeliveryPlan} icon={UploadCloud} tone="warning" />
        </div>
      </section>

      <section className="grid gap-6 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)] lg:gap-8">
        <Card className="rounded-3xl border-border/60 shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg font-semibold text-foreground">Ostatnie pomiary</CardTitle>
            <CardDescription>Podsumowanie świeżych wizji lokalnych z możliwością przejścia do zlecenia.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {recent.length === 0 ? (
              <p className="rounded-2xl border border-dashed border-border/60 bg-muted/40 p-6 text-sm text-muted-foreground">
                Nie dodano jeszcze żadnych pomiarów. Użyj przycisku „Dodaj pomiar”, aby rozpocząć.
              </p>
            ) : (
              <div className="space-y-4">
                {recent.map((item) => (
                  <div
                    key={item.id}
                    className="group flex flex-col gap-2 rounded-2xl border border-border/60 bg-card/80 p-4 transition hover:border-amber-400 hover:shadow-md hover:shadow-amber-500/10"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Badge className={cn('rounded-full px-3 py-0.5 text-xs font-semibold', measurementStatusBadgeClasses[item.status])}>
                          {measurementStatusLabels[item.status]}
                        </Badge>
                        <span className="font-medium text-foreground">{item.orderReference}</span>
                        <span className="text-muted-foreground">•</span>
                        <span>{item.clientName}</span>
                        {item.clientCity ? <span className="text-muted-foreground">({item.clientCity})</span> : null}
                      </div>
                      <Button asChild variant="ghost" size="sm" className="h-8 gap-2 rounded-full text-sm">
                        <Link href={`/zlecenia/${item.orderId}`}>
                          Szczegóły zlecenia
                        </Link>
                      </Button>
                    </div>
                    <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                      <span>
                        Plan: {item.scheduledAt ? formatRelativeDate(item.scheduledAt) : 'nie ustalono'}
                      </span>
                      <Separator orientation="vertical" className="hidden h-4 lg:block" />
                      <span>Zmierzone: {item.measuredAt ? formatRelativeDate(item.measuredAt) : 'w trakcie'}</span>
                      <Separator orientation="vertical" className="hidden h-4 lg:block" />
                      <span>
                        Powierzchnia: {item.measuredFloorArea ? `${item.measuredFloorArea.toFixed(1)} m²` : 'brak danych'}
                      </span>
                      <Separator orientation="vertical" className="hidden h-4 lg:block" />
                      <span>Korekty: {item.adjustments}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="rounded-3xl border border-border/60 shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg font-semibold text-foreground">Plan dostawy</CardTitle>
            <CardDescription>Dystrybucja form planowania dostaw na podstawie ostatnich pomiarów.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {distribution.length === 0 ? (
              <p className="rounded-2xl border border-dashed border-border/60 bg-muted/40 p-6 text-sm text-muted-foreground">
                Brak danych o planie dostawy. Uzupełnij pola „Plan dostawy materiałów” podczas dodawania pomiaru.
              </p>
            ) : (
              <div className="space-y-3">
                {distribution.map((entry) => (
                  <div key={entry.deliveryTimingType} className="flex items-center justify-between rounded-2xl border border-border/60 bg-muted/30 p-4">
                    <div>
                      <p className="text-sm font-semibold text-foreground">{deliveryTimingLabels[entry.deliveryTimingType]}</p>
                      <p className="text-xs text-muted-foreground">{entry.label}</p>
                    </div>
                    <div className="text-2xl font-semibold text-foreground">{entry.count}</div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </section>

      <MeasurementsTable measurements={measurements} />
    </div>
  )
}

function StatCard({ label, value, icon: Icon, tone = 'default' }: StatCardProps) {
  return (
    <Card className={cn('rounded-2xl border-none shadow-lg', STAT_CARD_CLASSES[tone])}>
      <CardContent className="flex flex-col gap-1 p-4">
        <span className="text-xs uppercase text-muted-foreground">{label}</span>
        <span className="flex items-center gap-2 text-2xl font-semibold">
          <Icon className="size-5" aria-hidden />
          {value}
        </span>
      </CardContent>
    </Card>
  )
}

function formatRelativeDate(value: Date | null | undefined) {
  if (!value) {
    return 'brak danych'
  }

  return formatDistanceToNow(value, { addSuffix: true, locale: pl })
}
