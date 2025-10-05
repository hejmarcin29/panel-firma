import { ShieldCheck, UserCog, UserPlus } from 'lucide-react'

import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'

import { getUsersDashboardData } from '@/lib/users'

import { UsersTable } from './users-table'

export const metadata = {
  title: 'Użytkownicy',
  description: 'Przegląd kont i ról w panelu zarządzania firmą.',
}

export default async function UsersPage() {
  const { metrics, roleBreakdown, users } = await getUsersDashboardData()

  const highlightedRole = roleBreakdown.reduce((top, current) => {
    if (!top || current.count > top.count) {
      return current
    }
    return top
  }, roleBreakdown[0] ?? null)

  return (
    <div className="flex flex-col gap-6 lg:gap-8">
      <section className="rounded-3xl border border-border/60 bg-gradient-to-br from-background via-background to-primary/10 p-6 shadow-sm lg:p-8">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
          <div className="space-y-3">
            <Badge variant="outline" className="rounded-full border-primary/50 text-primary">
              Użytkownicy
            </Badge>
            <div className="space-y-2">
              <h1 className="text-3xl font-semibold tracking-tight text-foreground lg:text-4xl">
                Zarządzaj dostępami i rolami
              </h1>
              <p className="max-w-2xl text-sm text-muted-foreground lg:text-base">
                Monitoruj aktywność zespołu, dbaj o uprawnienia i szybko reaguj na zalegające konta. Ten rejestr
                integruje administratorów, monterów oraz partnerów biznesowych.
              </p>
            </div>
            {highlightedRole ? (
              <div className="inline-flex items-center gap-2 rounded-full border border-primary/40 bg-primary/10 px-4 py-2 text-xs font-medium text-primary">
                Najliczniejsza grupa: <span className="font-semibold">{highlightedRole.label}</span> ({highlightedRole.count})
              </div>
            ) : null}
          </div>
          <div className="grid w-full grid-cols-2 gap-3 lg:w-auto lg:grid-cols-1">
            <Card className="rounded-2xl border-none bg-background/80 shadow-lg shadow-primary/10">
              <CardContent className="flex flex-col gap-1 p-4">
                <span className="text-xs uppercase text-muted-foreground">Łącznie kont</span>
                <span className="text-2xl font-semibold text-foreground">{metrics.totalUsers}</span>
              </CardContent>
            </Card>
            <Card className="rounded-2xl border-none bg-emerald-500/10 shadow-lg shadow-emerald-500/20">
              <CardContent className="flex flex-col gap-1 p-4">
                <span className="text-xs uppercase text-emerald-900/80 dark:text-emerald-100/80">Aktywne w ostatnich 30 dniach</span>
                <span className="text-2xl font-semibold text-emerald-900 dark:text-emerald-100">{metrics.activeThisMonth}</span>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      <section className="grid gap-4 lg:grid-cols-3">
        <Card className="rounded-3xl border border-border/60">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Administratorzy</CardTitle>
            <ShieldCheck className="size-4 text-muted-foreground" aria-hidden />
          </CardHeader>
          <CardContent className="space-y-1">
            <span className="text-2xl font-semibold text-foreground">{metrics.admins}</span>
            <p className="text-xs text-muted-foreground">Pełne uprawnienia i konfiguracja systemu.</p>
          </CardContent>
        </Card>

        <Card className="rounded-3xl border border-border/60">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Monterzy</CardTitle>
            <UserCog className="size-4 text-muted-foreground" aria-hidden />
          </CardHeader>
          <CardContent className="space-y-1">
            <span className="text-2xl font-semibold text-foreground">{metrics.installers}</span>
            <p className="text-xs text-muted-foreground">Zespoły realizujące montaże i raportujące postępy.</p>
          </CardContent>
        </Card>

        <Card className="rounded-3xl border border-border/60">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Partnerzy</CardTitle>
            <UserPlus className="size-4 text-muted-foreground" aria-hidden />
          </CardHeader>
          <CardContent className="space-y-1">
            <span className="text-2xl font-semibold text-foreground">{metrics.partners}</span>
            <p className="text-xs text-muted-foreground">Sprzedaż i obsługa klientów w terenie.</p>
          </CardContent>
        </Card>
      </section>

      <Separator className="border-border/60" />

      <UsersTable metrics={metrics} roleBreakdown={roleBreakdown} users={users} />
    </div>
  )
}
