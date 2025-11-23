'use client';

import { useTransition, useState } from 'react';
import { useRouter } from 'next/navigation';

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
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';

import { confirmManualOrder } from '../actions';

type ConfirmOrderButtonProps = {
  orderId: string;
  disabled?: boolean;
  className?: string;
};

export function ConfirmOrderButton({ orderId, disabled = false, className }: ConfirmOrderButtonProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [selectedType, setSelectedType] = useState<'production' | 'sample'>('production');

  const handleConfirm = () => {
    if (disabled || isPending) {
      return;
    }

    setError(null);
    startTransition(async () => {
      try {
        await confirmManualOrder(orderId, selectedType);
        setIsOpen(false);
        router.refresh();
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Nie udalo sie potwierdzic zamowienia.';
        setError(message);
      }
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button disabled={disabled} className={className}>
          Potwierdź zamówienie
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Weryfikacja zamówienia</DialogTitle>
          <DialogDescription>
            Wybierz typ zamówienia, aby przypisać je do odpowiedniego procesu realizacji.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <RadioGroup
            value={selectedType}
            onValueChange={(val) => setSelectedType(val as 'production' | 'sample')}
            className="grid gap-4"
          >
            <div className="flex items-center justify-between space-x-2 rounded-md border p-4 hover:bg-accent hover:text-accent-foreground has-data-[state=checked]:border-primary">
              <Label htmlFor="production" className="flex flex-col gap-1 cursor-pointer">
                <span className="font-semibold">Paleta</span>
                <span className="text-xs text-muted-foreground">Standardowe zamówienie na panele.</span>
              </Label>
              <RadioGroupItem value="production" id="production" />
            </div>
            <div className="flex items-center justify-between space-x-2 rounded-md border p-4 hover:bg-accent hover:text-accent-foreground has-data-[state=checked]:border-primary">
              <Label htmlFor="sample" className="flex flex-col gap-1 cursor-pointer">
                <span className="font-semibold">Próbki</span>
                <span className="text-xs text-muted-foreground">Zamówienie na próbki (szybka ścieżka).</span>
              </Label>
              <RadioGroupItem value="sample" id="sample" />
            </div>
          </RadioGroup>
        </div>
        {error ? <p className="text-sm text-destructive text-center">{error}</p> : null}
        <DialogFooter>
          <Button variant="outline" onClick={() => setIsOpen(false)} disabled={isPending}>
            Anuluj
          </Button>
          <Button onClick={handleConfirm} disabled={isPending}>
            {isPending ? 'Zapisywanie...' : 'Zatwierdź i przenieś'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
