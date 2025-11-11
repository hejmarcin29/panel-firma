'use client';

import { useTransition, useState } from 'react';
import { useRouter } from 'next/navigation';

import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

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

  const handleConfirm = () => {
    if (disabled || isPending) {
      return;
    }

    setError(null);
    startTransition(async () => {
      try {
        await confirmManualOrder(orderId);
        router.refresh();
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Nie udalo sie potwierdzic zamowienia.';
        setError(message);
      }
    });
  };

  return (
    <div className={cn('flex flex-col gap-2', className)}>
      <Button onClick={handleConfirm} disabled={disabled || isPending}>
        {isPending ? 'Potwierdzanie...' : 'Potwierdz zamowienie'}
      </Button>
      {error ? <p className="text-xs text-destructive">{error}</p> : null}
    </div>
  );
}
