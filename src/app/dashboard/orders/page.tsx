import { requireUser } from '@/lib/auth/session';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { LayoutGrid, List } from 'lucide-react';

export const dynamic = 'force-dynamic';

import { getManualOrders } from './actions';
import { OrdersListClient } from './orders-list-client';
import { OrdersBoard } from './_components/orders-board';

export default async function OrdersPage() {
	await requireUser();
	const orders = await getManualOrders();
	
    return (
        <div className="h-full flex flex-col p-4 md:p-6 space-y-6">
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
    );
}
