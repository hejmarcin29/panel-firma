'use client'

import { type ChangeEvent, useActionState, useRef, useState } from 'react'
import { useFormStatus } from 'react-dom'
import Link from 'next/link'
import { ArrowLeft, Building2, MapPin, Save, UserPlus2 } from 'lucide-react'

import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { ACQUISITION_SOURCE_OPTIONS } from '@/lib/clients/schemas'
import { cn } from '@/lib/utils'

import { createClientAction } from '../actions'
import { INITIAL_CREATE_CLIENT_FORM_STATE } from '../form-state'

export type SelectOption = {
  id: string
  label: string
}

type NewClientFormProps = {
  partners: SelectOption[]
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
      {pending ? 'Zapisywanie…' : 'Zapisz klienta'}
    </Button>
  )
}

export function NewClientForm({ partners }: NewClientFormProps) {
  const [state, action] = useActionState(createClientAction, INITIAL_CREATE_CLIENT_FORM_STATE)
  const errors = state.status === 'error' ? state.errors ?? {} : {}
  const [acquisitionSource, setAcquisitionSource] = useState<string>('')
  const partnerSelectRef = useRef<HTMLSelectElement>(null)

  const handleAcquisitionSourceChange = (event: ChangeEvent<HTMLSelectElement>) => {
    const value = event.target.value
    setAcquisitionSource(value)

    if (value !== 'partner' && partnerSelectRef.current) {
      partnerSelectRef.current.value = ''
    }
  }

  const isPartnerSource = acquisitionSource === 'partner'

  return (
    <form className="space-y-6 pb-24 md:pb-16 lg:pb-12" action={action}>
      <Card className="border border-border/60 shadow-lg shadow-primary/10">
        <CardHeader className="space-y-2">
          <CardTitle className="flex items-center gap-2 text-lg text-foreground">
            <UserPlus2 className="size-5 text-primary" aria-hidden />
            Dane podstawowe
          </CardTitle>
          <CardDescription>
            Uzupełnij podstawowe informacje o nowym kliencie. Jeśli klient pochodzi z sieci partnerskiej, wybierz źródło
            „Partner sprzedażowy”, aby powiązać go na potrzeby rozliczeń prowizyjnych.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="fullName">Imię i nazwisko</Label>
              <Input
                id="fullName"
                name="fullName"
                required
                placeholder="np. Joanna Kowalska"
                aria-invalid={errors.fullName ? 'true' : 'false'}
              />
              <FieldError message={errors.fullName} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="partnerId">Partner rozliczeniowy</Label>
              <select
                id="partnerId"
                name="partnerId"
                ref={partnerSelectRef}
                defaultValue=""
                disabled={!isPartnerSource}
                aria-disabled={!isPartnerSource}
                className={cn(
                  "h-11 w-full rounded-xl border border-border/60 px-3 text-sm shadow-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/30",
                  isPartnerSource ? "bg-background text-foreground" : "cursor-not-allowed bg-muted/60 text-muted-foreground"
                )}
              >
                <option value="">Brak partnera</option>
                {partners.map((partner) => (
                  <option key={partner.id} value={partner.id}>
                    {partner.label}
                  </option>
                ))}
              </select>
              <p className="text-xs text-muted-foreground">
                Opcja dostępna po wyborze źródła „Partner sprzedażowy”.
              </p>
              <FieldError message={errors.partnerId} />
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
            <div className="space-y-2">
              <Label htmlFor="email">E-mail</Label>
              <Input id="email" name="email" type="email" placeholder="np. joanna@example.com" />
              <FieldError message={errors.email} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">Telefon</Label>
              <Input id="phone" name="phone" placeholder="np. +48 600 700 800" />
              <FieldError message={errors.phone} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="acquisitionSource">Źródło pozyskania</Label>
              <select
                id="acquisitionSource"
                name="acquisitionSource"
                value={acquisitionSource}
                onChange={handleAcquisitionSourceChange}
                className="h-11 w-full rounded-xl border border-border/60 bg-background px-3 text-sm text-foreground shadow-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/30"
                aria-invalid={errors.acquisitionSource ? "true" : "false"}
              >
                <option value="">Wybierz źródło</option>
                {ACQUISITION_SOURCE_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
              <FieldError message={errors.acquisitionSource} />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="border border-border/60 shadow-sm">
        <CardHeader className="space-y-2">
          <CardTitle className="flex items-center gap-2 text-lg text-foreground">
            <MapPin className="size-5 text-primary" aria-hidden />
            Adres i lokalizacja
          </CardTitle>
          <CardDescription>Informacje adresowe ułatwią planowanie pomiarów oraz montaży.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
            <div className="space-y-2">
              <Label htmlFor="city">Miasto</Label>
              <Input id="city" name="city" placeholder="np. Warszawa" />
              <FieldError message={errors.city} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="street">Ulica</Label>
              <Input id="street" name="street" placeholder="np. ul. Spacerowa 10/5" />
              <FieldError message={errors.street} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="postalCode">Kod pocztowy</Label>
              <Input id="postalCode" name="postalCode" placeholder="np. 01-234" />
              <FieldError message={errors.postalCode} />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="border border-border/60 shadow-sm">
        <CardHeader className="space-y-2">
          <CardTitle className="flex items-center gap-2 text-lg text-foreground">
            <Building2 className="size-5 text-primary" aria-hidden />
            Notatki dodatkowe
          </CardTitle>
          <CardDescription>Zostaw informacje dla zespołu sprzedaży lub obsługi posprzedażowej.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="additionalInfo">Notatki</Label>
            <Textarea
              id="additionalInfo"
              name="additionalInfo"
              rows={4}
              placeholder="np. preferencje klienta, ograniczenia logistyczne"
            />
            <FieldError message={errors.additionalInfo} />
          </div>
        </CardContent>
      </Card>

      {state.status === 'error' && state.message ? (
        <Alert variant="destructive">
          <AlertTitle>Nie udało się zapisać klienta</AlertTitle>
          <AlertDescription>{state.message}</AlertDescription>
        </Alert>
      ) : null}

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <Button variant="outline" asChild className="gap-2 rounded-full">
          <Link href="/klienci">
            <ArrowLeft className="size-4" aria-hidden />
            Wróć do listy klientów
          </Link>
        </Button>
        <div className="flex flex-wrap gap-3">
          <Badge variant="secondary" className="rounded-full bg-muted/40 px-4 py-2 text-xs text-muted-foreground">
            Wszystkie pola możesz edytować później.
          </Badge>
          <SubmitButton />
        </div>
      </div>
    </form>
  )
}
