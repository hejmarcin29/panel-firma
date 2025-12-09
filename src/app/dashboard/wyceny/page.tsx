import { getQuotes } from './actions';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';

export default async function QuotesPage() {
    const quotes = await getQuotes();

    return (
        <div className="p-6 space-y-6">
            <div className="flex items-center justify-between">
                <h1 className="text-2xl font-bold">Wyceny</h1>
                <Button asChild>
                    <Link href="/dashboard/montaze">
                        <Plus className="w-4 h-4 mr-2" />
                        Nowa Wycena (z Montażu)
                    </Link>
                </Button>
            </div>

            <div className="border rounded-lg bg-white dark:bg-zinc-900">
                <table className="w-full text-sm">
                    <thead className="bg-muted/50">
                        <tr className="text-left border-b">
                            <th className="p-4 font-medium">Numer</th>
                            <th className="p-4 font-medium">Klient / Montaż</th>
                            <th className="p-4 font-medium">Status</th>
                            <th className="p-4 font-medium text-right">Wartość Netto</th>
                            <th className="p-4 font-medium text-right">Wartość Brutto</th>
                            <th className="p-4 font-medium">Data utworzenia</th>
                            <th className="p-4 font-medium"></th>
                        </tr>
                    </thead>
                    <tbody>
                        {quotes.map((quote) => (
                            <tr key={quote.id} className="border-b last:border-0 hover:bg-muted/50 transition-colors">
                                <td className="p-4 font-mono">{quote.id.slice(0, 8)}</td>
                                <td className="p-4">
                                    <div className="font-medium">{quote.montage.clientName}</div>
                                    <div className="text-xs text-muted-foreground">{quote.montage.installationAddress}</div>
                                </td>
                                <td className="p-4">
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
                                </td>
                                <td className="p-4 text-right">{formatCurrency(quote.totalNet)}</td>
                                <td className="p-4 text-right">{formatCurrency(quote.totalGross)}</td>
                                <td className="p-4 text-muted-foreground">
                                    {new Date(quote.createdAt).toLocaleDateString('pl-PL')}
                                </td>
                                <td className="p-4 text-right">
                                    <Button variant="ghost" size="sm" asChild>
                                        <Link href={`/dashboard/wyceny/${quote.id}`}>
                                            Edytuj
                                        </Link>
                                    </Button>
                                </td>
                            </tr>
                        ))}
                        {quotes.length === 0 && (
                            <tr>
                                <td colSpan={7} className="p-8 text-center text-muted-foreground">
                                    Brak wycen w systemie.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
