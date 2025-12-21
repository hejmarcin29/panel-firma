'use client';

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { SettlementsList } from './settlements-list';
import { AdvancesList } from './advances-list';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface SettlementsViewProps {
    settlements: any[];
    advances: any[];
}

export function SettlementsView({ settlements, advances }: SettlementsViewProps) {
    const pendingSettlements = settlements.filter(s => s.status !== 'paid');
    const paidSettlements = settlements.filter(s => s.status === 'paid');
    
    const pendingAdvances = advances.filter(a => a.status !== 'paid');
    const paidAdvances = advances.filter(a => a.status === 'paid');

    const totalPendingAmount = pendingSettlements.reduce((acc, s) => acc + s.totalAmount, 0) + 
                               pendingAdvances.reduce((acc, a) => acc + a.amount, 0);

    return (
        <div className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Do wypłaty (Razem)</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{totalPendingAmount.toFixed(2)} PLN</div>
                        <p className="text-xs text-muted-foreground">
                            {pendingSettlements.length} rozliczeń, {pendingAdvances.length} zaliczek
                        </p>
                    </CardContent>
                </Card>
            </div>

            <Tabs defaultValue="pending" className="space-y-4">
                <TabsList>
                    <TabsTrigger value="pending">Do wypłaty</TabsTrigger>
                    <TabsTrigger value="history">Historia wypłat</TabsTrigger>
                    <TabsTrigger value="advances">Zaliczki</TabsTrigger>
                </TabsList>
                <TabsContent value="pending" className="space-y-4">
                    <SettlementsList data={pendingSettlements} pendingAdvances={pendingAdvances} />
                </TabsContent>
                <TabsContent value="history" className="space-y-4">
                    <SettlementsList data={paidSettlements} isHistory />
                </TabsContent>
                <TabsContent value="advances" className="space-y-4">
                    <AdvancesList pending={pendingAdvances} history={paidAdvances} />
                </TabsContent>
            </Tabs>
        </div>
    );
}
