"use client"

import { useActionState, useEffect, useMemo, useState } from "react"
import { useFormStatus } from "react-dom"
import Link from "next/link"
import { ArrowLeft, ClipboardEdit, Save } from "lucide-react"

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import type { OrderStage } from "@db/schema"

import { updateOrderAction } from "../../actions"
import { INITIAL_ORDER_FORM_STATE } from "../../form-state"
import type { OrderForEditing } from "@/lib/orders"

export type SelectOption = {
  id: string
  label: string
}

export type StageOption = {
  value: OrderStage
  label: string
}

type EditOrderFormProps = {
  order: OrderForEditing
  clients: SelectOption[]
  partners: SelectOption[]
  users: SelectOption[]
  panelProducts: SelectOption[]
  baseboardProducts: SelectOption[]
  stageOptions: StageOption[]
}

const EXECUTION_MODE_OPTIONS = [
  {
    value: "INSTALLATION_ONLY",
    title: "Pełny montaż",
    description: "Planowanie pomiaru, dostaw i montażu ekipą.",
  },
  {
    value: "DELIVERY_ONLY",
    title: "Tylko dostawa",
    description: "Obsługa logistyczna bez planowania montażu.",
  },
] as const

type ExecutionMode = (typeof EXECUTION_MODE_OPTIONS)[number]["value"]

const DELIVERY_STAGE_VALUES = new Set<OrderStage>(["RECEIVED", "BEFORE_DELIVERY", "AWAITING_FINAL_PAYMENT", "COMPLETED"])
const DEFAULT_STAGE_FALLBACK: OrderStage = "RECEIVED"

const computeStageForMode = (mode: ExecutionMode, options: StageOption[], preferred?: OrderStage): OrderStage => {
  if (preferred && options.some((option) => option.value === preferred)) {
    return preferred
  }

  const recommended = mode === "DELIVERY_ONLY" ? "BEFORE_DELIVERY" : "BEFORE_INSTALLATION"
  const recommendedOption = options.find((option) => option.value === recommended)
  if (recommendedOption) {
    return recommendedOption.value
  }

  return options[0]?.value ?? DEFAULT_STAGE_FALLBACK
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
      {pending ? "Zapisywanie…" : "Zapisz zmiany"}
    </Button>
  )
}

export function EditOrderForm({
  order,
  clients,
  partners,
  users,
  panelProducts,
  baseboardProducts,
  stageOptions,
}: EditOrderFormProps) {
  const boundAction = updateOrderAction.bind(null, order.id)
  const [state, action] = useActionState(boundAction, INITIAL_ORDER_FORM_STATE)
  const errors = state.status === "error" ? state.errors ?? {} : {}

  const [executionMode, setExecutionMode] = useState<ExecutionMode>(order.executionMode)
  const [selectedStage, setSelectedStage] = useState<OrderStage>(() => computeStageForMode(order.executionMode, stageOptions, order.stage))

  const filteredStageOptions = useMemo(() => {
    if (executionMode === "DELIVERY_ONLY") {
      const filtered = stageOptions.filter((option) => DELIVERY_STAGE_VALUES.has(option.value))
      return filtered.length > 0 ? filtered : stageOptions
    }
    return stageOptions
  }, [executionMode, stageOptions])

  useEffect(() => {
    const allowedValues = new Set(filteredStageOptions.map((option) => option.value))
    if (!allowedValues.has(selectedStage)) {
      const fallback = computeStageForMode(executionMode, stageOptions)
      setSelectedStage(fallback)
    }
  }, [executionMode, filteredStageOptions, selectedStage, stageOptions])

  return (
    <form className="space-y-6" action={action}>
      <Card className="border border-border/60 shadow-lg shadow-primary/10">
        <CardHeader className="space-y-2">
          <CardTitle className="flex items-center gap-2 text-lg text-foreground">
            <ClipboardEdit className="size-5 text-primary" aria-hidden />
            Podstawowe dane zlecenia
          </CardTitle>
          <CardDescription>Zaktualizuj klienta, właściciela procesu oraz podstawowy opis zlecenia.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-3">
            <Label className="text-sm font-medium text-foreground">Tryb zlecenia</Label>
            <RadioGroup
              name="executionMode"
              value={executionMode}
              onValueChange={(value) => setExecutionMode(value as ExecutionMode)}
              className="grid gap-2 sm:grid-cols-2"
            >
              {EXECUTION_MODE_OPTIONS.map((option) => {
                const id = `execution-mode-${option.value.toLowerCase()}`
                const isSelected = executionMode === option.value
                return (
                  <label
                    key={option.value}
                    htmlFor={id}
                    className={
                      "flex cursor-pointer items-start gap-3 rounded-2xl border border-border/60 bg-background/70 p-4 shadow-xs transition hover:border-primary/60 hover:shadow-sm" +
                      (isSelected ? " border-primary/70 shadow-primary/10" : "")
                    }
                  >
                    <RadioGroupItem id={id} value={option.value} className="mt-1" />
                    <span className="flex flex-col gap-1">
                      <span className="text-sm font-semibold text-foreground">{option.title}</span>
                      <span className="text-xs text-muted-foreground">{option.description}</span>
                    </span>
                  </label>
                )
              })}
            </RadioGroup>
            <input type="hidden" name="executionMode" value={executionMode} />
            <FieldError message={errors.executionMode} />
          </div>

          <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
            <div className="space-y-2">
              <Label htmlFor="clientId">Klient</Label>
              <select
                id="clientId"
                name="clientId"
                required
                defaultValue={order.clientId}
                className="h-11 w-full rounded-xl border border-border/60 bg-background px-3 text-sm text-foreground shadow-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/30"
                aria-invalid={errors.clientId ? "true" : "false"}
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
                defaultValue={order.partnerId ?? ""}
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
                defaultValue={order.ownerId ?? ""}
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
              <Label htmlFor="orderNumber">Numer zlecenia</Label>
              <Input id="orderNumber" name="orderNumber" placeholder="np. ZL-2025-001" defaultValue={order.orderNumber ?? ""} />
              <FieldError message={errors.orderNumber} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="title">Tytuł / opis skrócony</Label>
              <Input id="title" name="title" placeholder="np. Montaż paneli w apartamencie" defaultValue={order.title ?? ""} />
              <FieldError message={errors.title} />
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1fr_1fr]">
            <div className="space-y-2">
              <Label htmlFor="stage">Etap procesu</Label>
              <select
                id="stage"
                name="stage"
                value={selectedStage}
                onChange={(event) => setSelectedStage(event.target.value as OrderStage)}
                className="h-11 w-full rounded-xl border border-border/60 bg-background px-3 text-sm text-foreground shadow-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/30"
              >
                {filteredStageOptions.map((stage) => (
                  <option key={stage.value} value={stage.value}>
                    {stage.label}
                  </option>
                ))}
              </select>
              <FieldError message={errors.stage} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="stageNotes">Notatka do etapu (opcjonalnie)</Label>
              <Input id="stageNotes" name="stageNotes" placeholder="np. oczekujemy na potwierdzenie zaliczki" defaultValue={order.stageNotes ?? ""} />
              <FieldError message={errors.stageNotes} />
            </div>
          </div>
        </CardContent>
      </Card>

      {executionMode === "INSTALLATION_ONLY" ? (
        <Card className="border border-border/60 shadow-sm">
          <CardHeader className="space-y-2">
            <CardTitle className="text-lg text-foreground">Parametry inwestycji</CardTitle>
            <CardDescription>Zaktualizuj dane liczbowe, preferencje produktów i typ budynku.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
              <div className="space-y-2">
                <Label htmlFor="declaredFloorArea">Powierzchnia (m²)</Label>
                <Input
                  id="declaredFloorArea"
                  name="declaredFloorArea"
                  type="number"
                  step="0.1"
                  min="0"
                  placeholder="np. 120"
                  defaultValue={order.declaredFloorArea ?? ""}
                />
                <FieldError message={errors.declaredFloorArea} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="declaredBaseboardLength">Listwy przypodłogowe (mb)</Label>
                <Input
                  id="declaredBaseboardLength"
                  name="declaredBaseboardLength"
                  type="number"
                  step="0.1"
                  min="0"
                  placeholder="np. 45"
                  defaultValue={order.declaredBaseboardLength ?? ""}
                />
                <FieldError message={errors.declaredBaseboardLength} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="buildingType">Typ budynku</Label>
                <Input id="buildingType" name="buildingType" placeholder="np. apartament, dom jednorodzinny" defaultValue={order.buildingType ?? ""} />
                <FieldError message={errors.buildingType} />
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="panelPreference">Preferencje paneli</Label>
                <Textarea
                  id="panelPreference"
                  name="panelPreference"
                  rows={3}
                  placeholder="Opis oczekiwanego wzoru, koloru, klasy jakości"
                  defaultValue={order.panelPreference ?? ""}
                />
                <FieldError message={errors.panelPreference} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="baseboardPreference">Preferencje listew</Label>
                <Textarea
                  id="baseboardPreference"
                  name="baseboardPreference"
                  rows={3}
                  placeholder="Opis materiału, wysokości, koloru"
                  defaultValue={order.baseboardPreference ?? ""}
                />
                <FieldError message={errors.baseboardPreference} />
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="preferredPanelProductId">Preferowany model paneli</Label>
                <select
                  id="preferredPanelProductId"
                  name="preferredPanelProductId"
                  defaultValue={order.preferredPanelProductId ?? ""}
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
                  defaultValue={order.preferredBaseboardProductId ?? ""}
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
      ) : (
        <Card className="border border-dashed border-primary/40 bg-primary/5 shadow-sm">
          <CardHeader className="space-y-2">
            <CardTitle className="text-lg text-foreground">Montaż pominięty</CardTitle>
            <CardDescription>Zlecenie w trybie dostawy nie wymaga wprowadzania parametrów montażowych.</CardDescription>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            W każdej chwili możesz przełączyć tryb na montaż i odblokować edycję danych inwestycji.
          </CardContent>
        </Card>
      )}

      <Card className="border border-border/60 shadow-sm">
        <CardHeader className="space-y-2">
          <CardTitle className="text-lg text-foreground">Kontrola procesu</CardTitle>
          <CardDescription>Zdecyduj, które dokumenty są gotowe i czy zlecenie wymaga reakcji administratora.</CardDescription>
        </CardHeader>
        <CardContent className="grid grid-cols-1 gap-3 md:grid-cols-2">
          <label className="flex items-center gap-3 rounded-xl border border-border/60 bg-muted/40 px-4 py-3 text-sm">
            <input
              type="checkbox"
              name="requiresAdminAttention"
              className="size-4 rounded border-border/70 text-primary focus:ring-primary"
              defaultChecked={order.requiresAdminAttention}
            />
            <span>Oznacz jako wymagające uwagi administratora</span>
          </label>
          <label className="flex items-center gap-3 rounded-xl border border-border/60 bg-muted/40 px-4 py-3 text-sm">
            <input
              type="checkbox"
              name="quoteSent"
              className="size-4 rounded border-border/70 text-primary focus:ring-primary"
              defaultChecked={order.quoteSent}
            />
            <span>Wycena została wysłana do klienta</span>
          </label>
          <label className="flex items-center gap-3 rounded-xl border border-border/60 bg-muted/40 px-4 py-3 text-sm">
            <input
              type="checkbox"
              name="depositInvoiceIssued"
              className="size-4 rounded border-border/70 text-primary focus:ring-primary"
              defaultChecked={order.depositInvoiceIssued}
            />
            <span>Wystawiono fakturę zaliczkową</span>
          </label>
          <label className="flex items-center gap-3 rounded-xl border border-border/60 bg-muted/40 px-4 py-3 text-sm">
            <input
              type="checkbox"
              name="finalInvoiceIssued"
              className="size-4 rounded border-border/70 text-primary focus:ring-primary"
              defaultChecked={order.finalInvoiceIssued}
            />
            <span>Wystawiono fakturę końcową</span>
          </label>
        </CardContent>
      </Card>

      {state.status === "error" && state.message ? (
        <Alert variant="destructive">
          <AlertTitle>Błąd zapisu</AlertTitle>
          <AlertDescription>{state.message}</AlertDescription>
        </Alert>
      ) : null}

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <Button variant="outline" asChild className="gap-2 rounded-full">
          <Link href={`/zlecenia/${order.id}`}>
            <ArrowLeft className="size-4" aria-hidden />
            Wróć do szczegółów zlecenia
          </Link>
        </Button>
        <SubmitButton />
      </div>
    </form>
  )
}
