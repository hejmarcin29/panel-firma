'use client';

import { useSearchParams, useRouter } from 'next/navigation';
import { getMontageDetails } from './actions';
import { deleteMontage } from '../actions';
import { Trash2, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { getMontageThreats } from '../utils';
import type { AlertSettings } from '../types';
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
import { MontageLeadQuickEdit } from './_components/montage-lead-quick-edit';
import { MontageSamplesCard } from './_components/montage-samples-card';

import { MontageDetailsLayout } from './_components/montage-details-layout';
import { ConvertLeadDialog } from './_components/convert-lead-dialog';
import { RequestDataButton } from './_components/request-data-button';
import { InstallerMontageView } from './_components/installer-montage-view';
import { MontageProcessHub } from './_components/montage-process-hub';
import { MontagePaymentsTab } from './_components/montage-payments-tab';

interface MontageViewProps {
    montageId: string;
    initialData: NonNullable<Awaited<ReturnType<typeof getMontageDetails>>>;
    portalEnabled: boolean;
    requireInstallerForMeasurement: boolean;
    threatDays: number;
    alertSettings: AlertSettings;
}

export function MontageView({ montageId, initialData, portalEnabled, requireInstallerForMeasurement, threatDays, alertSettings }: MontageViewProps) {
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

    const threats = getMontageThreats(montage, threatDays, alertSettings);

    if (isInstaller) {
        return <InstallerMontageView montage={montage} logs={logs} userRoles={userRoles} hasGoogleCalendar={hasGoogleCalendar} />;
    }

    const LEAD_PHASE_STATUSES = ['new_lead', 'lead_contact', 'lead_samples_pending', 'lead_samples_sent', 'lead_pre_estimate'];

    if (LEAD_PHASE_STATUSES.includes(montage.status)) {
        return (
             <div className="flex min-h-screen flex-col bg-muted/10">
                <div className="p-4 md:p-6 space-y-6 max-w-5xl mx-auto w-full">
                    {threats.length > 0 && (
                        <Alert variant="destructive">
                            <AlertTriangle className="h-4 w-4" />
                            <AlertTitle>Wykryto problemy ({threats.length})</AlertTitle>
                            <AlertDescription>
                                <ul className="list-disc list-inside">
                                    {threats.map((threat, index) => (
                                        <li key={index}>{threat}</li>
                                    ))}
                                </ul>
                            </AlertDescription>
                        </Alert>
                    )}
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                        <div>
                            <h1 className="text-2xl font-bold">{montage.clientName}</h1>
                            <p className="text-muted-foreground">Panel Handlowy (Lead)</p>
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
                            <RequestDataButton 
                                montage={montage} 
                                requireInstallerForMeasurement={requireInstallerForMeasurement}
                            />
                            <ConvertLeadDialog 
                                montage={montage} 
                                requireInstallerForMeasurement={requireInstallerForMeasurement}
                                measurers={measurers}
                            />
                        </div>
                    </div>

                    <div className="grid gap-6 md:grid-cols-2">
                        <div className="space-y-6">
                            <MontageClientCard montage={montage} userRoles={userRoles} installers={installers} measurers={measurers} architects={architects} portalEnabled={portalEnabled} />
                            <MontageMaterialCard montage={montage} userRoles={userRoles} />
                        </div>
                        <div className="space-y-6">
                             <MontageLeadQuickEdit montageId={montage.id} initialClientInfo={montage.clientInfo} initialEstimatedArea={montage.estimatedFloorArea} />
                             <MontageSamplesCard montage={montage} userRoles={userRoles} />
                             <div className="bg-card rounded-xl border shadow-sm p-6">
                                <h3 className="font-semibold mb-4">Notatki</h3>
                                <MontageNotesTab montage={montage} userRoles={userRoles} />
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
                header={
                    <div className="space-y-4 pb-4 px-4 md:px-6 pt-4 md:pt-6">
                        {threats.length > 0 && (
                            <Alert variant="destructive">
                                <AlertTriangle className="h-4 w-4" />
                                <AlertTitle>Wykryto problemy ({threats.length})</AlertTitle>
                                <AlertDescription>
                                    <ul className="list-disc list-inside">
                                        {threats.map((threat, index) => (
                                            <li key={index}>{threat}</li>
                                        ))}
                                    </ul>
                                </AlertDescription>
                            </Alert>
                        )}
                        <MontageHeader montage={montage} statusOptions={statusOptions} userRoles={userRoles} />
                        <MontageProcessHub montage={montage} stages={statusOptions} />
                    </div>
                }
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
                        <MontageLeadQuickEdit montageId={montage.id} initialClientInfo={montage.clientInfo} initialEstimatedArea={montage.estimatedFloorArea} />
                        
                        <MontageSamplesCard montage={montage} userRoles={userRoles} />
                    </div>
                }
                defaultTab={activeTab}
                tabs={{
                    notes: <MontageNotesTab montage={montage} userRoles={userRoles} />,
                    history: !isInstaller ? <MontageHistoryTab montage={montage} logs={logs} /> : undefined,
                    workflow: <MontageWorkflowTab montage={montage} statusOptions={statusOptions} installers={installers} measurers={measurers} userRoles={userRoles} />,
                    measurement: <MontageMeasurementTab montage={montage} userRoles={userRoles} />,
                    quotes: !isInstaller ? <MontageQuotes montageId={montage.id} quotes={montage.quotes} montage={montage} userRoles={userRoles} /> : undefined,
                    payments: !isInstaller ? <MontagePaymentsTab montageId={montage.id} payments={montage.payments} /> : undefined,
                    settlement: <MontageSettlementTab montage={montage} userRoles={userRoles} />,
                    tasks: <MontageTasksTab montage={montage} />,
                    gallery: <MontageGalleryTab montage={montage} userRoles={userRoles} />,
                }}
            />
        </div>
    );
}
