'use client';

import { useEffect, useState, useTransition, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

import { updateWooWebhookSecret } from '../actions';

type Props = {
  initialSecret: string;
};

type ResultState = {
  type: 'success' | 'error';
  message: string;
} | null;

export function WebhookSecretForm({ initialSecret }: Props) {
  const router = useRouter();
  const [secret, setSecret] = useState(initialSecret);
  const [result, setResult] = useState<ResultState>(null);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    setSecret(initialSecret);
  }, [initialSecret]);

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const nextSecret = String(formData.get('secret') ?? '').trim();

    startTransition(() => {
      updateWooWebhookSecret(nextSecret)
        .then(() => {
          setResult({ type: 'success', message: 'Sekret zostal zapisany.' });
          setSecret(nextSecret);
          router.refresh();
        })
        .catch((error) => {
          const message =
            error instanceof Error ? error.message : 'Nie udalo sie zapisac sekretu.';
          setResult({ type: 'error', message });
        });
    });
  };

  const handleReset = () => {
    setSecret(initialSecret);
    setResult(null);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="woo-secret">Sekret webhooka</Label>
        <Input
          id="woo-secret"
          name="secret"
          type="text"
          autoComplete="off"
          spellCheck={false}
          value={secret}
          onChange={(event) => setSecret(event.target.value)}
          placeholder="Wklej sekret z WooCommerce"
          disabled={isPending}
        />
      </div>
      {result && (
        <p
          className={
            result.type === 'error'
              ? 'text-xs text-destructive'
              : 'text-xs text-muted-foreground'
          }
        >
          {result.message}
        </p>
      )}
      <div className="flex flex-wrap gap-2">
        <Button type="submit" disabled={isPending}>
          {isPending ? 'Zapisuje...' : 'Zapisz sekret'}
        </Button>
        <Button
          type="button"
          variant="secondary"
          onClick={handleReset}
          disabled={isPending || secret === initialSecret}
        >
          Przywroc
        </Button>
      </div>
    </form>
  );
}
