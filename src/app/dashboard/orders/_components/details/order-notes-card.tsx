'use client';

import { useState, useTransition } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { updateOrderNote } from '../../actions';

interface OrderNotesCardProps {
  orderId: string;
  initialNote: string | null;
}

export function OrderNotesCard({ orderId, initialNote }: OrderNotesCardProps) {
  const [note, setNote] = useState(initialNote || '');
  const [isPending, startTransition] = useTransition();
  const [isEditing, setIsEditing] = useState(false);

  const handleSave = () => {
    startTransition(async () => {
      await updateOrderNote(orderId, note);
      setIsEditing(false);
    });
  };

  return (
    <Card>
      <CardHeader className="px-4 py-3 flex flex-row items-center justify-between space-y-0">
        <CardTitle className="text-base">Notatki</CardTitle>
        {!isEditing && (
          <Button variant="ghost" size="sm" onClick={() => setIsEditing(true)}>
            Edytuj
          </Button>
        )}
      </CardHeader>
      <CardContent className="px-4 pb-4 pt-0">
        {isEditing ? (
          <div className="space-y-2">
            <Textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Dodaj notatkę do zamówienia..."
              className="min-h-[100px]"
            />
            <div className="flex justify-end gap-2">
              <Button variant="outline" size="sm" onClick={() => setIsEditing(false)}>
                Anuluj
              </Button>
              <Button size="sm" onClick={handleSave} disabled={isPending}>
                {isPending ? 'Zapisywanie...' : 'Zapisz'}
              </Button>
            </div>
          </div>
        ) : (
          <div className="text-sm text-muted-foreground whitespace-pre-wrap">
            {note || 'Brak notatek.'}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
