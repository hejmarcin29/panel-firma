'use client';

import { CalendarEvent } from '../actions';
import { cn } from '@/lib/utils';
import { MapPin, DollarSign, Clock, Calendar as CalendarIcon } from 'lucide-react';
import { format } from 'date-fns';
import { pl } from 'date-fns/locale';
import { useRouter } from 'next/navigation';
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from '@/components/ui/hover-card';

interface CalendarEventProps {
  event: CalendarEvent;
  className?: string;
}

export function CalendarEventCard({ event, className }: CalendarEventProps) {
  const router = useRouter();
  const isMontage = event.type === 'montage';

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isMontage) {
      router.push(`/dashboard/crm/montaze/${event.id}`);
    } else {
      router.push(`/dashboard/orders/${event.id}`);
    }
  };

  return (
    <HoverCard>
      <HoverCardTrigger asChild>
        <div
          onClick={handleClick}
          className={cn(
            'group flex flex-col gap-1 rounded-md border px-2 py-1 text-xs font-medium shadow-sm transition-all hover:shadow-md cursor-pointer',
            isMontage
              ? 'bg-blue-50 border-blue-200 text-blue-700 hover:bg-blue-100'
              : 'bg-emerald-50 border-emerald-200 text-emerald-700 hover:bg-emerald-100',
            className
          )}
        >
          <div className="flex items-center justify-between gap-2">
            <span className="truncate font-semibold">{event.title}</span>
            {/* <span className="shrink-0 opacity-70">{format(event.date, 'HH:mm')}</span> */}
          </div>
          {isMontage && event.address && (
            <div className="flex items-center gap-1 opacity-80 truncate">
              <MapPin className="h-3 w-3" />
              <span className="truncate">{event.address}</span>
            </div>
          )}
          {!isMontage && event.amount && (
            <div className="flex items-center gap-1 opacity-80 truncate">
              <DollarSign className="h-3 w-3" />
              <span>{event.amount}</span>
            </div>
          )}
        </div>
      </HoverCardTrigger>
      <HoverCardContent className="w-80">
        <div className="flex justify-between space-x-4">
          <div className="space-y-1">
            <h4 className="text-sm font-semibold">{event.title}</h4>
            <p className="text-sm text-muted-foreground">
              {isMontage ? 'Montaż' : 'Zamówienie'}
            </p>
            <div className="flex items-center pt-2">
              <CalendarIcon className="mr-2 h-4 w-4 opacity-70" />
              <span className="text-xs text-muted-foreground">
                {event.date && format(event.date, 'dd.MM.yyyy', { locale: pl })}
                {event.endDate &&
                  ` - ${format(event.endDate, 'dd.MM.yyyy', { locale: pl })}`}
              </span>
            </div>
            <div className="flex items-center pt-1">
              <Clock className="mr-2 h-4 w-4 opacity-70" />
              <span className="text-xs text-muted-foreground">
                Status: {event.status}
              </span>
            </div>
            {event.address && (
              <div className="flex items-center pt-1">
                <MapPin className="mr-2 h-4 w-4 opacity-70" />
                <span className="text-xs text-muted-foreground">
                  {event.address}
                </span>
              </div>
            )}
            {event.amount && (
              <div className="flex items-center pt-1">
                <DollarSign className="mr-2 h-4 w-4 opacity-70" />
                <span className="text-xs text-muted-foreground">
                  {event.amount}
                </span>
              </div>
            )}
          </div>
        </div>
      </HoverCardContent>
    </HoverCard>
  );
}
