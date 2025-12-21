import { requireUser } from '@/lib/auth/session';
import { getAllSettlements, getAllAdvances } from './actions';
import { SettlementsView } from './_components/settlements-view';

export default async function SettlementsPage() {
    const user = await requireUser();
    
    // Only admin can see this page for now
    if (!user.roles.includes('admin')) {
        return <div>Brak dostępu</div>;
    }

    const [settlements, advances] = await Promise.all([
        getAllSettlements(),
        getAllAdvances(),
    ]);

    return (
        <div className="flex min-h-screen flex-col">
            <div className="flex-1 space-y-4 p-8 pt-6">
                <div className="flex items-center justify-between space-y-2">
                    <h2 className="text-3xl font-bold tracking-tight">Rozliczenia</h2>
                </div>
                <SettlementsView settlements={settlements} advances={advances} />
            </div>
        </div>
    );
}
