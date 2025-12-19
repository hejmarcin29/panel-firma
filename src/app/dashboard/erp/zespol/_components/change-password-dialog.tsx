'use client';

import { useState, useTransition } from 'react';
import { KeyRound, Loader2 } from 'lucide-react';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { changeUserPassword } from '../actions';
import { toast } from 'sonner';

interface ChangePasswordDialogProps {
    userId: string;
    userName: string;
}

export function ChangePasswordDialog({ userId, userName }: ChangePasswordDialogProps) {
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);

    const formData = new FormData(e.currentTarget);
    const password = formData.get('password') as string;
    const confirmPassword = formData.get('confirmPassword') as string;

    if (password !== confirmPassword) {
        setError('Hasła nie są identyczne.');
        return;
    }

    if (password.length < 6) {
        setError('Hasło musi mieć co najmniej 6 znaków.');
        return;
    }

    startTransition(async () => {
      try {
        await changeUserPassword(userId, password);
        setOpen(false);
        toast.success('Hasło zostało zmienione.');
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Wystąpił błąd.');
      }
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <KeyRound className="h-4 w-4" />
          Zmień hasło
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Zmień hasło użytkownika</DialogTitle>
          <DialogDescription>
            Ustaw nowe hasło dla użytkownika <strong>{userName}</strong>.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="password">Nowe hasło</Label>
            <Input 
                id="password" 
                name="password" 
                type="password" 
                required 
                minLength={6} 
                placeholder="Minimum 6 znaków"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="confirmPassword">Potwierdź hasło</Label>
            <Input 
                id="confirmPassword" 
                name="confirmPassword" 
                type="password" 
                required 
                minLength={6} 
                placeholder="Powtórz nowe hasło"
            />
          </div>
          
          {error && <p className="text-sm text-destructive">{error}</p>}

          <DialogFooter>
            <Button type="submit" disabled={isPending}>
              {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Zmień hasło
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
