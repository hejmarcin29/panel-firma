import { notFound } from 'next/navigation';
import { getCustomerByToken } from './actions';
import { CustomerPortal } from './_components/customer-portal';
import { getAppSetting, appSettingKeys } from '@/lib/settings';
import { Metadata } from 'next';

interface PageProps {
    params: Promise<{ token: string }>;
}

export const metadata: Metadata = {
    title: 'Portal Klienta',
};

export default async function ReferralPage({ params }: PageProps) {
    const { token } = await params;
    const customer = await getCustomerByToken(token);

    if (!customer) {
        notFound();
    }

    const [bankAccount, companyName, companyAddress, companyNip, companyLogoUrl] = await Promise.all([
        getAppSetting(appSettingKeys.companyBankAccount),
        getAppSetting(appSettingKeys.companyName),
        getAppSetting(appSettingKeys.companyAddress),
        getAppSetting(appSettingKeys.companyNip),
        getAppSetting(appSettingKeys.companyLogoUrl),
    ]);

    const companyInfo = {
        name: companyName || 'Moja Firma',
        address: companyAddress || '',
        nip: companyNip || '',
        logoUrl: companyLogoUrl || undefined,
    };

    return <CustomerPortal 
        customer={customer} 
        token={token} 
        bankAccount={bankAccount || undefined} 
        companyInfo={companyInfo}
    />;
}
