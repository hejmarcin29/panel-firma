import { getQuote } from '../actions';
import { QuoteEditor } from '../_components/quote-editor';
import { notFound } from 'next/navigation';
import { getContractTemplates } from '../../../settings/contracts/actions';
import { getAppSetting, appSettingKeys } from '@/lib/settings';

export default async function QuotePage({ params }: { params: Promise<{ quoteId: string }> }) {
    const { quoteId } = await params;
    const [quote, templates, companyName, companyAddress, companyNip, companyLogoUrl] = await Promise.all([
        getQuote(quoteId),
        getContractTemplates(),
        getAppSetting(appSettingKeys.companyName),
        getAppSetting(appSettingKeys.companyAddress),
        getAppSetting(appSettingKeys.companyNip),
        getAppSetting(appSettingKeys.companyLogoUrl),
    ]);

    const serializedTemplates = templates.map(t => ({
        ...t,
        createdAt: t.createdAt.toISOString(),
        updatedAt: t.updatedAt.toISOString(),
    }));

    const serializedQuote = JSON.parse(JSON.stringify(quote));

    const companyInfo = {
        name: companyName || 'Moja Firma',
        address: companyAddress || '',
        nip: companyNip || '',
        logoUrl: companyLogoUrl || undefined,
    };

    if (!quote) {
        notFound();
    }

    return (
        <div className="p-6">
            <QuoteEditor 
                quote={serializedQuote} 
                templates={serializedTemplates} 
                companyInfo={companyInfo}
            />
        </div>
    );
}
