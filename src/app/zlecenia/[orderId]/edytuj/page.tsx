import Link from "next/link"
import { notFound } from "next/navigation"
import { ClipboardEdit, HardHat, Package, User2 } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { requireRole } from "@/lib/auth"
import { listClientsForSelect } from "@/lib/clients"
import { getOrderForEditing } from "@/lib/orders"
import { orderStageLabels } from "@/lib/order-stage"
import { listPartnersForSelect } from "@/lib/partners"
import { listProductsForSelect } from "@/lib/products"
import { listUsersForSelect } from "@/lib/users"
import { orderStages } from "@db/schema"

import { EditOrderForm } from "./edit-order-form"

export const metadata = {
  title: "Edytuj zlecenie",
  description: "Aktualizuj dane zlecenia montażowego oraz flagi procesu.",
}

type EditOrderPageParams = Promise<{ orderId: string }>

export default async function EditOrderPage({ params }: { params: EditOrderPageParams }) {
  await requireRole(['ADMIN'])
  
  const resolvedParams = await params
  const orderId = resolvedParams.orderId

  const [order, clients, partners, users, installers, panelProducts, baseboardProducts] = await Promise.all([
    getOrderForEditing(orderId),
    listClientsForSelect(),
    listPartnersForSelect(),
    listUsersForSelect(),
    listUsersForSelect({ role: "MONTER" }),
    listProductsForSelect({ types: ["PANEL"] }),
    listProductsForSelect({ types: ["BASEBOARD"] }),
  ])

  if (!order) {
    notFound()
  }

  const stageOptions = orderStages.map((stage) => ({
    value: stage,
    label: orderStageLabels[stage],
  }))

  const reference = order.orderNumber ?? order.id.slice(0, 7).toUpperCase()
  const clientLabel = clients.find((client) => client.id === order.clientId)?.label ?? "Klient"

  return (
    <div className="flex flex-col gap-6 lg:gap-8">
      <section className="rounded-3xl border border-border/60 bg-gradient-to-br from-background via-background to-primary/10 p-6 shadow-sm lg:p-8">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
          <div className="space-y-3">
            <Badge variant="outline" className="rounded-full border-primary/50 text-primary">
              Zlecenie #{reference}
            </Badge>
            <div className="space-y-2">
              <h1 className="text-3xl font-semibold tracking-tight text-foreground lg:text-4xl">
                Edytuj parametry zlecenia
              </h1>
              <p className="max-w-2xl text-sm text-muted-foreground lg:text-base">
                Zaktualizuj etap, właściciela oraz informacje administracyjne. Poniżej znajdziesz pełny formularz ze
                wszystkimi polami zlecenia, aby zsynchronizować je z harmonogramem montaży i dostaw.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
              <span>Bieżący etap: {orderStageLabels[order.stage]}</span>
              <span>Klient: {clientLabel}</span>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <Button asChild className="rounded-full bg-primary px-5 py-2 text-sm font-semibold text-primary-foreground shadow-lg shadow-primary/20">
                <Link href={`/zlecenia/${order.id}`}>
                  Wróć do szczegółów
                </Link>
              </Button>
              <Button variant="outline" asChild className="rounded-full border-primary/50 px-5 py-2 text-sm font-semibold text-primary shadow-sm">
                <Link href={`/montaze/nowy?clientId=${order.clientId}`}>
                  Zaplanuj montaż
                </Link>
              </Button>
              <Button variant="ghost" asChild className="inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold text-muted-foreground hover:text-primary">
                <Link href={`/montaze/nowa-dostawa`}>
                  <Package className="size-4" aria-hidden />
                  Dodaj powiązaną dostawę
                </Link>
              </Button>
            </div>
          </div>
          <div className="grid w-full grid-cols-1 gap-3 sm:grid-cols-3 lg:w-auto">
            <Card className="rounded-2xl border-none bg-background/80 shadow-lg shadow-primary/10">
              <CardContent className="flex flex-col gap-1 p-4">
                <span className="text-xs uppercase text-muted-foreground">Klient</span>
                <span className="flex items-center gap-2 text-sm font-semibold text-foreground">
                  <User2 className="size-4 text-primary" aria-hidden />
                  {clientLabel}
                </span>
              </CardContent>
            </Card>
            <Card className="rounded-2xl border-none bg-primary/10 shadow-lg shadow-primary/20">
              <CardContent className="flex flex-col gap-1 p-4">
                <span className="text-xs uppercase text-primary">Etap</span>
                <span className="flex items-center gap-2 text-sm font-semibold text-primary">
                  <ClipboardEdit className="size-4" aria-hidden />
                  {orderStageLabels[order.stage]}
                </span>
              </CardContent>
            </Card>
            <Card className="rounded-2xl border-none bg-muted/60 shadow-lg shadow-muted/20">
              <CardContent className="flex flex-col gap-1 p-4">
                <span className="text-xs uppercase text-muted-foreground">Akcje operacyjne</span>
                <span className="flex items-center gap-2 text-sm font-semibold text-foreground">
                  <HardHat className="size-4 text-muted-foreground" aria-hidden />
                  Montaże i dostawy
                </span>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      <EditOrderForm
        order={order}
        clients={clients.map(({ id, label }) => ({ id, label }))}
        partners={partners}
        users={users.map(({ id, label }) => ({ id, label }))}
        installers={installers.map(({ id, label }) => ({ id, label }))}
        panelProducts={panelProducts.map(({ id, label }) => ({ id, label }))}
        baseboardProducts={baseboardProducts.map(({ id, label }) => ({ id, label }))}
        stageOptions={stageOptions}
      />
    </div>
  )
}
