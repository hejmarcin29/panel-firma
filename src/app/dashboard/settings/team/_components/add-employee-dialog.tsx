'use client';

import { useState, useTransition } from 'react';
import { Plus, Loader2 } from 'lucide-react';

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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { createEmployee } from '../actions';
import type { UserRole } from '@/lib/db/schema';

export function AddEmployeeDialog() {
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);

    const formData = new FormData(e.currentTarget);
    const name = formData.get('name') as string;
    const email = formData.get('email') as string;
    const password = formData.get('password') as string;
    const role = formData.get('role') as UserRole;

    if (!name || !email || !password || !role) {
        setError('Wypełnij wszystkie pola.');
        return;
    }

    startTransition(async () => {
      try {
        await createEmployee({ name, email, password, role });
        setOpen(false);
        // Reset form handled by dialog close usually, but we can force it if needed
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Wystąpił błąd.');
      }
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          Dodaj pracownika
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Dodaj nowego pracownika</DialogTitle>
          <DialogDescription>
            Utwórz konto dla członka zespołu. Będzie mógł się zalogować używając podanego adresu e-mail i hasła.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="name">Imię i Nazwisko</Label>
            <Input id="name" name="name" placeholder="Jan Kowalski" required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="email">Adres E-mail</Label>
            <Input id="email" name="email" type="email" placeholder="jan@firma.pl" required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Hasło tymczasowe</Label>
            <Input id="password" name="password" type="password" required minLength={6} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="role">Rola</Label>
            <Select name="role" defaultValue="installer">
              <SelectTrigger>
                <SelectValue placeholder="Wybierz rolę" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="admin">Administrator (Pełny dostęp)</SelectItem>
                <SelectItem value="measurer">Pomiarowiec</SelectItem>
                <SelectItem value="installer">Montażysta</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          {error && <p className="text-sm text-destructive">{error}</p>}

          <DialogFooter>
            <Button type="submit" disabled={isPending}>
              {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Utwórz konto
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
