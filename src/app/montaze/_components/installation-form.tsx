'use client'

import { useActionState, useEffect, useMemo, useState, type ChangeEvent } from 'react'
import { useFormStatus } from 'react-dom'
import Link from 'next/link'
import { format } from 'date-fns'
import { ArrowLeft, CalendarClock, HardHat, Save } from 'lucide-react'

import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'

import { INITIAL_INSTALLATION_FORM_STATE } from '../form-state'

import type { InstallationStatus } from '@db/schema'
import type { CreateInstallationFormErrors, CreateInstallationFormState } from '@/lib/installations/schemas'

type InstallationFormAction = (
  prevState: CreateInstallationFormState,
  formData: FormData,
) => Promise<CreateInstallationFormState>

export type SelectOption = {
  id: string
  label: string
}

export type ClientOption = SelectOption & {
  street: string | null
  city: string | null
  postalCode: string | null
}

export type StatusOption = {
  value: InstallationStatus
  label: string
}

export type InstallationFormScope = 'standard' | 'baseboard'

export type InstallationFormInitialValues = {
  installationId?: string
  clientId?: string | null
  orderId?: string | null
  assignedInstallerId?: string | null
  status?: InstallationStatus
  scheduledStartAt?: Date | null
  scheduledEndAt?: Date | null
  actualStartAt?: Date | null
  actualEndAt?: Date | null
  addressStreet?: string | null
  addressCity?: string | null
  addressPostalCode?: string | null
  locationPinUrl?: string | null
  panelProductId?: string | null
  baseboardProductId?: string | null
  additionalWork?: string | null
  additionalInfo?: string | null
  customerNotes?: string | null
  handoverProtocolSigned?: boolean
  reviewReceived?: boolean
  requiresAdminAttention?: boolean
}

type InstallationFormProps = {
  mode: 'create' | 'edit'
  clients: ClientOption[]
  orders?: SelectOption[]
  installers: SelectOption[]
  panelProducts: SelectOption[]
  baseboardProducts: SelectOption[]
  statusOptions: StatusOption[]
  actionFunction: InstallationFormAction
  defaultClientId?: string
  defaultOrderId?: string
  scope?: InstallationFormScope
  submitLabel?: string
  submitPendingLabel?: string
  backHref?: string
  initialValues?: InstallationFormInitialValues
}

function FieldError({ message }: { message?: string }) {
  if (!message) {
    return null
  }
  return <p className="text-xs font-medium text-destructive">{message}</p>
}

function formatDateInput(value?: Date | null) {
  if (!value) {
    return ''
  }
  try {
    return format(value, 'yyyy-MM-dd')
  } catch {
    return ''
  }
}

type SubmitButtonProps = {
  idleLabel: string
  pendingLabel: string
}

function SubmitButton({ idleLabel, pendingLabel }: SubmitButtonProps) {
  const { pending } = useFormStatus()

  return (
    <Button type="submit" className="w-full gap-2 rounded-full sm:w-auto sm:px-6 lg:px-8" disabled={pending}>
      <Save className="size-4" aria-hidden />
      {pending ? pendingLabel : idleLabel}
    </Button>
  )
}

export function InstallationForm({
  mode,
  clients,
  orders = [],
  installers,
  panelProducts,
  baseboardProducts,
  statusOptions,
  actionFunction,
  defaultClientId,
  defaultOrderId,
  scope = 'standard',
  submitLabel,
  submitPendingLabel,
  backHref = '/montaze',
  initialValues,
}: InstallationFormProps) {
  const [state, action] = useActionState(actionFunction, INITIAL_INSTALLATION_FORM_STATE)
  const errors: CreateInstallationFormErrors = state.status === 'error' ? state.errors ?? {} : {}

  const initialClientId = initialValues?.clientId ?? defaultClientId ?? ''
  const [selectedClientId, setSelectedClientId] = useState<string>(initialClientId)
  const selectedClient = useMemo(
    () => clients.find((client) => client.id === selectedClientId) ?? null,
    [clients, selectedClientId],
  )

  const hasCustomAddress = Boolean(
    initialValues?.addressStreet || initialValues?.addressCity || initialValues?.addressPostalCode,
  )
  const [useClientAddress, setUseClientAddress] = useState(() => (mode === 'create' ? true : !hasCustomAddress))
  const clientAddressLocked = Boolean(selectedClient) && useClientAddress

  const [addressStreet, setAddressStreet] = useState(initialValues?.addressStreet ?? '')
  const [addressCity, setAddressCity] = useState(initialValues?.addressCity ?? '')
  const [addressPostalCode, setAddressPostalCode] = useState(initialValues?.addressPostalCode ?? '')

  useEffect(() => {
    if (clientAddressLocked) {
      setAddressStreet(selectedClient?.street ?? '')
      setAddressCity(selectedClient?.city ?? '')
      setAddressPostalCode(selectedClient?.postalCode ?? '')
    }
  }, [clientAddressLocked, selectedClient])

  const [scheduledStartDate, setScheduledStartDate] = useState(() =>
    formatDateInput(initialValues?.scheduledStartAt ?? null),
  )
  const [scheduledEndDate, setScheduledEndDate] = useState(() =>
    formatDateInput(initialValues?.scheduledEndAt ?? null),
  )
  const [actualStartDate, setActualStartDate] = useState(() =>
    formatDateInput(initialValues?.actualStartAt ?? null),
  )
  const [actualEndDate, setActualEndDate] = useState(() => formatDateInput(initialValues?.actualEndAt ?? null))

  const handleScheduledStartChange = (event: ChangeEvent<HTMLInputElement>) => {
    const value = event.target.value
    setScheduledStartDate(value)

    if (!value) {
      setScheduledEndDate('')
      return
    }

    const parsed = new Date(value)
    if (Number.isNaN(parsed.getTime())) {
      setScheduledEndDate('')
      return
    }

    const nextDay = new Date(parsed)
    nextDay.setDate(parsed.getDate() + 1)
    setScheduledEndDate(formatDateInput(nextDay))
  }

  const handleScheduledEndChange = (event: ChangeEvent<HTMLInputElement>) => {
    setScheduledEndDate(event.target.value)
  }

  const handleActualStartChange = (event: ChangeEvent<HTMLInputElement>) => {
    const value = event.target.value
    setActualStartDate(value)

    if (!value) {
      setActualEndDate('')
      return
    }

    const parsed = new Date(value)
    if (Number.isNaN(parsed.getTime())) {
      setActualEndDate('')
      return
    }

    const nextDay = new Date(parsed)
    nextDay.setDate(parsed.getDate() + 1)
    setActualEndDate(formatDateInput(nextDay))
  }

  const handleActualEndChange = (event: ChangeEvent<HTMLInputElement>) => {
    setActualEndDate(event.target.value)
  }

  const submitIdleLabel = submitLabel ?? (mode === 'create' ? 'Zaplanuj montaż' : 'Zapisz montaż')
  const submitPending = submitPendingLabel ?? 'Zapisywanie…'
  const defaultOrderValue = initialValues?.orderId ?? defaultOrderId ?? ''
  const additionalWorkDefault = initialValues?.additionalWork ?? (scope === 'baseboard' ? 'Montaż listew wykończeniowych' : '')
  const additionalInfoDefault = initialValues?.additionalInfo ?? ''
  const customerNotesDefault = initialValues?.customerNotes ?? ''
  const locationPinDefault = initialValues?.locationPinUrl ?? ''
  const installationId = initialValues?.installationId

  return (
    <form className="space-y-6 pb-24 md:pb-16 lg:pb-12" action={action}>
      {installationId ? <input type="hidden" name="installationId" value={installationId} /> : null}
      <Card className="border border-border/60 shadow-lg shadow-emerald-500/10">
        <CardHeader className="space-y-2">
          <CardTitle className="flex items-center gap-2 text-lg text-foreground">
            <HardHat className="size-5 text-emerald-600" aria-hidden />
            {mode === 'create' ? 'Konfiguracja montażu' : 'Edytuj montaż'}
          </CardTitle>
          <CardDescription>
            Wybierz klienta, ekipę oraz status. Jeśli nie wskażesz istniejącego zlecenia, utworzymy je automatycznie.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
            <Badge className="rounded-full bg-emerald-500/10 text-emerald-600">
              {mode === 'create' ? 'Nowy montaż' : 'Edycja montażu'}
            </Badge>
            {scope === 'baseboard' ? (
              <Badge variant="outline" className="rounded-full border-emerald-500/40 text-emerald-600 dark:text-emerald-300">
                Listwy wykończeniowe
              </Badge>
            ) : null}
          </div>

          {scope === 'baseboard' ? (
            <Alert className="border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-200">
              <AlertTitle>Plan montażu listew</AlertTitle>
              <AlertDescription>
                Ustaw termin około 60 dni po montażu głównym i wskaż właściwą ekipę. Pola paneli możesz pozostawić puste.
              </AlertDescription>
            </Alert>
          ) : null}

          <div className="grid grid-cols-1 gap-4 lg:grid-cols-4">
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
                className="h-11 w-full rounded-xl border border-border/60 bg-background px-3 text-sm text-foreground shadow-sm focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
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
              <Label htmlFor="orderId">Powiązane zlecenie (opcjonalnie)</Label>
              <select
                id="orderId"
                name="orderId"
                defaultValue={defaultOrderValue}
                className="h-11 w-full rounded-xl border border-border/60 bg-background px-3 text-sm text-foreground shadow-sm focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
                aria-invalid={errors.orderId ? 'true' : 'false'}
              >
                <option value="">Utwórz nowe zlecenie automatycznie</option>
                {orders.map((order) => (
                  <option key={order.id} value={order.id}>
                    {order.label}
                  </option>
                ))}
              </select>
              <FieldError message={errors.orderId} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="assignedInstallerId">Przypisana ekipa</Label>
              <select
                id="assignedInstallerId"
                name="assignedInstallerId"
                defaultValue={initialValues?.assignedInstallerId ?? ''}
                className="h-11 w-full rounded-xl border border-border/60 bg-background px-3 text-sm text-foreground shadow-sm focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
              >
                <option value="">Wybierz montera</option>
                {installers.map((installer) => (
                  <option key={installer.id} value={installer.id}>
                    {installer.label}
                  </option>
                ))}
              </select>
              <FieldError message={errors.assignedInstallerId} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="status">Status montażu</Label>
              <select
                id="status"
                name="status"
                defaultValue={initialValues?.status ?? statusOptions[0]?.value ?? 'PLANNED'}
                className="h-11 w-full rounded-xl border border-border/60 bg-background px-3 text-sm text-foreground shadow-sm focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
              >
                {statusOptions.map((status) => (
                  <option key={status.value} value={status.value}>
                    {status.label}
                  </option>
                ))}
              </select>
              <FieldError message={errors.status} />
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="scheduledStartAt">Planowany start</Label>
              <Input
                id="scheduledStartAt"
                name="scheduledStartAt"
                type="date"
                value={scheduledStartDate}
                onChange={handleScheduledStartChange}
              />
              <FieldError message={errors.scheduledStartAt} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="scheduledEndAt">Planowane zakończenie</Label>
              <Input
                id="scheduledEndAt"
                name="scheduledEndAt"
                type="date"
                value={scheduledEndDate}
                onChange={handleScheduledEndChange}
              />
              <FieldError message={errors.scheduledEndAt} />
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="actualStartAt">Rzeczywisty start</Label>
              <Input
                id="actualStartAt"
                name="actualStartAt"
                type="date"
                value={actualStartDate}
                onChange={handleActualStartChange}
              />
              <FieldError message={errors.actualStartAt} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="actualEndAt">Rzeczywiste zakończenie</Label>
              <Input
                id="actualEndAt"
                name="actualEndAt"
                type="date"
                value={actualEndDate}
                onChange={handleActualEndChange}
              />
              <FieldError message={errors.actualEndAt} />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="border border-border/60 shadow-sm">
        <CardHeader className="space-y-2">
          <CardTitle className="flex items-center gap-2 text-lg text-foreground">
            <CalendarClock className="size-5 text-emerald-600" aria-hidden />
            Lokalizacja i materiały
          </CardTitle>
          <CardDescription>Ustal adres montażu oraz preferowane produkty.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <label className="flex items-start gap-3 rounded-xl border border-border/60 bg-muted/40 px-4 py-3 text-sm">
            <input
              type="checkbox"
              className="size-4 rounded border-border/70 text-emerald-500 focus:ring-emerald-500"
              checked={clientAddressLocked}
              onChange={(event) => setUseClientAddress(event.target.checked)}
              disabled={!selectedClient}
            />
            <span className="flex flex-col">
              <span className="text-foreground">Adres taki sam jak dane klienta</span>
              <span className="text-xs text-muted-foreground">
                {selectedClient
                  ? 'Odznacz, jeśli montaż odbywa się pod innym adresem niż zapisane dane klienta.'
                  : 'Wybierz klienta, aby automatycznie uzupełnić adres montażu.'}
              </span>
            </span>
          </label>

          <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
            <div className="space-y-2">
              <Label htmlFor="addressStreet">Ulica</Label>
              <Input
                id="addressStreet"
                name="addressStreet"
                placeholder="np. ul. Spacerowa 12"
                value={addressStreet}
                onChange={(event) => setAddressStreet(event.target.value)}
                readOnly={clientAddressLocked}
                aria-readonly={clientAddressLocked}
                className={clientAddressLocked ? 'cursor-not-allowed bg-muted/50 text-muted-foreground' : undefined}
              />
              <FieldError message={errors.addressStreet} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="addressCity">Miasto</Label>
              <Input
                id="addressCity"
                name="addressCity"
                placeholder="np. Warszawa"
                value={addressCity}
                onChange={(event) => setAddressCity(event.target.value)}
                readOnly={clientAddressLocked}
                aria-readonly={clientAddressLocked}
                className={clientAddressLocked ? 'cursor-not-allowed bg-muted/50 text-muted-foreground' : undefined}
              />
              <FieldError message={errors.addressCity} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="addressPostalCode">Kod pocztowy</Label>
              <Input
                id="addressPostalCode"
                name="addressPostalCode"
                placeholder="np. 01-234"
                value={addressPostalCode}
                onChange={(event) => setAddressPostalCode(event.target.value)}
                readOnly={clientAddressLocked}
                aria-readonly={clientAddressLocked}
                className={clientAddressLocked ? 'cursor-not-allowed bg-muted/50 text-muted-foreground' : undefined}
              />
              <FieldError message={errors.addressPostalCode} />
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
            <div className="space-y-2 lg:col-span-2">
              <Label htmlFor="locationPinUrl">Link do pinezki lokalizacji (opcjonalnie)</Label>
              <Input
                id="locationPinUrl"
                name="locationPinUrl"
                placeholder="Podaj link Google Maps"
                defaultValue={locationPinDefault}
              />
              <FieldError message={errors.locationPinUrl} />
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="panelProductId">Model paneli</Label>
              <select
                id="panelProductId"
                name="panelProductId"
                defaultValue={initialValues?.panelProductId ?? ''}
                className="h-11 w-full rounded-xl border border-border/60 bg-background px-3 text-sm text-foreground shadow-sm focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
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
              <Label htmlFor="baseboardProductId">Model listew</Label>
              <select
                id="baseboardProductId"
                name="baseboardProductId"
                defaultValue={initialValues?.baseboardProductId ?? ''}
                className="h-11 w-full rounded-xl border border-border/60 bg-background px-3 text-sm text-foreground shadow-sm focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
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
        </CardContent>
      </Card>

      <Card className="border border-border/60 shadow-sm">
        <CardHeader className="space-y-2">
          <CardTitle className="text-lg text-foreground">Notatki operacyjne</CardTitle>
          <CardDescription>Opisz prace dodatkowe, informacje dla zespołu oraz uwagi klienta.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
            <div className="space-y-2 lg:col-span-1">
              <Label htmlFor="additionalWork">Prace dodatkowe</Label>
              <Textarea
                id="additionalWork"
                name="additionalWork"
                rows={3}
                placeholder="np. demontaż starych paneli, listwy progowe"
                defaultValue={additionalWorkDefault}
              />
              <FieldError message={errors.additionalWork} />
            </div>
            <div className="space-y-2 lg:col-span-1">
              <Label htmlFor="additionalInfo">Informacje dla zespołu</Label>
              <Textarea
                id="additionalInfo"
                name="additionalInfo"
                rows={3}
                placeholder="np. klucze do odbioru u ochrony, parking podziemny"
                defaultValue={additionalInfoDefault}
              />
              <FieldError message={errors.additionalInfo} />
            </div>
            <div className="space-y-2 lg:col-span-1">
              <Label htmlFor="customerNotes">Uwagi klienta</Label>
              <Textarea
                id="customerNotes"
                name="customerNotes"
                rows={3}
                placeholder="np. prośba o zachowanie ciszy przed 9:00"
                defaultValue={customerNotesDefault}
              />
              <FieldError message={errors.customerNotes} />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="border border-border/60 shadow-sm">
        <CardHeader className="space-y-2">
          <CardTitle className="text-lg text-foreground">Status dokumentów</CardTitle>
          <CardDescription>Zaznacz, jeżeli protokół przekazania lub opinia klienta zostały już otrzymane.</CardDescription>
        </CardHeader>
        <CardContent className="grid grid-cols-1 gap-3 md:grid-cols-2">
          <label className="flex items-center gap-3 rounded-xl border border-border/60 bg-muted/40 px-4 py-3 text-sm">
            <input
              type="checkbox"
              name="handoverProtocolSigned"
              className="size-4 rounded border-border/70 text-emerald-500 focus:ring-emerald-500"
              defaultChecked={initialValues?.handoverProtocolSigned ?? false}
            />
            <span>Protokół odbioru podpisany</span>
          </label>
          <label className="flex items-center gap-3 rounded-xl border border-border/60 bg-muted/40 px-4 py-3 text-sm">
            <input
              type="checkbox"
              name="reviewReceived"
              className="size-4 rounded border-border/70 text-emerald-500 focus:ring-emerald-500"
              defaultChecked={initialValues?.reviewReceived ?? false}
            />
            <span>Otrzymano opinię klienta</span>
          </label>
          <label className="flex items-center gap-3 rounded-xl border border-border/60 bg-muted/40 px-4 py-3 text-sm md:col-span-2">
            <input
              type="checkbox"
              name="requiresAdminAttention"
              className="size-4 rounded border-border/70 text-emerald-500 focus:ring-emerald-500"
              defaultChecked={initialValues?.requiresAdminAttention ?? false}
            />
            <span>Oznacz jako wymagające reakcji administratora</span>
          </label>
        </CardContent>
      </Card>

      {state.status === 'error' && state.message ? (
        <Alert variant="destructive">
          <AlertTitle>Nie udało się zapisać montażu</AlertTitle>
          <AlertDescription>{state.message}</AlertDescription>
        </Alert>
      ) : null}

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between lg:justify-end">
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