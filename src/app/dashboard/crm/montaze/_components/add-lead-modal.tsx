'use client';

import { useState, useTransition } from 'react';
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
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { createLead } from '../actions';
import { Plus } from 'lucide-react';
import { toast } from 'sonner';
import { type MontageSampleStatus } from '@/lib/db/schema';

export function AddLeadModal({ 
    open: controlledOpen, 
    onOpenChange: controlledOnOpenChange 
}: { 
    open?: boolean; 
    onOpenChange?: (open: boolean) => void; 
} = {}) {
    const [internalOpen, setInternalOpen] = useState(false);
    const [isPending, startTransition] = useTransition();

    const isControlled = controlledOpen !== undefined;
    const open = isControlled ? controlledOpen : internalOpen;
    const setOpen = isControlled ? controlledOnOpenChange! : setInternalOpen;

    const [formData, setFormData] = useState({
        clientName: '',
        contactPhone: '',
        contactEmail: '',
        address: '',
        description: '',
        forecastedInstallationDate: '',
        sampleStatus: 'none' as MontageSampleStatus,
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        
        if (!formData.clientName.trim()) {
            toast.error('Podaj nazwę klienta');
            return;
        }

        if (!formData.contactPhone.trim()) {
            toast.error('Podaj numer telefonu');
            return;
        }

        if (!formData.contactEmail.trim()) {
            toast.error('Podaj adres email');
            return;
        }

        startTransition(async () => {
            try {
                const result = await createLead(formData);
                if (result.success) {
                    toast.success('Lead został dodany');
                    setOpen(false);
                    setFormData({
                        clientName: '',
                        contactPhone: '',
                        contactEmail: '',
                        address: '',
                        description: '',
                        forecastedInstallationDate: '',
                        sampleStatus: 'none',
                    });
                } else {
                    toast.error(result.error || 'Wystąpił błąd');
                }
            } catch (error) {
                toast.error(error instanceof Error ? error.message : 'Wystąpił błąd');
            }
        });
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            {!isControlled && (
                <DialogTrigger asChild>
                    <Button variant="outline">
                        <Plus className="mr-2 h-4 w-4" />
                        Dodaj Lead
                    </Button>
                </DialogTrigger>
            )}
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Dodaj nowy lead</DialogTitle>
                    <DialogDescription>
                        Szybkie dodawanie potencjalnego klienta. Możesz później uzupełnić szczegóły.
                    </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="grid gap-4 py-4">
                    <div className="grid gap-2">
                        <Label htmlFor="clientName">Nazwa klienta *</Label>
                        <Input
                            id="clientName"
                            value={formData.clientName}
                            onChange={(e) => setFormData({ ...formData, clientName: e.target.value })}
                            placeholder="Jan Kowalski"
                            disabled={isPending}
                        />
                    </div>
                    <div className="grid gap-2">
                        <Label htmlFor="contactPhone">Telefon *</Label>
                        <Input
                            id="contactPhone"
                            value={formData.contactPhone}
                            onChange={(e) => setFormData({ ...formData, contactPhone: e.target.value })}
                            placeholder="123 456 789"
                            disabled={isPending}
                        />
                    </div>
                    <div className="grid gap-2">
                        <Label htmlFor="contactEmail">Email *</Label>
                        <Input
                            id="contactEmail"
                            type="email"
                            value={formData.contactEmail}
                            onChange={(e) => setFormData({ ...formData, contactEmail: e.target.value })}
                            placeholder="jan@example.com"
                            disabled={isPending}
                        />
                    </div>
                    <div className="grid gap-2">
                        <Label htmlFor="address">Miasto / Lokalizacja</Label>
                        <Input
                            id="address"
                            value={formData.address}
                            onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                            placeholder="Warszawa"
                            disabled={isPending}
                        />
                    </div>
                    <div className="grid gap-2">
                        <Label htmlFor="forecastedInstallationDate">Szacowany termin montażu</Label>
                        <Input
                            id="forecastedInstallationDate"
                            type="date"
                            value={formData.forecastedInstallationDate}
                            onChange={(e) => setFormData({ ...formData, forecastedInstallationDate: e.target.value })}
                            disabled={isPending}
                        />
                    </div>
                    <div className="grid gap-2">
                        <Label htmlFor="sampleStatus">Status próbki</Label>
                        <Select
                            value={formData.sampleStatus}
                            onValueChange={(value) => setFormData({ ...formData, sampleStatus: value as MontageSampleStatus })}
                            disabled={isPending}
                        >
                            <SelectTrigger id="sampleStatus">
                                <SelectValue placeholder="Wybierz status" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="none">⛔ Nie dotyczy</SelectItem>
                                <SelectItem value="to_send">📦 Do wysłania</SelectItem>
                                <SelectItem value="sent">🚚 Wysłana</SelectItem>
                                <SelectItem value="delivered">✅ Odebrana / Zaakceptowana</SelectItem>
                                <SelectItem value="returned">↩️ Zwrócona</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="grid gap-2">
                        <Label htmlFor="description">Info od klienta</Label>
                        <Textarea
                            id="description"
                            value={formData.description}
                            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                            placeholder="Czego dotyczy zapytanie..."
                            disabled={isPending}
                        />
                    </div>
                    <DialogFooter>
                        <Button type="submit" disabled={isPending}>
                            {isPending ? 'Zapisywanie...' : 'Zapisz Lead'}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
