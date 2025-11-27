'use client';

import { useDraggable } from '@dnd-kit/core';
import { CalendarEventCard } from './calendar-event';
import { CalendarEvent } from '../actions';

interface DraggableEventProps {
  event: CalendarEvent;
  className?: string;
}

export function DraggableEvent({ event, className }: DraggableEventProps) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: event.id,
    data: event,
  });

  const style = transform ? {
    transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
    zIndex: 999,
  } : undefined;

  return (
    <div ref={setNodeRef} style={style} {...listeners} {...attributes} className={isDragging ? 'opacity-50' : ''}>
      <CalendarEventCard event={event} className={className} />
    </div>
  );
}
