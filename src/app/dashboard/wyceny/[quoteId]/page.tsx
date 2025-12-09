import { getQuote } from '../actions';
import { QuoteEditor } from '../_components/quote-editor';
import { notFound } from 'next/navigation';

export default async function QuotePage({ params }: { params: { quoteId: string } }) {
    const quote = await getQuote(params.quoteId);

    if (!quote) {
        notFound();
    }

    return (
        <div className="p-6">
            <QuoteEditor quote={quote} />
        </div>
    );
}
