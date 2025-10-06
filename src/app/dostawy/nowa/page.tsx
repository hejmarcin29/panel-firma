import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { listClientsForSelect } from '@/lib/clients'
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
    orderId?: string
    type?: string
  }>
}

export default async function NewDeliveryPage({ searchParams }: NewDeliveryPageProps) {
  const resolvedSearchParams = searchParams ? await searchParams : undefined
  const preselectedClientId = resolvedSearchParams?.clientId ?? null
  const preselectedOrderId = resolvedSearchParams?.orderId ?? null
  const preselectedType = resolvedSearchParams?.type ?? null

  const [clients, orders, panelProducts, baseboardProducts] = await Promise.all([
    listClientsForSelect(),
    listOrdersForSelect({ stages: ['BEFORE_DELIVERY', 'RECEIVED', 'BEFORE_INSTALLATION', 'AWAITING_FINAL_PAYMENT', 'BEFORE_QUOTE', 'BEFORE_MEASUREMENT'] }),
    listProductsForSelect({ types: ['PANEL'] }),
    listProductsForSelect({ types: ['BASEBOARD'] }),
  ])

  const typeOptions = deliveryTypes
    .filter((type) => type === 'STANDALONE')
    .map((type) => ({
      value: type,
      label: deliveryTypeLabels[type],
    }))

  const stageOptions = deliveryStages.map((stage) => ({
    value: stage,
    label: deliveryStageLabels[stage],
  }))

  return (
    <div className="flex flex-col gap-6 lg:gap-8">
      <section className="rounded-3xl border border-border/60 bg-gradient-to-br from-background via-background to-orange-200/20 p-6 shadow-sm lg:p-8">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
          <div className="space-y-3">
            <Badge variant="outline" className="rounded-full border-orange-500/50 text-orange-600">
              Tylko dostawa
            </Badge>
            <div className="space-y-2">
              <h1 className="text-3xl font-semibold tracking-tight text-foreground lg:text-4xl">
                Zaplanuj dostawę w trybie „Tylko dostawa”
              </h1>
              <p className="max-w-2xl text-sm text-muted-foreground lg:text-base">
                Ten formularz obsługuje wysyłki niewymagające ekipy montażowej – tryb „Tylko dostawa”. Jeśli chcesz zsynchronizować dostawę z montażem,
                przejdź do modułu Montaże i dodaj transport bezpośrednio przy harmonogramie brygady.
              </p>
            </div>
          </div>
          <div className="grid w-full grid-cols-1 gap-3 sm:grid-cols-3 lg:w-auto">
            <Card className="rounded-2xl border-none bg-background/80 shadow-lg shadow-orange-500/10">
              <CardContent className="flex flex-col gap-1 p-4">
                <span className="text-xs uppercase text-muted-foreground">Aktywni klienci</span>
                <span className="flex items-center gap-2 text-2xl font-semibold text-foreground">
                  <Truck className="size-5 text-orange-600" aria-hidden />
                  {clients.length}
                </span>
              </CardContent>
            </Card>
            <Card className="rounded-2xl border-none bg-orange-500/10 shadow-lg shadow-orange-500/20">
              <CardContent className="flex flex-col gap-1 p-4">
                <span className="text-xs uppercase text-orange-600">Otwarte zlecenia</span>
                <span className="flex items-center gap-2 text-2xl font-semibold text-orange-600">
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
        clients={clients}
        orders={orders.map((order) => ({ id: order.id, label: order.label }))}
        panelProducts={panelProducts.map((product) => ({ id: product.id, label: product.label }))}
        baseboardProducts={baseboardProducts.map((product) => ({ id: product.id, label: product.label }))}
        typeOptions={typeOptions}
        stageOptions={stageOptions}
        defaultClientId={preselectedClientId ?? undefined}
        defaultOrderId={preselectedOrderId ?? undefined}
        defaultType={preselectedType === 'STANDALONE' ? 'STANDALONE' : undefined}
      />
    </div>
  )
}
