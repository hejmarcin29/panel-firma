import { db } from '@/lib/db';
import { users } from '@/lib/db/schema';
import { requireUser } from '@/lib/auth/session';
import { InstallersList } from './_components/installers-list';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { redirect } from 'next/navigation';

export const dynamic = 'force-dynamic';

export default async function InstallersPage() {
    const user = await requireUser();

    if (user.roles.includes('architect') && !user.roles.includes('admin')) {
        redirect('/dashboard/montaze');
    }

    // Fetch users who have the 'installer' role
    // Since roles is a JSON array, we can't easily query it with SQL 'LIKE' or 'contains' in a standard way across all DBs,
    // but for SQLite with Drizzle and the way it's stored (text), we can try a LIKE query or fetch all and filter.
    // Given the number of users is likely small, fetching all and filtering in JS is safe and robust.
    
    const allUsers = await db.select().from(users);
    
    const installers = allUsers.filter(u => 
        Array.isArray(u.roles) && u.roles.includes('installer')
    ).sort((a, b) => (b.createdAt?.getTime() ?? 0) - (a.createdAt?.getTime() ?? 0));

    return (
        <div className="flex flex-col h-[calc(100vh-4rem)]">
            <div className="border-b bg-background/95 backdrop-blur supports-backdrop-filter:bg-background/60 z-10">
                <div className="flex h-16 items-center px-4 sm:px-6 justify-between">
                    <div className="flex items-center gap-4">
                        <Button variant="ghost" size="icon" asChild>
                            <Link href="/dashboard/montaze">
                                <ArrowLeft className="h-4 w-4" />
                            </Link>
                        </Button>
                        <h1 className="text-lg font-semibold">Baza Montażystów</h1>
                    </div>
                </div>
            </div>
            <div className="flex-1 overflow-auto p-4 md:p-6">
                <InstallersList installers={installers} />
            </div>
        </div>
    );
}
