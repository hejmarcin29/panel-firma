import { getQuote } from '../actions';
import { QuoteEditor } from '../_components/quote-editor';
import { notFound } from 'next/navigation';
import { getContractTemplates } from '../../settings/contracts/actions';

export default async function QuotePage({ params }: { params: Promise<{ quoteId: string }> }) {
    const { quoteId } = await params;
    const [quote, templates] = await Promise.all([
        getQuote(quoteId),
        getContractTemplates()
    ]);

    const serializedTemplates = templates.map(t => ({
        ...t,
        createdAt: t.createdAt.toISOString(),
        updatedAt: t.updatedAt.toISOString(),
    }));

    const serializedQuote = JSON.parse(JSON.stringify(quote));

    if (!quote) {
        notFound();
    }

    return (
        <div className="p-6">
            <QuoteEditor quote={serializedQuote} templates={serializedTemplates} />
        </div>
    );
}
