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
    const [
        data, 
        portalEnabled, 
        requireInstallerForMeasurement,
        kpiMontageThreatDays,
        kpiAlertMissingMaterialStatusDays,
        kpiAlertMissingInstallerStatusDays,
        kpiAlertMissingMeasurerDays,
        kpiAlertMissingInstallerDays,
        kpiAlertMaterialOrderedDays,
        kpiAlertMaterialInstockDays
    ] = await Promise.all([
        getMontageDetails(montageId),
        getAppSetting(appSettingKeys.portalEnabled),
        getAppSetting(appSettingKeys.requireInstallerForMeasurement),
        getAppSetting(appSettingKeys.kpiMontageThreatDays),
        getAppSetting(appSettingKeys.kpiAlertMissingMaterialStatusDays),
        getAppSetting(appSettingKeys.kpiAlertMissingInstallerStatusDays),
        getAppSetting(appSettingKeys.kpiAlertMissingMeasurerDays),
        getAppSetting(appSettingKeys.kpiAlertMissingInstallerDays),
        getAppSetting(appSettingKeys.kpiAlertMaterialOrderedDays),
        getAppSetting(appSettingKeys.kpiAlertMaterialInstockDays),
    ]);

    if (!data) {
        notFound();
    }

    const alertSettings = {
        missingMaterialStatusDays: Number(kpiAlertMissingMaterialStatusDays ?? 7),
        missingInstallerStatusDays: Number(kpiAlertMissingInstallerStatusDays ?? 7),
        missingMeasurerDays: Number(kpiAlertMissingMeasurerDays ?? 14),
        missingInstallerDays: Number(kpiAlertMissingInstallerDays ?? 14),
        materialOrderedDays: Number(kpiAlertMaterialOrderedDays ?? 5),
        materialInstockDays: Number(kpiAlertMaterialInstockDays ?? 2),
    };
    const threatDays = Number(kpiMontageThreatDays ?? 7);

    return <MontageView 
        montageId={montageId} 
        initialData={data} 
        portalEnabled={portalEnabled === 'true'} 
        requireInstallerForMeasurement={requireInstallerForMeasurement === 'true'}
        alertSettings={alertSettings}
        threatDays={threatDays}
    />;
}
