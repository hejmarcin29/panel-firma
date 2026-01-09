'use client';

import { useState } from 'react';
import { useDebouncedCallback } from 'use-debounce';
import { Loader2, Check } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { updateOrderNote } from '../../actions';

interface OrderNotesCardProps {
  orderId: string;
  initialNote: string | null;
}

export function OrderNotesCard({ orderId, initialNote }: OrderNotesCardProps) {
  const [note, setNote] = useState(initialNote || '');
  const [isSaving, setIsSaving] = useState(false);

  const debouncedSave = useDebouncedCallback(async (value: string) => {
    setIsSaving(true);
    try {
      await updateOrderNote(orderId, value);
    } finally {
      setIsSaving(false);
    }
  }, 1000);

  const handleChange = (value: string) => {
    setNote(value);
    debouncedSave(value);
  };

  return (
    <Card>
      <CardHeader className='px-4 py-3 flex flex-row items-center justify-between space-y-0'>
        <CardTitle className='text-base'>Notatki</CardTitle>
        <div className='flex items-center gap-2'>
            {isSaving ? (
                <span className='text-xs text-muted-foreground flex items-center gap-1'>
                    <Loader2 className='w-3 h-3 animate-spin' />
                    Zapisywanie...
                </span>
            ) : (
                <span className='text-xs text-emerald-600 flex items-center gap-1 opacity-0 transition-opacity duration-500 data-[visible=true]:opacity-100' data-visible={!isSaving}>
                    <Check className='w-3 h-3' />
                    Zapisano
                </span>
            )}
        </div>
      </CardHeader>
      <CardContent className='px-4 pb-4 pt-0'>
        <Textarea
          value={note}
          onChange={(e) => handleChange(e.target.value)}
          placeholder='Dodaj notatkę do zamówienia...'
          className='min-h-[100px] resize-none border-0 focus-visible:ring-0 px-0 shadow-none -ml-1'
        />
      </CardContent>
    </Card>
  );
}
