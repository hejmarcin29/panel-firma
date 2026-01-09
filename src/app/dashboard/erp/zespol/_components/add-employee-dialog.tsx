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
import { Checkbox } from '@/components/ui/checkbox';
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
    
    const roles: UserRole[] = [];
    if (formData.get('role_installer') === 'on') roles.push('installer');
    if (formData.get('role_architect') === 'on') roles.push('architect');
    if (formData.get('role_partner') === 'on') roles.push('partner');

    if (!name || !email || !password || roles.length === 0) {
        setError('Wypełnij wszystkie pola i wybierz przynajmniej jedną rolę.');
        return;
    }

    startTransition(async () => {
      try {
        await createEmployee({ name, email, password, roles });
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
            <Label htmlFor="name">Imię i Nazwisko *</Label>
            <Input id="name" name="name" placeholder="Jan Kowalski" required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="email">Adres E-mail *</Label>
            <Input id="email" name="email" type="email" placeholder="jan@firma.pl" required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Hasło tymczasowe *</Label>
            <Input id="password" name="password" type="password" required minLength={6} />
          </div>
          <div className="space-y-3">
            <Label>Role *</Label>
            <div className="flex flex-col gap-2 p-1">
                <div className="flex items-center space-x-2">
                    <Checkbox id="role_installer" name="role_installer" />
                    <Label htmlFor="role_installer" className="font-normal cursor-pointer">Montażysta</Label>
                </div>
                <div className="flex items-center space-x-2">
                    <Checkbox id="role_architect" name="role_architect" />
                    <Label htmlFor="role_architect" className="font-normal cursor-pointer">Architekt</Label>
                </div>
                <div className="flex items-center space-x-2">
                    <Checkbox id="role_partner" name="role_partner" />
                    <Label htmlFor="role_partner" className="font-normal cursor-pointer">Partner B2B</Label>
                </div>
            </div>
            <div className="text-xs text-muted-foreground space-y-2 mt-2 p-3 bg-muted/50 rounded-md border">
                <p><strong>Uprawnienia ról:</strong></p>
                <ul className="list-disc pl-4 space-y-1">
                    <li>
                        <span className="font-medium">Administrator:</span> Pełny dostęp do systemu (Tylko istniejący admini).
                    </li>
                    <li>
                        <span className="font-medium">Montażysta (Opiekun):</span> Dostęp tylko do modułów operacyjnych (Montaże, Kalendarz, Zadania).
                    </li>
                    <li>
                        <span className="font-medium">Architekt:</span> Dostęp do przypisanych zleceń i podgląd prowizji.
                    </li>
                    <li>
                        <span className="italic text-red-500/80">Brak dostępu do: Zamówień, Klientów, Produktów, Poczty i Ustawień (dla ról nie-admin).</span>
                    </li>
                </ul>
            </div>
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
