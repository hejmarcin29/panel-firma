'use client'

import { useActionState, useEffect, useRef, useState } from 'react'
import { Copy, Key, Check } from 'lucide-react'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import type { UserListItem } from '@/lib/users'
import { resetUserPasswordAction } from '../actions'

interface ResetPasswordState {
  status: 'idle' | 'pending' | 'success' | 'error'
  message?: string
  newPassword?: string
}

export function ResetPasswordDialog({ 
  user,
  open,
  onOpenChange,
}: { 
  user: UserListItem
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  const [copied, setCopied] = useState(false)
  const formRef = useRef<HTMLFormElement>(null)
  const [state, formAction, isPending] = useActionState<ResetPasswordState, FormData>(
    resetUserPasswordAction,
    { status: 'idle' }
  )

  useEffect(() => {
    if (state.status === 'success') {
      if (state.message) {
        toast.success(state.message)
      }
    } else if (state.status === 'error') {
      if (state.message) {
        toast.error(state.message)
      }
    }
  }, [state])

  useEffect(() => {
    if (!open) {
      setCopied(false)
    }
  }, [open])

  const handleCopy = async () => {
    if (state.newPassword) {
      await navigator.clipboard.writeText(state.newPassword)
      setCopied(true)
      toast.success('Hasło skopiowane do schowka')
      setTimeout(() => setCopied(false), 2000)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Key className="size-5 text-primary" />
            Resetuj hasło użytkownika
          </DialogTitle>
          <DialogDescription>
            Wygeneruj nowe hasło dla użytkownika <span className="font-semibold">{user.username}</span>
          </DialogDescription>
        </DialogHeader>

        {state.status === 'success' && state.newPassword ? (
          <div className="space-y-4">
            <div className="rounded-lg bg-primary/10 p-4 space-y-3">
              <div className="flex items-center gap-2 text-sm font-medium text-primary">
                <Check className="size-4" />
                Nowe hasło zostało wygenerowane
              </div>
              <div className="space-y-2">
                <Label htmlFor="password" className="text-sm text-muted-foreground">
                  Zapisz to hasło - nie będzie możliwości ponownego wyświetlenia
                </Label>
                <div className="flex gap-2">
                  <Input
                    id="password"
                    type="text"
                    value={state.newPassword}
                    readOnly
                    className="font-mono text-base font-semibold bg-background"
                  />
                  <Button
                    type="button"
                    size="icon"
                    variant="outline"
                    onClick={handleCopy}
                    className="shrink-0"
                  >
                    {copied ? (
                      <Check className="size-4 text-emerald-500" />
                    ) : (
                      <Copy className="size-4" />
                    )}
                  </Button>
                </div>
              </div>
            </div>
            <p className="text-xs text-muted-foreground">
              Przekaż to hasło użytkownikowi bezpiecznym kanałem. Może je zmienić po zalogowaniu.
            </p>
          </div>
        ) : (
          <form ref={formRef} action={formAction} className="space-y-4">
            <input type="hidden" name="userId" value={user.id} />
            <div className="rounded-lg bg-amber-500/10 p-4 space-y-2">
              <p className="text-sm font-medium text-amber-900 dark:text-amber-100">
                ⚠️ Uwaga
              </p>
              <p className="text-sm text-amber-800 dark:text-amber-200">
                Wygenerowanie nowego hasła natychmiast unieważni obecne hasło użytkownika.
                Nowe hasło zostanie wyświetlone tylko raz.
              </p>
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={isPending}
              >
                Anuluj
              </Button>
              <Button type="submit" disabled={isPending}>
                {isPending ? 'Generowanie...' : 'Wygeneruj nowe hasło'}
              </Button>
            </DialogFooter>
          </form>
        )}

        {state.status === 'success' && state.newPassword && (
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Zamknij
            </Button>
          </DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  )
}
