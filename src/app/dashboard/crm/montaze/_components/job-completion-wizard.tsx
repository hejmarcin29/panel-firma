'use client';

import { useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { CheckCircle2, FileSignature, Camera, Loader2, ArrowRight } from 'lucide-react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import {
    Drawer,
    DrawerClose,
    DrawerContent,
    DrawerDescription,
    DrawerFooter,
    DrawerHeader,
    DrawerTitle,
} from '@/components/ui/drawer';
import { cn } from '@/lib/utils';
import { finishMontage } from '../actions';

// Define a minimal type for the montage data we need
interface WizardMontage {
    id: string;
    clientName: string;
    clientSignatureUrl?: string | null;
    checklistItems?: { isChecked: boolean }[];
    notes?: { attachments?: { id: string }[] }[];
}

interface JobCompletionWizardProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    montage: WizardMontage;
}

export function JobCompletionWizard({ open, onOpenChange, montage }: JobCompletionWizardProps) {
    const router = useRouter();
    const [isPending, startTransition] = useTransition();

    // 1. Check Protocol
    const hasProtocol = !!montage.clientSignatureUrl;

    // 2. Check Photos (count attachments in notes)
    const photosCount = montage.notes?.reduce((acc, note) => acc + (note.attachments?.length || 0), 0) || 0;
    const hasPhotos = photosCount > 0;

    // 3. Check Checklist
    const totalTasks = montage.checklistItems?.length || 0;
    const completedTasks = montage.checklistItems?.filter(i => i.isChecked).length || 0;
    const isChecklistDone = totalTasks === 0 || totalTasks === completedTasks;

    const canFinish = hasProtocol; // Protocol is mandatory. Photos/Checklist might be optional but warned.

    const handleFinish = () => {
        if (!canFinish) return;

        startTransition(async () => {
            try {
                const result = await finishMontage(montage.id);
                if (result.success) {
                    toast.success('Zlecenie zostało zakończone pomyślnie!');
                    onOpenChange(false);
                } else {
                    toast.error('Wystąpił błąd podczas zamykania zlecenia.');
                }
            } catch (error) {
                console.error(error);
                toast.error('Wystąpił błąd połączenia.');
            }
        });
    };

    const navigateToDetails = (tab: string) => {
        onOpenChange(false);
        router.push(`/dashboard/crm/montaze/${montage.id}?tab=${tab}`);
    };

    return (
        <Drawer open={open} onOpenChange={onOpenChange}>
            <DrawerContent>
                <div className="mx-auto w-full max-w-sm">
                    <DrawerHeader>
                        <DrawerTitle className="text-xl text-center">Podsumowanie Realizacji</DrawerTitle>
                        <DrawerDescription className="text-center">
                            Sprawdź czy wszystko gotowe przed zamknięciem zlecenia u klienta <strong>{montage.clientName}</strong>.
                        </DrawerDescription>
                    </DrawerHeader>
                    
                    <div className="p-4 space-y-4">
                        {/* 1. Protocol Check */}
                        <div className={cn(
                            "flex items-center justify-between p-3 rounded-lg border",
                            hasProtocol ? "bg-green-50 border-green-200" : "bg-red-50 border-red-200"
                        )}>
                            <div className="flex items-center gap-3">
                                <div className={cn("p-2 rounded-full", hasProtocol ? "bg-green-100 text-green-600" : "bg-red-100 text-red-600")}>
                                    <FileSignature className="w-5 h-5" />
                                </div>
                                <div>
                                    <h4 className={cn("font-medium", hasProtocol ? "text-green-900" : "text-red-900")}>
                                        Protokół Odbioru
                                    </h4>
                                    <p className={cn("text-xs", hasProtocol ? "text-green-700" : "text-red-700")}>
                                        {hasProtocol ? "Podpisany przez klienta" : "Brak podpisu klienta"}
                                    </p>
                                </div>
                            </div>
                            {!hasProtocol && (
                                <Button size="sm" variant="outline" className="bg-white border-red-200 text-red-700 hover:bg-red-50" onClick={() => navigateToDetails('settlement')}>
                                    Podpisz
                                </Button>
                            )}
                            {hasProtocol && <CheckCircle2 className="w-5 h-5 text-green-600" />}
                        </div>

                        {/* 2. Photos Check */}
                        <div className={cn(
                            "flex items-center justify-between p-3 rounded-lg border",
                            hasPhotos ? "bg-green-50 border-green-200" : "bg-orange-50 border-orange-200"
                        )}>
                            <div className="flex items-center gap-3">
                                <div className={cn("p-2 rounded-full", hasPhotos ? "bg-green-100 text-green-600" : "bg-orange-100 text-orange-600")}>
                                    <Camera className="w-5 h-5" />
                                </div>
                                <div>
                                    <h4 className={cn("font-medium", hasPhotos ? "text-green-900" : "text-orange-900")}>
                                        Zdjęcia z realizacji
                                    </h4>
                                    <p className={cn("text-xs", hasPhotos ? "text-green-700" : "text-orange-700")}>
                                        {hasPhotos ? `Dodano ${photosCount} zdjęć` : "Brak zdjęć w systemie"}
                                    </p>
                                </div>
                            </div>
                            {!hasPhotos && (
                                <Button size="sm" variant="outline" className="bg-white border-orange-200 text-orange-700 hover:bg-orange-50" onClick={() => navigateToDetails('notes')}>
                                    Dodaj
                                </Button>
                            )}
                            {hasPhotos && <CheckCircle2 className="w-5 h-5 text-green-600" />}
                        </div>

                        {/* 3. Checklist Check */}
                        <div className={cn(
                            "flex items-center justify-between p-3 rounded-lg border",
                            isChecklistDone ? "bg-green-50 border-green-200" : "bg-blue-50 border-blue-200"
                        )}>
                            <div className="flex items-center gap-3">
                                <div className={cn("p-2 rounded-full", isChecklistDone ? "bg-green-100 text-green-600" : "bg-blue-100 text-blue-600")}>
                                    <CheckCircle2 className="w-5 h-5" />
                                </div>
                                <div>
                                    <h4 className={cn("font-medium", isChecklistDone ? "text-green-900" : "text-blue-900")}>
                                        Lista Zadań
                                    </h4>
                                    <p className={cn("text-xs", isChecklistDone ? "text-green-700" : "text-blue-700")}>
                                        {totalTasks > 0 ? `Wykonano ${completedTasks}/${totalTasks}` : "Brak zadań na liście"}
                                    </p>
                                </div>
                            </div>
                            {!isChecklistDone && (
                                <Button size="sm" variant="outline" className="bg-white border-blue-200 text-blue-700 hover:bg-blue-50" onClick={() => navigateToDetails('tasks')}>
                                    Sprawdź
                                </Button>
                            )}
                            {isChecklistDone && <CheckCircle2 className="w-5 h-5 text-green-600" />}
                        </div>
                    </div>

                    <DrawerFooter>
                        <Button 
                            className={cn("w-full h-12 text-lg", canFinish ? "bg-green-600 hover:bg-green-700" : "opacity-50 cursor-not-allowed")} 
                            onClick={handleFinish}
                            disabled={!canFinish || isPending}
                        >
                            {isPending ? (
                                <>
                                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                                    Zamykanie...
                                </>
                            ) : (
                                <>
                                    Zatwierdź i Zakończ
                                    <ArrowRight className="ml-2 h-5 w-5" />
                                </>
                            )}
                        </Button>
                        <DrawerClose asChild>
                            <Button variant="outline">Wróć</Button>
                        </DrawerClose>
                    </DrawerFooter>
                </div>
            </DrawerContent>
        </Drawer>
    );
}
