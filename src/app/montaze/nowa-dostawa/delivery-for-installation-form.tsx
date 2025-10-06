'use client'

import { useActionState } from 'react'
import { useFormStatus } from 'react-dom'
import Link from 'next/link'
import { ArrowLeft, HardHat, Package, Save, Warehouse } from 'lucide-react'

import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'

import { createInstallationDeliveryAction } from '../actions'
import { INITIAL_DELIVERY_FORM_STATE } from '../../dostawy/initial-state'

export type SelectOption = {
  id: string
  label: string
}

export type StageOption = {
  value: string
  label: string
}

type DeliveryForInstallationFormProps = {
  installations: SelectOption[]
  stageOptions: StageOption[]
  panelProducts: SelectOption[]
  baseboardProducts: SelectOption[]
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
      {pending ? 'Zapisywanie…' : 'Utwórz dostawę'}
    </Button>
  )
}

export function DeliveryForInstallationForm({
  installations,
  stageOptions,
  panelProducts,
  baseboardProducts,
}: DeliveryForInstallationFormProps) {
  const [state, action] = useActionState(createInstallationDeliveryAction, INITIAL_DELIVERY_FORM_STATE)
  const errors = state.status === 'error' ? state.errors ?? {} : {}

  return (
    <form className="space-y-6 pb-24 md:pb-16 lg:pb-12" action={action}>
      <Card className="border border-border/60 shadow-lg shadow-emerald-500/10">
        <CardHeader className="space-y-2">
          <CardTitle className="flex items-center gap-2 text-lg text-foreground">
            <HardHat className="size-5 text-emerald-600" aria-hidden />
            Montaż i harmonogram
          </CardTitle>
          <CardDescription>Powiąż dostawę z wybranym montażem i ustaw podstawowe parametry wysyłki.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
            <Badge className="rounded-full bg-emerald-500/10 text-emerald-600">Dostawa na potrzeby montażu</Badge>
            <span>Dane klienta i zlecenia zostaną pobrane automatycznie z montażu.</span>
          </div>

          <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
            <div className="space-y-2 lg:col-span-2">
              <Label htmlFor="installationId">Powiązany montaż</Label>
              <select
                id="installationId"
                name="installationId"
                required
                defaultValue=""
                className="h-11 w-full rounded-xl border border-border/60 bg-background px-3 text-sm text-foreground shadow-sm focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
                aria-invalid={errors.installationId ? 'true' : 'false'}
              >
                <option value="" disabled>
                  Wybierz montaż…
                </option>
                {installations.map((installation) => (
                  <option key={installation.id} value={installation.id}>
                    {installation.label}
                  </option>
                ))}
              </select>
              <FieldError message={errors.installationId} />
              <p className="text-xs text-muted-foreground">
                Jeżeli montażu nie ma na liście, utwórz go najpierw w module Montaże.
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="stage">Status dostawy</Label>
              <select
                id="stage"
                name="stage"
                defaultValue={stageOptions[0]?.value ?? 'RECEIVED'}
                className="h-11 w-full rounded-xl border border-border/60 bg-background px-3 text-sm text-foreground shadow-sm focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
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
              <Label htmlFor="scheduledDate">Planowana data dostawy</Label>
              <Input id="scheduledDate" name="scheduledDate" type="date" />
              <FieldError message={errors.scheduledDate} />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="border border-border/60 shadow-sm">
        <CardHeader className="space-y-2">
          <CardTitle className="flex items-center gap-2 text-lg text-foreground">
            <Package className="size-5 text-emerald-600" aria-hidden />
            Zawartość wysyłki
          </CardTitle>
          <CardDescription>Określ, jakie produkty mają trafić na montaż.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            <div className="space-y-3 rounded-xl border border-border/60 bg-muted/40 p-4">
              <label className="flex items-center gap-3 text-sm">
                <input type="checkbox" name="includePanels" className="size-4 rounded border-border/70 text-emerald-500 focus:ring-emerald-500" />
                <span>Dostawa paneli podłogowych</span>
              </label>
              <div className="space-y-2">
                <Label htmlFor="panelProductId">Model paneli</Label>
                <select
                  id="panelProductId"
                  name="panelProductId"
                  defaultValue=""
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
                <Label htmlFor="panelStyle">Opis/kolorystyka paneli</Label>
                <Input id="panelStyle" name="panelStyle" placeholder="np. Dąb jasny, mat" />
                <FieldError message={errors.panelStyle} />
              </div>
            </div>
            <div className="space-y-3 rounded-xl border border-border/60 bg-muted/40 p-4">
              <label className="flex items-center gap-3 text-sm">
                <input
                  type="checkbox"
                  name="includeBaseboards"
                  className="size-4 rounded border-border/70 text-emerald-500 focus:ring-emerald-500"
                />
                <span>Dostawa listew przypodłogowych</span>
              </label>
              <div className="space-y-2">
                <Label htmlFor="baseboardProductId">Model listew</Label>
                <select
                  id="baseboardProductId"
                  name="baseboardProductId"
                  defaultValue=""
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
          </div>
        </CardContent>
      </Card>

      <Card className="border border-border/60 shadow-sm">
        <CardHeader className="space-y-2">
          <CardTitle className="flex items-center gap-2 text-lg text-foreground">
            <Warehouse className="size-5 text-emerald-600" aria-hidden />
            Adres i uwagi logistyczne
          </CardTitle>
          <CardDescription>Możesz nadpisać dane adresowe – domyślnie wykorzystamy adres montażu.</CardDescription>
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
            <Label htmlFor="notes">Uwagi dla magazynu lub kierowcy</Label>
            <Textarea
              id="notes"
              name="notes"
              rows={3}
              placeholder="np. Rozładunek z rampy B, kontakt: 600 000 000"
            />
            <FieldError message={errors.notes} />
          </div>
        </CardContent>
      </Card>

      <Card className="border border-border/60 shadow-sm">
        <CardHeader className="space-y-2">
          <CardTitle className="text-lg text-foreground">Status dokumentów i płatności</CardTitle>
          <CardDescription>Zaznacz wykonane czynności, aby wyrównać checklistę z montażem.</CardDescription>
        </CardHeader>
        <CardContent className="grid grid-cols-1 gap-3 md:grid-cols-2">
          <label className="flex items-center gap-3 rounded-xl border border-border/60 bg-muted/40 px-4 py-3 text-sm">
            <input type="checkbox" name="proformaIssued" className="size-4 rounded border-border/70 text-emerald-500 focus:ring-emerald-500" />
            <span>Wystawiono proformę</span>
          </label>
          <label className="flex items-center gap-3 rounded-xl border border-border/60 bg-muted/40 px-4 py-3 text-sm">
            <input
              type="checkbox"
              name="depositOrFinalInvoiceIssued"
              className="size-4 rounded border-border/70 text-emerald-500 focus:ring-emerald-500"
            />
            <span>Faktura zaliczkowa/finalna wystawiona</span>
          </label>
          <label className="flex items-center gap-3 rounded-xl border border-border/60 bg-muted/40 px-4 py-3 text-sm">
            <input type="checkbox" name="shippingOrdered" className="size-4 rounded border-border/70 text-emerald-500 focus:ring-emerald-500" />
            <span>Zamówiono transport</span>
          </label>
          <label className="flex items-center gap-3 rounded-xl border border-border/60 bg-muted/40 px-4 py-3 text-sm">
            <input type="checkbox" name="reviewReceived" className="size-4 rounded border-border/70 text-emerald-500 focus:ring-emerald-500" />
            <span>Otrzymano opinię klienta</span>
          </label>
          <label className="flex items-center gap-3 rounded-xl border border-border/60 bg-muted/40 px-4 py-3 text-sm md:col-span-2">
            <input type="checkbox" name="requiresAdminAttention" className="size-4 rounded border-border/70 text-emerald-500 focus:ring-emerald-500" />
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
