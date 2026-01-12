import { notFound } from 'next/navigation';
import { getMontageDetails } from '@/app/dashboard/crm/montaze/[montageId]/actions';
import { InstallerMontageView } from '@/app/dashboard/crm/montaze/[montageId]/_components/installer-montage-view';
import { requireUser } from '@/lib/auth/session';
import type { Montage } from '@/app/dashboard/crm/montaze/types';

type Params = {
    params: Promise<{
        id: string; // The directory is named [id], but dashboard uses [montageId]. Need to match.
    }>;
};

// Next.js maps the folder name [id] to params.id.
// The reused action getMontageDetails expects a string.

export default async function InstallerMontageDetailsPage({ params }: Params) {
    const { id } = await params;
    
    // Authorization check (redundant if layout checks, but safe)
    const user = await requireUser();
    
    const data = await getMontageDetails(id);

    if (!data) {
        notFound();
    }

    return (
        <InstallerMontageView 
             montage={data.montage as unknown as Montage}
             logs={data.logs}
             userRoles={user.roles}
             hasGoogleCalendar={data.hasGoogleCalendar}
        />
    );
}
