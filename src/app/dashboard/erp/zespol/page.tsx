import { Suspense } from 'react';
import { Users } from 'lucide-react';
import { getTeamMembers } from './actions';
import { TeamList } from './_components/team-list';
import { AddEmployeeDialog } from './_components/add-employee-dialog';
import { requireUser } from '@/lib/auth/session';

export const dynamic = 'force-dynamic';

export default async function TeamPage() {
    const user = await requireUser();
    const members = await getTeamMembers();
    const isAdmin = user.roles.includes('admin');

    return (
        <div className="p-6 space-y-8 max-w-[1600px] mx-auto">
            <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
                <div className="flex flex-col gap-2">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-primary/10 rounded-lg">
                            <Users className="h-6 w-6 text-primary" />
                        </div>
                        <h1 className="text-3xl font-bold tracking-tight">Zespół</h1>
                    </div>
                    <p className="text-muted-foreground max-w-2xl">
                        Zarządzaj dostępem i rolami pracowników w systemie. Przeglądaj profile, uprawnienia i historię aktywności.
                    </p>
                </div>
                {isAdmin && <AddEmployeeDialog />}
            </div>

            <Suspense fallback={<div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {[...Array(8)].map((_, i) => (
                    <div key={i} className="h-[300px] rounded-xl bg-muted/20 animate-pulse" />
                ))}
            </div>}>
                <TeamList members={members} />
            </Suspense>
        </div>
    );
}
