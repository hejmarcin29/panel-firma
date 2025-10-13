'use client'

import { type ChangeEvent, type ComponentProps, useActionState, useEffect, useRef, useState } from 'react'
import { useFormStatus } from 'react-dom'
import { Building2, MapPin, Save, UserPlus2, X } from 'lucide-react'

import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { ACQUISITION_SOURCE_OPTIONS } from '@/lib/clients/schemas'
import { createClientForDialogAction } from './actions'
import { INITIAL_CREATE_CLIENT_FORM_STATE } from '@/app/klienci/form-state'
import { cn } from '@/lib/utils'

export type SelectOption = {
  id: string
  label: string
}

type AddClientDialogProps = {
  partners: SelectOption[]
  onClientCreated?: (clientId: string, clientName: string) => void
  triggerVariant?: ComponentProps<typeof Button>['variant']
  triggerClassName?: string
  triggerLabel?: string
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
    <Button type="submit" className="w-full gap-2 rounded-full sm:w-auto sm:px-6" disabled={pending}>
      <Save className="size-4" aria-hidden />
      {pending ? 'Zapisywanie…' : 'Zapisz klienta'}
    </Button>
  )
}

export function AddClientDialog({
  partners,
  onClientCreated,
  triggerVariant = 'outline',
  triggerClassName,
  triggerLabel = 'Dodaj klienta',
}: AddClientDialogProps) {
  const [open, setOpen] = useState(false)
  const [state, action] = useActionState(createClientForDialogAction, INITIAL_CREATE_CLIENT_FORM_STATE)
  const errors = state.status === 'error' ? state.errors ?? {} : {}
  const [acquisitionSource, setAcquisitionSource] = useState<string>('')
  const partnerSelectRef = useRef<HTMLSelectElement>(null)
  const formRef = useRef<HTMLFormElement>(null)

  const handleAcquisitionSourceChange = (event: ChangeEvent<HTMLSelectElement>) => {
    const value = event.target.value
    setAcquisitionSource(value)

    if (value !== 'partner' && partnerSelectRef.current) {
      partnerSelectRef.current.value = ''
    }
  }

  const isPartnerSource = acquisitionSource === 'partner'

  // Po udanym zapisie: zamknij dialog i wywołaj callback
  useEffect(() => {
    if (state.status === 'success') {
      setOpen(false)
      onClientCreated?.(state.clientId, state.clientName)
      
      // Reset formularza
      formRef.current?.reset()
      setAcquisitionSource('')
    }
  }, [state, onClientCreated])

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          variant={triggerVariant}
          className={cn(
            'gap-2',
            triggerVariant === 'link' ? 'px-0 text-sm font-semibold' : 'rounded-full',
            triggerClassName,
          )}
          type="button"
        >
          <UserPlus2 className="size-4 text-current" />
          {triggerLabel}
        </Button>
      </DialogTrigger>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Dodaj nowego klienta</DialogTitle>
          <DialogDescription>
            Wypełnij podstawowe dane klienta. Po zapisie zostanie automatycznie wybrany w formularzu.
          </DialogDescription>
        </DialogHeader>

        <form ref={formRef} className="space-y-6" action={action}>
          {/* Dane podstawowe */}
          <div className="space-y-4">
            <h3 className="flex items-center gap-2 text-sm font-semibold text-foreground">
              <UserPlus2 className="size-4 text-primary" aria-hidden />
              Dane podstawowe
            </h3>
            
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="dialog-fullName">
                  Imię i nazwisko <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="dialog-fullName"
                  name="fullName"
                  required
                  placeholder="np. Joanna Kowalska"
                  aria-invalid={errors.fullName ? 'true' : 'false'}
                />
                <FieldError message={errors.fullName} />
              </div>

              <div className="space-y-2">
                <Label htmlFor="dialog-phone">Telefon</Label>
                <Input id="dialog-phone" name="phone" placeholder="np. +48 600 700 800" />
                <FieldError message={errors.phone} />
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="dialog-email">E-mail</Label>
                <Input id="dialog-email" name="email" type="email" placeholder="np. joanna@example.com" />
                <FieldError message={errors.email} />
              </div>

              <div className="space-y-2">
                <Label htmlFor="dialog-acquisitionSource">Źródło pozyskania</Label>
                <select
                  id="dialog-acquisitionSource"
                  name="acquisitionSource"
                  value={acquisitionSource}
                  onChange={handleAcquisitionSourceChange}
                  className="h-11 w-full rounded-xl border border-border/60 bg-background px-3 text-sm text-foreground shadow-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/30"
                  aria-invalid={errors.acquisitionSource ? 'true' : 'false'}
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

            {isPartnerSource && (
              <div className="space-y-2">
                <Label htmlFor="dialog-partnerId">Partner rozliczeniowy</Label>
                <select
                  id="dialog-partnerId"
                  name="partnerId"
                  ref={partnerSelectRef}
                  defaultValue=""
                  className="h-11 w-full rounded-xl border border-border/60 bg-background px-3 text-sm text-foreground shadow-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/30"
                >
                  <option value="">Brak partnera</option>
                  {partners.map((partner) => (
                    <option key={partner.id} value={partner.id}>
                      {partner.label}
                    </option>
                  ))}
                </select>
                <FieldError message={errors.partnerId} />
              </div>
            )}
          </div>

          {/* Adres */}
          <div className="space-y-4">
            <h3 className="flex items-center gap-2 text-sm font-semibold text-foreground">
              <MapPin className="size-4 text-primary" aria-hidden />
              Adres
            </h3>
            
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <div className="space-y-2">
                <Label htmlFor="dialog-city">Miasto</Label>
                <Input id="dialog-city" name="city" placeholder="np. Warszawa" />
                <FieldError message={errors.city} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="dialog-street">Ulica</Label>
                <Input id="dialog-street" name="street" placeholder="np. Spacerowa 10" />
                <FieldError message={errors.street} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="dialog-postalCode">Kod</Label>
                <Input id="dialog-postalCode" name="postalCode" placeholder="01-234" />
                <FieldError message={errors.postalCode} />
              </div>
            </div>
          </div>

          {/* Notatki */}
          <div className="space-y-4">
            <h3 className="flex items-center gap-2 text-sm font-semibold text-foreground">
              <Building2 className="size-4 text-primary" aria-hidden />
              Notatki
            </h3>
            
            <div className="space-y-2">
              <Label htmlFor="dialog-additionalInfo">Dodatkowe informacje</Label>
              <Textarea
                id="dialog-additionalInfo"
                name="additionalInfo"
                rows={3}
                placeholder="np. preferencje klienta, ograniczenia"
              />
              <FieldError message={errors.additionalInfo} />
            </div>
          </div>

          {state.status === 'error' && state.message ? (
            <Alert variant="destructive">
              <AlertTitle>Nie udało się zapisać klienta</AlertTitle>
              <AlertDescription>{state.message}</AlertDescription>
            </Alert>
          ) : null}

          <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
            <Button
              type="button"
              variant="outline"
              className="gap-2 rounded-full"
              onClick={() => setOpen(false)}
            >
              <X className="size-4" />
              Anuluj
            </Button>
            <SubmitButton />
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
