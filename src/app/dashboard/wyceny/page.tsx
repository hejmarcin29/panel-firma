import { getQuotes } from './actions';
import { NewQuoteDialog } from './_components/new-quote-dialog';
import { QuotesList } from './_components/quotes-list';

export default async function QuotesPage() {
    const quotes = await getQuotes();

    return (
        <div className="p-4 md:p-6 space-y-6">
            <div className="flex items-center justify-between">
                <h1 className="text-2xl font-bold">Wyceny</h1>
                <NewQuoteDialog />
            </div>

            <QuotesList quotes={quotes} />
        </div>
    );
}
