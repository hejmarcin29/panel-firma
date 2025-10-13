'use client'

import { useActionState, useEffect, useMemo, useState, type ChangeEvent } from 'react'
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
import { AddClientDialog } from '@/components/clients/add-client-dialog'

import { INITIAL_DELIVERY_FORM_STATE } from '../initial-state'

import type { DeliveryStage, DeliveryType } from '@db/schema'
import type { CreateDeliveryFormErrors, CreateDeliveryFormState } from '@/lib/deliveries/schemas'

type DeliveryFormAction = (
  prevState: CreateDeliveryFormState,
  formData: FormData,
) => Promise<CreateDeliveryFormState>

export type SelectOption = {
  id: string
  label: string
}

export type ClientOption = SelectOption & {
  street: string | null
  city: string | null
  postalCode: string | null
}

export type OptionItem = {
  value: string
  label: string
}

export type DeliveryFormInitialValues = {
  deliveryId?: string
  type?: DeliveryType
  clientId?: string
  orderId?: string | null
  installationId?: string | null
  stage?: DeliveryStage
  scheduledDate?: Date | null
  includePanels?: boolean
  panelProductId?: string | null
  panelStyle?: string | null
  includeBaseboards?: boolean
  baseboardProductId?: string | null
  shippingAddressStreet?: string | null
  shippingAddressCity?: string | null
  shippingAddressPostalCode?: string | null
  notes?: string | null
  proformaIssued?: boolean
  depositOrFinalInvoiceIssued?: boolean
  shippingOrdered?: boolean
  reviewReceived?: boolean
  requiresAdminAttention?: boolean
}

type DeliveryFormProps = {
  mode: 'create' | 'edit'
  clients: ClientOption[]
  partners?: SelectOption[]
  orders: SelectOption[]
  panelProducts: SelectOption[]
  baseboardProducts: SelectOption[]
  typeOptions: OptionItem[]
  stageOptions: OptionItem[]
  actionFunction: DeliveryFormAction
  defaultClientId?: string
  defaultOrderId?: string
  defaultType?: DeliveryType
  initialValues?: DeliveryFormInitialValues
  submitLabel?: string
  submitPendingLabel?: string
  backHref?: string
}

function formatDateInput(value?: Date | null) {
  if (!value) {
    return ''
  }

  const year = value.getFullYear()
  const month = `${value.getMonth() + 1}`.padStart(2, '0')
  const day = `${value.getDate()}`.padStart(2, '0')
  return `${year}-${month}-${day}`
}

function FieldError({ message }: { message?: string }) {
  if (!message) {
    return null
  }

  return <p className="text-xs font-medium text-destructive">{message}</p>
}

type SubmitButtonProps = {
  idleLabel: string
  pendingLabel: string
}

function SubmitButton({ idleLabel, pendingLabel }: SubmitButtonProps) {
  const { pending } = useFormStatus()

  return (
    <Button type="submit" className="w-full gap-2 rounded-full" disabled={pending}>
      <Save className="size-4" aria-hidden />
      {pending ? pendingLabel : idleLabel}
    </Button>
  )
}

export function DeliveryForm({
  mode,
  clients,
  partners = [],
  orders,
  panelProducts,
  baseboardProducts,
  typeOptions,
  stageOptions,
  actionFunction,
  defaultClientId,
  defaultOrderId,
  defaultType,
  initialValues,
  submitLabel,
  submitPendingLabel,
  backHref = '/dostawy',
}: DeliveryFormProps) {
  const [state, action] = useActionState(actionFunction, INITIAL_DELIVERY_FORM_STATE)
  const errors: CreateDeliveryFormErrors = state.status === 'error' ? state.errors ?? {} : {}

  const initialClientId = initialValues?.clientId ?? defaultClientId ?? ''
  const [selectedClientId, setSelectedClientId] = useState<string>(initialClientId)
  const [clientsList, setClientsList] = useState<ClientOption[]>(clients)
  
  const selectedClient = useMemo(
    () => clientsList.find((client) => client.id === selectedClientId) ?? null,
    [clientsList, selectedClientId],
  )

  // Callback do obsługi nowo dodanego klienta
  const handleClientCreated = (clientId: string, clientName: string) => {
    const newClient: ClientOption = {
      id: clientId,
      label: clientName,
      street: null,
      city: null,
      postalCode: null,
    }
    setClientsList((prev) => [...prev, newClient])
    setSelectedClientId(clientId)
    setUseClientAddress(false)
  }

  const [useClientAddress, setUseClientAddress] = useState(() =>
    initialValues?.shippingAddressStreet || initialValues?.shippingAddressCity || initialValues?.shippingAddressPostalCode
      ? false
      : true,
  )
  const clientAddressLocked = Boolean(selectedClient) && useClientAddress

  const [shippingAddressStreet, setShippingAddressStreet] = useState(initialValues?.shippingAddressStreet ?? '')
  const [shippingAddressCity, setShippingAddressCity] = useState(initialValues?.shippingAddressCity ?? '')
  const [shippingAddressPostalCode, setShippingAddressPostalCode] = useState(
    initialValues?.shippingAddressPostalCode ?? '',
  )

  useEffect(() => {
    if (clientAddressLocked) {
      setShippingAddressStreet(selectedClient?.street ?? '')
      setShippingAddressCity(selectedClient?.city ?? '')
      setShippingAddressPostalCode(selectedClient?.postalCode ?? '')
    }
  }, [clientAddressLocked, selectedClient])

  const [scheduledDateValue, setScheduledDateValue] = useState(() =>
    formatDateInput(initialValues?.scheduledDate ?? null),
  )

  const handleScheduledDateChange = (event: ChangeEvent<HTMLInputElement>) => {
    setScheduledDateValue(event.target.value)
  }

  const submitIdleLabel = submitLabel ?? (mode === 'create' ? 'Dodaj dostawę' : 'Zapisz dostawę')
  const submitPending = submitPendingLabel ?? 'Zapisywanie…'

  const selectedType = initialValues?.type ?? defaultType ?? (typeOptions[0]?.value as DeliveryType | undefined)
  const deliveryId = initialValues?.deliveryId
  const defaultOrderValue = initialValues?.orderId ?? defaultOrderId ?? ''

  return (
  <form className="space-y-6" action={action}>
      {deliveryId ? <input type="hidden" name="deliveryId" value={deliveryId} /> : null}
      {selectedType ? <input type="hidden" name="type" value={selectedType} /> : null}

      <Card className="border border-border/60 shadow-lg shadow-orange-500/10">
        <CardHeader className="space-y-4">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
            <div className="space-y-2">
              <CardTitle className="flex items-center gap-2 text-lg text-foreground">
                <Truck className="size-5 text-orange-600" aria-hidden />
                {mode === 'create' ? 'Szczegóły dostawy' : 'Edytuj dostawę'}
              </CardTitle>
              <CardDescription>Ustal podstawowe informacje o dostawie i powiązaniach ze zleceniem.</CardDescription>
            </div>
            {mode === 'create' ? (
              <AddClientDialog
                partners={partners}
                onClientCreated={handleClientCreated}
                triggerVariant="link"
                triggerClassName="text-orange-600 hover:text-orange-700"
              />
            ) : null}
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
            <Badge className="rounded-full bg-orange-500/10 text-orange-600">
              {selectedType ? selectedType : 'Dostawa'}
            </Badge>
            <span>{mode === 'create' ? 'Planowanie transportu i dokumentacji dla klienta.' : 'Aktualizuj dane wysyłki.'}</span>
          </div>

          <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
            <div className="space-y-2">
              <Label htmlFor="clientId">Klient</Label>
              <select
                id="clientId"
                name="clientId"
                required
                value={selectedClientId}
                onChange={(event) => {
                  setSelectedClientId(event.target.value)
                  setUseClientAddress(true)
                }}
                className="h-11 w-full rounded-xl border border-border/60 bg-background px-3 text-sm text-foreground shadow-sm focus:border-orange-500 focus:outline-none focus:ring-2 focus:ring-orange-500/30"
                aria-invalid={errors.clientId ? 'true' : 'false'}
              >
                <option value="" disabled>
                  Wybierz klienta…
                </option>
                {clientsList.map((client) => (
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
                defaultValue={initialValues?.stage ?? stageOptions[0]?.value ?? 'RECEIVED'}
                className="h-11 w-full rounded-xl border border-border/60 bg-background px-3 text-sm text-foreground shadow-sm focus:border-orange-500 focus:outline-none focus:ring-2 focus:ring-orange-500/30"
              >
                {stageOptions.map((stage) => (
                  <option key={stage.value} value={stage.value}>
                    {stage.label}
                  </option>
                ))}
              </select>
              <FieldError message={errors.stage} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="orderId">Powiązane zlecenie</Label>
              <select
                id="orderId"
                name="orderId"
                defaultValue={defaultOrderValue}
                className="h-11 w-full rounded-xl border border-border/60 bg-background px-3 text-sm text-foreground shadow-sm focus:border-orange-500 focus:outline-none focus:ring-2 focus:ring-orange-500/30"
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
          </div>

          <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
            <div className="space-y-2">
              <Label htmlFor="scheduledDate">Planowana data wysyłki</Label>
              <Input
                id="scheduledDate"
                name="scheduledDate"
                type="date"
                value={scheduledDateValue}
                onChange={handleScheduledDateChange}
              />
              <FieldError message={errors.scheduledDate} />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="border border-border/60 shadow-sm">
        <CardHeader className="space-y-2">
          <CardTitle className="flex items-center gap-2 text-lg text-foreground">
            <Package className="size-5 text-orange-600" aria-hidden />
            Zawartość dostawy
          </CardTitle>
          <CardDescription>Wskaż, jakie materiały i produkty obejmuje ta dostawa.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            <div className="space-y-3 rounded-xl border border-border/60 bg-muted/40 p-4">
              <label className="flex items-center gap-3 text-sm">
                <input
                  type="checkbox"
                  name="includePanels"
                  className="size-4 rounded border-border/70 text-orange-500 focus:ring-orange-500"
                  defaultChecked={initialValues?.includePanels ?? false}
                />
                <span>Dostawa paneli podłogowych</span>
              </label>
              <div className="space-y-2">
                <Label htmlFor="panelProductId">Model paneli</Label>
                <select
                  id="panelProductId"
                  name="panelProductId"
                  defaultValue={initialValues?.panelProductId ?? ''}
                  className="h-11 w-full rounded-xl border border-border/60 bg-background px-3 text-sm text-foreground shadow-sm focus:border-orange-500 focus:outline-none focus:ring-2 focus:ring-orange-500/30"
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
                <Input
                  id="panelStyle"
                  name="panelStyle"
                  placeholder="np. Dąb jasny, mat"
                  defaultValue={initialValues?.panelStyle ?? ''}
                />
                <FieldError message={errors.panelStyle} />
              </div>
            </div>
            <div className="space-y-3 rounded-xl border border-border/60 bg-muted/40 p-4">
              <label className="flex items-center gap-3 text-sm">
                <input
                  type="checkbox"
                  name="includeBaseboards"
                  className="size-4 rounded border-border/70 text-orange-500 focus:ring-orange-500"
                  defaultChecked={initialValues?.includeBaseboards ?? false}
                />
                <span>Dostawa listew przypodłogowych</span>
              </label>
              <div className="space-y-2">
                <Label htmlFor="baseboardProductId">Model listew</Label>
                <select
                  id="baseboardProductId"
                  name="baseboardProductId"
                  defaultValue={initialValues?.baseboardProductId ?? ''}
                  className="h-11 w-full rounded-xl border border-border/60 bg-background px-3 text-sm text-foreground shadow-sm focus:border-orange-500 focus:outline-none focus:ring-2 focus:ring-orange-500/30"
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
            <Warehouse className="size-5 text-orange-600" aria-hidden />
            Adres i uwagi
          </CardTitle>
          <CardDescription>Dane do dostawy oraz dodatkowe informacje dla magazynu i logistyki.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <label className="flex items-start gap-3 rounded-xl border border-border/60 bg-muted/40 px-4 py-3 text-sm">
            <input
              type="checkbox"
              className="size-4 rounded border-border/70 text-orange-500 focus:ring-orange-500"
              checked={clientAddressLocked}
              onChange={(event) => setUseClientAddress(event.target.checked)}
              disabled={!selectedClient}
            />
            <span className="flex flex-col">
              <span className="text-foreground">Adres taki sam jak dane klienta</span>
              <span className="text-xs text-muted-foreground">
                {selectedClient
                  ? 'Możesz odznaczyć, aby wprowadzić inny adres dostawy.'
                  : 'Wybierz klienta, aby skopiować jego adres lub wprowadź dane ręcznie.'}
              </span>
            </span>
          </label>

          <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
            <div className="space-y-2">
              <Label htmlFor="shippingAddressStreet">Ulica</Label>
              <Input
                id="shippingAddressStreet"
                name="shippingAddressStreet"
                placeholder="np. ul. Spacerowa 12"
                value={shippingAddressStreet}
                onChange={(event) => setShippingAddressStreet(event.target.value)}
                readOnly={clientAddressLocked}
                aria-readonly={clientAddressLocked}
                className={clientAddressLocked ? 'cursor-not-allowed bg-muted/50 text-muted-foreground' : undefined}
              />
              <FieldError message={errors.shippingAddressStreet} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="shippingAddressCity">Miasto</Label>
              <Input
                id="shippingAddressCity"
                name="shippingAddressCity"
                placeholder="np. Warszawa"
                value={shippingAddressCity}
                onChange={(event) => setShippingAddressCity(event.target.value)}
                readOnly={clientAddressLocked}
                aria-readonly={clientAddressLocked}
                className={clientAddressLocked ? 'cursor-not-allowed bg-muted/50 text-muted-foreground' : undefined}
              />
              <FieldError message={errors.shippingAddressCity} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="shippingAddressPostalCode">Kod pocztowy</Label>
              <Input
                id="shippingAddressPostalCode"
                name="shippingAddressPostalCode"
                placeholder="np. 01-234"
                value={shippingAddressPostalCode}
                onChange={(event) => setShippingAddressPostalCode(event.target.value)}
                readOnly={clientAddressLocked}
                aria-readonly={clientAddressLocked}
                className={clientAddressLocked ? 'cursor-not-allowed bg-muted/50 text-muted-foreground' : undefined}
              />
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
              defaultValue={initialValues?.notes ?? ''}
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
            <input
              type="checkbox"
              name="proformaIssued"
              className="size-4 rounded border-border/70 text-orange-500 focus:ring-orange-500"
              defaultChecked={initialValues?.proformaIssued ?? false}
            />
            <span>Wystawiono proformę</span>
          </label>
          <label className="flex items-center gap-3 rounded-xl border border-border/60 bg-muted/40 px-4 py-3 text-sm">
            <input
              type="checkbox"
              name="depositOrFinalInvoiceIssued"
              className="size-4 rounded border-border/70 text-orange-500 focus:ring-orange-500"
              defaultChecked={initialValues?.depositOrFinalInvoiceIssued ?? false}
            />
            <span>Faktura zaliczkowa/finalna wystawiona</span>
          </label>
          <label className="flex items-center gap-3 rounded-xl border border-border/60 bg-muted/40 px-4 py-3 text-sm">
            <input
              type="checkbox"
              name="shippingOrdered"
              className="size-4 rounded border-border/70 text-orange-500 focus:ring-orange-500"
              defaultChecked={initialValues?.shippingOrdered ?? false}
            />
            <span>Zamówiono transport</span>
          </label>
          <label className="flex items-center gap-3 rounded-xl border border-border/60 bg-muted/40 px-4 py-3 text-sm">
            <input
              type="checkbox"
              name="reviewReceived"
              className="size-4 rounded border-border/70 text-orange-500 focus:ring-orange-500"
              defaultChecked={initialValues?.reviewReceived ?? false}
            />
            <span>Otrzymano opinię klienta</span>
          </label>
          <label className="flex items-center gap-3 rounded-xl border border-border/60 bg-muted/40 px-4 py-3 text-sm md:col-span-2">
            <input
              type="checkbox"
              name="requiresAdminAttention"
              className="size-4 rounded border-border/70 text-orange-500 focus:ring-orange-500"
              defaultChecked={initialValues?.requiresAdminAttention ?? false}
            />
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
          <Link href={backHref}>
            <ArrowLeft className="size-4" aria-hidden />
            Wróć
          </Link>
        </Button>
        <SubmitButton idleLabel={submitIdleLabel} pendingLabel={submitPending} />
      </div>
    </form>
  )
}
