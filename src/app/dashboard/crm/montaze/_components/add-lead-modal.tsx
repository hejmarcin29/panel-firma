'use client';

import { useState, useTransition, useEffect } from 'react';
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
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";
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
import { createLead, getReferrers } from '../actions';
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
    const [duplicateCustomer, setDuplicateCustomer] = useState<{
        id: string;
        name: string;
        email: string | null;
        phone: string | null;
    } | null>(null);

    const isControlled = controlledOpen !== undefined;
    const open = isControlled ? controlledOpen : internalOpen;
    const setOpen = isControlled ? controlledOnOpenChange! : setInternalOpen;

    const [referrers, setReferrers] = useState<{
        architects: { id: string, name: string | null }[];
        partners: { id: string, name: string | null }[];
    }>({ architects: [], partners: [] });

    useEffect(() => {
        getReferrers().then((data) => {
            // Ensure compatibility with state
            setReferrers(data);
        }).catch(console.error);
    }, []);

    const [formData, setFormData] = useState({
        clientName: '',
        contactPhone: '',
        contactEmail: '',
        address: '',
        description: '',
        forecastedInstallationDate: '',
        sampleStatus: 'none' as MontageSampleStatus,
        source: 'showroom',
        architectId: '',
        partnerId: '',
    });

    const resetForm = () => {
        setFormData({
            clientName: '',
            contactPhone: '',
            contactEmail: '',
            address: '',
            description: '',
            forecastedInstallationDate: '',
            sampleStatus: 'none',
            source: 'showroom',
            architectId: '',
            partnerId: '',
        });
        setDuplicateCustomer(null);
    };

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
                const submissionData = {
                    ...formData,
                    source: formData.source as any,
                    architectId: formData.source === 'architect' && formData.architectId ? formData.architectId : undefined,
                    partnerId: formData.source === 'partner' && formData.partnerId ? formData.partnerId : undefined,
                };
                
                const result = await createLead(submissionData);
                
                if (result.success) {
                    toast.success(result.message);
                    setOpen(false);
                    resetForm();
                } else if (result.status === 'duplicate_found' && result.existingCustomer) {
                    setDuplicateCustomer(result.existingCustomer);
                } else {
                    toast.error(result.message);
                }
            } catch {
                toast.error('Wystąpił nieoczekiwany błąd komunikacji z serwerem.');
            }
        });
    };

    const handleConfirmLink = () => {
        if (!duplicateCustomer) return;

        startTransition(async () => {
            try {
                const submissionData = {
                    ...formData,
                    existingCustomerId: duplicateCustomer.id,
                    source: formData.source as any,
                    architectId: formData.source === 'architect' && formData.architectId ? formData.architectId : undefined,
                    partnerId: formData.source === 'partner' && formData.partnerId ? formData.partnerId : undefined,
                };

                const result = await createLead(submissionData);
                
                if (result.success) {
                    toast.success('Lead został przypisany do istniejącego klienta');
                    setOpen(false);
                    resetForm();
                } else {
                    toast.error(result.message);
                }
            } catch {
                toast.error('Wystąpił błąd podczas przypisywania leada.');
            }
        });
    };

    return (
        <>
            <Dialog open={open} onOpenChange={(val) => {
                setOpen(val);
                if (!val) setDuplicateCustomer(null);
            }}>
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
                            <Label htmlFor="source">Źródło</Label>
                            <Select
                                value={formData.source}
                                onValueChange={(value) => setFormData({ ...formData, source: value, architectId: '', partnerId: '' })}
                                disabled={isPending}
                            >
                                <SelectTrigger id="source">
                                    <SelectValue placeholder="Wybierz źródło" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="showroom">🏠 Salon (Showroom)</SelectItem>
                                    <SelectItem value="phone">📞 Telefon</SelectItem>
                                    <SelectItem value="website">🌐 Strona WWW</SelectItem>
                                    <SelectItem value="architect">📐 Architekt</SelectItem>
                                    <SelectItem value="partner">🤝 Partner B2B</SelectItem>
                                    <SelectItem value="other">❓ Inne</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        {formData.source === 'architect' && (
                            <div className="grid gap-2 pl-4 border-l-2 border-primary/20">
                                <Label htmlFor="architectId">Wybierz architekta</Label>
                                <Select
                                    value={formData.architectId}
                                    onValueChange={(value) => setFormData({ ...formData, architectId: value })}
                                    disabled={isPending}
                                >
                                    <SelectTrigger id="architectId">
                                        <SelectValue placeholder="Wybierz z listy..." />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {referrers.architects.map((arch) => (
                                            <SelectItem key={arch.id} value={arch.id}>{arch.name || 'Brak nazwy'}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        )}

                        {formData.source === 'partner' && (
                            <div className="grid gap-2 pl-4 border-l-2 border-primary/20">
                                <Label htmlFor="partnerId">Wybierz partnera</Label>
                                <Select
                                    value={formData.partnerId}
                                    onValueChange={(value) => setFormData({ ...formData, partnerId: value })}
                                    disabled={isPending}
                                >
                                    <SelectTrigger id="partnerId">
                                        <SelectValue placeholder="Wybierz z listy..." />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {referrers.partners.map((p) => (
                                            <SelectItem key={p.id} value={p.id}>{p.name || 'Brak nazwy'}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        )}

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

            <AlertDialog open={!!duplicateCustomer} onOpenChange={(val) => !val && setDuplicateCustomer(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Klient już istnieje</AlertDialogTitle>
                        <AlertDialogDescription>
                            W bazie istnieje już klient <strong>{duplicateCustomer?.name}</strong> powiązany z podanym adresem email lub numerem telefonu.
                            <br /><br />
                            Czy chcesz przypisać to nowe zapytanie do istniejącego klienta?
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel onClick={() => setDuplicateCustomer(null)}>Popraw dane</AlertDialogCancel>
                        <AlertDialogAction onClick={handleConfirmLink}>Tak, połącz z klientem</AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
    );
}
