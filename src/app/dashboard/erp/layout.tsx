import { ReactNode } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Package, Users, Warehouse, ArrowLeftRight, FileText } from 'lucide-react';

export default function ERPLayout({ children }: { children: ReactNode }) {
    return (
        <div className="flex flex-col h-full space-y-6 p-6">
            <div className="flex items-center justify-between border-b pb-4">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">ERP & Magazyn</h1>
                    <p className="text-muted-foreground">
                        Zarządzanie produktami, dostawcami i stanami magazynowymi
                    </p>
                </div>
            </div>

            <div className="flex space-x-2 border-b pb-2 overflow-x-auto">
                <Link href="/dashboard/erp/products">
                    <Button variant="ghost" size="sm" className="gap-2">
                        <Package className="h-4 w-4" />
                        Kartoteka
                    </Button>
                </Link>
                <Link href="/dashboard/erp/suppliers">
                    <Button variant="ghost" size="sm" className="gap-2">
                        <Users className="h-4 w-4" />
                        Dostawcy
                    </Button>
                </Link>
                <Link href="/dashboard/erp/inventory">
                    <Button variant="ghost" size="sm" className="gap-2">
                        <Warehouse className="h-4 w-4" />
                        Magazyn
                    </Button>
                </Link>
                 <Link href="/dashboard/erp/orders">
                    <Button variant="ghost" size="sm" className="gap-2">
                        <FileText className="h-4 w-4" />
                        Zamówienia (PO)
                    </Button>
                </Link>
            </div>

            <div className="flex-1">
                {children}
            </div>
        </div>
    );
}

