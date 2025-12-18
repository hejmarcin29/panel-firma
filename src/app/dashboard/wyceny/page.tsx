import { getQuotes } from './actions';
import { NewQuoteDialog } from './_components/new-quote-dialog';
import { QuotesBoard } from './_components/quotes-board';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { QuotesList } from './_components/quotes-list';
import { LayoutGrid, List } from 'lucide-react';

export default async function QuotesPage() {
    const quotes = await getQuotes();

    return (
        <div className="p-4 md:p-6 space-y-6 h-full flex flex-col">
            <div className="flex items-center justify-between shrink-0">
                <h1 className="text-2xl font-bold">Oferty</h1>
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
