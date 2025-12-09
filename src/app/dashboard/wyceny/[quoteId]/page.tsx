import { getQuote } from '../actions';
import { QuoteEditor } from '../_components/quote-editor';
import { notFound } from 'next/navigation';

export default async function QuotePage({ params }: { params: Promise<{ quoteId: string }> }) {
    const { quoteId } = await params;
    const quote = await getQuote(quoteId);

    if (!quote) {
        notFound();
    }

    return (
        <div className="p-6">
            <QuoteEditor quote={quote} />
        </div>
    );
}
