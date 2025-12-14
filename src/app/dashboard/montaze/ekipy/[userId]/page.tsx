import { db } from '@/lib/db';
import { users, montages } from '@/lib/db/schema';
import { eq, desc, and, or } from 'drizzle-orm';
import { notFound } from 'next/navigation';
import { InstallerDetailsView } from './_components/installer-details-view';
import { requireUser } from '@/lib/auth/session';

export const dynamic = 'force-dynamic';

export default async function InstallerDetailsPage({ params }: { params: Promise<{ userId: string }> }) {
    const { userId } = await params;
    const currentUser = await requireUser();

    const user = await db.query.users.findFirst({
        where: eq(users.id, userId),
        with: {
            installerProfile: true,
        }
    });

    if (!user || !user.roles.includes('installer')) {
        notFound();
    }

    // Fetch montages assigned to this installer
    // We need to check if the user is in the assignedInstallers JSON array
    // Since we can't easily do JSON array contains in all SQL dialects via Drizzle query builder yet for this specific case without raw SQL,
    // and we want to be safe, we'll fetch montages and filter or use a raw query if performance is needed.
    // For now, fetching recent montages and filtering is acceptable for the scale.
    
    const allMontages = await db.query.montages.findMany({
        orderBy: [desc(montages.createdAt)],
        with: {
            tasks: true,
        }
    });

    const installerMontages = allMontages.filter(m => 
        Array.isArray(m.assignedInstallers) && m.assignedInstallers.includes(userId)
    );

    return (
        <InstallerDetailsView 
            installer={user} 
            montages={installerMontages} 
        />
    );
}
