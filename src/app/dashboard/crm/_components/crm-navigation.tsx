"use client";

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Users, Hammer, FileText, LayoutDashboard, Images, HardHat } from 'lucide-react';

export function CRMNavigation({ userRoles = [] }: { userRoles?: string[] }) {
    const pathname = usePathname();
    const isInstaller = userRoles.includes('installer') && !userRoles.includes('admin');

    // Define paths where the header should be visible
    const mainPaths = [
        '/dashboard/crm',
        '/dashboard/crm/customers',
        '/dashboard/crm/montaze',
        '/dashboard/crm/oferty',
        '/dashboard/crm/logistics',
        '/dashboard/crm/montaze/galeria',
        '/dashboard/crm/montaze/ekipy'
    ];

    // Check if current path is exactly one of the main paths
    // We also want to show it if there are query params, but pathname doesn't include them.
    const shouldShow = mainPaths.includes(pathname);

    if (!shouldShow || isInstaller) {
        return null;
    }

    return (
        <>
            <div className="hidden md:flex items-center justify-between border-b pb-4">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">Centrum CRM</h1>
                    <p className="text-muted-foreground">
                        Zarządzanie relacjami, realizacjami i ofertami
                    </p>
                </div>
            </div>

            <div className="hidden md:flex space-x-2 border-b pb-2 overflow-x-auto">
                {!isInstaller && (
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
                )}
                {!isInstaller && (
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
                )}
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
                {!isInstaller && (
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
                )}
                {!isInstaller && (
                    <Link href="/dashboard/crm/montaze/galeria">
                        <Button 
                            variant={pathname.startsWith('/dashboard/crm/montaze/galeria') ? "secondary" : "ghost"} 
                            size="sm" 
                            className="gap-2"
                        >
                            <Images className="h-4 w-4" />
                            Galeria
                        </Button>
                    </Link>
                )}
                {!isInstaller && (
                    <Link href="/dashboard/crm/montaze/ekipy">
                        <Button 
                            variant={pathname.startsWith('/dashboard/crm/montaze/ekipy') ? "secondary" : "ghost"} 
                            size="sm" 
                            className="gap-2"
                        >
                            <HardHat className="h-4 w-4" />
                            Baza Ekip
                        </Button>
                    </Link>
                )}
            </div>
        </>
    );
}
