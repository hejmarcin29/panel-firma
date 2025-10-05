'use client'

import { useActionState } from 'react'
import { useFormStatus } from 'react-dom'
import Link from 'next/link'
import { ArrowLeft, Package, Save, Truck, Warehouse } from 'lucide-react'

import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'

import { createDeliveryAction } from '../actions'
import { INITIAL_DELIVERY_FORM_STATE } from '../initial-state'

export type SelectOption = {
  id: string
  label: string
}

export type OptionItem = {
  value: string
  label: string
}

type NewDeliveryFormProps = {
  clients: SelectOption[]
  orders: SelectOption[]
  installations: SelectOption[]
  panelProducts: SelectOption[]
  baseboardProducts: SelectOption[]
  typeOptions: OptionItem[]
  stageOptions: OptionItem[]
  defaultClientId?: string
}

function FieldError({ message }: { message?: string }) {
  if (!message) {
    return null
  }
  return <p className="text-xs font-medium text-destructive">{message}</p>
}

function SubmitButton() {
  const { pending } = useFormStatus()

  return (
    <Button type="submit" className="w-full gap-2 rounded-full" disabled={pending}>
      <Save className="size-4" aria-hidden />
      {pending ? 'Zapisywanie…' : 'Dodaj dostawę'}
    </Button>
  )
}

export function NewDeliveryForm({
  clients,
  orders,
  installations,
  panelProducts,
  baseboardProducts,
  typeOptions,
  stageOptions,
  defaultClientId,
}: NewDeliveryFormProps) {
  const [state, action] = useActionState(createDeliveryAction, INITIAL_DELIVERY_FORM_STATE)
  const errors = state.status === 'error' ? state.errors ?? {} : {}

  return (
    <form className="space-y-6" action={action}>
      <Card className="border border-border/60 shadow-lg shadow-primary/10">
        <CardHeader className="space-y-2">
          <CardTitle className="flex items-center gap-2 text-lg text-foreground">
            <Truck className="size-5 text-primary" aria-hidden />
            Szczegóły dostawy
          </CardTitle>
          <CardDescription>Ustal podstawowe informacje o dostawie i powiązaniach ze zleceniem.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
            <Badge className="rounded-full bg-primary/10 text-primary">Nowa dostawa</Badge>
            <span>Planowanie transportu i dokumentacji dla klienta.</span>
          </div>

          <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
            <div className="space-y-2">
              <Label htmlFor="type">Typ dostawy</Label>
              <select
                id="type"
                name="type"
                required
                defaultValue={typeOptions[0]?.value ?? ''}
                className="h-11 w-full rounded-xl border border-border/60 bg-background px-3 text-sm text-foreground shadow-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/30"
                aria-invalid={errors.type ? 'true' : 'false'}
              >
                {typeOptions.map((type) => (
                  <option key={type.value} value={type.value}>
                    {type.label}
                  </option>
                ))}
              </select>
              <FieldError message={errors.type} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="clientId">Klient</Label>
              <select
                id="clientId"
                name="clientId"
                required
                defaultValue={defaultClientId ?? ''}
                className="h-11 w-full rounded-xl border border-border/60 bg-background px-3 text-sm text-foreground shadow-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/30"
                aria-invalid={errors.clientId ? 'true' : 'false'}
              >
                <option value="" disabled>
                  Wybierz klienta…
                </option>
                {clients.map((client) => (
                  <option key={client.id} value={client.id}>
                    {client.label}
                  </option>
                ))}
              </select>
              <FieldError message={errors.clientId} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="stage">Status dostawy</Label>
              <select
                id="stage"
                name="stage"
                defaultValue={stageOptions[0]?.value ?? 'RECEIVED'}
                className="h-11 w-full rounded-xl border border-border/60 bg-background px-3 text-sm text-foreground shadow-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/30"
              >
                {stageOptions.map((stage) => (
                  <option key={stage.value} value={stage.value}>
                    {stage.label}
                  </option>
                ))}
              </select>
              <FieldError message={errors.stage} />
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
            <div className="space-y-2">
              <Label htmlFor="orderId">Powiązane zlecenie</Label>
              <select
                id="orderId"
                name="orderId"
                defaultValue=""
                className="h-11 w-full rounded-xl border border-border/60 bg-background px-3 text-sm text-foreground shadow-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/30"
              >
                <option value="">Brak</option>
                {orders.map((order) => (
                  <option key={order.id} value={order.id}>
                    {order.label}
                  </option>
                ))}
              </select>
              <FieldError message={errors.orderId} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="installationId">Powiązany montaż</Label>
              <select
                id="installationId"
                name="installationId"
                defaultValue=""
                className="h-11 w-full rounded-xl border border-border/60 bg-background px-3 text-sm text-foreground shadow-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/30"
              >
                <option value="">Brak</option>
                {installations.map((installation) => (
                  <option key={installation.id} value={installation.id}>
                    {installation.label}
                  </option>
                ))}
              </select>
              <FieldError message={errors.installationId} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="scheduledDate">Planowana data wysyłki</Label>
              <Input id="scheduledDate" name="scheduledDate" type="date" />
              <FieldError message={errors.scheduledDate} />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="border border-border/60 shadow-sm">
        <CardHeader className="space-y-2">
          <CardTitle className="flex items-center gap-2 text-lg text-foreground">
            <Package className="size-5 text-primary" aria-hidden />
            Zawartość dostawy
          </CardTitle>
          <CardDescription>Wskaż, jakie materiały i produkty obejmuje ta dostawa.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            <div className="space-y-3 rounded-xl border border-border/60 bg-muted/40 p-4">
              <label className="flex items-center gap-3 text-sm">
                <input type="checkbox" name="includePanels" className="size-4 rounded border-border/70 text-primary focus:ring-primary" />
                <span>Dostawa paneli podłogowych</span>
              </label>
              <div className="space-y-2">
                <Label htmlFor="panelProductId">Model paneli</Label>
                <select
                  id="panelProductId"
                  name="panelProductId"
                  defaultValue=""
                  className="h-11 w-full rounded-xl border border-border/60 bg-background px-3 text-sm text-foreground shadow-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/30"
                >
                  <option value="">Nie wybrano</option>
                  {panelProducts.map((product) => (
                    <option key={product.id} value={product.id}>
                      {product.label}
                    </option>
                  ))}
                </select>
                <FieldError message={errors.panelProductId} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="panelStyle">Opis/kolorystyka paneli</Label>
                <Input id="panelStyle" name="panelStyle" placeholder="np. Dąb jasny, mat" />
                <FieldError message={errors.panelStyle} />
              </div>
            </div>
            <div className="space-y-3 rounded-xl border border-border/60 bg-muted/40 p-4">
              <label className="flex items-center gap-3 text-sm">
                <input type="checkbox" name="includeBaseboards" className="size-4 rounded border-border/70 text-primary focus:ring-primary" />
                <span>Dostawa listew przypodłogowych</span>
              </label>
              <div className="space-y-2">
                <Label htmlFor="baseboardProductId">Model listew</Label>
                <select
                  id="baseboardProductId"
                  name="baseboardProductId"
                  defaultValue=""
                  className="h-11 w-full rounded-xl border border-border/60 bg-background px-3 text-sm text-foreground shadow-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/30"
                >
                  <option value="">Nie wybrano</option>
                  {baseboardProducts.map((product) => (
                    <option key={product.id} value={product.id}>
                      {product.label}
                    </option>
                  ))}
                </select>
                <FieldError message={errors.baseboardProductId} />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="border border-border/60 shadow-sm">
        <CardHeader className="space-y-2">
          <CardTitle className="flex items-center gap-2 text-lg text-foreground">
            <Warehouse className="size-5 text-primary" aria-hidden />
            Adres i uwagi
          </CardTitle>
          <CardDescription>Dane do dostawy oraz dodatkowe informacje dla magazynu i logistyki.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
            <div className="space-y-2">
              <Label htmlFor="shippingAddressStreet">Ulica</Label>
              <Input id="shippingAddressStreet" name="shippingAddressStreet" placeholder="np. ul. Spacerowa 12" />
              <FieldError message={errors.shippingAddressStreet} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="shippingAddressCity">Miasto</Label>
              <Input id="shippingAddressCity" name="shippingAddressCity" placeholder="np. Warszawa" />
              <FieldError message={errors.shippingAddressCity} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="shippingAddressPostalCode">Kod pocztowy</Label>
              <Input id="shippingAddressPostalCode" name="shippingAddressPostalCode" placeholder="np. 01-234" />
              <FieldError message={errors.shippingAddressPostalCode} />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Notatki do dokumentów lub kuriera</Label>
            <Textarea
              id="notes"
              name="notes"
              rows={3}
              placeholder="np. Prośba o kontakt 30 min przed dostawą, winda towarowa, rozładunek od tyłu budynku"
            />
            <FieldError message={errors.notes} />
          </div>
        </CardContent>
      </Card>

      <Card className="border border-border/60 shadow-sm">
        <CardHeader className="space-y-2">
          <CardTitle className="text-lg text-foreground">Status dokumentów i płatności</CardTitle>
          <CardDescription>Zaznacz, które czynności zostały już wykonane.</CardDescription>
        </CardHeader>
  <CardContent className="grid grid-cols-1 gap-3 md:grid-cols-2">
          <label className="flex items-center gap-3 rounded-xl border border-border/60 bg-muted/40 px-4 py-3 text-sm">
            <input type="checkbox" name="proformaIssued" className="size-4 rounded border-border/70 text-primary focus:ring-primary" />
            <span>Wystawiono proformę</span>
          </label>
          <label className="flex items-center gap-3 rounded-xl border border-border/60 bg-muted/40 px-4 py-3 text-sm">
            <input
              type="checkbox"
              name="depositOrFinalInvoiceIssued"
              className="size-4 rounded border-border/70 text-primary focus:ring-primary"
            />
            <span>Faktura zaliczkowa/finalna wystawiona</span>
          </label>
          <label className="flex items-center gap-3 rounded-xl border border-border/60 bg-muted/40 px-4 py-3 text-sm">
            <input type="checkbox" name="shippingOrdered" className="size-4 rounded border-border/70 text-primary focus:ring-primary" />
            <span>Zamówiono transport</span>
          </label>
          <label className="flex items-center gap-3 rounded-xl border border-border/60 bg-muted/40 px-4 py-3 text-sm">
            <input type="checkbox" name="reviewReceived" className="size-4 rounded border-border/70 text-primary focus:ring-primary" />
            <span>Otrzymano opinię klienta</span>
          </label>
          <label className="flex items-center gap-3 rounded-xl border border-border/60 bg-muted/40 px-4 py-3 text-sm md:col-span-2">
            <input type="checkbox" name="requiresAdminAttention" className="size-4 rounded border-border/70 text-primary focus:ring-primary" />
            <span>Oznacz jako wymagające reakcji administratora</span>
          </label>
        </CardContent>
      </Card>

      {state.status === 'error' && state.message ? (
        <Alert variant="destructive">
          <AlertTitle>Nie udało się zapisać dostawy</AlertTitle>
          <AlertDescription>{state.message}</AlertDescription>
        </Alert>
      ) : null}

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <Button variant="outline" asChild className="gap-2 rounded-full">
          <Link href="/dostawy">
            <ArrowLeft className="size-4" aria-hidden />
            Wróć do listy dostaw
          </Link>
        </Button>
        <SubmitButton />
      </div>
    </form>
  )
}
