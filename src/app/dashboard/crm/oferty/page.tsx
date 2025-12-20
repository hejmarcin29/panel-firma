import { getQuotes } from './actions';
import { NewQuoteDialog } from './_components/new-quote-dialog';
import { QuotesBoard } from './_components/quotes-board';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { QuotesList } from './_components/quotes-list';
import { LayoutGrid, List } from 'lucide-react';
import { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'Oferty',
};

export default async function QuotesPage() {
    const quotes = await getQuotes();

    const pendingQuotes = quotes.filter(q => q.status === 'sent').length;

    return (
        <div className="p-4 md:p-6 space-y-6 h-full flex flex-col">
            <div className="flex items-center justify-between shrink-0">
                <div className="space-y-1">
                    <h1 className="text-2xl font-bold">Oferty</h1>
                    <div className="flex gap-2 text-xs">
                        {pendingQuotes > 0 && (
                            <span className="text-orange-700 font-medium bg-orange-50 px-2 py-0.5 rounded-full border border-orange-200">
                                {pendingQuotes} wysłanych ofert (oczekuje na podpis)
                            </span>
                        )}
                        {pendingQuotes === 0 && (
                            <span className="text-muted-foreground">Wszystko na bieżąco</span>
                        )}
                    </div>
                </div>
                <NewQuoteDialog />
            </div>

            <Tabs defaultValue="board" className="flex-1 flex flex-col">
                <div className="flex items-center mb-4">
                    <TabsList>
                        <TabsTrigger value="board">
                            <LayoutGrid className="mr-2 h-4 w-4" />
                            Tablica
                        </TabsTrigger>
                        <TabsTrigger value="list">
                            <List className="mr-2 h-4 w-4" />
                            Lista
                        </TabsTrigger>
                    </TabsList>
                </div>

                <TabsContent value="board" className="flex-1 mt-0">
                    <QuotesBoard quotes={quotes} />
                </TabsContent>
                
                <TabsContent value="list" className="mt-0">
                    <QuotesList quotes={quotes} />
                </TabsContent>
            </Tabs>
        </div>
    );
}
