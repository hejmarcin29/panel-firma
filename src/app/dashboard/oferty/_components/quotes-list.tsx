'use client';

import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { format } from 'date-fns';
import { pl } from 'date-fns/locale';
import { Calendar, MapPin, FileText } from 'lucide-react';

import { useIsMobile } from '@/hooks/use-mobile';
import { formatCurrency } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { QuoteActionsMenu } from './quote-actions-menu';

interface Quote {
    id: string;
    number: string | null;
    status: string;
    totalNet: number;
    totalGross: number;
    createdAt: Date;
    montage: {
        clientName: string;
        installationAddress: string | null;
    };
}

interface QuotesListProps {
    quotes: Quote[];
}

const statusMap: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
    draft: { label: 'Szkic', variant: 'outline' },
    sent: { label: 'Wysłana', variant: 'secondary' },
    accepted: { label: 'Zaakceptowana', variant: 'default' },
    rejected: { label: 'Odrzucona', variant: 'destructive' },
};

export function QuotesList({ quotes }: QuotesListProps) {
    const isMobile = useIsMobile();
    const router = useRouter();

    const handleRowClick = (quoteId: string) => {
        router.push(`/dashboard/oferty/${quoteId}`);
    };

    if (quotes.length === 0) {
        return (
            <div className="p-8 text-center text-muted-foreground border rounded-lg bg-background">
                Brak wycen w systemie.
            </div>
        );
    }

    if (isMobile) {
        return (
            <div className="space-y-4">
                {quotes.map((quote, index) => {
                    const status = statusMap[quote.status] || { label: quote.status, variant: 'outline' };
                    
                    return (
                        <motion.div
                            key={quote.id}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.3, delay: index * 0.05 }}
                            onClick={() => handleRowClick(quote.id)}
                        >
                            <Card className="overflow-hidden border-l-4 border-l-primary/20 active:scale-[0.98] transition-transform">
                                <CardHeader className="p-4 pb-2 flex flex-row items-start justify-between space-y-0">
                                    <div className="space-y-1">
                                        <CardTitle className="text-base font-semibold leading-none">
                                            {quote.montage.clientName}
                                        </CardTitle>
                                        <div className="text-xs text-muted-foreground flex items-center gap-1">
                                            <FileText className="h-3 w-3" />
                                            {quote.number || quote.id.slice(0, 8)}
                                        </div>
                                    </div>
                                    <Badge variant={status.variant} className="ml-2 shrink-0">
                                        {status.label}
                                    </Badge>
                                </CardHeader>
                                <CardContent className="p-4 pt-2 space-y-3">
                                    {quote.montage.installationAddress && (
                                        <div className="flex items-start gap-2 text-sm text-muted-foreground">
                                            <MapPin className="h-4 w-4 mt-0.5 shrink-0" />
                                            <span className="line-clamp-2">{quote.montage.installationAddress}</span>
                                        </div>
                                    )}
                                    
                                    <div className="flex items-center justify-between pt-2 border-t">
                                        <div className="flex flex-col">
                                            <span className="text-xs text-muted-foreground">Wartość brutto</span>
                                            <span className="font-bold text-lg text-primary">
                                                {formatCurrency(quote.totalGross)}
                                            </span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <div className="text-xs text-muted-foreground flex items-center gap-1 mr-2">
                                                <Calendar className="h-3 w-3" />
                                                {format(new Date(quote.createdAt), 'dd MMM', { locale: pl })}
                                            </div>
                                            <div onClick={(e) => e.stopPropagation()}>
                                                <QuoteActionsMenu 
                                                    quoteId={quote.id} 
                                                    quoteNumber={quote.number || quote.id.slice(0, 8)} 
                                                />
                                            </div>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        </motion.div>
                    );
                })}
            </div>
        );
    }

    return (
        <div className="border rounded-lg bg-white dark:bg-zinc-900 overflow-hidden">
            <table className="w-full text-sm">
                <thead className="bg-muted/50">
                    <tr className="text-left border-b">
                        <th className="p-4 font-medium">Numer</th>
                        <th className="p-4 font-medium">Klient / Montaż</th>
                        <th className="p-4 font-medium">Status</th>
                        <th className="p-4 font-medium text-right">Wartość Netto</th>
                        <th className="p-4 font-medium text-right">Wartość Brutto</th>
                        <th className="p-4 font-medium">Data utworzenia</th>
                        <th className="p-4 font-medium w-[50px]"></th>
                    </tr>
                </thead>
                <tbody>
                    {quotes.map((quote) => {
                        const status = statusMap[quote.status] || { label: quote.status, variant: 'outline' };
                        
                        return (
                            <tr 
                                key={quote.id} 
                                className="border-b last:border-0 hover:bg-muted/50 transition-colors cursor-pointer"
                                onClick={() => handleRowClick(quote.id)}
                            >
                                <td className="p-4 font-mono">{quote.number || quote.id.slice(0, 8)}</td>
                                <td className="p-4">
                                    <div className="font-medium">{quote.montage.clientName}</div>
                                    <div className="text-xs text-muted-foreground">{quote.montage.installationAddress}</div>
                                </td>
                                <td className="p-4">
                                    <Badge variant={status.variant}>
                                        {status.label}
                                    </Badge>
                                </td>
                                <td className="p-4 text-right">{formatCurrency(quote.totalNet)}</td>
                                <td className="p-4 text-right">{formatCurrency(quote.totalGross)}</td>
                                <td className="p-4 text-muted-foreground">
                                    {format(new Date(quote.createdAt), 'dd.MM.yyyy')}
                                </td>
                                <td className="p-4 text-right" onClick={(e) => e.stopPropagation()}>
                                    <QuoteActionsMenu 
                                        quoteId={quote.id} 
                                        quoteNumber={quote.number || quote.id.slice(0, 8)} 
                                    />
                                </td>
                            </tr>
                        );
                    })}
                </tbody>
            </table>
        </div>
    );
}
