import { getPayoutRequests } from './actions';
import { PayoutsTable } from './_components/payouts-table';

export default async function ReferralsPage() {
    const requests = await getPayoutRequests();

    return (
        <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
            <div className="flex items-center justify-between space-y-2">
                <h2 className="text-3xl font-bold tracking-tight">Wypłaty (Program Poleceń)</h2>
            </div>
            <div className="hidden md:block text-muted-foreground">
                Zarządzaj zleceniami wypłat nagród z programu poleceń.
            </div>
            
            <PayoutsTable requests={requests} />
        </div>
    );
}
