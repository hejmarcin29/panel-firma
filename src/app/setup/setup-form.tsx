'use client'

import { useActionState } from 'react'
import { useFormStatus } from 'react-dom'

import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { cn } from '@/lib/utils'

import { registerInitialAdmin, type SetupFormState } from './actions'

const INITIAL_STATE: SetupFormState = { status: 'idle' }

function SubmitButton() {
  const { pending } = useFormStatus()

  return (
    <Button type="submit" className="w-full" disabled={pending}>
      {pending ? 'Tworzenie konta…' : 'Utwórz konto administratora'}
    </Button>
  )
}

export function SetupForm({ className }: { className?: string }) {
  const [state, action] = useActionState<SetupFormState, FormData>(registerInitialAdmin, INITIAL_STATE)

  return (
    <Card className={cn('w-full max-w-xl border border-border/60 shadow-lg shadow-primary/10', className)}>
      <CardHeader className="space-y-2 text-center">
        <CardTitle className="text-2xl font-semibold text-foreground">Pierwsze konto administratora</CardTitle>
        <CardDescription className="text-sm text-muted-foreground">
          Utwórz dane do logowania dla głównego administratora. To konto uzyskuje pełny dostęp do panelu.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form className="space-y-6" action={action}>
          <div className="grid gap-4">
            <div className="space-y-2 text-left">
              <Label htmlFor="name">Imię i nazwisko (opcjonalnie)</Label>
              <Input id="name" name="name" placeholder="np. Anna Kowalska" autoComplete="name" />
            </div>
            <div className="space-y-2 text-left">
              <Label htmlFor="email">Adres e-mail</Label>
              <Input id="email" name="email" type="email" placeholder="np. anna@firma.pl" autoComplete="email" required />
            </div>
            <div className="space-y-2 text-left">
              <Label htmlFor="username">Login</Label>
              <Input id="username" name="username" placeholder="np. admin" autoComplete="username" required />
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2 text-left">
                <Label htmlFor="password">Hasło</Label>
                <Input id="password" name="password" type="password" autoComplete="new-password" placeholder="••••••••" required />
              </div>
              <div className="space-y-2 text-left">
                <Label htmlFor="confirmPassword">Powtórz hasło</Label>
                <Input id="confirmPassword" name="confirmPassword" type="password" autoComplete="new-password" placeholder="••••••••" required />
              </div>
            </div>
          </div>

          {state.status === 'error' ? (
            <Alert variant="destructive">
              <AlertTitle>Błąd rejestracji</AlertTitle>
              <AlertDescription>{state.message ?? 'Nie udało się utworzyć konta. Spróbuj ponownie.'}</AlertDescription>
            </Alert>
          ) : null}

          <SubmitButton />
        </form>
      </CardContent>
    </Card>
  )
}
