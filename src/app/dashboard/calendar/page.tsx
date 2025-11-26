import { startOfMonth, endOfMonth, eachDayOfInterval, format, isSameDay, isToday, addMonths, subMonths } from 'date-fns';
import { pl } from 'date-fns/locale';
import { db } from '@/lib/db';
import { requireUser } from '@/lib/auth/session';
import { cn } from '@/lib/utils';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight } from 'lucide-react';

export default async function CalendarPage({ searchParams }: { searchParams: Promise<{ date?: string }> }) {
    await requireUser();
    const { date } = await searchParams;
    
    const currentDate = date ? new Date(date) : new Date();
    const monthStart = startOfMonth(currentDate);
    const monthEnd = endOfMonth(currentDate);
    
    const days = eachDayOfInterval({ start: monthStart, end: monthEnd });

    // Fetch montages for this month
    const monthMontages = await db.query.montages.findMany({
        where: (table, { and, gte, lte, isNotNull }) => and(
            isNotNull(table.scheduledInstallationAt),
            gte(table.scheduledInstallationAt, monthStart),
            lte(table.scheduledInstallationAt, monthEnd)
        ),
    });

    const prevMonth = format(subMonths(currentDate, 1), 'yyyy-MM-dd');
    const nextMonth = format(addMonths(currentDate, 1), 'yyyy-MM-dd');

    return (
        <div className="flex flex-col h-full p-4 md:p-8 space-y-4">
            <div className="flex items-center justify-between">
                <h1 className="text-2xl font-bold capitalize">
                    {format(currentDate, 'MMMM yyyy', { locale: pl })}
                </h1>
                <div className="flex gap-2">
                    <Link href={`/dashboard/calendar?date=${prevMonth}`}>
                        <Button variant="outline" size="icon">
                            <ChevronLeft className="h-4 w-4" />
                        </Button>
                    </Link>
                    <Link href={`/dashboard/calendar?date=${nextMonth}`}>
                        <Button variant="outline" size="icon">
                            <ChevronRight className="h-4 w-4" />
                        </Button>
                    </Link>
                </div>
            </div>
            
            <div className="grid grid-cols-7 gap-px bg-muted rounded-lg overflow-hidden border shadow-sm">
                {['Pon', 'Wt', 'Śr', 'Czw', 'Pt', 'Sob', 'Ndz'].map((day) => (
                    <div key={day} className="bg-background p-3 text-center text-sm font-medium text-muted-foreground">
                        {day}
                    </div>
                ))}
                
                {/* Padding for start of month */}
                {Array.from({ length: (days[0].getDay() + 6) % 7 }).map((_, i) => (
                    <div key={`pad-${i}`} className="bg-background/50 min-h-[100px] md:min-h-[140px]" />
                ))}

                {days.map((day) => {
                    const dayMontages = monthMontages.filter(m => 
                        m.scheduledInstallationAt && isSameDay(new Date(m.scheduledInstallationAt), day)
                    );

                    return (
                        <div key={day.toISOString()} className={cn(
                            "bg-background p-2 min-h-[100px] md:min-h-[140px] flex flex-col gap-1 transition-colors hover:bg-muted/50 relative group",
                            isToday(day) && "bg-accent/5"
                        )}>
                            <span className={cn(
                                "text-sm font-medium w-7 h-7 flex items-center justify-center rounded-full mb-1",
                                isToday(day) ? "bg-primary text-primary-foreground" : "text-muted-foreground"
                            )}>
                                {format(day, 'd')}
                            </span>
                            
                            <div className="flex flex-col gap-1.5 overflow-y-auto max-h-[100px]">
                                {dayMontages.map(montage => (
                                    <Link 
                                        key={montage.id} 
                                        href={`/dashboard/montaze/${montage.id}`}
                                        className="text-xs p-2 rounded-md bg-blue-50 dark:bg-blue-950/50 border border-blue-100 dark:border-blue-900 hover:border-blue-300 dark:hover:border-blue-700 transition-colors block shadow-sm"
                                    >
                                        <div className="font-bold text-blue-700 dark:text-blue-300">
                                            {format(new Date(montage.scheduledInstallationAt!), 'HH:mm')}
                                        </div>
                                        <div className="truncate text-blue-900 dark:text-blue-100 font-medium">
                                            {montage.clientName}
                                        </div>
                                    </Link>
                                ))}
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
