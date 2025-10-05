'use client'

import * as React from 'react'
import { useRouter } from 'next/navigation'

import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { cn } from '@/lib/utils'

export function LoginForm({ className }: { className?: string }) {
  const router = useRouter()
  const [username, setUsername] = React.useState('')
  const [password, setPassword] = React.useState('')
  const [error, setError] = React.useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = React.useState(false)

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setError(null)
    setIsSubmitting(true)

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username, password }),
      })

      if (!response.ok) {
        const data = (await response.json().catch(() => null)) as { error?: string } | null
        throw new Error(data?.error ?? 'Nie udało się zalogować. Spróbuj ponownie.')
      }

      router.replace('/zlecenia')
      router.refresh()
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : 'Wystąpił nieoczekiwany błąd.')
      setIsSubmitting(false)
    }
  }

  return (
    <Card className={cn('w-full max-w-md border border-border/60 shadow-lg shadow-primary/10', className)}>
      <CardHeader className="space-y-2 text-center">
        <CardTitle className="text-2xl font-semibold text-foreground">Zaloguj się do panelu</CardTitle>
        <CardDescription className="text-sm text-muted-foreground">
          Użyj danych administracyjnych, aby zarządzać zleceniami, dostawami i partnerami.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form className="space-y-6" onSubmit={handleSubmit}>
          <div className="space-y-4">
            <div className="space-y-2 text-left">
              <Label htmlFor="username">Login</Label>
              <Input
                id="username"
                name="username"
                autoComplete="username"
                value={username}
                onChange={(event) => setUsername(event.target.value)}
                placeholder="np. admin"
                required
              />
            </div>
            <div className="space-y-2 text-left">
              <Label htmlFor="password">Hasło</Label>
              <Input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder="••••••••"
                required
              />
            </div>
          </div>

          {error ? (
            <Alert variant="destructive">
              <AlertTitle>Logowanie nie powiodło się</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          ) : null}

          <Button type="submit" className="w-full" disabled={isSubmitting}>
            {isSubmitting ? 'Logowanie…' : 'Zaloguj się'}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
