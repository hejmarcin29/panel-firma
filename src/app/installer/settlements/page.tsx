import { getInstallerSettlements } from '../actions';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { formatCurrency } from '@/lib/utils';
import { format } from 'date-fns';
import { pl } from 'date-fns/locale';
import { Download, Calendar, CircleDollarSign, Info } from 'lucide-react';

export const metadata = {
    title: 'Rozliczenia | Panel Montażysty',
};

export default async function InstallerSettlementsPage() {
    const settlements = await getInstallerSettlements();

    return (
        <div className="p-4 pb-24 space-y-6">
            <h1 className="text-2xl font-bold tracking-tight px-1">Rozliczenia</h1>

            <div className="space-y-4">
                {settlements.length === 0 ? (
                    <Card className="border-dashed">
                        <CardContent className="flex flex-col items-center justify-center py-10 text-center text-muted-foreground">
                            <CircleDollarSign className="h-10 w-10 mb-3 opacity-20" />
                            <p>Brak historii rozliczeń</p>
                        </CardContent>
                    </Card>
                ) : (
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    settlements.map((settlement: any) => (
                        <Card key={settlement.id} className="overflow-hidden">
                            <div className={`h-1.5 w-full ${
                                settlement.status === 'paid' ? 'bg-green-500' : 
                                settlement.status === 'rejected' ? 'bg-red-500' : 'bg-yellow-500'
                            }`} />
                            <CardHeader className="pb-2 pt-4">
                                <div className="flex justify-between items-start">
                                    <div>
                                        <CardTitle className="text-lg">
                                            {formatCurrency(settlement.amount / 100)}
                                        </CardTitle>
                                        <div className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                                            <Calendar className="h-3 w-3" />
                                            {format(new Date(settlement.createdAt), 'd MMMM yyyy', { locale: pl })}
                                        </div>
                                    </div>
                                    <Badge variant={
                                        settlement.status === 'paid' ? 'default' : 
                                        settlement.status === 'rejected' ? 'destructive' : 'outline'
                                    }>
                                        {settlement.status === 'paid' ? 'Wypłacono' : 
                                         settlement.status === 'rejected' ? 'Odrzucono' : 'W trakcie'}
                                    </Badge>
                                </div>
                            </CardHeader>
                            <CardContent className="pb-4">
                                <div className="space-y-3">
                                    {settlement.periodStart && settlement.periodEnd && (
                                        <div className="text-sm flex justify-between py-2 border-b border-dashed">
                                            <span className="text-muted-foreground">Okres</span>
                                            <span className="font-medium">
                                                {format(new Date(settlement.periodStart), 'd.MM', { locale: pl })} - {format(new Date(settlement.periodEnd), 'd.MM', { locale: pl })}
                                            </span>
                                        </div>
                                    )}
                                    
                                    {settlement.note && (
                                        <div className="bg-muted/50 p-2.5 rounded-md text-xs text-muted-foreground flex gap-2">
                                            <Info className="h-4 w-4 shrink-0 mt-0.5" />
                                            <span>{settlement.note}</span>
                                        </div>
                                    )}

                                    {settlement.invoiceUrl ? (
                                        <a 
                                            href={settlement.invoiceUrl} 
                                            target="_blank" 
                                            rel="noopener noreferrer"
                                            className="flex items-center justify-center gap-2 w-full py-2 mt-2 text-sm font-medium text-primary hover:bg-primary/5 rounded-md transition-colors border border-primary/20"
                                        >
                                            <Download className="h-4 w-4" />
                                            Pobierz fakturę / Potwierdzenie
                                        </a>
                                    ) : (
                                        <div className="text-center text-xs text-muted-foreground pt-2">
                                            Faktura niedostępna
                                        </div>
                                    )}
                                </div>
                            </CardContent>
                        </Card>
                    ))
                )}
            </div>
        </div>
    );
}
