'use client'

import { useActionState } from 'react'
import { useFormStatus } from 'react-dom'
import Link from 'next/link'
import { ArrowLeft, CalendarClock, HardHat, Save } from 'lucide-react'

import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'

import { createInstallationAction } from '../actions'
import { INITIAL_INSTALLATION_FORM_STATE } from '../form-state'

export type SelectOption = {
  id: string
  label: string
}

export type StatusOption = {
  value: string
  label: string
}

export type OrderOption = SelectOption

type NewInstallationFormProps = {
  clients: SelectOption[]
  orders?: OrderOption[]
  installers: SelectOption[]
  panelProducts: SelectOption[]
  baseboardProducts: SelectOption[]
  statusOptions: StatusOption[]
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
    <Button type="submit" className="w-full gap-2 rounded-full sm:w-auto sm:px-6 lg:px-8" disabled={pending}>
      <Save className="size-4" aria-hidden />
      {pending ? 'Zapisywanie…' : 'Zaplanuj montaż'}
    </Button>
  )
}

export function NewInstallationForm({
  clients,
  orders = [],
  installers,
  panelProducts,
  baseboardProducts,
  statusOptions,
  defaultClientId,
}: NewInstallationFormProps) {
  const [state, action] = useActionState(createInstallationAction, INITIAL_INSTALLATION_FORM_STATE)
  const errors = state.status === 'error' ? state.errors ?? {} : {}

  return (
    <form className="space-y-6 pb-24 md:pb-16 lg:pb-12" action={action}>
      <Card className="border border-border/60 shadow-lg shadow-primary/10">
        <CardHeader className="space-y-2">
          <CardTitle className="flex items-center gap-2 text-lg text-foreground">
            <HardHat className="size-5 text-primary" aria-hidden />
            Konfiguracja montażu
          </CardTitle>
          <CardDescription>Wybierz klienta, ekipę oraz status. Jeśli nie wskażesz istniejącego zlecenia, utworzymy je automatycznie.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-4">
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
              <Label htmlFor="orderId">Powiązane zlecenie (opcjonalnie)</Label>
              <select
                id="orderId"
                name="orderId"
                defaultValue=""
                className="h-11 w-full rounded-xl border border-border/60 bg-background px-3 text-sm text-foreground shadow-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/30"
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
              {orders.length === 0 ? (
                <p className="text-xs text-muted-foreground">Brak otwartych zleceń – zostanie utworzone nowe.</p>
              ) : (
                <p className="text-xs text-muted-foreground">Wybierz, jeśli montaż ma trafić do istniejącego zlecenia.</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="assignedInstallerId">Przypisana ekipa</Label>
              <select
                id="assignedInstallerId"
                name="assignedInstallerId"
                defaultValue=""
                className="h-11 w-full rounded-xl border border-border/60 bg-background px-3 text-sm text-foreground shadow-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/30"
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
                defaultValue={statusOptions[0]?.value ?? 'PLANNED'}
                className="h-11 w-full rounded-xl border border-border/60 bg-background px-3 text-sm text-foreground shadow-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/30"
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
              <Input id="scheduledStartAt" name="scheduledStartAt" type="datetime-local" />
              <FieldError message={errors.scheduledStartAt} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="scheduledEndAt">Planowane zakończenie</Label>
              <Input id="scheduledEndAt" name="scheduledEndAt" type="datetime-local" />
              <FieldError message={errors.scheduledEndAt} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="actualStartAt">Rzeczywisty start</Label>
              <Input id="actualStartAt" name="actualStartAt" type="datetime-local" />
              <FieldError message={errors.actualStartAt} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="actualEndAt">Rzeczywiste zakończenie</Label>
              <Input id="actualEndAt" name="actualEndAt" type="datetime-local" />
              <FieldError message={errors.actualEndAt} />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="border border-border/60 shadow-sm">
        <CardHeader className="space-y-2">
          <CardTitle className="flex items-center gap-2 text-lg text-foreground">
            <CalendarClock className="size-5 text-primary" aria-hidden />
            Lokalizacja i materiały
          </CardTitle>
          <CardDescription>Ustal adres montażu oraz preferowane produkty.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
            <div className="space-y-2">
              <Label htmlFor="addressStreet">Ulica</Label>
              <Input id="addressStreet" name="addressStreet" placeholder="np. ul. Spacerowa 12" />
              <FieldError message={errors.addressStreet} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="addressCity">Miasto</Label>
              <Input id="addressCity" name="addressCity" placeholder="np. Warszawa" />
              <FieldError message={errors.addressCity} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="addressPostalCode">Kod pocztowy</Label>
              <Input id="addressPostalCode" name="addressPostalCode" placeholder="np. 01-234" />
              <FieldError message={errors.addressPostalCode} />
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
            <div className="space-y-2 lg:col-span-2">
              <Label htmlFor="locationPinUrl">Link do pinezki lokalizacji (opcjonalnie)</Label>
              <Input id="locationPinUrl" name="locationPinUrl" placeholder="Podaj link Google Maps" />
              <FieldError message={errors.locationPinUrl} />
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
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
              <Textarea id="additionalWork" name="additionalWork" rows={3} placeholder="np. demontaż starych paneli, listwy progowe" />
              <FieldError message={errors.additionalWork} />
            </div>
            <div className="space-y-2 lg:col-span-1">
              <Label htmlFor="additionalInfo">Informacje dla zespołu</Label>
              <Textarea id="additionalInfo" name="additionalInfo" rows={3} placeholder="np. klucze do odbioru u ochrony, parking podziemny" />
              <FieldError message={errors.additionalInfo} />
            </div>
            <div className="space-y-2 lg:col-span-1">
              <Label htmlFor="customerNotes">Uwagi klienta</Label>
              <Textarea id="customerNotes" name="customerNotes" rows={3} placeholder="np. prośba o zachowanie ciszy przed 9:00" />
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
            <input type="checkbox" name="handoverProtocolSigned" className="size-4 rounded border-border/70 text-primary focus:ring-primary" />
            <span>Protokół odbioru podpisany</span>
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
          <AlertTitle>Nie udało się zapisać montażu</AlertTitle>
          <AlertDescription>{state.message}</AlertDescription>
        </Alert>
      ) : null}

  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between lg:justify-end">
        <Button variant="outline" asChild className="gap-2 rounded-full">
          <Link href="/montaze">
            <ArrowLeft className="size-4" aria-hidden />
            Wróć do widoku montaży
          </Link>
        </Button>
        <SubmitButton />
      </div>
    </form>
  )
}
