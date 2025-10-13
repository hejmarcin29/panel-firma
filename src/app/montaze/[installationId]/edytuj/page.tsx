import { notFound } from 'next/navigation'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { HardHat, Package } from 'lucide-react'

import { requireRole } from '@/lib/auth'
import { getInstallationForEdit } from '@/lib/installations'
import { installationStatusOptions } from '@/lib/installations/constants'
import { listClientsForSelect } from '@/lib/clients'
import { listOrdersForSelect } from '@/lib/orders'
import { listUsersForSelect } from '@/lib/users'
import { listProductsForSelect } from '@/lib/products'

import { InstallationForm } from '../../_components/installation-form'
import { updateInstallationAction } from '../../actions'

export const metadata = {
  title: 'Edytuj montaż',
  description: 'Aktualizuj szczegóły montażu, harmonogram i status.',
}

type EditInstallationPageParams = Promise<{ installationId: string }>

export default async function EditInstallationPage({ params }: { params: EditInstallationPageParams }) {
  await requireRole(['ADMIN'])

  const resolvedParams = await params
  const installationId = resolvedParams.installationId

  const [installation, clients, orders, installers, panelProducts, baseboardProducts] = await Promise.all([
    getInstallationForEdit(installationId),
    listClientsForSelect(),
    listOrdersForSelect(),
    listUsersForSelect(),
    listProductsForSelect({ types: ['PANEL'] }),
    listProductsForSelect({ types: ['BASEBOARD'] }),
  ])

  if (!installation) {
    notFound()
  }

  const statusOptions = installationStatusOptions

  const summaryCards = [
    {
      label: 'Klient',
      value: installation.order?.client?.fullName ?? 'Nieznany',
      icon: Package,
    },
    {
      label: 'Status montażu',
      value: statusOptions.find((opt) => opt.value === installation.status)?.label ?? 'Nieznany',
      icon: HardHat,
    },
  ]

  return (
    <div className="flex flex-col gap-6">
      <section className="flex flex-col gap-4 rounded-3xl border border-border/60 bg-gradient-to-br from-emerald-50/50 via-background to-emerald-100/30 p-6 shadow-sm dark:from-emerald-950/20 dark:to-emerald-900/10">
        <div className="space-y-3">
          <Badge variant="outline" className="rounded-full border-emerald-500/50 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300">
            Edycja montażu
          </Badge>
          <div className="space-y-2">
            <h1 className="text-3xl font-semibold tracking-tight text-foreground">
              Aktualizuj montaż #{installation.installationNumber || installationId.slice(0, 8)}
            </h1>
            <p className="max-w-2xl text-sm text-muted-foreground">
              Edytuj szczegóły montażu, zaktualizuj harmonogram lub zmień status realizacji.
            </p>
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          {summaryCards.map((card) => {
            const Icon = card.icon
            return (
              <Card key={card.label} className="rounded-2xl border border-border/60 bg-background/80 shadow-sm">
                <CardContent className="flex items-center gap-3 p-4">
                  <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-emerald-500/10">
                    <Icon className="size-5 text-emerald-600 dark:text-emerald-400" aria-hidden />
                  </div>
                  <div className="flex flex-col">
                    <span className="text-xs text-muted-foreground">{card.label}</span>
                    <span className="text-sm font-semibold text-foreground">{card.value}</span>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      </section>

      <InstallationForm
        mode="edit"
        clients={clients}
        orders={orders}
        installers={installers}
        panelProducts={panelProducts}
        baseboardProducts={baseboardProducts}
        statusOptions={statusOptions}
        actionFunction={updateInstallationAction}
        initialValues={{
          installationId: installation.id,
          clientId: installation.order?.clientId ?? null,
          orderId: installation.orderId,
          assignedInstallerId: installation.assignedInstallerId,
          status: installation.status,
          scheduledStartAt: installation.scheduledStartAt,
          scheduledEndAt: installation.scheduledEndAt,
          actualStartAt: installation.actualStartAt,
          actualEndAt: installation.actualEndAt,
          addressStreet: installation.addressStreet,
          addressCity: installation.addressCity,
          addressPostalCode: installation.addressPostalCode,
          locationPinUrl: installation.locationPinUrl,
          panelProductId: installation.panelProductId,
          baseboardProductId: installation.baseboardProductId,
          additionalWork: installation.additionalWork,
          additionalInfo: installation.additionalInfo,
          customerNotes: installation.customerNotes,
          handoverProtocolSigned: installation.handoverProtocolSigned,
          reviewReceived: installation.reviewReceived,
          requiresAdminAttention: installation.requiresAdminAttention,
        }}
      />
    </div>
  )
}
