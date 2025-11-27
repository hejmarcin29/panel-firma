'use client';

import { useDroppable } from '@dnd-kit/core';
import { cn } from '@/lib/utils';

interface DroppableDayProps {
  id: string;
  date: Date;
  children: React.ReactNode;
  className?: string;
  isCurrentMonth?: boolean;
  isToday?: boolean;
}

export function DroppableDay({ id, date, children, className, isCurrentMonth, isToday }: DroppableDayProps) {
  const { setNodeRef, isOver } = useDroppable({
    id: id,
    data: { date },
  });

  return (
    <div
      ref={setNodeRef}
      className={cn(
        className,
        isOver && 'bg-accent/20 ring-2 ring-inset ring-primary/20'
      )}
    >
      {children}
    </div>
  );
}
