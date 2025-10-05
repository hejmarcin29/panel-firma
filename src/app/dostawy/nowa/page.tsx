import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { listClientsForSelect } from '@/lib/clients'
import { listInstallationsForSelect } from '@/lib/installations'
import { deliveryStageLabels, deliveryTypeLabels } from '@/lib/deliveries'
import { listOrdersForSelect } from '@/lib/orders'
import { listProductsForSelect } from '@/lib/products'
import { deliveryStages, deliveryTypes } from '@db/schema'
import { Boxes, ClipboardList, Truck } from 'lucide-react'

import { NewDeliveryForm } from './new-delivery-form'

export const metadata = {
  title: 'Nowa dostawa',
  description: 'Zaplanuj wysyłkę materiałów oraz status dokumentów dla wybranego klienta.',
}

type NewDeliveryPageProps = {
  searchParams?: Promise<{
    clientId?: string
  }>
}

export default async function NewDeliveryPage({ searchParams }: NewDeliveryPageProps) {
  const resolvedSearchParams = searchParams ? await searchParams : undefined
  const preselectedClientId = resolvedSearchParams?.clientId ?? null

  const [clients, orders, installations, panelProducts, baseboardProducts] = await Promise.all([
    listClientsForSelect(),
    listOrdersForSelect({ stages: ['BEFORE_DELIVERY', 'RECEIVED', 'BEFORE_INSTALLATION', 'AWAITING_FINAL_PAYMENT', 'BEFORE_QUOTE', 'BEFORE_MEASUREMENT'] }),
    listInstallationsForSelect(),
    listProductsForSelect({ types: ['PANEL'] }),
    listProductsForSelect({ types: ['BASEBOARD'] }),
  ])

  const typeOptions = deliveryTypes.map((type) => ({
    value: type,
    label: deliveryTypeLabels[type],
  }))

  const stageOptions = deliveryStages.map((stage) => ({
    value: stage,
    label: deliveryStageLabels[stage],
  }))

  return (
    <div className="flex flex-col gap-6 lg:gap-8">
      <section className="rounded-3xl border border-border/60 bg-gradient-to-br from-background via-background to-primary/10 p-6 shadow-sm lg:p-8">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
          <div className="space-y-3">
            <Badge variant="outline" className="rounded-full border-primary/50 text-primary">
              Nowa dostawa
            </Badge>
            <div className="space-y-2">
              <h1 className="text-3xl font-semibold tracking-tight text-foreground lg:text-4xl">
                Zaplanuj logistykę materiałów
              </h1>
              <p className="max-w-2xl text-sm text-muted-foreground lg:text-base">
                Powiąż dostawę z klientem, zleceniem lub montażem i przypilnuj dokumentów, aby zespół wiedział, co i kiedy wyrusza.
              </p>
            </div>
          </div>
          <div className="grid w-full grid-cols-1 gap-3 sm:grid-cols-3 lg:w-auto">
            <Card className="rounded-2xl border-none bg-background/80 shadow-lg shadow-primary/10">
              <CardContent className="flex flex-col gap-1 p-4">
                <span className="text-xs uppercase text-muted-foreground">Aktywni klienci</span>
                <span className="flex items-center gap-2 text-2xl font-semibold text-foreground">
                  <Truck className="size-5 text-primary" aria-hidden />
                  {clients.length}
                </span>
              </CardContent>
            </Card>
            <Card className="rounded-2xl border-none bg-primary/10 shadow-lg shadow-primary/20">
              <CardContent className="flex flex-col gap-1 p-4">
                <span className="text-xs uppercase text-primary">Otwarte zlecenia</span>
                <span className="flex items-center gap-2 text-2xl font-semibold text-primary">
                  <ClipboardList className="size-5" aria-hidden />
                  {orders.length}
                </span>
              </CardContent>
            </Card>
            <Card className="rounded-2xl border-none bg-muted/60 shadow-lg shadow-muted/20">
              <CardContent className="flex flex-col gap-1 p-4">
                <span className="text-xs uppercase text-muted-foreground">Produkty</span>
                <span className="flex items-center gap-2 text-2xl font-semibold text-foreground">
                  <Boxes className="size-5 text-muted-foreground" aria-hidden />
                  {panelProducts.length + baseboardProducts.length}
                </span>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      <NewDeliveryForm
        clients={clients.map((client) => ({ id: client.id, label: client.label }))}
        orders={orders.map((order) => ({ id: order.id, label: order.label }))}
        installations={installations.map((installation) => ({ id: installation.id, label: installation.label }))}
        panelProducts={panelProducts.map((product) => ({ id: product.id, label: product.label }))}
        baseboardProducts={baseboardProducts.map((product) => ({ id: product.id, label: product.label }))}
        typeOptions={typeOptions}
        stageOptions={stageOptions}
        defaultClientId={preselectedClientId ?? undefined}
      />
    </div>
  )
}
