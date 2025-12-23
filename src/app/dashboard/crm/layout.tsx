import { ReactNode } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Users, Hammer, FileText, LayoutDashboard } from 'lucide-react';

export default function CRMLayout({ children }: { children: ReactNode }) {
    return (
        <div className="flex flex-col h-full space-y-6 p-4 md:p-6">
            <div className="flex items-center justify-between border-b pb-4">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">Centrum CRM</h1>
                    <p className="text-muted-foreground">
                        Zarządzanie relacjami, realizacjami i ofertami
                    </p>
                </div>
            </div>

            <div className="flex space-x-2 border-b pb-2 overflow-x-auto">
                <Link href="/dashboard/crm">
                    <Button variant="ghost" size="sm" className="gap-2">
                        <LayoutDashboard className="h-4 w-4" />
                        Przegląd
                    </Button>
                </Link>
                <Link href="/dashboard/crm/customers">
                    <Button variant="ghost" size="sm" className="gap-2">
                        <Users className="h-4 w-4" />
                        Klienci
                    </Button>
                </Link>
                <Link href="/dashboard/crm/montaze">
                    <Button variant="ghost" size="sm" className="gap-2">
                        <Hammer className="h-4 w-4" />
                        Realizacje
                    </Button>
                </Link>
                <Link href="/dashboard/crm/oferty">
                    <Button variant="ghost" size="sm" className="gap-2">
                        <FileText className="h-4 w-4" />
                        Oferty
                    </Button>
                </Link>
            </div>

            <div className="flex-1">
                {children}
            </div>
        </div>
    );
}
