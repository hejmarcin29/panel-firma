'use client';

import { useEffect } from 'react';
import { Button } from '@/components/ui/button';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('Dashboard Error:', error);
  }, [error]);

  return (
    <div className="flex h-[50vh] w-full flex-col items-center justify-center gap-4">
      <h2 className="text-xl font-semibold">Coś poszło nie tak!</h2>
      <p className="text-muted-foreground text-center max-w-md">
        Wystąpił błąd podczas ładowania panelu. Może to być spowodowane problemem z połączeniem lub bazą danych.
      </p>
      <div className="flex gap-2">
        <Button onClick={() => window.location.reload()} variant="outline">
            Odśwież stronę
        </Button>
        <Button onClick={() => reset()}>Spróbuj ponownie</Button>
      </div>
      {process.env.NODE_ENV === 'development' && (
        <pre className="mt-4 p-4 bg-muted rounded text-xs overflow-auto max-w-full">
            {error.message}
            {error.stack}
        </pre>
      )}
    </div>
  );
}
