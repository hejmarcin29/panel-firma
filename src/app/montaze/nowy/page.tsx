import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { requireRole } from '@/lib/auth'
import { installationStatusOptions } from '@/lib/installations/constants'
import { listClientsForSelect } from '@/lib/clients'
import { listOrdersForSelect } from '@/lib/orders'
import { listUsersForSelect } from '@/lib/users'
import { listProductsForSelect } from '@/lib/products'
import { listPartnersForSelect } from '@/lib/partners'
import { Building2, ClipboardList, Wrench } from 'lucide-react'

import { NewInstallationForm } from './new-installation-form'
export const metadata = {
  title: 'Nowy montaż',
  description: 'Zaplanuj montaż dla wybranego zlecenia i zespołu monterskiego.',
}

type NewInstallationPageProps = {
  searchParams?: Promise<{
    clientId?: string
    orderId?: string
    scope?: string
  }>
}
export default async function NewInstallationPage({ searchParams }: NewInstallationPageProps) {
  await requireRole(['ADMIN'])
  
  const resolvedSearchParams = searchParams ? await searchParams : undefined
  const preselectedClientId = resolvedSearchParams?.clientId ?? null
  const preselectedOrderId = resolvedSearchParams?.orderId ?? null
  const scope = resolvedSearchParams?.scope === 'baseboard' ? 'baseboard' : 'standard'

  const [clients, orders, installers, panelProducts, baseboardProducts, partners] = await Promise.all([
    listClientsForSelect(),
    listOrdersForSelect({ stages: ['BEFORE_INSTALLATION', 'AWAITING_FINAL_PAYMENT', 'BEFORE_DELIVERY', 'RECEIVED', 'BEFORE_QUOTE', 'BEFORE_MEASUREMENT'] }),
    listUsersForSelect({ role: 'MONTER' }),
    listProductsForSelect({ types: ['PANEL'] }),
    listProductsForSelect({ types: ['BASEBOARD'] }),
    listPartnersForSelect(),
  ])

  const statusOptions = installationStatusOptions

  return (
    <div className="flex flex-col gap-6 lg:gap-8">
      <section className="rounded-3xl border border-border/60 bg-gradient-to-br from-background via-background to-emerald-200/20 p-6 shadow-sm lg:p-8">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
          <div className="space-y-3">
            <Badge variant="outline" className="rounded-full border-emerald-500/50 text-emerald-600">
              Nowy montaż
            </Badge>
            <div className="space-y-2">
              <h1 className="text-3xl font-semibold tracking-tight text-foreground lg:text-4xl">
                Zaplanuj ekipę montażową
              </h1>
              <p className="max-w-2xl text-sm text-muted-foreground lg:text-base">
                Powiąż montaż z konkretnym zleceniem, wybierz ekipę i określ planowane terminy, aby zsynchronizować prace
                z dostawami i pomiarami.
              </p>
            </div>
          </div>
          <div className="grid w-full grid-cols-1 gap-3 sm:grid-cols-3 lg:w-auto">
            <Card className="rounded-2xl border-none bg-background/80 shadow-lg shadow-emerald-500/10">
              <CardContent className="flex flex-col gap-1 p-4">
                <span className="text-xs uppercase text-muted-foreground">Aktywne zlecenia</span>
                <span className="flex items-center gap-2 text-2xl font-semibold text-foreground">
                  <ClipboardList className="size-5 text-emerald-600" aria-hidden />
                  {orders.length}
                </span>
              </CardContent>
            </Card>
            <Card className="rounded-2xl border-none bg-emerald-500/10 shadow-lg shadow-emerald-500/20">
              <CardContent className="flex flex-col gap-1 p-4">
                <span className="text-xs uppercase text-emerald-600">Dostępne ekipy</span>
                <span className="flex items-center gap-2 text-2xl font-semibold text-emerald-600">
                  <Wrench className="size-5" aria-hidden />
                  {installers.length}
                </span>
              </CardContent>
            </Card>
            <Card className="rounded-2xl border-none bg-muted/60 shadow-lg shadow-muted/20">
              <CardContent className="flex flex-col gap-1 p-4">
                <span className="text-xs uppercase text-muted-foreground">Produkty</span>
                <span className="flex items-center gap-2 text-2xl font-semibold text-foreground">
                  <Building2 className="size-5 text-muted-foreground" aria-hidden />
                  {panelProducts.length + baseboardProducts.length}
                </span>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      <NewInstallationForm
        clients={clients}
        partners={partners.map((partner) => ({ id: partner.id, label: partner.label }))}
        orders={orders.map((order) => ({ id: order.id, label: order.label }))}
        installers={installers.map((installer) => ({ id: installer.id, label: installer.label }))}
        panelProducts={panelProducts.map((product) => ({ id: product.id, label: product.label }))}
        defaultOrderId={preselectedOrderId ?? undefined}
        scope={scope}
        baseboardProducts={baseboardProducts.map((product) => ({ id: product.id, label: product.label }))}
        statusOptions={statusOptions}
        defaultClientId={preselectedClientId ?? undefined}
      />
    </div>
  )
}
