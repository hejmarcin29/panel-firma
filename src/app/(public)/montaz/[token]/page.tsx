import { notFound } from 'next/navigation';
import { getCustomerByToken, getAvailableSamples, getPendingTechnicalOrder } from './actions';
import { PortalView } from './_components/portal-view';
import { getAppSetting, appSettingKeys } from '@/lib/settings';
import { Metadata } from 'next';

interface PageProps {
    params: Promise<{ token: string }>;
}

export const metadata: Metadata = {
    title: 'Portal Klienta - Montaż i Próbki',
};

export default async function MontagePage({ params }: PageProps) {
    const { token } = await params;
    
    // 1. Fetch Data
    const customer = await getCustomerByToken(token);

    if (!customer) {
        notFound();
    }

    // Check for pending technical order (Payment Gate)
    const activeMontage = customer.montages[0];
    const pendingOrder = activeMontage && activeMontage.status === 'lead_payment_pending' 
        ? await getPendingTechnicalOrder(activeMontage.id)
        : undefined;

    const samples = await getAvailableSamples();

    // 2. Fetch Settings
    const [
        bankAccount, 
        companyName, 
        companyAddress, 
        companyNip, 
        companyLogoUrl,
        inpostToken,
        inpostConfig
    ] = await Promise.all([
        getAppSetting(appSettingKeys.companyBankAccount),
        getAppSetting(appSettingKeys.companyName),
        getAppSetting(appSettingKeys.companyAddress),
        getAppSetting(appSettingKeys.companyNip),
        getAppSetting(appSettingKeys.companyLogoUrl),
        getAppSetting(appSettingKeys.inpostGeowidgetToken),
        getAppSetting(appSettingKeys.inpostGeowidgetConfig),
    ]);

    const companyInfo = {
        name: companyName || 'Panel Klienta',
        address: companyAddress || '',
        nip: companyNip || '',
        logoUrl: companyLogoUrl || undefined,
    };

    // 3. Determine Initial Tab
    // Default to 'orders' (Client Portal) unless specifically in Lead Stage
    const latestMontage = customer.montages && customer.montages.length > 0 ? customer.montages[0] : null;
    const leadStatuses = ['new_lead', 'lead_contact', 'lead_samples_pending'];
    
    // Logic: If no montage OR status is pre-measurement => Samples
    // Else => Orders
    const initialTab = (!latestMontage || leadStatuses.includes(latestMontage.status)) ? 'samples' : 'orders';

    return <PortalView 
        token={token}
        customer={customer}
        samples={samples}
        geowidgetToken={inpostToken || ""}
        geowidgetConfig={inpostConfig || "parcelCollect"}
        companyInfo={companyInfo}
        bankAccount={bankAccount || undefined}
        initialTab={initialTab}
        pendingOrder={pendingOrder}
    />;
}
