import { requireUser } from '@/lib/auth/session';
import { redirect } from 'next/navigation';
import { X } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Metadata } from 'next';

export const dynamic = 'force-dynamic';
export const metadata: Metadata = {
    title: 'Zamówienia',
};

import { getManualOrders } from './actions';
import { OrdersListClient } from './orders-list-client';

type PageProps = {
    searchParams: Promise<{ filter?: string }>;
};

export default async function OrdersPage({ searchParams }: PageProps) {
	const user = await requireUser();
    if (user.roles.includes('installer') && !user.roles.includes('admin')) {
        redirect('/dashboard');
    }

    const { filter } = await searchParams;
    
    // If filter is 'verification', we want to load ALL orders so tabs work correctly,
    // but default the view to the 'verification' tab.
    // For other filters (urgent, invoice), we keep the strict filtering behavior.
    const effectiveFilter = filter === 'verification' ? undefined : filter;
	const orders = await getManualOrders(effectiveFilter);
    
    const showBanner = filter && filter !== 'verification';
	
    return (
        <div className="h-full flex flex-col">
            {showBanner && (
                <div className="bg-amber-50 border-b border-amber-200 px-4 md:px-6 py-2.5 text-sm text-amber-800 flex justify-between items-center shrink-0">
                    <div className="flex items-center gap-2">
                        <span className="font-medium">
                            {filter === 'urgent' && 'Filtrowanie: Pilne (ponad 3 dni)'}
                            {filter === 'invoice' && 'Filtrowanie: Wiszące (brak faktury)'}
                        </span>
                        <span className="opacity-75">
                            • Znaleziono: {orders.length}
                        </span>
                    </div>
                    <Button variant="ghost" size="sm" asChild className="h-auto py-1 px-2 hover:bg-amber-100 text-amber-900 hover:text-amber-950">
                        <Link href="/dashboard/crm/orders">
                            <X className="h-3.5 w-3.5 mr-1.5" />
                            Wyczyść
                        </Link>
                    </Button>
                </div>
            )}

            <div className="flex-1 flex flex-col overflow-y-auto">
                <OrdersListClient 
                    initialOrders={orders} 
                    initialTab={filter === 'verification' ? 'verification' : 'all'}
                />
            </div>
        </div>
    );
}
