import { notFound } from 'next/navigation';
import { getCustomerByToken } from './actions';
import { CustomerPortal } from './_components/customer-portal';
import { getAppSetting, appSettingKeys } from '@/lib/settings';

interface PageProps {
    params: Promise<{ token: string }>;
}

export default async function ReferralPage({ params }: PageProps) {
    const { token } = await params;
    const customer = await getCustomerByToken(token);

    if (!customer) {
        notFound();
    }

    const bankAccount = await getAppSetting(appSettingKeys.companyBankAccount);

    return <CustomerPortal customer={customer} token={token} bankAccount={bankAccount || undefined} />;
}
