'use client';

import { useState } from 'react';
import { useDebouncedCallback } from 'use-debounce';
import { Loader2, Check, StickyNote } from 'lucide-react';
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
    <Card className="border-border/50 shadow-sm h-full flex flex-col">
      <CardHeader className='px-6 py-4 bg-muted/10 border-b border-border/50 flex flex-row items-center justify-between space-y-0'>
        <div className="flex items-center gap-2">
            <StickyNote className="h-4 w-4 text-muted-foreground" />
            <CardTitle className='text-base font-medium'>Notatki wewnętrzne</CardTitle>
        </div>
        <div className='flex items-center gap-2'>
            {isSaving ? (
                <span className='text-[10px] text-muted-foreground uppercase tracking-widest flex items-center gap-1.5'>
                    <Loader2 className='w-3 h-3 animate-spin' />
                    Zapisywanie
                </span>
            ) : (
                <span className='text-[10px] text-emerald-600 uppercase tracking-widest flex items-center gap-1.5 opacity-0 transition-opacity duration-500 data-[visible=true]:opacity-100' data-visible={!isSaving}>
                    <Check className='w-3 h-3' />
                    Zapisano
                </span>
            )}
        </div>
      </CardHeader>
      <CardContent className='p-0 flex-1 relative'>
        <Textarea
          value={note}
          onChange={(e) => handleChange(e.target.value)}
          placeholder='Dodaj poufną notatkę do tego zamówienia...'
          className='min-h-[150px] w-full h-full resize-none border-0 focus-visible:ring-0 p-6 shadow-none text-sm leading-relaxed bg-transparent'
        />
        <div className="absolute bottom-2 right-2 text-[10px] text-muted-foreground/50 pointer-events-none">
            Markdown wspierany
        </div>
      </CardContent>
    </Card>
  );
}
