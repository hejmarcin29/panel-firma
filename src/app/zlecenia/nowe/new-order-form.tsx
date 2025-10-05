'use client'

import { useActionState } from 'react'
import { useFormStatus } from 'react-dom'
import Link from 'next/link'
import { ArrowLeft, ClipboardList, Save } from 'lucide-react'

import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'

import { createOrderAction } from '../actions'
import { INITIAL_ORDER_FORM_STATE } from '../form-state'

export type SelectOption = {
  id: string
  label: string
}

export type StageOption = {
  value: string
  label: string
}

type NewOrderFormProps = {
  clients: SelectOption[]
  partners: SelectOption[]
  users: SelectOption[]
  panelProducts: SelectOption[]
  baseboardProducts: SelectOption[]
  stageOptions: StageOption[]
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
      {pending ? 'Zapisywanie…' : 'Utwórz zlecenie'}
    </Button>
  )
}

export function NewOrderForm({
  clients,
  partners,
  users,
  panelProducts,
  baseboardProducts,
  stageOptions,
}: NewOrderFormProps) {
  const [state, action] = useActionState(createOrderAction, INITIAL_ORDER_FORM_STATE)
  const errors = state.status === 'error' ? state.errors ?? {} : {}

  return (
    <form className="space-y-6" action={action}>
      <Card className="border border-border/60 shadow-lg shadow-primary/10">
        <CardHeader className="space-y-2">
          <CardTitle className="flex items-center gap-2 text-lg text-foreground">
            <ClipboardList className="size-5 text-primary" aria-hidden />
            Dane zlecenia
          </CardTitle>
          <CardDescription>Wybierz klienta, partnera oraz podstawowe parametry nowego zlecenia montażowego.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
            <div className="space-y-2">
              <Label htmlFor="clientId">Klient</Label>
              <select
                id="clientId"
                name="clientId"
                required
                className="h-11 w-full rounded-xl border border-border/60 bg-background px-3 text-sm text-foreground shadow-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/30"
                defaultValue=""
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
              <Label htmlFor="partnerId">Partner (opcjonalnie)</Label>
              <select
                id="partnerId"
                name="partnerId"
                defaultValue=""
                className="h-11 w-full rounded-xl border border-border/60 bg-background px-3 text-sm text-foreground shadow-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/30"
              >
                <option value="">Bez przypisanego partnera</option>
                {partners.map((partner) => (
                  <option key={partner.id} value={partner.id}>
                    {partner.label}
                  </option>
                ))}
              </select>
              <FieldError message={errors.partnerId} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="ownerId">Właściciel procesu (opcjonalnie)</Label>
              <select
                id="ownerId"
                name="ownerId"
                defaultValue=""
                className="h-11 w-full rounded-xl border border-border/60 bg-background px-3 text-sm text-foreground shadow-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/30"
              >
                <option value="">Wybierz użytkownika</option>
                {users.map((user) => (
                  <option key={user.id} value={user.id}>
                    {user.label}
                  </option>
                ))}
              </select>
              <FieldError message={errors.ownerId} />
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="orderNumber">Numer zlecenia (opcjonalnie)</Label>
              <Input id="orderNumber" name="orderNumber" placeholder="np. ZL-2025-001" />
              <FieldError message={errors.orderNumber} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="title">Tytuł / opis skrócony</Label>
              <Input id="title" name="title" placeholder="np. Montaż paneli w apartamencie" />
              <FieldError message={errors.title} />
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1fr_1fr]">
            <div className="space-y-2">
              <Label htmlFor="stage">Etap początkowy</Label>
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
            <div className="space-y-2">
              <Label htmlFor="stageNotes">Notatka do etapu (opcjonalnie)</Label>
              <Input id="stageNotes" name="stageNotes" placeholder="np. oczekujemy na potwierdzenie zaliczki" />
              <FieldError message={errors.stageNotes} />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="border border-border/60 shadow-sm">
        <CardHeader className="space-y-2">
          <CardTitle className="text-lg text-foreground">Parametry inwestycji</CardTitle>
          <CardDescription>Podaj dane liczbowe i kontekst montażu. Możesz uzupełnić je później po pomiarze.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
            <div className="space-y-2">
              <Label htmlFor="declaredFloorArea">Powierzchnia (m²)</Label>
              <Input id="declaredFloorArea" name="declaredFloorArea" type="number" step="0.1" min="0" placeholder="np. 120" />
              <FieldError message={errors.declaredFloorArea} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="declaredBaseboardLength">Listwy przypodłogowe (mb)</Label>
              <Input id="declaredBaseboardLength" name="declaredBaseboardLength" type="number" step="0.1" min="0" placeholder="np. 45" />
              <FieldError message={errors.declaredBaseboardLength} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="buildingType">Typ budynku</Label>
              <Input id="buildingType" name="buildingType" placeholder="np. apartament, dom jednorodzinny" />
              <FieldError message={errors.buildingType} />
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="panelPreference">Preferencje paneli</Label>
              <Textarea id="panelPreference" name="panelPreference" rows={3} placeholder="Opis oczekiwanego wzoru, koloru, klasy jakości" />
              <FieldError message={errors.panelPreference} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="baseboardPreference">Preferencje listew</Label>
              <Textarea id="baseboardPreference" name="baseboardPreference" rows={3} placeholder="Opis materiału, wysokości, koloru" />
              <FieldError message={errors.baseboardPreference} />
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="preferredPanelProductId">Preferowany model paneli</Label>
              <select
                id="preferredPanelProductId"
                name="preferredPanelProductId"
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
              <FieldError message={errors.preferredPanelProductId} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="preferredBaseboardProductId">Preferowany model listew</Label>
              <select
                id="preferredBaseboardProductId"
                name="preferredBaseboardProductId"
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
              <FieldError message={errors.preferredBaseboardProductId} />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="border border-border/60 shadow-sm">
        <CardHeader className="space-y-2">
          <CardTitle className="text-lg text-foreground">Kontrola procesu</CardTitle>
          <CardDescription>Zdefiniuj flagi administracyjne i status dokumentów finansowych.</CardDescription>
        </CardHeader>
  <CardContent className="grid grid-cols-1 gap-3 md:grid-cols-2">
          <label className="flex items-center gap-3 rounded-xl border border-border/60 bg-muted/40 px-4 py-3 text-sm">
            <input type="checkbox" name="requiresAdminAttention" className="size-4 rounded border-border/70 text-primary focus:ring-primary" />
            <span>Oznacz jako wymagające uwagi administratora</span>
          </label>
          <label className="flex items-center gap-3 rounded-xl border border-border/60 bg-muted/40 px-4 py-3 text-sm">
            <input type="checkbox" name="quoteSent" className="size-4 rounded border-border/70 text-primary focus:ring-primary" />
            <span>Wycena została wysłana do klienta</span>
          </label>
          <label className="flex items-center gap-3 rounded-xl border border-border/60 bg-muted/40 px-4 py-3 text-sm">
            <input type="checkbox" name="depositInvoiceIssued" className="size-4 rounded border-border/70 text-primary focus:ring-primary" />
            <span>Wystawiono fakturę zaliczkową</span>
          </label>
          <label className="flex items-center gap-3 rounded-xl border border-border/60 bg-muted/40 px-4 py-3 text-sm">
            <input type="checkbox" name="finalInvoiceIssued" className="size-4 rounded border-border/70 text-primary focus:ring-primary" />
            <span>Wystawiono fakturę końcową</span>
          </label>
        </CardContent>
      </Card>

      {state.status === 'error' && state.message ? (
        <Alert variant="destructive">
          <AlertTitle>Błąd zapisu</AlertTitle>
          <AlertDescription>{state.message}</AlertDescription>
        </Alert>
      ) : null}

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <Button variant="outline" asChild className="gap-2 rounded-full">
          <Link href="/zlecenia">
            <ArrowLeft className="size-4" aria-hidden />
            Wróć do listy zleceń
          </Link>
        </Button>
        <SubmitButton />
      </div>
    </form>
  )
}
