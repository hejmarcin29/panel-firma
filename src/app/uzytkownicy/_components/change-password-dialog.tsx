'use client'

import { type ReactNode, useActionState, useEffect, useMemo, useRef, useState } from 'react'
import { useFormStatus } from 'react-dom'
import { KeyRound } from 'lucide-react'
import { toast } from 'sonner'

import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import type { UserListItem } from '@/lib/users'
import type { ChangeUserPasswordFormState } from '@/lib/users/schemas'
import { changeUserPasswordAction } from '../actions'
import { INITIAL_CHANGE_USER_PASSWORD_FORM_STATE } from '../form-state'

function FieldError({ message }: { message?: string }) {
  if (!message) {
    return null
  }

  return <p className="text-xs font-medium text-destructive">{message}</p>
}

function SubmitButton({ idleLabel, pendingLabel }: { idleLabel: string; pendingLabel: string }) {
  const { pending } = useFormStatus()

  return (
    <Button type="submit" className="w-full gap-2" disabled={pending}>
      {pending ? pendingLabel : idleLabel}
    </Button>
  )
}

export type ChangePasswordDialogProps = {
  user: UserListItem
  open?: boolean
  onOpenChange?: (open: boolean) => void
  hideTrigger?: boolean
  trigger?: ReactNode
}

export function ChangePasswordDialog({
  user,
  open: controlledOpen,
  onOpenChange,
  hideTrigger = false,
  trigger,
}: ChangePasswordDialogProps) {
  const [uncontrolledOpen, setUncontrolledOpen] = useState(false)
  const [formKey, setFormKey] = useState(0)
  const formRef = useRef<HTMLFormElement>(null)
  const [state, formAction] = useActionState<ChangeUserPasswordFormState, FormData>(
    changeUserPasswordAction,
    INITIAL_CHANGE_USER_PASSWORD_FORM_STATE,
  )
  const isControlled = typeof controlledOpen === 'boolean' && typeof onOpenChange === 'function'
  const open = isControlled ? (controlledOpen as boolean) : uncontrolledOpen
  const setOpen = useMemo(() => {
    if (isControlled) {
      return onOpenChange as (next: boolean) => void
    }
    return (next: boolean) => {
      setUncontrolledOpen(next)
    }
  }, [isControlled, onOpenChange])

  useEffect(() => {
    if (state.status === 'success') {
      toast.success(state.message ?? 'Hasło zostało zaktualizowane.')
      formRef.current?.reset()
      setOpen(false)
    }
  }, [setOpen, state])

  useEffect(() => {
    if (!open) {
      formRef.current?.reset()
      setFormKey((value) => value + 1)
    }
  }, [open])

  const errors = state.status === 'error' ? state.errors ?? {} : {}

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      {hideTrigger ? null : (
        <DialogTrigger asChild>
          {trigger ?? (
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 rounded-full border border-border/40 text-muted-foreground hover:text-primary"
              aria-label={`Zmień hasło użytkownika ${user.username}`}
            >
              <KeyRound className="size-4" aria-hidden />
            </Button>
          )}
        </DialogTrigger>
      )}
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Zmień hasło</DialogTitle>
          <DialogDescription>
            Ustaw nowe hasło dla konta <span className="font-semibold text-foreground">{user.username}</span>.
            Nowe dane logowania zaczną działać od razu po zapisaniu zmian.
          </DialogDescription>
        </DialogHeader>
        <form
          key={formKey}
          ref={formRef}
          action={formAction}
          className="space-y-5"
        >
          <input type="hidden" name="userId" value={user.id} />
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor={`password-${user.id}`}>Nowe hasło</Label>
              <Input
                id={`password-${user.id}`}
                name="password"
                type="password"
                placeholder="••••••••"
                autoComplete="new-password"
                required
              />
              <FieldError message={errors?.password} />
            </div>
            <div className="space-y-2">
              <Label htmlFor={`confirmPassword-${user.id}`}>Powtórz hasło</Label>
              <Input
                id={`confirmPassword-${user.id}`}
                name="confirmPassword"
                type="password"
                placeholder="••••••••"
                autoComplete="new-password"
                required
              />
              <FieldError message={errors?.confirmPassword} />
            </div>
            <p className="text-xs text-muted-foreground">
              Hasło musi mieć co najmniej 8 znaków. Zalecamy łączenie liter, cyfr i znaków specjalnych.
            </p>
          </div>

          {state.status === 'error' && state.message ? (
            <Alert variant="destructive">
              <AlertTitle>Nie udało się zmienić hasła</AlertTitle>
              <AlertDescription>{state.message}</AlertDescription>
            </Alert>
          ) : null}

          <DialogFooter>
            <Button type="button" variant="outline" className="w-full sm:w-auto" onClick={() => setOpen(false)}>
              Anuluj
            </Button>
            <SubmitButton idleLabel="Zapisz nowe hasło" pendingLabel="Zapisywanie…" />
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
