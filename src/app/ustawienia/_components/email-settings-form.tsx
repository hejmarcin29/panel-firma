'use client'

import { useActionState, useEffect, useMemo, useRef, useState } from 'react'
import { MailCheck, ServerCog } from 'lucide-react'
import { toast } from 'sonner'

import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import type { EmailSettings } from '@/lib/settings/schemas'
import { updateEmailSettingsAction, type UpdateEmailSettingsFormState } from '../actions'

const INITIAL_STATE: UpdateEmailSettingsFormState = { status: 'idle' }

function FieldError({ message }: { message?: string }) {
  if (!message) {
    return null
  }

  return <p className="text-xs font-medium text-destructive">{message}</p>
}

export type EmailSettingsFormProps = {
  initialSettings: EmailSettings
  lastUpdatedAt: string | null
}

export function EmailSettingsForm({ initialSettings, lastUpdatedAt }: EmailSettingsFormProps) {
  const formRef = useRef<HTMLFormElement>(null)
  const [mode, setMode] = useState(initialSettings.mode)
  const [smtpSecure, setSmtpSecure] = useState(initialSettings.smtpSecure)
  const [state, formAction, isPending] = useActionState<UpdateEmailSettingsFormState, FormData>(
    updateEmailSettingsAction,
    INITIAL_STATE,
  )

  useEffect(() => {
    if (state.status === 'success') {
      toast.success(state.message ?? 'Ustawienia e-mail zostały zapisane.')
      formRef.current?.reset()
    } else if (state.status === 'error' && state.message) {
      toast.error(state.message)
    }
  }, [state])

  useEffect(() => {
    setMode(initialSettings.mode)
    setSmtpSecure(initialSettings.smtpSecure)
  }, [initialSettings.mode, initialSettings.smtpSecure])

  const modeBadge = useMemo(() => {
    if (mode === 'SMTP') {
      return (
        <Badge className="inline-flex items-center gap-2 bg-primary/15 text-primary">
          <ServerCog className="size-3.5" aria-hidden />
          Tryb produkcyjny SMTP
        </Badge>
      )
    }

    return (
      <Badge variant="outline" className="inline-flex items-center gap-2 border-emerald-500/40 text-emerald-600 dark:text-emerald-200">
        <MailCheck className="size-3.5" aria-hidden />
        Tryb testowy (mock)
      </Badge>
    )
  }, [mode])

  const pending = isPending
  const errors = state.status === 'error' ? state.errors ?? {} : {}

  return (
    <Card className="border border-border/60">
      <CardHeader className="space-y-4">
        <div className="space-y-2">
          <CardTitle className="text-xl font-semibold text-foreground">Konfiguracja wysyłki e-mail</CardTitle>
          <CardDescription>
            Określ sposób wysyłki powiadomień z panelu. W trybie testowym wiadomości nie opuszczają aplikacji – logujemy je lokalnie.
          </CardDescription>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {modeBadge}
          {lastUpdatedAt ? (
            <span className="text-xs text-muted-foreground">Ostatnia zmiana: {new Date(lastUpdatedAt).toLocaleString('pl-PL')}</span>
          ) : (
            <span className="text-xs text-muted-foreground">Nie zapisano jeszcze ustawień.</span>
          )}
        </div>
      </CardHeader>
      <form ref={formRef} action={formAction} className="space-y-6">
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="mode">Tryb działania</Label>
            <div className="grid gap-2 sm:grid-cols-2">
              <button
                type="button"
                onClick={() => setMode('MOCK')}
                className={`flex h-16 flex-col justify-center rounded-2xl border p-4 text-left transition ${
                  mode === 'MOCK'
                    ? 'border-emerald-500 bg-emerald-500/10 text-emerald-900 dark:text-emerald-100'
                    : 'border-border/60 bg-muted/30 hover:border-emerald-400/60'
                }`}
              >
                <span className="text-sm font-semibold">Tryb testowy (mock)</span>
                <span className="text-xs text-muted-foreground">
                  Rejestrowanie wiadomości lokalnie na potrzeby developmentu.
                </span>
              </button>
              <button
                type="button"
                onClick={() => setMode('SMTP')}
                className={`flex h-16 flex-col justify-center rounded-2xl border p-4 text-left transition ${
                  mode === 'SMTP'
                    ? 'border-primary bg-primary/10 text-primary'
                    : 'border-border/60 bg-muted/30 hover:border-primary/60'
                }`}
              >
                <span className="text-sm font-semibold">Serwer SMTP</span>
                <span className="text-xs text-muted-foreground">
                  Wysyłka przez zewnętrzny serwer – wymagane pełne dane logowania.
                </span>
              </button>
            </div>
            <input type="hidden" name="mode" value={mode} />
            <FieldError message={errors.mode} />
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="fromName">Nazwa nadawcy</Label>
              <Input id="fromName" name="fromName" defaultValue={initialSettings.fromName ?? ''} placeholder="np. Panel SolarPro" />
              <FieldError message={errors.fromName} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="fromEmail">Adres nadawcy</Label>
              <Input id="fromEmail" name="fromEmail" type="email" defaultValue={initialSettings.fromEmail ?? ''} placeholder="np. powiadomienia@twojadomena.pl" />
              <FieldError message={errors.fromEmail} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="replyToEmail">Adres odpowiedzi (opcjonalny)</Label>
              <Input id="replyToEmail" name="replyToEmail" type="email" defaultValue={initialSettings.replyToEmail ?? ''} placeholder="np. biuro@twojadomena.pl" />
              <FieldError message={errors.replyToEmail} />
            </div>
          </div>

          <div className="space-y-4 rounded-2xl border border-border/60 bg-muted/20 p-4">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <h3 className="text-sm font-semibold text-foreground">Parametry serwera SMTP</h3>
                <p className="text-xs text-muted-foreground">
                  Wypełnij poniższe pola, jeśli korzystasz z dostawcy SMTP. W trybie testowym pozostaw domyślne wartości.
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Switch
                  id="smtpSecureSwitch"
                  checked={smtpSecure}
                  onCheckedChange={(checked) => setSmtpSecure(checked)}
                  disabled={mode === 'MOCK'}
                />
                <Label htmlFor="smtpSecureSwitch" className="text-sm font-medium text-foreground">
                  Połączenie szyfrowane (TLS/SSL)
                </Label>
              </div>
              <input type="hidden" name="smtpSecure" value={smtpSecure ? 'true' : 'false'} />
            </div>

            <div className={`grid gap-4 lg:grid-cols-2 ${mode === 'MOCK' ? 'opacity-60' : ''}`}>
              <div className="space-y-2">
                <Label htmlFor="smtpHost">Adres serwera</Label>
                <Input
                  id="smtpHost"
                  name="smtpHost"
                  defaultValue={initialSettings.smtpHost ?? ''}
                  placeholder="np. smtp.twojadomena.pl"
                  disabled={mode === 'MOCK'}
                />
                <FieldError message={errors.smtpHost} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="smtpPort">Port</Label>
                <Input
                  id="smtpPort"
                  name="smtpPort"
                  defaultValue={initialSettings.smtpPort ? String(initialSettings.smtpPort) : ''}
                  placeholder="np. 587"
                  inputMode="numeric"
                  disabled={mode === 'MOCK'}
                />
                <FieldError message={errors.smtpPort} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="smtpUser">Login</Label>
                <Input
                  id="smtpUser"
                  name="smtpUser"
                  defaultValue={initialSettings.smtpUser ?? ''}
                  placeholder="np. api@twojadomena.pl"
                  disabled={mode === 'MOCK'}
                />
                <FieldError message={errors.smtpUser} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="smtpPassword">Hasło</Label>
                <Input id="smtpPassword" name="smtpPassword" type="password" placeholder="••••••••" disabled={mode === 'MOCK'} />
                <p className="text-xs text-muted-foreground">Pozostaw puste, aby zachować obecne hasło.</p>
                <FieldError message={errors.smtpPassword} />
              </div>
            </div>
          </div>

          {state.status === 'error' && state.message ? (
            <Alert variant="destructive">
              <AlertTitle>Nie udało się zapisać zmian</AlertTitle>
              <AlertDescription>{state.message}</AlertDescription>
            </Alert>
          ) : null}
        </CardContent>
        <CardFooter className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-xs text-muted-foreground">
            Uwaga: dane logowania SMTP są przechowywane w zaszyfrowanej bazie panelu. Zmieniaj je tylko na zaufanych urządzeniach.
          </p>
          <Button type="submit" className="w-full sm:w-auto" disabled={pending}>
            {pending ? 'Zapisywanie…' : 'Zapisz konfigurację'}
          </Button>
        </CardFooter>
      </form>
    </Card>
  )
}
