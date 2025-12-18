import { notFound } from 'next/navigation';
import { getCustomerByToken } from './actions';
import { CustomerPortal } from './_components/customer-portal';

interface PageProps {
    params: Promise<{ token: string }>;
}

export default async function ReferralPage({ params }: PageProps) {
    const { token } = await params;
    const customer = await getCustomerByToken(token);

    if (!customer) {
        notFound();
    }

    return <CustomerPortal customer={customer} />;
}
