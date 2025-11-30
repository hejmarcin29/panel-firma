'use client';

import * as React from 'react';
import {
  addDays,
  eachDayOfInterval,
  endOfWeek,
  format,
  isSameDay,
  startOfWeek,
  setHours,
  setMinutes,
  differenceInMinutes,
  startOfDay,
  isWithinInterval,
} from 'date-fns';
import { pl } from 'date-fns/locale';
import { CalendarEvent } from '../actions';
import { cn } from '@/lib/utils';
import { ScrollArea } from '@/components/ui/scroll-area';

interface CalendarWeekViewProps {
  currentDate: Date;
  events: CalendarEvent[];
  onEventClick?: (event: CalendarEvent) => void;
}

export function CalendarWeekView({
  currentDate,
  events,
  onEventClick,
}: CalendarWeekViewProps) {
  const startDate = startOfWeek(currentDate, { locale: pl });
  const endDate = endOfWeek(currentDate, { locale: pl });

  const weekDays = eachDayOfInterval({
    start: startDate,
    end: endDate,
  });

  const hours = Array.from({ length: 24 }, (_, i) => i);

  // Helper to calculate event position and height
  const getEventStyle = (event: CalendarEvent) => {
    if (!event.date) return {};

    const start = new Date(event.date);
    const end = event.endDate ? new Date(event.endDate) : addDays(start, 0); // Default to 1 hour if no end date? Or just show as block.
    
    // If no end date, assume 1 hour duration for visualization
    const effectiveEnd = event.endDate ? new Date(event.endDate) : new Date(start.getTime() + 60 * 60 * 1000);

    const startHour = start.getHours();
    const startMinute = start.getMinutes();
    const top = (startHour * 60 + startMinute) * (64 / 60); // 64px per hour

    const durationMinutes = differenceInMinutes(effectiveEnd, start);
    const height = Math.max(durationMinutes * (64 / 60), 32); // Min height 32px

    return {
      top: `${top}px`,
      height: `${height}px`,
    };
  };

  return (
    <div className="flex flex-col h-full overflow-hidden bg-background">
      {/* Header - Days */}
      <div className="flex border-b">
        <div className="w-16 flex-shrink-0 border-r bg-muted/30" /> {/* Time column header */}
        <div className="flex flex-1">
          {weekDays.map((day, i) => (
            <div
              key={day.toString()}
              className={cn(
                "flex-1 p-2 text-center border-r last:border-r-0 text-sm",
                isSameDay(day, new Date()) && "bg-accent/50"
              )}
            >
              <div className="font-medium text-muted-foreground">
                {format(day, 'EEE', { locale: pl })}
              </div>
              <div className={cn(
                "text-lg font-bold rounded-full w-8 h-8 flex items-center justify-center mx-auto mt-1",
                isSameDay(day, new Date()) && "bg-primary text-primary-foreground"
              )}>
                {format(day, 'd')}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Body - Time Grid */}
      <ScrollArea className="flex-1">
        <div className="flex relative min-h-[1536px]"> {/* 24 * 64px = 1536px */}
          {/* Time Labels */}
          <div className="w-16 flex-shrink-0 border-r bg-muted/10 flex flex-col">
            {hours.map((hour) => (
              <div
                key={hour}
                className="h-16 border-b text-xs text-muted-foreground p-1 text-right pr-2 relative"
              >
                <span className="-top-2 relative block">
                  {hour}:00
                </span>
              </div>
            ))}
          </div>

          {/* Days Columns */}
          <div className="flex flex-1 relative">
            {/* Grid Lines */}
            <div className="absolute inset-0 flex pointer-events-none">
              {weekDays.map((day) => (
                <div key={day.toString()} className="flex-1 border-r last:border-r-0 flex flex-col">
                  {hours.map((hour) => (
                    <div key={hour} className="h-16 border-b" />
                  ))}
                </div>
              ))}
            </div>

            {/* Events */}
            <div className="absolute inset-0 flex">
              {weekDays.map((day) => {
                const dayEvents = events.filter(event => 
                  event.date && isSameDay(new Date(event.date), day)
                );

                return (
                  <div key={day.toString()} className="flex-1 relative">
                    {dayEvents.map((event) => (
                      <div
                        key={event.id}
                        className={cn(
                          "absolute left-1 right-1 rounded-md p-2 text-xs overflow-hidden cursor-pointer hover:opacity-90 transition-opacity border-l-4 shadow-sm",
                          event.type === 'order' 
                            ? "bg-blue-100 border-blue-500 text-blue-700 dark:bg-blue-900/30 dark:text-blue-100" 
                            : "bg-orange-100 border-orange-500 text-orange-700 dark:bg-orange-900/30 dark:text-orange-100"
                        )}
                        style={getEventStyle(event)}
                        onClick={() => onEventClick?.(event)}
                      >
                        <div className="font-semibold truncate">
                          {event.title}
                        </div>
                        <div className="truncate opacity-80">
                          {event.date && format(new Date(event.date), 'HH:mm')}
                          {event.endDate && ` - ${format(new Date(event.endDate), 'HH:mm')}`}
                        </div>
                        {event.address && (
                          <div className="truncate opacity-70 mt-1">
                            {event.address}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </ScrollArea>
    </div>
  );
}
