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
import { createLead } from '../actions';
import { Plus } from 'lucide-react';
import { toast } from 'sonner';

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
        address: '',
        description: '',
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        
        if (!formData.clientName.trim()) {
            toast.error('Podaj nazwę klienta');
            return;
        }

        startTransition(async () => {
            try {
                await createLead(formData);
                toast.success('Lead został dodany');
                setOpen(false);
                setFormData({
                    clientName: '',
                    contactPhone: '',
                    address: '',
                    description: '',
                });
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
                        <Label htmlFor="contactPhone">Telefon</Label>
                        <Input
                            id="contactPhone"
                            value={formData.contactPhone}
                            onChange={(e) => setFormData({ ...formData, contactPhone: e.target.value })}
                            placeholder="123 456 789"
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
                        <Label htmlFor="description">Opis / Notatki</Label>
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
