import { notFound } from 'next/navigation';
import { getMontageDetails } from './actions';
import { MontageView } from './montage-view';

type MontageDetailsPageParams = {
    params: Promise<{
        montageId: string;
    }>;
};

export default async function MontageDetailsPage({ params }: MontageDetailsPageParams) {
    const { montageId } = await params;
    const data = await getMontageDetails(montageId);

    if (!data) {
        notFound();
    }

    return <MontageView montageId={montageId} initialData={data} />;
}
