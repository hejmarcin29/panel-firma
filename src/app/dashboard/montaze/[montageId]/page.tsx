import { notFound } from 'next/navigation';
import { getAppSetting, appSettingKeys } from '@/lib/settings';
import { getMontageDetails } from '../../crm/montaze/[montageId]/actions';
import { MontageView } from '../../crm/montaze/[montageId]/montage-view';

type MontageDetailsPageParams = {
    params: Promise<{
        montageId: string;
    }>;
};

export default async function MontageDetailsPage({ params }: MontageDetailsPageParams) {
    const { montageId } = await params;
    const [data, portalEnabled] = await Promise.all([
        getMontageDetails(montageId),
        getAppSetting(appSettingKeys.portalEnabled)
    ]);

    if (!data) {
        notFound();
    }

    return <MontageView montageId={montageId} initialData={data} portalEnabled={portalEnabled === 'true'} />;
}
