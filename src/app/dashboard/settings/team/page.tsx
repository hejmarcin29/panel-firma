import { redirect } from 'next/navigation';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { getCurrentUser } from '@/lib/auth/session';
import { getTeamMembers } from './actions';
import { TeamList } from './_components/team-list';
import { AddEmployeeDialog } from './_components/add-employee-dialog';

export default async function TeamSettingsPage() {
    const user = await getCurrentUser();
    
    if (!user || !user.roles.includes('admin')) {
        redirect('/dashboard');
    }

    const members = await getTeamMembers();

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h3 className="text-lg font-medium">Zarządzanie Zespołem</h3>
                    <p className="text-sm text-muted-foreground">
                        Dodawaj pracowników, zarządzaj ich rolami i dostępem do panelu.
                    </p>
                </div>
                <AddEmployeeDialog />
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Pracownicy</CardTitle>
                    <CardDescription>
                        Lista wszystkich kont z dostępem do panelu.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <TeamList members={members} currentUserId={user.id} />
                </CardContent>
            </Card>
        </div>
    );
}
