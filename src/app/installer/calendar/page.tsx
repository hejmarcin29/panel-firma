import { getInstallerMontages } from '../actions';
import { CalendarView } from './_components/calendar-view';

export const metadata = {
    title: 'Kalendarz | Panel Montażysty',
};

export default async function InstallerCalendarPage() {
    const montages = await getInstallerMontages();

    return <CalendarView montages={montages} />;
}
