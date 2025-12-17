'use client';

import { useQuery } from '@tanstack/react-query';
import { useSearchParams } from 'next/navigation';
import { getMontageDetails } from './actions';

import { MontageHeader } from './_components/montage-header';
import { MontageClientCard } from './_components/montage-client-card';
import { MontageMaterialCard } from './_components/montage-material-card';
import { MontageWorkflowTab } from './_components/montage-workflow-tab';
import { MontageTasksTab } from './_components/montage-tasks-tab';
import { MontageGalleryTab } from './_components/montage-gallery-tab';
import { MontageNotesTab } from './_components/montage-notes-tab';
import { MontageHistoryTab } from './_components/montage-history-tab';
import { MontageMeasurementTab } from '../_components/montage-measurement-tab';
import { MontageTechnicalTab } from './_components/montage-technical-tab';
import { MontageQuotes } from './_components/montage-quotes';
import { MontageClientInfo } from './_components/montage-client-info';

import { MontageDetailsLayout } from './_components/montage-details-layout';
import { ConvertLeadButton } from './_components/convert-lead-button';

interface MontageViewProps {
    montageId: string;
    initialData: NonNullable<Awaited<ReturnType<typeof getMontageDetails>>>;
}

export function MontageView({ montageId, initialData }: MontageViewProps) {
    const searchParams = useSearchParams();
    const tab = searchParams.get('tab');
    const activeTab = tab || 'notes';

    const { data } = useQuery({
        queryKey: ['montage', montageId],
        queryFn: () => getMontageDetails(montageId),
        initialData,
        staleTime: 1000 * 60 * 5, // 5 minutes
    });

    if (!data) return null;

    const { montage, logs, installers, measurers, architects, statusOptions, referralEnabled, userRoles } = data;

    if (montage.status === 'lead') {
        return (
             <div className="flex min-h-screen flex-col bg-muted/10">
                <div className="p-4 md:p-6 space-y-6 max-w-5xl mx-auto w-full">
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                        <div>
                            <h1 className="text-2xl font-bold">{montage.clientName}</h1>
                            <p className="text-muted-foreground">Nowy Lead - Weryfikacja</p>
                        </div>
                        <ConvertLeadButton montageId={montage.id} />
                    </div>

                    <div className="grid gap-6 md:grid-cols-2">
                        <MontageClientCard montage={montage} userRoles={userRoles} installers={installers} measurers={measurers} architects={architects} />
                        <div className="space-y-6">
                             <MontageClientInfo montageId={montage.id} initialContent={montage.materialDetails} />
                             <div className="bg-card rounded-xl border shadow-sm p-6">
                                <h3 className="font-semibold mb-4">Notatki</h3>
                                <MontageNotesTab montage={montage} />
                             </div>
                        </div>
                    </div>
                </div>
             </div>
        );
    }

    const isInstaller = userRoles?.includes('installer') && !userRoles?.includes('admin');

    return (
        <div className="flex min-h-screen flex-col bg-muted/10">
            <MontageDetailsLayout 
                header={<MontageHeader montage={montage} statusOptions={statusOptions} userRoles={userRoles} />}
                clientCard={<MontageClientCard montage={montage} userRoles={userRoles} installers={installers} measurers={measurers} architects={architects} referralEnabled={referralEnabled} />}
                materialCard={
                    <div className="space-y-6">
                        <MontageMaterialCard montage={montage} userRoles={userRoles} />

                        {/* Measurement Notes */}
                        {montage.additionalInfo && (
                            <div className="rounded-xl border bg-card text-card-foreground shadow-sm">
                                <div className="p-6 pt-6">
                                    <h3 className="font-semibold leading-none tracking-tight mb-4">Uwagi z Pomiaru</h3>
                                    <div className="text-sm text-muted-foreground whitespace-pre-wrap">
                                        {montage.additionalInfo}
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Client Requirements (Lead) */}
                        <MontageClientInfo montageId={montage.id} initialContent={montage.materialDetails} />
                    </div>
                }
                defaultTab={activeTab}
                tabs={{
                    notes: <MontageNotesTab montage={montage} />,
                    history: !isInstaller ? <MontageHistoryTab montage={montage} logs={logs} /> : undefined,
                    workflow: <MontageWorkflowTab montage={montage} statusOptions={statusOptions} installers={installers} measurers={measurers} />,
                    measurement: <MontageMeasurementTab montage={montage} userRoles={userRoles} />,
                    technical: <MontageTechnicalTab montage={montage} userRoles={userRoles} />,
                    quotes: !isInstaller ? <MontageQuotes montageId={montage.id} quotes={montage.quotes} /> : undefined,
                    tasks: <MontageTasksTab montage={montage} />,
                    gallery: <MontageGalleryTab montage={montage} userRoles={userRoles} />,
                }}
            />
        </div>
    );
}
