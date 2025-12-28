import { notFound } from 'next/navigation';
import { getAppSetting, appSettingKeys } from '@/lib/settings';
import { getMontageDetails } from './actions';
import { MontageView } from './montage-view';

type MontageDetailsPageParams = {
    params: Promise<{
        montageId: string;
    }>;
};

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
