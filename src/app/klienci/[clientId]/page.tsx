import { notFound } from 'next/navigation'
import Link from 'next/link'
import { format, formatDistanceToNow } from 'date-fns'
import { pl } from 'date-fns/locale'
import { ArrowLeft, Building2, ClipboardList, HardHat, MapPin, Phone, Truck, User, Users } from 'lucide-react'

import { Badge } from '@/components/ui/badge'
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from '@/components/ui/empty'
import { Separator } from '@/components/ui/separator'
import { getClientDetail } from '@/lib/clients'
import { orderStageBadgeClasses, orderStageLabels } from '@/lib/order-stage'

const numberFormatter = new Intl.NumberFormat('pl-PL', { maximumFractionDigits: 1 })

export async function generateMetadata({ params }: { params: { clientId: string } }) {
  const detail = await getClientDetail(params.clientId)

  if (!detail) {
    return {
      title: 'Klient',
      description: 'Szczegóły klienta',
    }
  }

  return {
    title: detail.client.fullName,
    description: 'Podsumowanie aktywności i zleceń klienta',
  }
}

export default async function ClientDetailPage({ params }: { params: { clientId: string } }) {
  const detail = await getClientDetail(params.clientId)

  if (!detail) {
    notFound()
  }

  const { client, partner, stats, orders } = detail

  return (
    <div className="flex flex-col gap-6 lg:gap-8">
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink href="/">Dashboard</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbLink href="/klienci">Klienci</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>{client.fullName}</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <section className="rounded-3xl border border-border/60 bg-gradient-to-br from-background via-background to-primary/10 p-6 shadow-sm lg:p-8">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
          <div className="space-y-4">
            <div className="space-y-2">
              <Badge variant="outline" className="rounded-full border-primary/50 text-primary">
                Klient
              </Badge>
              <Badge variant="secondary" className="rounded-full bg-muted/50 text-muted-foreground">
                Nr klienta: #{client.clientNumber}
              </Badge>
              <h1 className="text-3xl font-semibold tracking-tight text-foreground lg:text-4xl">{client.fullName}</h1>
              {client.city || client.street ? (
                <p className="flex items-center gap-2 text-sm text-muted-foreground">
                  <MapPin className="size-4" aria-hidden />
                  {client.street ? `${client.street}, ` : ''}
                  {client.postalCode ? `${client.postalCode} ` : ''}
                  {client.city ?? ''}
                </p>
              ) : null}
            </div>
            <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
              <span>Założono: {format(client.createdAt, 'dd MMM yyyy', { locale: pl })}</span>
              <span>Ostatnia aktualizacja: {format(client.updatedAt, 'dd MMM yyyy', { locale: pl })}</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {client.phone ? (
                <Badge variant="secondary" className="gap-1">
                  <Phone className="size-3" aria-hidden />
                  {client.phone}
                </Badge>
              ) : null}
              {client.email ? (
                <Badge variant="secondary" className="gap-1">
                  <User className="size-3" aria-hidden />
                  {client.email}
                </Badge>
              ) : null}
            </div>
          </div>
          <div className="flex flex-col items-end gap-4">
            <Button variant="outline" asChild className="gap-2 rounded-full">
              <Link href="/klienci">
                <ArrowLeft className="size-4" aria-hidden />
                Wróć do listy
              </Link>
            </Button>
            <div className="flex flex-wrap justify-end gap-2">
              <Button asChild className="gap-2 rounded-full bg-primary text-primary-foreground shadow-primary/20">
                <Link href={`/montaze/nowy?clientId=${client.id}`}>
                  <HardHat className="size-4" aria-hidden />
                  Zaplanuj montaż
                </Link>
              </Button>
              <Button variant="outline" asChild className="gap-2 rounded-full">
                <Link href={`/dostawy/nowa?clientId=${client.id}`}>
                  <Truck className="size-4" aria-hidden />
                  Zaplanuj dostawę
                </Link>
              </Button>
            </div>
            {partner ? (
              <Card className="rounded-2xl border border-border/60 bg-background/80">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Partner opiekujący</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 text-sm text-muted-foreground">
                  <div className="flex items-center gap-2 text-base text-foreground font-semibold">
                    <Building2 className="size-4" aria-hidden />
                    {partner.companyName}
                  </div>
                  {partner.contactName ? <p>Opiekun: {partner.contactName}</p> : null}
                  {partner.contactEmail ? <p>Email: {partner.contactEmail}</p> : null}
                  {partner.contactPhone ? <p>Telefon: {partner.contactPhone}</p> : null}
                </CardContent>
              </Card>
            ) : (
              <Card className="rounded-2xl border border-dashed border-primary/40 bg-primary/5 text-primary">
                <CardContent className="p-4 text-sm">
                  Przypisz partnera, aby zapewnić pełną obsługę klienta.
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </section>

      <section className="grid gap-4 lg:grid-cols-4">
        <Card className="rounded-3xl border border-border/60">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Łącznie zleceń</CardTitle>
            <ClipboardList className="size-4 text-muted-foreground" aria-hidden />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-semibold text-foreground">{stats.totalOrders}</div>
            <p className="text-xs text-muted-foreground">Wszystkie zlecenia przypisane do klienta.</p>
          </CardContent>
        </Card>
        <Card className="rounded-3xl border border-border/60">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Aktywne</CardTitle>
            <Users className="size-4 text-muted-foreground" aria-hidden />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-semibold text-foreground">{stats.openOrders}</div>
            <p className="text-xs text-muted-foreground">Zlecenia w toku wymagające dalszych działań.</p>
          </CardContent>
        </Card>
        <Card className="rounded-3xl border border-border/60">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Zamknięte</CardTitle>
            <ClipboardList className="size-4 text-muted-foreground" aria-hidden />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-semibold text-foreground">{stats.completedOrders}</div>
            <p className="text-xs text-muted-foreground">Zlecenia zakończone statusem „Zakończone”.</p>
          </CardContent>
        </Card>
        <Card className="rounded-3xl border border-border/60">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Ostatnia aktywność</CardTitle>
            <Users className="size-4 text-muted-foreground" aria-hidden />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-semibold text-foreground">
              {stats.lastOrderAt ? formatDistanceToNow(stats.lastOrderAt, { addSuffix: true, locale: pl }) : 'Brak danych'}
            </div>
            <p className="text-xs text-muted-foreground">Na podstawie ostatniej zmiany etapu zlecenia.</p>
          </CardContent>
        </Card>
      </section>

      <Separator className="border-border/60" />

      <section className="grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
        <Card className="rounded-3xl border border-border/60">
          <CardHeader className="pb-4">
            <CardTitle className="text-lg font-semibold text-foreground">Historia zleceń</CardTitle>
            <CardDescription>Lista zleceń w kolejności od najnowszych aktualizacji.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {orders.length === 0 ? (
              <Empty className="border-none">
                <EmptyMedia variant="icon">
                  <ClipboardList className="size-6" aria-hidden />
                </EmptyMedia>
                <EmptyHeader>
                  <EmptyTitle>Brak zleceń</EmptyTitle>
                  <EmptyDescription>
                    Ten klient nie ma jeszcze żadnych zleceń. Zaplanuj montaż lub dostawę – zlecenie zostanie utworzone automatycznie.
                  </EmptyDescription>
                </EmptyHeader>
                <div className="flex flex-wrap items-center justify-center gap-3">
                  <Button asChild className="gap-2 rounded-full bg-primary text-primary-foreground">
                    <Link href={`/montaze/nowy?clientId=${client.id}`}>
                      <HardHat className="size-4" aria-hidden />
                      Zaplanuj montaż
                    </Link>
                  </Button>
                  <Button variant="outline" asChild className="gap-2 rounded-full">
                    <Link href={`/dostawy/nowa?clientId=${client.id}`}>
                      <Truck className="size-4" aria-hidden />
                      Dodaj dostawę
                    </Link>
                  </Button>
                </div>
              </Empty>
            ) : (
              <div className="space-y-3">
                {orders.map((order) => {
                  const badgeVariant = orderStageBadgeClasses[order.stage] ?? 'bg-muted text-foreground'
                  return (
                    <div key={order.id} className="flex flex-col gap-2 rounded-2xl border border-border/60 bg-background/80 p-4">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div className="space-y-1">
                          <p className="text-sm font-semibold text-foreground">
                            {order.title ?? order.orderNumber ?? 'Zlecenie bez nazwy'}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            Ostatnia zmiana: {format(order.stageChangedAt, 'dd MMM yyyy, HH:mm', { locale: pl })}
                          </p>
                        </div>
                        <Badge className={badgeVariant}>{orderStageLabels[order.stage]}</Badge>
                      </div>
                      <div className="flex flex-wrap items-center gap-4 text-xs text-muted-foreground">
                        <span>Wymaga uwagi: {order.requiresAdminAttention ? 'Tak' : 'Nie'}</span>
                        {order.declaredFloorArea ? <span>Powierzchnia: {numberFormatter.format(order.declaredFloorArea)} m²</span> : null}
                        {order.declaredBaseboardLength ? <span>Listwy: {numberFormatter.format(order.declaredBaseboardLength)} mb</span> : null}
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="rounded-3xl border border-border/60">
          <CardHeader className="pb-4">
            <CardTitle className="text-lg font-semibold text-foreground">Notatki i źródła</CardTitle>
            <CardDescription>Główne informacje referencyjne dla zespołu.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 text-sm text-muted-foreground">
            <div>
              <p className="text-xs uppercase tracking-wide text-muted-foreground">Źródło pozyskania</p>
              <p className="mt-1 text-foreground text-base">
                {client.acquisitionSource ? client.acquisitionSource : 'Nie określono'}
              </p>
            </div>
            <Separator className="border-border/40" />
            <div>
              <p className="text-xs uppercase tracking-wide text-muted-foreground">Informacje dodatkowe</p>
              <p className="mt-1 whitespace-pre-wrap text-foreground">
                {client.additionalInfo ? client.additionalInfo : 'Brak dodatkowych notatek.'}
              </p>
            </div>
          </CardContent>
        </Card>
      </section>
    </div>
  )
}
