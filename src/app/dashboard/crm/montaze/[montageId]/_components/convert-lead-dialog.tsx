'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { CheckCircle2, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Label } from '@/components/ui/label';
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip";

import { assignMeasurerAndAdvance } from '../../actions';
import type { Montage } from '../../types';
import { users } from '@/lib/db/schema';

type Measurer = Pick<typeof users.$inferSelect, 'id' | 'name' | 'email' | 'roles'>;

interface ConvertLeadDialogProps {
    montage: Montage;
    requireInstallerForMeasurement?: boolean;
    measurers?: Measurer[];
}

export function ConvertLeadDialog({ montage, measurers = [] }: ConvertLeadDialogProps) {
    const [open, setOpen] = useState(false);
    const [isPending, startTransition] = useTransition();
    const [selectedMeasurerId, setSelectedMeasurerId] = useState<string>('');
    const router = useRouter();

    const handleAssignAndAdvance = async (measurerId: string) => {
        startTransition(async () => {
            try {
                const result = await assignMeasurerAndAdvance(montage.id, measurerId);
                if (result.success) {
                    toast.success('Zlecono pomiar! Status zmieniony na "Do umówienia".');
                    setOpen(false);
                    router.refresh();
                } else {
                    toast.error('Wystąpił błąd.');
                }
            } catch (error) {
                console.error(error);
                toast.error('Wystąpił błąd podczas zlecania pomiaru');
            }
        });
    };

    const isSampleBlocking = montage.sampleStatus === 'to_send' || montage.sampleStatus === 'sent';

    if (isSampleBlocking) {
        return (
            <TooltipProvider>
                <Tooltip>
                    <TooltipTrigger asChild>
                        <span tabIndex={0} className="inline-block w-full sm:w-auto">
                            <Button 
                                className="w-full sm:w-auto bg-gray-400 text-white cursor-not-allowed"
                                size="lg"
                                disabled
                            >
                                <CheckCircle2 className="mr-2 h-5 w-5" />
                                Akceptuj i zleć pomiar
                            </Button>
                        </span>
                    </TooltipTrigger>
                    <TooltipContent>
                        <p>Musisz zweryfikować próbki (status &quot;Dostarczono&quot; lub &quot;Brak&quot;) aby przejść dalej.</p>
                    </TooltipContent>
                </Tooltip>
            </TooltipProvider>
        );
    }

    // Scenario A: Measurer already assigned
    if (montage.measurerId) {
        return (
            <Button 
                className="w-full sm:w-auto bg-green-600 hover:bg-green-700 text-white"
                size="lg"
                disabled={isPending}
                onClick={() => handleAssignAndAdvance(montage.measurerId!)}
            >
                {isPending ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : <CheckCircle2 className="mr-2 h-5 w-5" />}
                Akceptuj i zleć pomiar
            </Button>
        );
    }

    // Scenario B: Measurer NOT assigned -> Show Dialog
    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button 
                    className="w-full sm:w-auto bg-green-600 hover:bg-green-700 text-white"
                    size="lg"
                >
                    <CheckCircle2 className="mr-2 h-5 w-5" />
                    Akceptuj i zleć pomiar
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Zleć pomiar</DialogTitle>
                    <DialogDescription>
                        Wybierz osobę, która ma skontaktować się z klientem i wykonać pomiar.
                    </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                    <div className="grid gap-2">
                        <Label htmlFor="measurer">Pomiarowiec / Montażysta</Label>
                        <Select
                            value={selectedMeasurerId}
                            onValueChange={setSelectedMeasurerId}
                        >
                            <SelectTrigger id="measurer">
                                <SelectValue placeholder="Wybierz z listy..." />
                            </SelectTrigger>
                            <SelectContent>
                                {measurers.map((m) => (
                                    <SelectItem key={m.id} value={m.id}>
                                        {m.name}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                </div>
                <DialogFooter>
                    <Button 
                        onClick={() => handleAssignAndAdvance(selectedMeasurerId)} 
                        disabled={isPending || !selectedMeasurerId}
                        className="bg-green-600 hover:bg-green-700 text-white"
                    >
                        {isPending ? 'Zapisywanie...' : 'Zleć pomiar'}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
