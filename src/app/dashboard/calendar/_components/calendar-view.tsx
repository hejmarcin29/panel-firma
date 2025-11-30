'use client';

import * as React from 'react';
import {
  addMonths,
  addWeeks,
  eachDayOfInterval,
  endOfMonth,
  endOfWeek,
  format,
  isSameDay,
  isSameMonth,
  isToday,
  startOfDay,
  startOfMonth,
  startOfWeek,
  subMonths,
  subWeeks,
} from 'date-fns';
import { pl } from 'date-fns/locale';
import { CalendarWeekView } from './calendar-week-view';
import {
  ChevronLeft,
  ChevronRight,
  Calendar as CalendarIcon,
  List,
  Inbox,
  Clock,
  Grid3X3,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { CalendarEvent, updateEventDate } from '../actions';
import { CalendarEventCard } from './calendar-event';
import { useIsMobile } from '@/hooks/use-mobile';
import { cn } from '@/lib/utils';
import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import { DraggableEvent } from './draggable-event';
import { DroppableDay } from './droppable-day';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { toast } from 'sonner';

interface CalendarViewProps {
  initialScheduledEvents: CalendarEvent[];
  initialUnscheduledEvents: CalendarEvent[];
}

export function CalendarView({
  initialScheduledEvents,
  initialUnscheduledEvents,
}: CalendarViewProps) {
  const [currentDate, setCurrentDate] = React.useState(new Date());
  const [scheduledEvents, setScheduledEvents] = React.useState<CalendarEvent[]>(
    initialScheduledEvents
  );
  const [unscheduledEvents, setUnscheduledEvents] = React.useState<
    CalendarEvent[]
  >(initialUnscheduledEvents);
  const isMobile = useIsMobile();
  const [viewMode, setViewMode] = React.useState<'month' | 'month-compact' | 'week' | 'agenda'>('month');
  const [selectedCompactDate, setSelectedCompactDate] = React.useState<Date>(new Date());
  const [activeEvent, setActiveEvent] = React.useState<CalendarEvent | null>(
    null
  );

  // Filters
  const [showOrders, setShowOrders] = React.useState(true);
  const [showMontages, setShowMontages] = React.useState(true);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  );

  // Sync view mode with mobile state
  React.useEffect(() => {
    if (isMobile) {
      setViewMode('agenda');
    } else {
      setViewMode('month');
    }
  }, [isMobile]);

  const next = () => {
    if (viewMode === 'week') {
      setCurrentDate(addWeeks(currentDate, 1));
    } else {
      setCurrentDate(addMonths(currentDate, 1));
    }
  };

  const prev = () => {
    if (viewMode === 'week') {
      setCurrentDate(subWeeks(currentDate, 1));
    } else {
      setCurrentDate(subMonths(currentDate, 1));
    }
  };
  const jumpToToday = () => setCurrentDate(new Date());

  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(monthStart);
  const startDate = startOfWeek(monthStart, { locale: pl });
  const endDate = endOfWeek(monthEnd, { locale: pl });

  const calendarDays = eachDayOfInterval({
    start: startDate,
    end: endDate,
  });

  const daysOfWeek = ['Pon', 'Wt', 'Śr', 'Czw', 'Pt', 'Sob', 'Ndz'];

  const getEventsForDay = (day: Date) => {
    return scheduledEvents.filter((event) => {
      if (!event.date) return false;
      if (event.type === 'order' && !showOrders) return false;
      if (event.type === 'montage' && !showMontages) return false;

      if (event.endDate) {
        const start = startOfDay(event.date);
        const end = startOfDay(event.endDate);
        const current = startOfDay(day);
        return current >= start && current <= end;
      }

      return isSameDay(event.date, day);
    });
  };

  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event;
    const eventData = active.data.current as CalendarEvent;
    setActiveEvent(eventData);
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;

    if (!over) {
      setActiveEvent(null);
      return;
    }

    const eventId = active.id as string;
    const eventData = active.data.current as CalendarEvent;
    const newDate = over.data.current?.date as Date;

    // Optimistic update
    if (newDate) {
      // Remove from unscheduled if it was there
      setUnscheduledEvents((prev) => prev.filter((e) => e.id !== eventId));

      // Update or add to scheduled
      setScheduledEvents((prev) => {
        const existing = prev.find((e) => e.id === eventId);
        if (existing) {
          return prev.map((e) =>
            e.id === eventId ? { ...e, date: newDate } : e
          );
        } else {
          return [...prev, { ...eventData, date: newDate }];
        }
      });

      toast.success('Zaktualizowano termin', {
        description: `Przeniesiono na ${format(newDate, 'd MMMM', {
          locale: pl,
        })}`,
      });

      try {
        await updateEventDate(eventId, eventData.type, newDate);
      } catch {
        toast.error('Błąd aktualizacji', {
          description: 'Nie udało się zapisać zmian w bazie.',
        });
        // Revert changes (simplified, ideally would refetch)
      }
    }

    setActiveEvent(null);
  };

  return (
    <DndContext
      sensors={sensors}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div className="flex h-[calc(100vh-120px)] md:h-[calc(100vh-200px)] gap-4">
        <div className="flex flex-col flex-1 bg-background md:rounded-lg md:border md:shadow-sm rounded-none border-0 shadow-none overflow-hidden">
          {/* Header */}
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between p-4 border-b bg-card/50 backdrop-blur-sm sticky top-0 z-10 gap-4">
            <div className="flex items-center justify-between w-full md:w-auto gap-2">
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-semibold capitalize">
                  {format(currentDate, 'MMMM yyyy', { locale: pl })}
                </h2>
                <div className="flex items-center rounded-md border bg-background shadow-sm ml-4">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 rounded-none rounded-l-md border-r"
                    onClick={prev}
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 rounded-none rounded-r-md"
                    onClick={next}
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              
              {/* Mobile Backlog Trigger - Visible only on mobile next to title */}
              <div className="md:hidden">
                <Sheet>
                  <SheetTrigger asChild>
                    <Button variant="outline" size="icon">
                      <Inbox className="h-4 w-4" />
                    </Button>
                  </SheetTrigger>
                  <SheetContent>
                    <SheetHeader>
                      <SheetTitle>Poczekalnia</SheetTitle>
                    </SheetHeader>
                    <div className="mt-4 flex flex-col gap-2">
                      {unscheduledEvents.map((event) => (
                        <DraggableEvent key={event.id} event={event} />
                      ))}
                      {unscheduledEvents.length === 0 && (
                        <p className="text-sm text-muted-foreground text-center py-4">
                          Brak nieprzypisanych zadań.
                        </p>
                      )}
                    </div>
                  </SheetContent>
                </Sheet>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
              <div className="flex items-center space-x-4 mr-0 border-r-0 pr-0 md:mr-4 md:border-r md:pr-4 w-full md:w-auto justify-between md:justify-start">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="show-orders"
                    checked={showOrders}
                    onCheckedChange={(c) => setShowOrders(!!c)}
                  />
                  <Label htmlFor="show-orders" className="text-sm">
                    Zamówienia
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="show-montages"
                    checked={showMontages}
                    onCheckedChange={(c) => setShowMontages(!!c)}
                  />
                  <Label htmlFor="show-montages" className="text-sm">
                    Montaże
                  </Label>
                </div>
              </div>

              <div className="flex items-center gap-2 w-full md:w-auto justify-between md:justify-start">
                <Button variant="outline" size="sm" onClick={jumpToToday} className="flex-1 md:flex-none">
                  Dzisiaj
                </Button>
                
                <div className="flex border rounded-md overflow-hidden">
                  <Button
                    variant={viewMode === 'month' ? 'secondary' : 'ghost'}
                    size="sm"
                    className="rounded-none px-2 sm:px-4"
                    onClick={() => setViewMode('month')}
                  >
                    <CalendarIcon className="h-4 w-4 sm:mr-2" />
                    <span className="hidden sm:inline">Miesiąc</span>
                  </Button>
                  <Button
                    variant={viewMode === 'month-compact' ? 'secondary' : 'ghost'}
                    size="sm"
                    className="rounded-none px-2 sm:px-4 md:hidden"
                    onClick={() => setViewMode('month-compact')}
                  >
                    <Grid3X3 className="h-4 w-4" />
                  </Button>
                  <Button
                    variant={viewMode === 'week' ? 'secondary' : 'ghost'}
                    size="sm"
                    className="rounded-none px-2 sm:px-4"
                    onClick={() => setViewMode('week')}
                  >
                    <Clock className="h-4 w-4 sm:mr-2" />
                    <span className="hidden sm:inline">Tydzień</span>
                  </Button>
                  <Button
                    variant={viewMode === 'agenda' ? 'secondary' : 'ghost'}
                    size="sm"
                    className="rounded-none px-2 sm:px-4"
                    onClick={() => setViewMode('agenda')}
                  >
                    <List className="h-4 w-4 sm:mr-2" />
                    <span className="hidden sm:inline">Agenda</span>
                  </Button>
                </div>
              </div>
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-auto">
            {viewMode === 'week' ? (
              <CalendarWeekView
                currentDate={currentDate}
                events={scheduledEvents.filter((event) => {
                  if (event.type === 'order' && !showOrders) return false;
                  if (event.type === 'montage' && !showMontages) return false;
                  return true;
                })}
                onEventClick={(event) => {
                  toast.info(event.title, {
                    description: `${format(event.date!, 'HH:mm')} - ${event.endDate ? format(event.endDate, 'HH:mm') : ''}`,
                  });
                }}
              />
            ) : viewMode === 'month-compact' ? (
              <div className="flex flex-col h-full">
                <div className="grid grid-cols-7 border-b">
                  {daysOfWeek.map((day) => (
                    <div
                      key={day}
                      className="p-2 text-center text-xs font-medium text-muted-foreground border-r last:border-r-0 bg-muted/30"
                    >
                      {day}
                    </div>
                  ))}
                </div>
                <div className="grid grid-cols-7 auto-rows-fr">
                  {calendarDays.map((day) => {
                    const dayEvents = getEventsForDay(day);
                    const isCurrentMonth = isSameMonth(day, monthStart);
                    const isSelected = isSameDay(day, selectedCompactDate);

                    return (
                      <div
                        key={day.toString()}
                        className={cn(
                          'min-h-[60px] p-1 border-b border-r last:border-r-0 flex flex-col items-center gap-1 cursor-pointer transition-colors',
                          !isCurrentMonth && 'bg-muted/20 text-muted-foreground',
                          isSelected && 'bg-accent/20 ring-2 ring-inset ring-primary',
                          isToday(day) && !isSelected && 'bg-accent/10'
                        )}
                        onClick={() => setSelectedCompactDate(day)}
                      >
                        <span
                          className={cn(
                            'text-xs font-medium h-6 w-6 flex items-center justify-center rounded-full',
                            isToday(day)
                              ? 'bg-primary text-primary-foreground'
                              : 'text-muted-foreground'
                          )}
                        >
                          {format(day, 'd')}
                        </span>
                        <div className="flex flex-wrap justify-center gap-1 w-full px-1">
                          {dayEvents.map((event) => (
                            <div
                              key={event.id}
                              className={cn(
                                "w-1.5 h-1.5 rounded-full",
                                event.type === 'order' ? "bg-blue-500" : "bg-orange-500"
                              )}
                            />
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
                <div className="flex-1 overflow-y-auto border-t bg-background p-4">
                  <div className="flex items-center gap-2 mb-4">
                    <div className="text-lg font-bold">
                      {format(selectedCompactDate, 'd MMMM', { locale: pl })}
                    </div>
                    <div className="text-sm text-muted-foreground capitalize">
                      {format(selectedCompactDate, 'EEEE', { locale: pl })}
                    </div>
                  </div>
                  <div className="flex flex-col gap-2">
                    {getEventsForDay(selectedCompactDate).map((event) => (
                      <CalendarEventCard
                        key={event.id}
                        event={event}
                        className="w-full"
                      />
                    ))}
                    {getEventsForDay(selectedCompactDate).length === 0 && (
                      <div className="text-center py-8 text-muted-foreground text-sm">
                        Brak wydarzeń tego dnia.
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ) : viewMode === 'month' ? (
              <div className="grid grid-cols-7 h-full min-w-[800px]">
                {/* Days Header */}
                {daysOfWeek.map((day) => (
                  <div
                    key={day}
                    className="p-2 text-center text-sm font-medium text-muted-foreground border-b bg-muted/30"
                  >
                    {day}
                  </div>
                ))}

                {/* Calendar Grid */}
                {calendarDays.map((day) => {
                  const dayEvents = getEventsForDay(day);
                  const isCurrentMonth = isSameMonth(day, monthStart);

                  return (
                    <DroppableDay
                      key={day.toString()}
                      id={day.toISOString()}
                      date={day}
                      className={cn(
                        'min-h-[120px] p-2 border-b border-r transition-colors hover:bg-muted/10 flex flex-col gap-1',
                        !isCurrentMonth && 'bg-muted/20 text-muted-foreground',
                        isToday(day) && 'bg-accent/10'
                      )}
                    >
                      <div className="flex justify-between items-start">
                        <span
                          className={cn(
                            'text-sm font-medium h-7 w-7 flex items-center justify-center rounded-full',
                            isToday(day)
                              ? 'bg-primary text-primary-foreground'
                              : 'text-muted-foreground'
                          )}
                        >
                          {format(day, 'd')}
                        </span>
                      </div>
                      <div className="flex flex-col gap-1 mt-1 overflow-y-auto max-h-[100px] no-scrollbar">
                        {dayEvents.map((event) => (
                          <DraggableEvent key={event.id} event={event} />
                        ))}
                      </div>
                    </DroppableDay>
                  );
                })}
              </div>
            ) : (
              <div className="flex flex-col divide-y">
                {calendarDays
                  .filter((day) => isSameMonth(day, monthStart))
                  .map((day) => {
                    const dayEvents = getEventsForDay(day);
                    if (dayEvents.length === 0) return null;

                    return (
                      <div
                        key={day.toString()}
                        className="p-4 flex flex-col gap-3"
                      >
                        <div className="flex items-center gap-2 sticky top-0 bg-background/95 backdrop-blur py-2 z-10">
                          <div
                            className={cn(
                              'text-2xl font-bold w-10 text-center',
                              isToday(day) ? 'text-primary' : 'text-foreground'
                            )}
                          >
                            {format(day, 'd')}
                          </div>
                          <div className="flex flex-col">
                            <span className="text-xs font-medium text-muted-foreground uppercase">
                              {format(day, 'EEEE', { locale: pl })}
                            </span>
                            {isToday(day) && (
                              <span className="text-xs font-bold text-primary">
                                Dzisiaj
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="pl-12 flex flex-col gap-2">
                          {dayEvents.map((event) => (
                            <CalendarEventCard
                              key={event.id}
                              event={event}
                              className="w-full"
                            />
                          ))}
                        </div>
                      </div>
                    );
                  })}
                {scheduledEvents.filter((e) =>
                  e.date ? isSameMonth(e.date, monthStart) : false
                ).length === 0 && (
                  <div className="p-8 text-center text-muted-foreground">
                    Brak wydarzeń w tym miesiącu.
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Desktop Backlog Sidebar */}
        <div className="hidden md:flex w-80 flex-col bg-background rounded-lg border shadow-sm overflow-hidden">
          <div className="p-4 border-b bg-muted/30">
            <h3 className="font-semibold flex items-center gap-2">
              <Inbox className="h-4 w-4" />
              Poczekalnia
            </h3>
            <p className="text-xs text-muted-foreground mt-1">
              Przeciągnij na kalendarz, aby zaplanować.
            </p>
          </div>
          <ScrollArea className="flex-1 p-4">
            <div className="flex flex-col gap-2">
              {unscheduledEvents
                .filter((event) => {
                  if (event.type === 'order' && !showOrders) return false;
                  if (event.type === 'montage' && !showMontages) return false;
                  return true;
                })
                .map((event) => (
                  <DraggableEvent key={event.id} event={event} />
                ))}
              {unscheduledEvents.length === 0 && (
                <div className="text-center py-8 text-muted-foreground text-sm border-2 border-dashed rounded-lg">
                  Pusto! Wszystko zaplanowane. 🎉
                </div>
              )}
            </div>
          </ScrollArea>
        </div>
      </div>

      <DragOverlay>
        {activeEvent ? (
          <CalendarEventCard event={activeEvent} className="w-64 opacity-80" />
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}
