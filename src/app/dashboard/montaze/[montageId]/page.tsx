import { notFound } from 'next/navigation';
import { getAppSetting, appSettingKeys } from '@/lib/settings';
import { getMontageDetails } from '../../crm/montaze/[montageId]/actions';
import { MontageView } from '../../crm/montaze/[montageId]/montage-view';
import { Metadata } from 'next';

type MontageDetailsPageParams = {
    params: Promise<{
        montageId: string;
    }>;
};

export async function generateMetadata(
    { params }: MontageDetailsPageParams
): Promise<Metadata> {
    const { montageId } = await params;
    const data = await getMontageDetails(montageId);
    
    return {
        title: data ? `Montaż - ${data.montage.customer?.name || 'Szczegóły'}` : 'Szczegóły montażu',
    };
}

export default async function MontageDetailsPage({ params }: MontageDetailsPageParams) {
    const { montageId } = await params;
    const [data, portalEnabled, requireInstallerForMeasurement] = await Promise.all([
        getMontageDetails(montageId),
        getAppSetting(appSettingKeys.portalEnabled),
        getAppSetting(appSettingKeys.requireInstallerForMeasurement)
    ]);

    if (!data) {
        notFound();
    }

    return <MontageView 
        montageId={montageId} 
        initialData={data} 
        portalEnabled={portalEnabled === 'true'} 
        requireInstallerForMeasurement={requireInstallerForMeasurement === 'true'}
    />;
}
