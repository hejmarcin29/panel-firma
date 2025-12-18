'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  PointerSensor,
  useDraggable,
  useDroppable,
  useSensor,
  useSensors,
  closestCorners,
} from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';

import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { cn, formatCurrency } from '@/lib/utils';
import { updateQuote } from '../actions';
import type { QuoteStatus, QuoteItem } from '@/lib/db/schema';
import Link from 'next/link';

type QuoteWithMontage = {
    id: string;
    number: string | null;
    status: QuoteStatus;
    totalNet: number;
    totalGross: number;
    createdAt: Date;
    montage: {
        id: string;
        clientName: string;
        displayId: string | null;
    };
    items: QuoteItem[];
};

const statusOptions: { value: QuoteStatus; label: string; description: string }[] = [
    { value: 'draft', label: 'Szkic', description: 'Oferty w przygotowaniu' },
    { value: 'sent', label: 'Wysłane', description: 'Oczekujące na decyzję' },
    { value: 'accepted', label: 'Zaakceptowane', description: 'Gotowe do realizacji' },
    { value: 'rejected', label: 'Odrzucone', description: 'Archiwum' },
];

function buildBoard(quotes: QuoteWithMontage[]) {
  const board: Record<QuoteStatus, QuoteWithMontage[]> = {
      draft: [],
      sent: [],
      accepted: [],
      rejected: []
  };

  for (const quote of quotes) {
    if (board[quote.status]) {
        board[quote.status].push(quote);
    }
  }

  return board;
}

function QuoteCard({ quote }: { quote: QuoteWithMontage }) {
    return (
        <Card className="cursor-grab active:cursor-grabbing hover:shadow-md transition-shadow">
            <CardHeader className="p-4 pb-2">
                <div className="flex justify-between items-start">
                    <div className="space-y-1">
                        <Link href={`/dashboard/crm/oferty/${quote.id}`} className="font-semibold hover:underline block">
                            {quote.montage.clientName}
                        </Link>
                        <div className="text-xs text-muted-foreground">
                            {quote.number || 'Brak numeru'}
                        </div>
                    </div>
                    <Badge variant="outline" className="text-[10px]">
                        {new Date(quote.createdAt).toLocaleDateString('pl-PL')}
                    </Badge>
                </div>
            </CardHeader>
            <CardContent className="p-4 pt-2">
                <div className="flex justify-between items-center text-sm">
                    <span className="text-muted-foreground">Wartość:</span>
                    <span className="font-medium">{formatCurrency(quote.totalGross)}</span>
                </div>
                {quote.items.length > 0 && (
                    <div className="mt-2 text-xs text-muted-foreground">
                        {quote.items.length} pozycji
                    </div>
                )}
            </CardContent>
        </Card>
    );
}

function DraggableQuoteCard({ quote, disabled }: { quote: QuoteWithMontage; disabled: boolean }) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: quote.id,
    data: { status: quote.status },
    disabled,
  });

  const style = {
    transform: transform ? CSS.Translate.toString(transform) : undefined,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        isDragging ? "z-50 opacity-75" : "opacity-100"
      )}
      {...(!disabled ? attributes : {})}
      {...(!disabled ? listeners : {})}
    >
      <QuoteCard quote={quote} />
    </div>
  );
}

function PipelineColumn({
  status,
  items,
  isPending,
}: {
  status: typeof statusOptions[number];
  items: QuoteWithMontage[];
  isPending: boolean;
}) {
  const { setNodeRef, isOver } = useDroppable({
    id: status.value,
    data: { status: status.value },
  });

  return (
    <div
      ref={setNodeRef}
      className={cn(
        "min-w-[85vw] sm:min-w-[350px] md:min-w-[300px] xl:min-w-[280px] snap-center snap-always shrink-0",
        "transition",
        isOver && "scale-[1.01]"
      )}
    >
      <Card
        className={cn(
          "h-full border border-border/70 bg-muted/20",
          "flex flex-col",
          isOver && "border-primary bg-primary/10 shadow-sm",
          isPending && "pointer-events-none opacity-60"
        )}
      >
        <CardHeader className="space-y-1">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm font-semibold text-foreground">{status.label}</CardTitle>
            <Badge
              variant="secondary"
              className="rounded-full text-[11px] uppercase tracking-wide"
            >
              {items.length}
            </Badge>
          </div>
          <CardDescription className="text-xs text-muted-foreground">
            {status.description}
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-1 flex-col gap-3 pb-6">
          {items.length === 0 ? (
            <p className="text-xs text-muted-foreground">Brak wycen w tym etapie.</p>
          ) : (
            items.map((quote) => (
              <DraggableQuoteCard
                key={quote.id}
                quote={quote}
                disabled={isPending}
              />
            ))
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export function QuotesBoard({ quotes }: { quotes: QuoteWithMontage[] }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 6 },
    })
  );

  const [board, setBoard] = useState(() => buildBoard(quotes));
  const [activeId, setActiveId] = useState<string | null>(null);

  // Update board when props change
  useState(() => {
      setBoard(buildBoard(quotes));
  });

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(String(event.active.id));
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveId(null);

    if (!over) return;

    const sourceStatus = active.data.current?.status as QuoteStatus;
    const targetStatus = over.data.current?.status as QuoteStatus;

    if (!sourceStatus || !targetStatus || sourceStatus === targetStatus) return;

    const quoteId = String(active.id);
    const quote = quotes.find(q => q.id === quoteId);
    if (!quote) return;

    // Optimistic update
    const newBoard = { ...board };
    newBoard[sourceStatus] = newBoard[sourceStatus].filter(q => q.id !== quoteId);
    newBoard[targetStatus] = [{ ...quote, status: targetStatus }, ...newBoard[targetStatus]];
    setBoard(newBoard);

    startTransition(async () => {
      try {
        await updateQuote(quoteId, { status: targetStatus });
        router.refresh();
      } catch (error) {
        console.error('Failed to update quote status:', error);
        // Revert on error
        setBoard(buildBoard(quotes));
      }
    });
  };

  const activeQuote = activeId ? quotes.find(q => q.id === activeId) : null;

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragEnd={handleDragEnd}
      onDragStart={handleDragStart}
      onDragCancel={() => setActiveId(null)}
    >
      <div className="flex flex-nowrap overflow-x-auto snap-x snap-mandatory gap-4 pb-6 scrollbar-hide" style={{ scrollbarWidth: 'none' }}>
        {statusOptions.map((status) => (
          <PipelineColumn
            key={status.value}
            status={status}
            items={board[status.value]}
            isPending={isPending}
          />
        ))}
      </div>
      <DragOverlay>
        {activeQuote ? (
          <div className="w-[280px]">
            <QuoteCard quote={activeQuote} />
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}
