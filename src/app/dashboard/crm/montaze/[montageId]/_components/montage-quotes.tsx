'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Plus, FileText, Trash2 } from 'lucide-react';
import Link from 'next/link';
import { formatCurrency } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { createQuote } from '@/app/dashboard/crm/oferty/actions';
import { deleteMontageAttachment } from '../../actions';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import type { Montage } from '../../types';
import { ProtocolWizard } from './protocol/protocol-wizard';

export function MontageQuotes({ montageId, quotes, montage, userRoles }: { montageId: string, quotes: Montage['quotes'], montage: Montage, userRoles: string[] }) {
    const router = useRouter();

    const handleCreate = async () => {
        try {
            const id = await createQuote(montageId);
            toast.success('Utworzono nową ofertę');
            router.push(`/dashboard/crm/oferty/${id}`);
        } catch {
            toast.error('Błąd tworzenia oferty');
        }
    };

    const acceptedQuote = montage.quotes?.find(q => q.status === 'accepted') || montage.quotes?.[0];
    const defaultIsHousingVat = acceptedQuote 
        ? acceptedQuote.items.some(i => i.vatRate === 8) 
        : true;

    const protocols = montage.attachments?.filter(a => a.type === 'protocol' || a.title?.includes('Protokół Odbioru')) || [];

    const handleDeleteProtocol = async (id: string) => {
        if (confirm('Czy na pewno chcesz usunąć ten protokół?')) {
            try {
                await deleteMontageAttachment(id);
                toast.success('Protokół usunięty');
                router.refresh();
            } catch {
                toast.error('Błąd usuwania protokołu');
            }
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h3 className="text-lg font-medium">Oferty do zlecenia</h3>
                <div className="flex gap-2">
                    <ProtocolWizard 
                        montageId={montage.id}
                        clientName={montage.clientName}
                        installerName={userRoles.includes('installer') ? 'Ja' : 'Montażysta'}
                        defaultLocation={montage.installationCity || ''}
                        contractNumber={montage.contractNumber || ''}
                        contractDate={montage.contractDate ? new Date(montage.contractDate as string) : null}
                        defaultIsHousingVat={defaultIsHousingVat}
                        onComplete={() => router.refresh()}
                    />
                    <Button onClick={handleCreate}>
                        <Plus className="w-4 h-4 mr-2" />
                        Nowa Oferta
                    </Button>
                </div>
            </div>

            {protocols.length > 0 && (
                <div className="space-y-4">
                    <h4 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Podpisane Protokoły</h4>
                    <div className="grid gap-4">
                        {protocols.map(protocol => (
                            <Card key={protocol.id}>
                                <CardContent className="p-6 flex items-center justify-between">
                                    <div className="flex items-center gap-4">
                                        <div className="p-2 bg-green-100 rounded-full">
                                            <FileText className="w-6 h-6 text-green-600" />
                                        </div>
                                        <div>
                                            <div className="font-medium">{protocol.title || 'Protokół Odbioru'}</div>
                                            <div className="text-sm text-muted-foreground">
                                                {new Date(protocol.createdAt).toLocaleDateString('pl-PL')}
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Button variant="outline" size="sm" asChild>
                                            <a href={protocol.url} target="_blank" rel="noopener noreferrer">
                                                Pobierz
                                            </a>
                                        </Button>
                                        <Button variant="ghost" size="icon" onClick={() => handleDeleteProtocol(protocol.id)}>
                                            <Trash2 className="w-4 h-4 text-destructive" />
                                        </Button>
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                </div>
            )}

            <div className="grid gap-4">
                {quotes.map((quote) => (
                    <Link key={quote.id} href={`/dashboard/crm/oferty/${quote.id}`} className="block group">
                    <Card className="hover:bg-muted/50 transition-colors group-hover:border-primary/50">
                        <CardContent className="p-6 flex items-center justify-between">
                            <div className="flex items-center gap-4">
                                <div className="p-2 bg-primary/10 rounded-full group-hover:bg-primary/20 transition-colors">
                                    <FileText className="w-6 h-6 text-primary" />
                                </div>
                                <div>
                                    <div className="font-medium">Oferta #{quote.id.slice(0, 8)}</div>
                                    <div className="text-sm text-muted-foreground">
                                        {quote.createdAt ? new Date(quote.createdAt).toLocaleDateString('pl-PL') : '-'}
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

                                <Button variant="ghost" size="sm" className="opacity-0 group-hover:opacity-100 transition-opacity">
                                    Edytuj
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                    </Link>
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
