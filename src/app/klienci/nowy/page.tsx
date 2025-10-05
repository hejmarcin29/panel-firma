import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { getClientTotals } from '@/lib/clients'
import { listPartnersForSelect } from '@/lib/partners'
import { CircleUserRound, Handshake, Users } from 'lucide-react'

import { NewClientForm } from './new-client-form'

export const metadata = {
  title: 'Nowy klient',
  description: 'Dodaj klienta, zaplanuj dalsze działania i rozlicz prowizję partnera sprzedażowego.',
}

export default async function NewClientPage() {
  const [totals, partners] = await Promise.all([getClientTotals(), listPartnersForSelect()])

  const summaryCards = [
    {
      label: 'Łącznie klientów',
      value: totals.totalClients,
      icon: Users,
    },
    {
      label: 'Otwarte zlecenia',
      value: totals.openOrders,
      icon: CircleUserRound,
    },
    {
      label: 'Dostępni partnerzy',
      value: partners.length,
      icon: Handshake,
    },
  ]

  return (
    <div className="flex flex-col gap-6 lg:gap-8">
      <section className="rounded-3xl border border-border/60 bg-gradient-to-br from-background via-background to-primary/10 p-6 shadow-sm lg:p-8">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
          <div className="space-y-3">
            <Badge variant="outline" className="rounded-full border-primary/50 text-primary">
              Nowy klient
            </Badge>
            <div className="space-y-2">
              <h1 className="text-3xl font-semibold tracking-tight text-foreground lg:text-4xl">
                Dodaj klienta i rozpocznij współpracę
              </h1>
              <p className="max-w-2xl text-sm text-muted-foreground lg:text-base">
                Stworzenie rekordu klienta pozwala błyskawicznie planować pomiary, montaże i dostawy. Jeżeli źródłem
                pozyskania jest partner, zaznacz go w formularzu, aby system naliczył odpowiednią prowizję od m².
              </p>
            </div>
          </div>
          <div className="grid w-full grid-cols-1 gap-3 sm:grid-cols-3 lg:w-auto">
            {summaryCards.map(({ label, value, icon: Icon }) => (
              <Card key={label} className="rounded-2xl border-none bg-background/80 shadow-lg shadow-primary/10">
                <CardContent className="flex flex-col gap-1 p-4">
                  <span className="text-xs uppercase text-muted-foreground">{label}</span>
                  <span className="flex items-center gap-2 text-2xl font-semibold text-foreground">
                    <Icon className="size-5 text-primary" aria-hidden />
                    {value}
                  </span>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      <NewClientForm partners={partners.map((partner) => ({ id: partner.id, label: partner.label }))} />
    </div>
  )
}
