'use client'

import { type ReactNode, useActionState, useEffect, useMemo, useRef, useState } from 'react'
import { Pencil } from 'lucide-react'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import type { UserListItem } from '@/lib/users'
import type { UpdateUserFormState } from '@/lib/users/schemas'
import { updateUserAction } from '../actions'
import { INITIAL_UPDATE_USER_FORM_STATE } from '../form-state'
import { UserForm, type UserFormDefaultValues } from './user-form'

type EditUserDialogProps = {
  user: UserListItem
  open?: boolean
  onOpenChange?: (open: boolean) => void
  hideTrigger?: boolean
  trigger?: ReactNode
}

export function EditUserDialog({
  user,
  open: controlledOpen,
  onOpenChange,
  hideTrigger = false,
  trigger,
}: EditUserDialogProps) {
  const [uncontrolledOpen, setUncontrolledOpen] = useState(false)
  const [formKey, setFormKey] = useState(0)
  const formRef = useRef<HTMLFormElement>(null)
  const [state, formAction] = useActionState<UpdateUserFormState, FormData>(
    updateUserAction,
    INITIAL_UPDATE_USER_FORM_STATE,
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
      if (state.message) {
        toast.success(state.message)
      } else {
        toast.success('Dane użytkownika zostały zaktualizowane.')
      }
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

  const defaultValues: UserFormDefaultValues = {
    id: user.id,
    name: user.name ?? '',
    email: user.email,
    username: user.username,
    phone: user.phone ?? '',
    role: user.role,
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      {hideTrigger ? null : (
        <DialogTrigger asChild>
          {trigger ?? (
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 rounded-full border border-border/40 text-muted-foreground hover:text-primary"
              aria-label={`Edytuj użytkownika ${user.username}`}
            >
              <Pencil className="size-4" aria-hidden />
            </Button>
          )}
        </DialogTrigger>
      )}
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Edytuj dane użytkownika</DialogTitle>
          <DialogDescription>
            Zmień dane kontaktowe, rolę lub zresetuj hasło. Pozostaw pola hasła puste, jeśli nie chcesz go aktualizować.
          </DialogDescription>
        </DialogHeader>
        <UserForm
          key={formKey}
          mode="edit"
          state={state}
          formRef={formRef}
          action={formAction}
          defaultValues={defaultValues}
          submitLabel="Zapisz zmiany"
          pendingLabel="Zapisywanie…"
        />
      </DialogContent>
    </Dialog>
  )
}
