import { db } from '@/lib/db';
import { users, montages } from '@/lib/db/schema';
import { eq, desc } from 'drizzle-orm';
import { notFound } from 'next/navigation';
import { InstallerDetailsView } from './_components/installer-details-view';
import { requireUser } from '@/lib/auth/session';

export const dynamic = 'force-dynamic';

export default async function InstallerDetailsPage({ params }: { params: Promise<{ userId: string }> }) {
    const { userId } = await params;
    await requireUser();

    const user = await db.query.users.findFirst({
        where: eq(users.id, userId),
    });

    if (!user || !user.roles.includes('installer')) {
        notFound();
    }

    // Fetch montages assigned to this installer
    const allMontages = await db.query.montages.findMany({
        orderBy: [desc(montages.createdAt)],
        with: {
            tasks: true,
        }
    });

    const installerMontages = allMontages.filter(m => 
        m.installerId === userId
    );

    return (
        <InstallerDetailsView 
            installer={user} 
            montages={installerMontages} 
        />
    );
}
