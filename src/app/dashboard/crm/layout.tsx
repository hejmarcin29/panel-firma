import { ReactNode } from 'react';
import { CRMNavigation } from './_components/crm-navigation';
import { requireUser } from '@/lib/auth/session';

export default async function CRMLayout({ children }: { children: ReactNode }) {
    const user = await requireUser();
    
    return (
        <div className="flex flex-col h-full space-y-6 p-4 md:p-6">
            <CRMNavigation userRoles={user.roles} />

            <div className="flex-1">
                {children}
            </div>
        </div>
    );
}
