'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Plus, FileText } from 'lucide-react';
import Link from 'next/link';
import { formatCurrency } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { createQuote } from '@/app/dashboard/wyceny/actions';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';

export function MontageQuotes({ montageId, quotes }: { montageId: string, quotes: any[] }) {
    const router = useRouter();

    const handleCreate = async () => {
        try {
            const id = await createQuote(montageId);
            toast.success('Utworzono nową wycenę');
            router.push(`/dashboard/wyceny/${id}`);
        } catch (error) {
            toast.error('Błąd tworzenia wyceny');
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h3 className="text-lg font-medium">Wyceny do zlecenia</h3>
                <Button onClick={handleCreate}>
                    <Plus className="w-4 h-4 mr-2" />
                    Nowa Wycena
                </Button>
            </div>

            <div className="grid gap-4">
                {quotes.map((quote) => (
                    <Card key={quote.id} className="hover:bg-muted/50 transition-colors">
                        <CardContent className="p-6 flex items-center justify-between">
                            <div className="flex items-center gap-4">
                                <div className="p-2 bg-primary/10 rounded-full">
                                    <FileText className="w-6 h-6 text-primary" />
                                </div>
                                <div>
                                    <div className="font-medium">Wycena #{quote.id.slice(0, 8)}</div>
                                    <div className="text-sm text-muted-foreground">
                                        {new Date(quote.createdAt).toLocaleDateString('pl-PL')}
                                    </div>
                                </div>
                            </div>
                            
                            <div className="flex items-center gap-6">
                                <div className="text-right">
                                    <div className="font-bold">{formatCurrency(quote.totalGross)}</div>
                                    <div className="text-xs text-muted-foreground">Brutto</div>
                                </div>
                                
                                <Badge variant={
                                    quote.status === 'accepted' ? 'default' :
                                    quote.status === 'sent' ? 'secondary' :
                                    quote.status === 'rejected' ? 'destructive' : 'outline'
                                }>
                                    {quote.status === 'draft' && 'Szkic'}
                                    {quote.status === 'sent' && 'Wysłana'}
                                    {quote.status === 'accepted' && 'Zaakceptowana'}
                                    {quote.status === 'rejected' && 'Odrzucona'}
                                </Badge>

                                <Button variant="outline" size="sm" asChild>
                                    <Link href={`/dashboard/wyceny/${quote.id}`}>
                                        Edytuj
                                    </Link>
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                ))}
                
                {quotes.length === 0 && (
                    <div className="text-center py-12 text-muted-foreground border rounded-lg border-dashed">
                        Brak wycen dla tego montażu.
                    </div>
                )}
            </div>
        </div>
    );
}
