"use client";

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Users, Hammer, FileText, LayoutDashboard } from 'lucide-react';

export function CRMNavigation() {
    const pathname = usePathname();

    // Define paths where the header should be visible
    const mainPaths = [
        '/dashboard/crm',
        '/dashboard/crm/customers',
        '/dashboard/crm/montaze',
        '/dashboard/crm/oferty',
        '/dashboard/crm/logistics'
    ];

    // Check if current path is exactly one of the main paths
    // We also want to show it if there are query params, but pathname doesn't include them.
    const shouldShow = mainPaths.includes(pathname);

    if (!shouldShow) {
        return null;
    }

    return (
        <>
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
                    <Button 
                        variant={pathname === '/dashboard/crm' ? "secondary" : "ghost"} 
                        size="sm" 
                        className="gap-2"
                    >
                        <LayoutDashboard className="h-4 w-4" />
                        Przegląd
                    </Button>
                </Link>
                <Link href="/dashboard/crm/customers">
                    <Button 
                        variant={pathname.startsWith('/dashboard/crm/customers') ? "secondary" : "ghost"} 
                        size="sm" 
                        className="gap-2"
                    >
                        <Users className="h-4 w-4" />
                        Klienci
                    </Button>
                </Link>
                <Link href="/dashboard/crm/montaze">
                    <Button 
                        variant={pathname.startsWith('/dashboard/crm/montaze') ? "secondary" : "ghost"} 
                        size="sm" 
                        className="gap-2"
                    >
                        <Hammer className="h-4 w-4" />
                        Realizacje
                    </Button>
                </Link>
                <Link href="/dashboard/crm/oferty">
                    <Button 
                        variant={pathname.startsWith('/dashboard/crm/oferty') ? "secondary" : "ghost"} 
                        size="sm" 
                        className="gap-2"
                    >
                        <FileText className="h-4 w-4" />
                        Oferty
                    </Button>
                </Link>
            </div>
        </>
    );
}
