import Link from 'next/link'

import { Users, UserPlus2, Workflow } from 'lucide-react'

import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { requireRole } from '@/lib/auth'
import { getClientsDashboardData } from '@/lib/clients'

import { ClientsTable } from './clients-table'

const numberFormatter = new Intl.NumberFormat('pl-PL')

export const metadata = {
  title: 'Klienci',
  description: 'Rejestr klientów wraz z powiązanymi partnerami i zleceniami.',
}

export default async function ClientsPage() {
  await requireRole(['ADMIN']);
  const { metrics, clients } = await getClientsDashboardData()

  const openRatio = metrics.totalClients > 0 ? Math.round((metrics.clientsWithOpenOrders / metrics.totalClients) * 100) : 0

  return (
    <div className="flex flex-col gap-6 lg:gap-8">
      <section className="rounded-3xl border border-border/60 bg-gradient-to-br from-background via-background to-primary/10 p-6 shadow-sm lg:p-8">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
          <div className="space-y-3">
            <Badge variant="outline" className="rounded-full border-primary/50 text-primary">
              Klienci
            </Badge>
            <div className="space-y-2">
              <h1 className="text-3xl font-semibold tracking-tight text-foreground lg:text-4xl">Portfel klientów w jednym miejscu</h1>
              <p className="max-w-2xl text-sm text-muted-foreground lg:text-base">
                Monitoruj aktywność klientów i powiązanych partnerów. Ten rejestr stanowi fundament pracy zespołu sprzedaży oraz produkcji – od leadu po montaż.
              </p>
            </div>
            <div className="inline-flex items-center gap-2 rounded-full border border-primary/40 bg-primary/10 px-4 py-2 text-xs font-medium text-primary">
              Aktywne zlecenia posiada {metrics.clientsWithOpenOrders}/{metrics.totalClients} klientów ({openRatio}%)
            </div>
          </div>
          <div className="flex w-full flex-col gap-3 lg:w-auto lg:items-end">
            <Button asChild className="inline-flex items-center gap-2 rounded-full px-5 py-2">
              <Link href="/klienci/nowy">
                <UserPlus2 className="size-4" aria-hidden /> Dodaj klienta
              </Link>
            </Button>
            <div className="grid w-full grid-cols-1 gap-3 sm:grid-cols-3">
            <Card className="rounded-2xl border-none bg-background/80 shadow-lg shadow-primary/10">
              <CardContent className="flex flex-col gap-1 p-4">
                <span className="text-xs uppercase text-muted-foreground">Łącznie klientów</span>
                <span className="text-2xl font-semibold text-foreground">{numberFormatter.format(metrics.totalClients)}</span>
              </CardContent>
            </Card>
            <Card className="rounded-2xl border-none bg-emerald-500/10 shadow-lg shadow-emerald-500/20">
              <CardContent className="flex flex-col gap-1 p-4">
                <span className="text-xs uppercase text-emerald-900/80 dark:text-emerald-100/80">Z aktywnymi zleceniami</span>
                <span className="text-2xl font-semibold text-emerald-900 dark:text-emerald-100">{numberFormatter.format(metrics.clientsWithOpenOrders)}</span>
              </CardContent>
            </Card>
            <Card className="rounded-2xl border-none bg-sky-500/10 shadow-lg shadow-sky-500/20">
              <CardContent className="flex flex-col gap-1 p-4">
                <span className="text-xs uppercase text-sky-900/80 dark:text-sky-100/80">Nowi w tym miesiącu</span>
                <span className="text-2xl font-semibold text-sky-900 dark:text-sky-100">{numberFormatter.format(metrics.newThisMonth)}</span>
              </CardContent>
            </Card>
            </div>
          </div>
        </div>
      </section>

      <section className="grid gap-4 lg:grid-cols-3">
        <Card className="rounded-3xl border border-border/60">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Klienci bez partnera</CardTitle>
            <UserPlus2 className="size-4 text-muted-foreground" aria-hidden />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-semibold text-foreground">
              {numberFormatter.format(clients.filter((client) => !client.partnerName).length)}
            </div>
            <p className="text-xs text-muted-foreground">Warto przypisać partnera, aby usprawnić obsługę leadów.</p>
          </CardContent>
        </Card>
        <Card className="rounded-3xl border border-border/60">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Aktywne zlecenia</CardTitle>
            <Workflow className="size-4 text-muted-foreground" aria-hidden />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-semibold text-foreground">
              {numberFormatter.format(clients.reduce((acc, client) => acc + client.openOrders, 0))}
            </div>
            <p className="text-xs text-muted-foreground">Suma otwartych zleceń we wszystkich etapach.</p>
          </CardContent>
        </Card>
        <Card className="rounded-3xl border border-border/60">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Średnio zleceń na klienta</CardTitle>
            <Users className="size-4 text-muted-foreground" aria-hidden />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-semibold text-foreground">
              {metrics.totalClients > 0
                ? (clients.reduce((acc, client) => acc + client.totalOrders, 0) / metrics.totalClients).toFixed(1)
                : '0.0'}
            </div>
            <p className="text-xs text-muted-foreground">Pomoże identyfikować klientów o największym potencjale.</p>
          </CardContent>
        </Card>
      </section>

      <Separator className="border-border/60" />

  <ClientsTable data={clients} />
    </div>
  )
}
