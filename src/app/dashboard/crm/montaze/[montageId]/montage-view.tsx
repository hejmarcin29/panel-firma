'use client';

import { useSearchParams, useRouter } from 'next/navigation';
import { getMontageDetails } from './actions';
import { deleteMontage } from '../actions';
import { Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from '@/components/ui/alert-dialog';

import { MontageHeader } from './_components/montage-header';
import { MontageClientCard } from './_components/montage-client-card';
import { MontageMaterialCard } from './_components/montage-material-card';
import { MontageWorkflowTab } from './_components/montage-workflow-tab';
import { MontageTasksTab } from './_components/montage-tasks-tab';
import { MontageGalleryTab } from './_components/montage-gallery-tab';
import { MontageNotesTab } from './_components/montage-notes-tab';
import { MontageHistoryTab } from './_components/montage-history-tab';
import { MontageMeasurementTab } from '../_components/montage-measurement-tab';
import { MontageSettlementTab } from '../_components/montage-settlement-tab';
import { MontageQuotes } from './_components/montage-quotes';
import { MontageClientInfo } from './_components/montage-client-info';

import { MontageDetailsLayout } from './_components/montage-details-layout';
import { ConvertLeadDialog } from './_components/convert-lead-dialog';
import { InstallerMontageView } from './_components/installer-montage-view';

interface MontageViewProps {
    montageId: string;
    initialData: NonNullable<Awaited<ReturnType<typeof getMontageDetails>>>;
    portalEnabled: boolean;
}

export function MontageView({ montageId, initialData, portalEnabled }: MontageViewProps) {
    const searchParams = useSearchParams();
    const router = useRouter();
    const tab = searchParams.get('tab');
    const activeTab = tab || 'workflow';

    const handleDelete = async () => {
        try {
            await deleteMontage(montageId);
            toast.success('Lead został usunięty');
            router.push('/dashboard/crm/montaze');
        } catch {
            toast.error('Wystąpił błąd podczas usuwania leada');
        }
    };

    const data = initialData;

    if (!data) return null;

    const { montage, logs, installers, measurers, architects, statusOptions, userRoles, hasGoogleCalendar } = data;

    const isInstaller = userRoles.includes('installer') && !userRoles.includes('admin');

    if (isInstaller) {
        return <InstallerMontageView montage={montage} logs={logs} userRoles={userRoles} hasGoogleCalendar={hasGoogleCalendar} />;
    }

    if (montage.status === 'lead') {
        return (
             <div className="flex min-h-screen flex-col bg-muted/10">
                <div className="p-4 md:p-6 space-y-6 max-w-5xl mx-auto w-full">
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                        <div>
                            <h1 className="text-2xl font-bold">{montage.clientName}</h1>
                            <p className="text-muted-foreground">Nowy Lead - Weryfikacja</p>
                        </div>
                        <div className="flex items-center gap-2">
                            <AlertDialog>
                                <AlertDialogTrigger asChild>
                                    <Button variant="destructive" size="sm">
                                        <Trash2 className="mr-2 h-4 w-4" />
                                        Usuń
                                    </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                    <AlertDialogHeader>
                                        <AlertDialogTitle>Czy na pewno chcesz usunąć ten lead?</AlertDialogTitle>
                                        <AlertDialogDescription>
                                            Lead zostanie przeniesiony do kosza.
                                        </AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <AlertDialogFooter>
                                        <AlertDialogCancel>Anuluj</AlertDialogCancel>
                                        <AlertDialogAction onClick={handleDelete} className="bg-red-600 hover:bg-red-700">
                                            Usuń
                                        </AlertDialogAction>
                                    </AlertDialogFooter>
                                </AlertDialogContent>
                            </AlertDialog>
                            <ConvertLeadDialog montage={montage} />
                        </div>
                    </div>

                    <div className="grid gap-6 md:grid-cols-2">
                        <div className="space-y-6">
                            <MontageClientCard montage={montage} userRoles={userRoles} installers={installers} measurers={measurers} architects={architects} portalEnabled={portalEnabled} />
                            <MontageMaterialCard montage={montage} userRoles={userRoles} />
                        </div>
                        <div className="space-y-6">
                             <MontageClientInfo montageId={montage.id} initialContent={montage.clientInfo} />
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

    return (
        <div className="flex min-h-screen flex-col bg-muted/10">
            <MontageDetailsLayout 
                header={<MontageHeader montage={montage} statusOptions={statusOptions} userRoles={userRoles} />}
                clientCard={<MontageClientCard montage={montage} userRoles={userRoles} installers={installers} measurers={measurers} architects={architects} portalEnabled={portalEnabled} />}
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
                        <MontageClientInfo montageId={montage.id} initialContent={montage.clientInfo} />
                    </div>
                }
                defaultTab={activeTab}
                tabs={{
                    notes: <MontageNotesTab montage={montage} />,
                    history: !isInstaller ? <MontageHistoryTab montage={montage} logs={logs} /> : undefined,
                    workflow: <MontageWorkflowTab montage={montage} statusOptions={statusOptions} installers={installers} measurers={measurers} userRoles={userRoles} />,
                    measurement: <MontageMeasurementTab montage={montage} userRoles={userRoles} />,
                    quotes: !isInstaller ? <MontageQuotes montageId={montage.id} quotes={montage.quotes} /> : undefined,
                    settlement: <MontageSettlementTab montage={montage} userRoles={userRoles} />,
                    tasks: <MontageTasksTab montage={montage} />,
                    gallery: <MontageGalleryTab montage={montage} userRoles={userRoles} />,
                }}
            />
        </div>
    );
}
