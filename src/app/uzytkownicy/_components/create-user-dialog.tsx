'use client'

import { useActionState, useEffect, useRef, useState } from 'react'
import { UserPlus } from 'lucide-react'
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
import { createUserAction } from '../actions'
import { INITIAL_CREATE_USER_FORM_STATE } from '../form-state'
import type { CreateUserFormState } from '@/lib/users/schemas'
import { UserForm, type UserFormDefaultValues } from './user-form'

const DEFAULT_VALUES: UserFormDefaultValues = {
  name: '',
  email: '',
  username: '',
  phone: '',
  role: 'ADMIN',
}

export function CreateUserDialog() {
  const [open, setOpen] = useState(false)
  const [formKey, setFormKey] = useState(0)
  const formRef = useRef<HTMLFormElement>(null)
  const [state, formAction] = useActionState<CreateUserFormState, FormData>(
    createUserAction,
    INITIAL_CREATE_USER_FORM_STATE,
  )

  useEffect(() => {
    if (state.status === 'success') {
      if (state.message) {
        toast.success(state.message)
      } else {
        toast.success('Użytkownik został utworzony.')
      }
      formRef.current?.reset()
      setOpen(false)
      setFormKey((value) => value + 1)
    }
  }, [state])

  const handleOpenChange = (next: boolean) => {
    setOpen(next)
    if (!next) {
      formRef.current?.reset()
      setFormKey((value) => value + 1)
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
  <Button className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow-sm transition hover:bg-primary/90 sm:w-auto">
          <UserPlus className="size-4" aria-hidden />
          Dodaj użytkownika
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Dodaj nowego użytkownika</DialogTitle>
          <DialogDescription>
            Uzupełnij dane logowania i przypisz odpowiednią rolę, aby zaprosić kolejną osobę do systemu.
          </DialogDescription>
        </DialogHeader>
        <UserForm
          key={formKey}
          mode="create"
          state={state}
          formRef={formRef}
          action={formAction}
          defaultValues={DEFAULT_VALUES}
          submitLabel="Dodaj użytkownika"
          pendingLabel="Zapisywanie…"
          passwordRequired
        />
      </DialogContent>
    </Dialog>
  )
}
