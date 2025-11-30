import { getCalendarEvents } from './actions';
import { CalendarView } from './_components/calendar-view';

export const dynamic = 'force-dynamic';

export default async function CalendarPage() {
  const { scheduled, unscheduled } = await getCalendarEvents();
  const today = new Date();

  return (
    <div className="h-full flex-1 flex-col space-y-8 p-0 md:p-8 md:flex">
      <div className="hidden md:flex items-center justify-between space-y-2">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Kalendarz</h2>
          <p className="text-muted-foreground">
            Zarządzaj zamówieniami i montażami w jednym miejscu.
          </p>
        </div>
      </div>
      <CalendarView 
        initialScheduledEvents={scheduled} 
        initialUnscheduledEvents={unscheduled} 
        initialDate={today}
      />
    </div>
  );
}
