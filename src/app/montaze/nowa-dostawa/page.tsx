import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { requireRole } from '@/lib/auth'
import { deliveryStageLabels } from '@/lib/deliveries'
import { listInstallationsForSelect } from '@/lib/installations'
import { listProductsForSelect } from '@/lib/products'
import { deliveryStages, type InstallationStatus } from '@db/schema'
import { HardHat, Package, Truck } from 'lucide-react'

import { DeliveryForInstallationForm } from './delivery-for-installation-form'

export const metadata = {
  title: 'Dostawa do montażu',
  description: 'Utwórz dostawę materiałów powiązaną z harmonogramem montażu.',
}

const activeStatuses: InstallationStatus[] = ['PLANNED', 'SCHEDULED', 'IN_PROGRESS']

type InstallationDeliveryPageProps = {
  searchParams?: Promise<{
    orderId?: string
    installationId?: string
  }>
}

export default async function InstallationDeliveryPage({ searchParams }: InstallationDeliveryPageProps) {
  await requireRole(['ADMIN'])
  
  const resolvedSearchParams = searchParams ? await searchParams : undefined
  const requestedOrderIdRaw = resolvedSearchParams?.orderId?.trim()
  const requestedOrderId = requestedOrderIdRaw && requestedOrderIdRaw.length > 0 ? requestedOrderIdRaw : undefined
  const requestedInstallationIdRaw = resolvedSearchParams?.installationId?.trim()
  const requestedInstallationId =
    requestedInstallationIdRaw && requestedInstallationIdRaw.length > 0 ? requestedInstallationIdRaw : undefined

  let installations = requestedOrderId
    ? await listInstallationsForSelect({ orderId: requestedOrderId, statuses: activeStatuses })
    : await listInstallationsForSelect({ statuses: activeStatuses })

  if (requestedOrderId && installations.length === 0) {
    installations = await listInstallationsForSelect({ statuses: activeStatuses })
  }

  const [panelProducts, baseboardProducts] = await Promise.all([
    listProductsForSelect({ types: ['PANEL'] }),
    listProductsForSelect({ types: ['BASEBOARD'] }),
  ])

  const stageOptions = deliveryStages.map((stage) => ({
    value: stage,
    label: deliveryStageLabels[stage],
  }))

  const defaultInstallationId = installations.some((installation) => installation.id === requestedInstallationId)
    ? requestedInstallationId
    : requestedOrderId && installations.length === 1
      ? installations[0]?.id
      : undefined

  const totalInstallations = installations.length
  const plannedCount = installations.filter((installation) => installation.status === 'PLANNED').length
  const scheduledOrInProgress = installations.filter((installation) => installation.status === 'SCHEDULED' || installation.status === 'IN_PROGRESS').length

  return (
    <div className="flex flex-col gap-6 lg:gap-8">
      <section className="rounded-3xl border border-border/60 bg-gradient-to-br from-background via-background to-emerald-200/20 p-6 shadow-sm lg:p-8">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
          <div className="space-y-3">
            <Badge variant="outline" className="rounded-full border-emerald-500/50 text-emerald-600">
              Nowa dostawa pod montaż
            </Badge>
            <div className="space-y-2">
              <h1 className="text-3xl font-semibold tracking-tight text-foreground lg:text-4xl">Zsynchronizuj logistykę z ekipą</h1>
              <p className="max-w-2xl text-sm text-muted-foreground lg:text-base">
                Wybierz montaż, dla którego chcesz zamówić transport materiałów. System automatycznie powiąże dostawę z
                właściwym klientem i zleceniem, utrzymując spójny pipeline.
              </p>
            </div>
          </div>
          <div className="grid w-full grid-cols-1 gap-3 sm:grid-cols-3 lg:w-auto">
            <Card className="rounded-2xl border-none bg-background/80 shadow-lg shadow-emerald-500/10">
              <CardContent className="flex flex-col gap-1 p-4">
                <span className="text-xs uppercase text-muted-foreground">Montaże do obsłużenia</span>
                <span className="flex items-center gap-2 text-2xl font-semibold text-foreground">
                  <HardHat className="size-5 text-emerald-600" aria-hidden />
                  {totalInstallations}
                </span>
              </CardContent>
            </Card>
            <Card className="rounded-2xl border-none bg-emerald-500/10 shadow-lg shadow-emerald-500/20">
              <CardContent className="flex flex-col gap-1 p-4">
                <span className="text-xs uppercase text-emerald-600">Zaplanowane</span>
                <span className="flex items-center gap-2 text-2xl font-semibold text-emerald-600">
                  <Truck className="size-5" aria-hidden />
                  {scheduledOrInProgress}
                </span>
              </CardContent>
            </Card>
            <Card className="rounded-2xl border-none bg-muted/60 shadow-lg shadow-muted/20">
              <CardContent className="flex flex-col gap-1 p-4">
                <span className="text-xs uppercase text-muted-foreground">Do potwierdzenia</span>
                <span className="flex items-center gap-2 text-2xl font-semibold text-foreground">
                  <Package className="size-5 text-muted-foreground" aria-hidden />
                  {plannedCount}
                </span>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      <DeliveryForInstallationForm
        installations={installations.map((installation) => ({ id: installation.id, label: installation.label }))}
        stageOptions={stageOptions}
        panelProducts={panelProducts.map((product) => ({ id: product.id, label: product.label }))}
        baseboardProducts={baseboardProducts.map((product) => ({ id: product.id, label: product.label }))}
        defaultInstallationId={defaultInstallationId}
      />
    </div>
  )
}
