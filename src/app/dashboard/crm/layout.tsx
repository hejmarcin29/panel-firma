import { ReactNode } from 'react';
import { CRMNavigation } from './_components/crm-navigation';

export default function CRMLayout({ children }: { children: ReactNode }) {
    return (
        <div className="flex flex-col h-full space-y-6 p-4 md:p-6">
            <CRMNavigation />

            <div className="flex-1">
                {children}
            </div>
        </div>
    );
}
