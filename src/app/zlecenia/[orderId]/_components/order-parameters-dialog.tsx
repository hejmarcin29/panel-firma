"use client"

import { useActionState } from "react"
import { useFormStatus } from "react-dom"
import { ClipboardEdit, Save } from "lucide-react"

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"

import { updateOrderAction } from "../../actions"
import { INITIAL_ORDER_FORM_STATE } from "../../form-state"

import type { OrderDetail } from "@/lib/orders"
import type { CreateOrderFormErrors } from "@/lib/orders/schemas"

type SelectOption = {
  id: string
  label: string
}

type OrderParametersDialogProps = {
  detail: OrderDetail
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
    <Button type="submit" className="gap-2 rounded-full" disabled={pending}>
      <Save className="size-4" aria-hidden />
      {pending ? "Zapisywanie…" : "Zapisz zmiany"}
    </Button>
  )
}

export function OrderParametersDialog({ detail, panelProducts, baseboardProducts }: OrderParametersDialogProps) {
  const boundAction = updateOrderAction.bind(null, detail.order.id)
  const [state, action] = useActionState(boundAction, INITIAL_ORDER_FORM_STATE)
  const errors: CreateOrderFormErrors | undefined = state.status === "error" ? state.errors : undefined

  const reference = detail.order.orderNumber ?? detail.order.id.slice(0, 7).toUpperCase()

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2 rounded-full border-primary/50 text-primary shadow-sm">
          <ClipboardEdit className="size-4" aria-hidden />
          Edytuj parametry
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Edycja parametrów inwestycji</DialogTitle>
          <DialogDescription>
            Zaktualizuj dane liczbowe i preferencje produktów dla zlecenia #{reference}.
          </DialogDescription>
        </DialogHeader>
        <form action={action} className="space-y-6">
          <input type="hidden" name="clientId" value={detail.order.clientId} />
          <input type="hidden" name="partnerId" value={detail.order.partnerId ?? ""} />
          <input type="hidden" name="ownerId" value={detail.order.ownerId ?? ""} />
          <input type="hidden" name="assignedInstallerId" value={detail.order.assignedInstallerId ?? ""} />
          <input type="hidden" name="orderNumber" value={detail.order.orderNumber ?? ""} />
          <input type="hidden" name="title" value={detail.order.title ?? ""} />
          <input type="hidden" name="executionMode" value={detail.order.executionMode} />
          <input type="hidden" name="stage" value={detail.order.stage} />
          <input type="hidden" name="stageNotes" value={detail.order.stageNotes ?? ""} />
          <input type="hidden" name="requiresAdminAttention" value={detail.order.requiresAdminAttention ? "true" : "false"} />
          <input type="hidden" name="quoteSent" value={detail.order.quoteSent ? "true" : "false"} />
          <input type="hidden" name="depositInvoiceIssued" value={detail.order.depositInvoiceIssued ? "true" : "false"} />
          <input type="hidden" name="finalInvoiceIssued" value={detail.order.finalInvoiceIssued ? "true" : "false"} />

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="declaredFloorArea">Powierzchnia (m²)</Label>
              <Input
                id="declaredFloorArea"
                name="declaredFloorArea"
                type="number"
                step="0.1"
                min="0"
                defaultValue={detail.order.declaredFloorArea ?? ""}
                placeholder="np. 120"
              />
              <FieldError message={errors?.declaredFloorArea} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="declaredBaseboardLength">Listwy (mb)</Label>
              <Input
                id="declaredBaseboardLength"
                name="declaredBaseboardLength"
                type="number"
                step="0.1"
                min="0"
                defaultValue={detail.order.declaredBaseboardLength ?? ""}
                placeholder="np. 45"
              />
              <FieldError message={errors?.declaredBaseboardLength} />
            </div>
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="buildingType">Typ budynku</Label>
              <Input
                id="buildingType"
                name="buildingType"
                defaultValue={detail.order.buildingType ?? ""}
                placeholder="np. apartament, dom jednorodzinny"
              />
              <FieldError message={errors?.buildingType} />
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="panelPreference">Preferencje paneli</Label>
              <Textarea
                id="panelPreference"
                name="panelPreference"
                rows={3}
                defaultValue={detail.order.panelPreference ?? ""}
                placeholder="Opis oczekiwanego wzoru, koloru, klasy jakości"
              />
              <FieldError message={errors?.panelPreference} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="baseboardPreference">Preferencje listew</Label>
              <Textarea
                id="baseboardPreference"
                name="baseboardPreference"
                rows={3}
                defaultValue={detail.order.baseboardPreference ?? ""}
                placeholder="Opis materiału, wysokości, koloru"
              />
              <FieldError message={errors?.baseboardPreference} />
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="preferredPanelProductId">Preferowany model paneli</Label>
              <select
                id="preferredPanelProductId"
                name="preferredPanelProductId"
                defaultValue={detail.order.preferredPanelProductId ?? ""}
                className="h-11 w-full rounded-xl border border-border/60 bg-background px-3 text-sm text-foreground shadow-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/30"
              >
                <option value="">Nie wybrano</option>
                {panelProducts.map((product) => (
                  <option key={product.id} value={product.id}>
                    {product.label}
                  </option>
                ))}
              </select>
              <FieldError message={errors?.preferredPanelProductId} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="preferredBaseboardProductId">Preferowany model listew</Label>
              <select
                id="preferredBaseboardProductId"
                name="preferredBaseboardProductId"
                defaultValue={detail.order.preferredBaseboardProductId ?? ""}
                className="h-11 w-full rounded-xl border border-border/60 bg-background px-3 text-sm text-foreground shadow-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/30"
              >
                <option value="">Nie wybrano</option>
                {baseboardProducts.map((product) => (
                  <option key={product.id} value={product.id}>
                    {product.label}
                  </option>
                ))}
              </select>
              <FieldError message={errors?.preferredBaseboardProductId} />
            </div>
          </div>

          {state.status === "error" && state.message ? (
            <Alert variant="destructive">
              <AlertTitle>Nie udało się zapisać zmian</AlertTitle>
              <AlertDescription>{state.message}</AlertDescription>
            </Alert>
          ) : null}

          <DialogFooter className="flex flex-col gap-2 sm:flex-row sm:justify-end">
            <DialogClose asChild>
              <Button type="button" variant="outline" className="w-full rounded-full sm:w-auto">
                Anuluj
              </Button>
            </DialogClose>
            <SubmitButton />
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
