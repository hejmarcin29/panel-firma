'use client';

import { useState } from 'react';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, isToday, addMonths, subMonths, startOfWeek, endOfWeek, compareAsc } from 'date-fns';
import { pl } from 'date-fns/locale';
import { ChevronLeft, ChevronRight, Clock, MapPin, Navigation, Calendar as CalendarIcon, List as ListIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { cn } from '@/lib/utils';
import Link from 'next/link';
import type { Montage } from '@/app/dashboard/crm/montaze/types';

export function CalendarView({ montages }: { montages: Montage[] }) {
    const [viewMode, setViewMode] = useState<'calendar' | 'list'>('calendar');

    const [currentMonth, setCurrentMonth] = useState(new Date());
    const [selectedDate, setSelectedDate] = useState(new Date());

    const monthStart = startOfMonth(currentMonth);
    const monthEnd = endOfMonth(monthStart);
    const startDate = startOfWeek(monthStart, { locale: pl });
    const endDate = endOfWeek(monthEnd, { locale: pl });

    const calendarDays = eachDayOfInterval({
        start: startDate,
        end: endDate,
    });

    const weekDays = ['Pn', 'Wt', 'Śr', 'Cz', 'Pt', 'So', 'Nd'];

    const montagesForSelectedDate = montages.filter(m => {
        if (!m.scheduledInstallationAt) return false;
        return isSameDay(new Date(m.scheduledInstallationAt), selectedDate);
    });

    // Helper to check if a day has events
    const hasEvents = (date: Date) => {
        return montages.some(m => 
            m.scheduledInstallationAt && isSameDay(new Date(m.scheduledInstallationAt), date)
        );
    };

    // Sort montages for list view (Ascending dates)
    const sortedMontages = [...montages].sort((a, b) => {
        const dateA = a.scheduledInstallationAt ? new Date(a.scheduledInstallationAt) : new Date(0);
        const dateB = b.scheduledInstallationAt ? new Date(b.scheduledInstallationAt) : new Date(0);
        return compareAsc(dateA, dateB);
    });

    return (
        <div className="flex flex-col h-full bg-background">
            <div className="px-4 pt-4 pb-2">
                <Tabs value={viewMode} onValueChange={(v) => setViewMode(v as 'calendar' | 'list')} className="w-full">
                    <TabsList className="grid w-full grid-cols-2">
                        <TabsTrigger value="calendar">
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            Kalendarz
                        </TabsTrigger>
                        <TabsTrigger value="list">
                            <ListIcon className="mr-2 h-4 w-4" />
                            Lista
                        </TabsTrigger>
                    </TabsList>
                </Tabs>
            </div>

            {viewMode === 'calendar' ? (
                <>
                    {/* Header */}
                    <div className="flex items-center justify-between p-4 border-b">
                        <Button variant="ghost" size="icon" onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}>
                            <ChevronLeft className="h-5 w-5" />
                        </Button>
                        <h2 className="text-lg font-semibold capitalize">
                            {format(currentMonth, 'MMMM yyyy', { locale: pl })}
                        </h2>
                        <Button variant="ghost" size="icon" onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}>
                            <ChevronRight className="h-5 w-5" />
                        </Button>
                    </div>

                    {/* Calendar Grid */}
                    <div className="p-4 bg-background">
                        {/* Weekday Headers */}
                        <div className="grid grid-cols-7 mb-2">
                            {weekDays.map(day => (
                                <div key={day} className="text-center text-xs text-muted-foreground font-medium py-1">
                                    {day}
                                </div>
                            ))}
                        </div>

                        {/* Days */}
                        <div className="grid grid-cols-7 gap-y-2">
                            {calendarDays.map((day) => {
                                const isSelected = isSameDay(day, selectedDate);
                                const isCurrentMonth = isSameMonth(day, currentMonth);
                                const isDayToday = isToday(day);
                                const hasEvent = hasEvents(day);

                                return (
                                    <div key={day.toString()} className="flex justify-center">
                                        <button
                                            onClick={() => setSelectedDate(day)}
                                            className={cn(
                                                "relative h-9 w-9 rounded-full flex items-center justify-center text-sm transition-all",
                                                !isCurrentMonth && "text-muted-foreground/30",
                                                isSelected && "bg-primary text-primary-foreground font-medium shadow-md scale-110",
                                                !isSelected && isDayToday && "bg-accent text-accent-foreground font-medium",
                                                !isSelected && !isDayToday && "hover:bg-muted",
                                                hasEvent && !isSelected && "font-semibold"
                                            )}
                                        >
                                            {format(day, 'd')}
                                            {hasEvent && (
                                                <div className={cn(
                                                    "absolute bottom-1 w-1 h-1 rounded-full",
                                                    isSelected ? "bg-white" : "bg-primary"
                                                )} />
                                            )}
                                        </button>
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    {/* Selected Day Agenda */}
                    <div className="flex-1 bg-muted/30 p-4 border-t overflow-y-auto">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="font-medium text-muted-foreground">
                                {isToday(selectedDate) ? 'Dziś' : format(selectedDate, 'EEEE, d MMMM', { locale: pl })}
                            </h3>
                            <Badge variant="outline" className="bg-background">
                                {montagesForSelectedDate.length} {montagesForSelectedDate.length === 1 ? 'zadanie' : montagesForSelectedDate.length > 1 && montagesForSelectedDate.length < 5 ? 'zadania' : 'zadań'}
                            </Badge>
                        </div>

                        <div className="space-y-3 pb-20">
                            {montagesForSelectedDate.length === 0 ? (
                                <div className="flex flex-col items-center justify-center py-10 text-muted-foreground">
                                    <CalendarViewPlaceholder />
                                    <p className="mt-4 text-sm">Brak zaplanowanych prac na ten dzień</p>
                                </div>
                            ) : (
                                montagesForSelectedDate.map(montage => (
                                    <MontageCard key={montage.id} montage={montage} />
                                ))
                            )}
                        </div>
                    </div>
                </>
            ) : (
                <div className="flex-1 bg-muted/30 p-4 overflow-y-auto">
                     <div className="space-y-4 pb-20">
                        {sortedMontages.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-10 text-muted-foreground">
                                <CalendarViewPlaceholder />
                                <p className="mt-4 text-sm">Brak zaplanowanych prac</p>
                            </div>
                        ) : (
                            // Group by date logic could be added here, currently flat list
                            sortedMontages.map((montage, index) => {
                                const date = new Date(montage.scheduledInstallationAt);
                                const prevDate = index > 0 ? new Date(sortedMontages[index - 1].scheduledInstallationAt) : null;
                                const showDateHeader = !prevDate || !isSameDay(date, prevDate);

                                return (
                                    <div key={montage.id}>
                                        {showDateHeader && (
                                            <div className="sticky top-0 z-10 bg-muted/95 backdrop-blur py-2 mb-2 font-semibold text-sm text-foreground/80 border-b border-border/50">
                                                {format(date, 'EEEE, d MMMM yyyy', { locale: pl })}
                                            </div>
                                        )}
                                        <MontageCard montage={montage} showDate={false} />
                                    </div>
                                );
                            })
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}

function MontageCard({ montage, showDate = false }: { montage: Montage, showDate?: boolean }) {
    return (
        <Link href={`/installer/montages/${montage.id}`} className="block mb-3">
            <Card className="active:scale-98 transition-transform">
                <CardContent className="p-4">
                    <div className="flex items-start justify-between mb-2">
                        <div>
                             {showDate && montage.scheduledInstallationAt && (
                                <div className="text-sm font-semibold text-blue-600 mb-1">
                                    {format(new Date(montage.scheduledInstallationAt), 'd MMM', { locale: pl })}
                                </div>
                            )}
                            <div className="font-semibold text-base">{montage.clientName}</div>
                            {/* City Highlight */}
                            <div className="text-sm font-medium text-foreground/80 flex items-center gap-1 mt-1">
                                <MapPin className="h-3.5 w-3.5 text-primary" />
                                {montage.installationCity || 'Brak miasta'} 
                                <span className="text-muted-foreground text-xs font-normal">
                                    ({montage.address?.split(',')[0]}...)
                                </span>
                            </div>
                        </div>
                        <Badge variant={montage.status.includes('done') ? 'default' : 'secondary'}>
                            {montage.scheduledInstallationAt ? format(new Date(montage.scheduledInstallationAt), 'HH:mm') : '--:--'}
                        </Badge>
                    </div>

                    <div className="flex items-center gap-4 mt-3 pt-3 border-t text-sm">
                        <div className="flex items-center gap-1.5 text-blue-600 bg-blue-50 px-2 py-1 rounded-md">
                            <Navigation className="h-3.5 w-3.5" />
                            <span className="text-xs font-medium">Nawiguj</span>
                        </div>
                        <div className="flex items-center gap-1.5 text-muted-foreground ml-auto">
                            <Clock className="h-3.5 w-3.5" />
                            <span className="text-xs">
                                {montage.forecastedInstallationDuration || 4}h
                            </span>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </Link>
    );
}


function CalendarViewPlaceholder() {
    return (
        <svg
            className="w-16 h-16 opacity-20"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            xmlns="http://www.w3.org/2000/svg"
        >
            <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1}
                d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
            />
        </svg>
    );
}
