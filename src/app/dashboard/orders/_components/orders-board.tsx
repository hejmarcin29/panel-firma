'use client';

import { useState } from 'react';
import {
  DndContext,
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
import Link from 'next/link';
import type { Order } from '../data';

// Simplified status mapping for the board
const BOARD_COLUMNS = [
    { id: 'new', label: 'Nowe', description: 'Do weryfikacji', statuses: ['Zamówienie utworzone', 'Weryfikacja i płatność'] },
    { id: 'processing', label: 'W realizacji', description: 'Kompletacja', statuses: ['Kompletacja zamówienia'] },
    { id: 'shipping', label: 'Wysyłka', description: 'Wydane kurierowi', statuses: ['Wydanie przewoźnikowi'] },
    { id: 'done', label: 'Zakończone', description: 'Dostarczone', statuses: ['Dostarczone do klienta', 'Zakończone'] },
];

function getColumnId(status: string) {
    const col = BOARD_COLUMNS.find(c => c.statuses.includes(status));
    return col ? col.id : 'new';
}

function buildBoard(orders: Order[]) {
  const board: Record<string, Order[]> = {
      new: [],
      processing: [],
      shipping: [],
      done: []
  };

  for (const order of orders) {
    const colId = getColumnId(order.status);
    if (board[colId]) {
        board[colId].push(order);
    }
  }

  return board;
}

function OrderCard({ order }: { order: Order }) {
    return (
        <Card className="cursor-grab active:cursor-grabbing hover:shadow-md transition-shadow border-l-4" style={{ borderLeftColor: order.source === 'manual' ? '#3b82f6' : '#a855f7' }}>
            <CardHeader className="p-4 pb-2">
                <div className="flex justify-between items-start">
                    <div className="space-y-1">
                        <Link href={`/dashboard/orders/${order.id}`} className="font-semibold hover:underline block truncate max-w-[180px]">
                            {order.billing.name}
                        </Link>
                        <div className="text-xs text-muted-foreground">
                            #{order.reference}
                        </div>
                    </div>
                    <Badge variant="outline" className="text-[10px]">
                        {new Date(order.createdAt).toLocaleDateString('pl-PL')}
                    </Badge>
                </div>
            </CardHeader>
            <CardContent className="p-4 pt-2">
                <div className="flex justify-between items-center text-sm">
                    <span className="text-muted-foreground">Wartość:</span>
                    <span className="font-medium">{formatCurrency(order.totals.totalGross / 100)}</span>
                </div>
                <div className="mt-2 flex items-center justify-between text-xs text-muted-foreground">
                    <span>{order.items.length} pozycji</span>
                    <span className={cn(
                        "px-1.5 py-0.5 rounded-full text-[10px]",
                        order.source === 'manual' ? "bg-blue-100 text-blue-700" : "bg-purple-100 text-purple-700"
                    )}>
                        {order.source === 'manual' ? 'Ręczne' : 'WooCommerce'}
                    </span>
                </div>
            </CardContent>
        </Card>
    );
}

function DraggableOrderCard({ order, disabled }: { order: Order; disabled: boolean }) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: order.id,
    data: { status: order.status },
    disabled, // Disable dragging for now as status mapping is complex
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
      <OrderCard order={order} />
    </div>
  );
}

function PipelineColumn({
  column,
  items,
}: {
  column: typeof BOARD_COLUMNS[number];
  items: Order[];
}) {
  // Droppable is disabled for now as we don't support drag-to-update for orders yet due to complex status mapping
  const { setNodeRef, isOver } = useDroppable({
    id: column.id,
    disabled: true 
  });

  return (
    <div
      ref={setNodeRef}
      className={cn(
        "min-w-[85vw] sm:min-w-[350px] md:min-w-[300px] xl:min-w-[280px] snap-center snap-always flex-shrink-0",
        "transition",
        isOver && "scale-[1.01]"
      )}
    >
      <Card
        className={cn(
          "h-full border border-border/70 bg-muted/20",
          "flex flex-col",
          isOver && "border-primary bg-primary/10 shadow-sm"
        )}
      >
        <CardHeader className="space-y-1">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm font-semibold text-foreground">{column.label}</CardTitle>
            <Badge
              variant="secondary"
              className="rounded-full text-[11px] uppercase tracking-wide"
            >
              {items.length}
            </Badge>
          </div>
          <CardDescription className="text-xs text-muted-foreground">
            {column.description}
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-1 flex-col gap-3 pb-6">
          {items.length === 0 ? (
            <p className="text-xs text-muted-foreground">Brak zamówień w tym etapie.</p>
          ) : (
            items.map((order) => (
              <DraggableOrderCard
                key={order.id}
                order={order}
                disabled={true} // Dragging disabled for orders
              />
            ))
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export function OrdersBoard({ orders }: { orders: Order[] }) {
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 6 },
    })
  );

  const [board] = useState(() => buildBoard(orders));

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCorners}
    >
      <div className="flex flex-nowrap overflow-x-auto snap-x snap-mandatory gap-4 pb-6 scrollbar-hide" style={{ scrollbarWidth: 'none' }}>
        {BOARD_COLUMNS.map((column) => (
          <PipelineColumn
            key={column.id}
            column={column}
            items={board[column.id]}
          />
        ))}
      </div>
    </DndContext>
  );
}
