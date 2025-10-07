'use client'

import { useActionState, useCallback, useEffect, useMemo, useState } from 'react'
import { useFormStatus } from 'react-dom'
import Link from 'next/link'
import { ArrowLeft, CalendarClock, ClipboardSignature, Ruler, Save, UploadCloud } from 'lucide-react'

import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'

import { deliveryTimingHints, deliveryTimingLabels } from '@/lib/measurements/constants'
import type { CreateMeasurementFormErrors, CreateMeasurementFormState } from '@/lib/measurements/schemas'
import type { DeliveryTimingType } from '@db/schema'

import { INITIAL_MEASUREMENT_FORM_STATE } from '../form-state'

type MeasurementFormAction = (
  prevState: CreateMeasurementFormState,
  formData: FormData,
) => Promise<CreateMeasurementFormState>

export type SelectOption = {
  id: string
  label: string
}

type OrderSelectOption = SelectOption & {
  assignedInstallerId?: string | null
}

export type MeasurementFormInitialValues = {
  measurementId?: string
  orderId?: string | null
  measuredById?: string | null
  scheduledAt?: Date | null
  measuredAt?: Date | null
  measuredFloorArea?: number | null
  measuredBaseboardLength?: number | null
  offcutPercent?: number | null
  panelProductId?: string | null
  additionalNotes?: string | null
  deliveryTimingType?: DeliveryTimingType
  deliveryDaysBefore?: number | null
  deliveryDate?: Date | null
}

type MeasurementFormProps = {
  mode: 'create' | 'edit'
  orders: OrderSelectOption[]
  users: SelectOption[]
  panelProducts: SelectOption[]
  actionFunction: MeasurementFormAction
  backHref?: string
  submitLabel?: string
  submitPendingLabel?: string
  defaultOrderId?: string
  initialValues?: MeasurementFormInitialValues
}

function formatLocalDateTime(value?: Date | null) {
  if (!value) {
    return ''
  }
  try {
    const date = new Date(value)
    const offset = date.getTimezoneOffset()
    const local = new Date(date.getTime() - offset * 60000)
    return local.toISOString().slice(0, 16)
  } catch {
    return ''
  }
}

function formatLocalDate(value?: Date | null) {
  if (!value) {
    return ''
  }
  try {
    const date = new Date(value)
    const offset = date.getTimezoneOffset()
    const local = new Date(date.getTime() - offset * 60000)
    return local.toISOString().slice(0, 10)
  } catch {
    return ''
  }
}

function FieldError({ message }: { message?: string }) {
  if (!message) {
    return null
  }

  return <p className="text-xs font-medium text-destructive">{message}</p>
}

function SubmitButton({ idleLabel, pendingLabel }: { idleLabel: string; pendingLabel: string }) {
  const { pending } = useFormStatus()

  return (
    <Button type="submit" className="w-full gap-2 rounded-full sm:w-auto sm:px-6 lg:px-8" disabled={pending}>
      <Save className="size-4" aria-hidden />
      {pending ? pendingLabel : idleLabel}
    </Button>
  )
}

export function MeasurementForm({
  mode,
  orders,
  users,
  panelProducts,
  actionFunction,
  backHref = '/pomiary',
  submitLabel,
  submitPendingLabel,
  defaultOrderId,
  initialValues,
}: MeasurementFormProps) {
  const [state, action] = useActionState(actionFunction, INITIAL_MEASUREMENT_FORM_STATE)
  const errors: CreateMeasurementFormErrors = state.status === 'error' ? state.errors ?? {} : {}

  const measuredAtDefault = formatLocalDateTime(initialValues?.measuredAt ?? null)
  const scheduledAtDefault = formatLocalDateTime(initialValues?.scheduledAt ?? null)
  const deliveryDateDefault = formatLocalDate(initialValues?.deliveryDate ?? null)

  const deliveryTimingOptions = useMemo(
    () =>
      (Object.entries(deliveryTimingLabels) as Array<[DeliveryTimingType, string]>).map(([value, label]) => ({
        value,
        label,
        hint: deliveryTimingHints[value] ?? undefined,
      })),
    [],
  )

  const initialOrderId = initialValues?.orderId ?? defaultOrderId ?? ''
  const currentTimingType = initialValues?.deliveryTimingType ?? 'DAYS_BEFORE'

  const resolveAssignedInstaller = useCallback(
    (orderId?: string | null) => {
      if (!orderId) {
        return ''
      }
      const assigned = orders.find((order) => order.id === orderId)?.assignedInstallerId ?? ''
      if (!assigned) {
        return ''
      }
      return users.some((user) => user.id === assigned) ? assigned : ''
    },
    [orders, users],
  )

  const [selectedOrderId, setSelectedOrderId] = useState(initialOrderId)
  const [selectedMeasuredById, setSelectedMeasuredById] = useState(() => {
    if (initialValues?.measuredById) {
      return initialValues.measuredById
    }
    return resolveAssignedInstaller(initialOrderId)
  })

  useEffect(() => {
    if (initialValues?.measuredById) {
      return
    }
    const installer = resolveAssignedInstaller(selectedOrderId)
    setSelectedMeasuredById(installer)
  }, [selectedOrderId, resolveAssignedInstaller, initialValues?.measuredById])

  return (
    <form className="space-y-6 pb-20 md:pb-16" action={action}>
      <div className="flex items-center gap-3 text-sm text-muted-foreground">
        <Button variant="ghost" asChild className="h-auto gap-2 rounded-full px-3 py-1 text-sm text-muted-foreground">
          <Link href={backHref}>
            <ArrowLeft className="size-4" aria-hidden />
            Wróć
          </Link>
        </Button>
        <Badge className="rounded-full bg-amber-100 text-amber-700">Pomiary</Badge>
        <span>{mode === 'create' ? 'Dodaj nowy pomiar dla zlecenia montażowego.' : 'Edytuj szczegóły pomiaru.'}</span>
      </div>

      {state.status === 'error' && state.message ? (
        <Alert variant="destructive" className="rounded-3xl border border-destructive/40">
          <AlertTitle>Nie udało się zapisać pomiaru</AlertTitle>
          <AlertDescription>{state.message}</AlertDescription>
        </Alert>
      ) : null}

      <Card className="border border-border/60 shadow-lg shadow-amber-500/10">
        <CardHeader className="space-y-2">
          <CardTitle className="flex items-center gap-2 text-lg text-foreground">
            <ClipboardSignature className="size-5 text-amber-600" aria-hidden />
            Powiązanie ze zleceniem
          </CardTitle>
          <CardDescription>Wybierz zlecenie oraz osobę odpowiedzialną za pomiar. Ustal planowaną datę oraz moment realizacji.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid gap-4 lg:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="orderId">Zlecenie</Label>
              <select
                id="orderId"
                name="orderId"
                required
                value={selectedOrderId}
                onChange={(event) => setSelectedOrderId(event.target.value)}
                className="h-11 w-full rounded-xl border border-border/60 bg-background px-3 text-sm text-foreground shadow-sm focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-500/30"
                aria-invalid={errors.orderId ? 'true' : 'false'}
              >
                <option value="" disabled>
                  Wybierz zlecenie…
                </option>
                {orders.map((order) => (
                  <option key={order.id} value={order.id}>
                    {order.label}
                  </option>
                ))}
              </select>
              <FieldError message={errors.orderId} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="measuredById">Pomiar wykona</Label>
              <select
                id="measuredById"
                name="measuredById"
                value={selectedMeasuredById}
                onChange={(event) => setSelectedMeasuredById(event.target.value)}
                className="h-11 w-full rounded-xl border border-border/60 bg-background px-3 text-sm text-foreground shadow-sm focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-500/30"
              >
                <option value="">Nie wskazano</option>
                {users.map((user) => (
                  <option key={user.id} value={user.id}>
                    {user.label}
                  </option>
                ))}
              </select>
              <FieldError message={errors.measuredById} />
            </div>
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="scheduledAt">Planowany termin pomiaru</Label>
              <Input
                id="scheduledAt"
                name="scheduledAt"
                type="datetime-local"
                defaultValue={scheduledAtDefault}
                aria-invalid={errors.scheduledAt ? 'true' : 'false'}
              />
              <FieldError message={errors.scheduledAt} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="measuredAt">Data realizacji pomiaru</Label>
              <Input
                id="measuredAt"
                name="measuredAt"
                type="datetime-local"
                defaultValue={measuredAtDefault}
                aria-invalid={errors.measuredAt ? 'true' : 'false'}
              />
              <FieldError message={errors.measuredAt} />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="border border-border/60 shadow-sm">
        <CardHeader className="space-y-2">
          <CardTitle className="flex items-center gap-2 text-lg text-foreground">
            <Ruler className="size-5 text-amber-600" aria-hidden />
            Parametry pomiaru
          </CardTitle>
          <CardDescription>Wprowadź zmierzone wartości oraz dodatkowe notatki z wizji lokalnej.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid gap-4 lg:grid-cols-3">
            <div className="space-y-2">
              <Label htmlFor="measuredFloorArea">Powierzchnia (m²)</Label>
              <Input
                id="measuredFloorArea"
                name="measuredFloorArea"
                type="number"
                step="0.1"
                min="0"
                placeholder="np. 78.4"
                defaultValue={initialValues?.measuredFloorArea ?? ''}
                aria-invalid={errors.measuredFloorArea ? 'true' : 'false'}
              />
              <FieldError message={errors.measuredFloorArea} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="measuredBaseboardLength">Długość listew (mb)</Label>
              <Input
                id="measuredBaseboardLength"
                name="measuredBaseboardLength"
                type="number"
                step="0.1"
                min="0"
                placeholder="np. 53.2"
                defaultValue={initialValues?.measuredBaseboardLength ?? ''}
                aria-invalid={errors.measuredBaseboardLength ? 'true' : 'false'}
              />
              <FieldError message={errors.measuredBaseboardLength} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="offcutPercent">Docinki (%)</Label>
              <Input
                id="offcutPercent"
                name="offcutPercent"
                type="number"
                step="1"
                min="0"
                max="100"
                placeholder="np. 8"
                defaultValue={initialValues?.offcutPercent ?? ''}
                aria-invalid={errors.offcutPercent ? 'true' : 'false'}
              />
              <FieldError message={errors.offcutPercent} />
            </div>
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="panelProductId">Rekomendowany model paneli</Label>
              <select
                id="panelProductId"
                name="panelProductId"
                defaultValue={initialValues?.panelProductId ?? ''}
                className="h-11 w-full rounded-xl border border-border/60 bg-background px-3 text-sm text-foreground shadow-sm focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-500/30"
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
          </div>

          <div className="space-y-2">
            <Label htmlFor="additionalNotes">Notatki z pomiaru</Label>
            <Textarea
              id="additionalNotes"
              name="additionalNotes"
              placeholder="Wpisz dodatkowe obserwacje, uwagi klienta, rekomendacje…"
              defaultValue={initialValues?.additionalNotes ?? ''}
              className="min-h-32 rounded-2xl"
            />
            <FieldError message={errors.additionalNotes} />
          </div>
        </CardContent>
      </Card>

      <Card className="border border-border/60 shadow-sm">
        <CardHeader className="space-y-2">
          <CardTitle className="flex items-center gap-2 text-lg text-foreground">
            <CalendarClock className="size-5 text-amber-600" aria-hidden />
            Plan dostawy materiałów
          </CardTitle>
          <CardDescription>Zaznacz, kiedy materiały powinny dotrzeć przed montażem, aby zsynchronizować logistykę.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-3">
            <span className="text-sm font-medium text-foreground">Sposób określenia terminu</span>
            <div className="grid gap-2 sm:grid-cols-2">
              {deliveryTimingOptions.map((option) => {
                const isActive = (initialValues?.deliveryTimingType ?? currentTimingType) === option.value
                return (
                  <label
                    key={option.value}
                    className={`flex cursor-pointer items-center justify-between gap-3 rounded-2xl border px-4 py-3 text-sm transition ${
                      isActive
                        ? 'border-amber-500 bg-amber-500/10 text-amber-700 shadow-sm shadow-amber-500/10'
                        : 'border-border/60 bg-muted/30 text-muted-foreground hover:border-amber-400/80 hover:bg-amber-500/10 hover:text-amber-700'
                    }`}
                  >
                    <div className="flex flex-col gap-1">
                      <span className="font-semibold">{option.label}</span>
                      <span className="text-xs text-muted-foreground">
                        {option.hint ?? deliveryTimingLabels[option.value as DeliveryTimingType]}
                      </span>
                    </div>
                    <input
                      type="radio"
                      name="deliveryTimingType"
                      value={option.value}
                      defaultChecked={option.value === (initialValues?.deliveryTimingType ?? currentTimingType)}
                      className="size-4"
                    />
                  </label>
                )
              })}
            </div>
            <FieldError message={errors.deliveryTimingType} />
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="deliveryDaysBefore">Dostawa ile dni przed montażem?</Label>
              <Input
                id="deliveryDaysBefore"
                name="deliveryDaysBefore"
                type="number"
                min="0"
                step="1"
                placeholder="np. 5"
                defaultValue={initialValues?.deliveryDaysBefore ?? ''}
                aria-invalid={errors.deliveryDaysBefore ? 'true' : 'false'}
              />
              <FieldError message={errors.deliveryDaysBefore} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="deliveryDate">Konkretny termin dostawy</Label>
              <Input
                id="deliveryDate"
                name="deliveryDate"
                type="date"
                defaultValue={deliveryDateDefault}
                aria-invalid={errors.deliveryDate ? 'true' : 'false'}
              />
              <FieldError message={errors.deliveryDate} />
            </div>
          </div>
          <p className="text-xs text-muted-foreground">
            Wybierz tylko jedno z pól powyżej – schemat walidacji zadba o spójność danych.
          </p>
        </CardContent>
      </Card>

      <Card className="border border-border/60 shadow-sm">
        <CardHeader className="space-y-2">
          <CardTitle className="flex items-center gap-2 text-lg text-foreground">
            <UploadCloud className="size-5 text-amber-600" aria-hidden />
            Załączniki z pomiaru
          </CardTitle>
          <CardDescription>Dodaj zdjęcia, szkice lub dokumenty. Pliki trafią do repozytorium klienta i będą widoczne w szczegółach zlecenia.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="files">Dodaj pliki</Label>
            <Input
              id="files"
              name="files"
              type="file"
              multiple
              className="rounded-2xl border-dashed border-amber-400/60 bg-amber-50/40 file:mr-4 file:rounded-full file:border-0 file:bg-amber-500 file:px-4 file:py-2 file:text-sm file:font-semibold file:text-amber-50 hover:file:bg-amber-600"
            />
            <p className="text-xs text-muted-foreground">Obsługujemy obrazy, PDF-y i dokumenty. Limit 25 MB na plik.</p>
            <FieldError message={errors.files} />
          </div>
        </CardContent>
      </Card>

      {initialValues?.measurementId ? (
        <input type="hidden" name="measurementId" value={initialValues.measurementId} />
      ) : null}

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="text-xs text-muted-foreground">
          Zapis tworzy wpis w historii zlecenia oraz aktualizuje zakładkę „Pomiary”.
        </div>
        <SubmitButton
          idleLabel={submitLabel ?? (mode === 'create' ? 'Zapisz pomiar' : 'Zapisz zmiany')}
          pendingLabel={submitPendingLabel ?? (mode === 'create' ? 'Zapisywanie…' : 'Aktualizowanie…')}
        />
      </div>
    </form>
  )
}
