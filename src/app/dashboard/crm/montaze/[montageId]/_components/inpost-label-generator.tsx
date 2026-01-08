'use client';

import { useState } from 'react';
import { Package, Loader2, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { generateInPostLabel } from '../actions';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog';

interface InPostLabelGeneratorProps {
    montageId: string;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    sampleDelivery: any; // JSON
    sampleStatus: string | null;
}

export function InPostLabelGenerator({ montageId, sampleDelivery, sampleStatus }: InPostLabelGeneratorProps) {
    const [isLoading, setIsLoading] = useState(false);
    const [isOpen, setIsOpen] = useState(false);

    const hasDelivery = !!sampleDelivery;
    const isSent = sampleStatus === 'sent';
    const trackingNumber = sampleDelivery?.trackingNumber;
    const labelUrl = sampleDelivery?.labelUrl;

    const handleGenerate = async () => {
        setIsLoading(true);
        try {
            await generateInPostLabel(montageId, sampleDelivery);
            toast.success('Etykieta została wygenerowana i zapisana w notatkach.');
            setIsOpen(false);
        } catch (error) {
            console.error(error);
            toast.error(error instanceof Error ? error.message : 'Błąd generowania etykiety');
        } finally {
            setIsLoading(false);
        }
    };

    if (!hasDelivery) {
        return (
            <div className="text-xs text-muted-foreground italic">
                Brak wybranych danych dostawy (paczkomat/kurier).
            </div>
        );
    }

    if (isSent && trackingNumber) {
        return (
            <div className="flex flex-col gap-2">
                <div className="flex items-center gap-2 text-sm text-emerald-600 font-medium bg-emerald-50 p-2 rounded border border-emerald-100">
                    <Package className="h-4 w-4" />
                    <span>Wysłano: {trackingNumber}</span>
                </div>
                {labelUrl && (
                    <Button variant="outline" size="sm" asChild className="w-full">
                        <a href={labelUrl} target="_blank" rel="noopener noreferrer">
                            <FileText className="mr-2 h-3 w-3" />
                            Pobierz etykietę
                        </a>
                    </Button>
                )}
            </div>
        );
    }

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
                <Button variant="outline" size="sm" className="w-full border-orange-200 text-orange-700 bg-orange-50 hover:bg-orange-100 hover:text-orange-800">
                    <Package className="mr-2 h-3 w-3" />
                    Generuj Etykietę InPost
                </Button>
            </DialogTrigger>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Generowanie etykiety InPost</DialogTitle>
                    <DialogDescription>
                        Czy na pewno chcesz wygenerować etykietę przesyłki dla tego klienta?
                        <br /><br />
                        <strong>Dane dostawy:</strong><br />
                        {sampleDelivery.pointName ? (
                            <>Paczkomat: {sampleDelivery.pointName} <span className="text-xs text-muted-foreground">({sampleDelivery.boxMachineName})</span></>
                        ) : (
                            <>Kurier: {sampleDelivery.street} {sampleDelivery.buildingNumber}, {sampleDelivery.city}</>
                        )}
                    </DialogDescription>
                </DialogHeader>
                <DialogFooter>
                    <Button variant="outline" onClick={() => setIsOpen(false)}>Anuluj</Button>
                    <Button onClick={handleGenerate} disabled={isLoading} className="bg-orange-600 hover:bg-orange-700 text-white">
                        {isLoading ? (
                            <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Generowanie...
                            </>
                        ) : (
                            'Generuj Etykietę'
                        )}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
