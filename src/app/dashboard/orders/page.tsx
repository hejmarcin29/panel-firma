import { requireUser } from '@/lib/auth/session';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { LayoutGrid, List, X } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Metadata } from 'next';

export const dynamic = 'force-dynamic';
export const metadata: Metadata = {
    title: 'Zamówienia',
};

import { getManualOrders } from './actions';
import { OrdersListClient } from './orders-list-client';
import { OrdersBoard } from './_components/orders-board';

type PageProps = {
    searchParams: Promise<{ filter?: string }>;
};

export default async function OrdersPage({ searchParams }: PageProps) {
	await requireUser();
    const { filter } = await searchParams;
	const orders = await getManualOrders(filter);
	
    return (
        <div className="h-full flex flex-col">
            {filter && (
                <div className="bg-amber-50 border-b border-amber-200 px-4 md:px-6 py-2.5 text-sm text-amber-800 flex justify-between items-center shrink-0">
                    <div className="flex items-center gap-2">
                        <span className="font-medium">
                            {filter === 'verification' && 'Filtrowanie: Do weryfikacji'}
                            {filter === 'urgent' && 'Filtrowanie: Pilne (ponad 3 dni)'}
                            {filter === 'invoice' && 'Filtrowanie: Wiszące (brak faktury)'}
                        </span>
                        <span className="opacity-75">
                            • Znaleziono: {orders.length}
                        </span>
                    </div>
                    <Button variant="ghost" size="sm" asChild className="h-auto py-1 px-2 hover:bg-amber-100 text-amber-900 hover:text-amber-950">
                        <Link href="/dashboard/orders">
                            <X className="h-3.5 w-3.5 mr-1.5" />
                            Wyczyść
                        </Link>
                    </Button>
                </div>
            )}

            <div className="flex-1 flex flex-col p-4 md:p-6 space-y-6 overflow-y-auto">
                <div className="flex items-center justify-between shrink-0">
                    <h1 className="text-2xl font-bold">Zamówienia</h1>
                </div>

                <Tabs defaultValue="list" className="flex-1 flex flex-col">
                    <div className="flex items-center mb-4">
                        <TabsList>
                            <TabsTrigger value="list">
                                <List className="mr-2 h-4 w-4" />
                                Lista
                            </TabsTrigger>
                            <TabsTrigger value="board">
                                <LayoutGrid className="mr-2 h-4 w-4" />
                                Tablica
                            </TabsTrigger>
                        </TabsList>
                    </div>

                    <TabsContent value="list" className="flex-1 mt-0">
                        <OrdersListClient initialOrders={orders} />
                    </TabsContent>
                    
                    <TabsContent value="board" className="mt-0">
                        <OrdersBoard orders={orders} />
                    </TabsContent>
                </Tabs>
            </div>
        </div>
    );
}
