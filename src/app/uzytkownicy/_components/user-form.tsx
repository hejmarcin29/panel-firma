'use client'

import { type MutableRefObject, useEffect, useState } from 'react'
import { useFormStatus } from 'react-dom'

import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { DialogClose, DialogFooter } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import type { UserRole } from '@/lib/user-roles'
import { userRoleLabels, userRoleOptions } from '@/lib/user-roles'
import type { CreateUserFormState, UpdateUserFormState } from '@/lib/users/schemas'

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

export type UserFormDefaultValues = {
  id?: string
  username?: string
  email?: string
  name?: string | null
  phone?: string | null
  role?: UserRole | ''
}

type UserFormProps = {
  mode: 'create' | 'edit'
  state: CreateUserFormState | UpdateUserFormState
  formRef: MutableRefObject<HTMLFormElement | null>
  action: (formData: FormData) => void
  defaultValues: UserFormDefaultValues
  submitLabel: string
  pendingLabel: string
  passwordRequired?: boolean
}

export function UserForm({
  mode,
  state,
  formRef,
  action,
  defaultValues,
  submitLabel,
  pendingLabel,
  passwordRequired = false,
}: UserFormProps) {
  const errors = state.status === 'error' ? state.errors ?? {} : {}
  const defaultRoleValue = defaultValues.role ?? 'ADMIN'
  const [selectedRole, setSelectedRole] = useState<UserRole | ''>(defaultRoleValue)

  useEffect(() => {
    setSelectedRole(defaultValues.role ?? 'ADMIN')
  }, [defaultValues.role, mode])

  return (
  <form ref={formRef} action={action} className="space-y-5">
      {mode === 'edit' && defaultValues.id ? <input type="hidden" name="userId" value={defaultValues.id} /> : null}

      <div className="space-y-4">
        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor={`${mode}-name`}>Imię i nazwisko</Label>
            <Input
              id={`${mode}-name`}
              name="name"
              defaultValue={defaultValues.name ?? ''}
              autoComplete="name"
              placeholder="np. Anna Kowalska"
            />
            <FieldError message={errors?.name} />
          </div>
          <div className="space-y-2">
            <Label htmlFor={`${mode}-email`}>Adres e-mail</Label>
            <Input
              id={`${mode}-email`}
              name="email"
              type="email"
              defaultValue={defaultValues.email ?? ''}
              autoComplete={mode === 'create' ? 'email' : 'username'}
              placeholder="np. anna@firma.pl"
              required
            />
            <FieldError message={errors?.email} />
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor={`${mode}-username`}>Login</Label>
            <Input
              id={`${mode}-username`}
              name="username"
              defaultValue={defaultValues.username ?? ''}
              autoComplete={mode === 'create' ? 'username' : 'off'}
              placeholder="np. ania"
              required
            />
            <FieldError message={errors?.username} />
          </div>
          <div className="space-y-2">
            <Label htmlFor={`${mode}-phone`}>Telefon (opcjonalnie)</Label>
            <Input
              id={`${mode}-phone`}
              name="phone"
              defaultValue={defaultValues.phone ?? ''}
              autoComplete="tel"
              placeholder="np. +48 600 600 600"
            />
            <FieldError message={errors?.phone} />
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor={`${mode}-role`}>Rola w systemie</Label>
            <div className="flex items-center gap-3">
              <select
                id={`${mode}-role`}
                name="role"
                value={selectedRole}
                onChange={(event) => setSelectedRole(event.target.value as UserRole | '')}
                className="h-11 w-full rounded-xl border border-border/60 bg-background px-3 text-sm text-foreground shadow-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/30"
                required
              >
                <option value="" disabled>
                  Wybierz rolę…
                </option>
                {userRoleOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
              <Badge variant="outline" className="hidden text-xs sm:inline-flex">
                {selectedRole ? userRoleLabels[selectedRole as UserRole] : '—'}
              </Badge>
            </div>
            <FieldError message={errors?.role} />
          </div>
          <div className="space-y-2">
            <Label htmlFor={`${mode}-password`}>{mode === 'create' ? 'Hasło' : 'Nowe hasło'}</Label>
            <Input
              id={`${mode}-password`}
              name="password"
              type="password"
              autoComplete={mode === 'create' ? 'new-password' : 'off'}
              placeholder="••••••••"
              required={passwordRequired}
            />
            <FieldError message={errors?.password} />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor={`${mode}-confirmPassword`}>{mode === 'create' ? 'Potwierdź hasło' : 'Powtórz hasło'}</Label>
          <Input
            id={`${mode}-confirmPassword`}
            name="confirmPassword"
            type="password"
            autoComplete={mode === 'create' ? 'new-password' : 'off'}
            placeholder="••••••••"
            required={passwordRequired}
          />
          <FieldError message={errors?.confirmPassword} />
        </div>
      </div>

      {state.status === 'error' && state.message ? (
        <Alert variant="destructive">
          <AlertTitle>Nie udało się zapisać formularza</AlertTitle>
          <AlertDescription>{state.message}</AlertDescription>
        </Alert>
      ) : null}

      <DialogFooter>
        <DialogClose asChild>
          <Button type="button" variant="outline" className="w-full sm:w-auto">
            Anuluj
          </Button>
        </DialogClose>
        <SubmitButton idleLabel={submitLabel} pendingLabel={pendingLabel} />
      </DialogFooter>
    </form>
  )
}
