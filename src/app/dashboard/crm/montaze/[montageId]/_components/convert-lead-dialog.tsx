'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { CheckCircle2, Loader2, Send } from 'lucide-react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
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
    Popover,
    PopoverContent,
    PopoverTrigger,
} from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { format } from 'date-fns';
import { pl } from 'date-fns/locale';
import { CalendarIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip";

import { convertLeadToMontage, sendDataRequest } from '../../actions';
import type { Montage } from '../../types';

interface ConvertLeadDialogProps {
    montage: Montage;
    requireInstallerForMeasurement?: boolean;
}

export function ConvertLeadDialog({ montage, requireInstallerForMeasurement }: ConvertLeadDialogProps) {
    const [open, setOpen] = useState(false);
    const [isPending, startTransition] = useTransition();
    const router = useRouter();

    const [formData, setFormData] = useState({
        clientName: montage.clientName || '',
        isCompany: montage.isCompany || false,
        companyName: montage.companyName || '',
        nip: montage.nip || '',
        contactPhone: montage.contactPhone || '',
        contactEmail: montage.contactEmail || '',
        
        billingAddress: montage.billingAddress || '',
        billingCity: montage.billingCity || '',
        billingPostalCode: montage.billingPostalCode || '',
        
        installationAddress: montage.installationAddress || '',
        installationCity: montage.installationCity || '',
        installationPostalCode: montage.installationPostalCode || '',
        
        forecastedInstallationDate: montage.forecastedInstallationDate ? new Date(montage.forecastedInstallationDate) : undefined as Date | undefined,
        floorArea: montage.floorArea?.toString() || '',
        
        sameAsBilling: false,
    });

    const handleSameAsBillingChange = (checked: boolean) => {
        setFormData(prev => ({
            ...prev,
            sameAsBilling: checked,
            installationAddress: checked ? prev.billingAddress : prev.installationAddress,
            installationCity: checked ? prev.billingCity : prev.installationCity,
            installationPostalCode: checked ? prev.billingPostalCode : prev.installationPostalCode,
        }));
    };

    const handleRequestData = async () => {
        startTransition(async () => {
            try {
                await sendDataRequest(montage.id);
                toast.success('Wysłano prośbę o uzupełnienie danych');
                setOpen(false);
            } catch {
                toast.error('Wystąpił błąd podczas wysyłania prośby');
            }
        });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!formData.clientName || !formData.contactPhone || !formData.contactEmail) {
            toast.error('Uzupełnij dane kontaktowe klienta');
            return;
        }

        if (!formData.billingAddress || !formData.billingCity || !formData.billingPostalCode) {
            toast.error('Uzupełnij adres rozliczeniowy');
            return;
        }

        if (!formData.sameAsBilling && (!formData.installationAddress || !formData.installationCity || !formData.installationPostalCode)) {
            toast.error('Uzupełnij adres montażu');
            return;
        }

        startTransition(async () => {
            try {
                await convertLeadToMontage({
                    montageId: montage.id,
                    clientName: formData.clientName,
                    isCompany: formData.isCompany,
                    companyName: formData.companyName,
                    nip: formData.nip,
                    contactPhone: formData.contactPhone,
                    contactEmail: formData.contactEmail,
                    billingAddress: formData.billingAddress,
                    billingCity: formData.billingCity,
                    billingPostalCode: formData.billingPostalCode,
                    installationAddress: formData.sameAsBilling ? formData.billingAddress : formData.installationAddress,
                    installationCity: formData.sameAsBilling ? formData.billingCity : formData.installationCity,
                    installationPostalCode: formData.sameAsBilling ? formData.billingPostalCode : formData.installationPostalCode,
                    forecastedInstallationDate: formData.forecastedInstallationDate?.toISOString(),
                    floorArea: formData.floorArea,
                });
                toast.success('Lead zaakceptowany! Przeniesiono do pomiarów.');
                setOpen(false);
                router.refresh();
            } catch (error) {
                console.error(error);
                toast.error('Wystąpił błąd podczas akceptacji leada');
            }
        });
    };

    const isSampleBlocking = montage.sampleStatus === 'to_send' || montage.sampleStatus === 'sent';
    const isInstallerBlocking = requireInstallerForMeasurement && !montage.installerId;

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

    if (isInstallerBlocking) {
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
                        <p>Wymagane przypisanie montażysty przed zleceniem pomiaru.</p>
                    </TooltipContent>
                </Tooltip>
            </TooltipProvider>
        );
    }

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
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>Uzupełnij dane przed zleceniem pomiaru</DialogTitle>
                    <DialogDescription>
                        Aby przejść do etapu pomiaru, wymagane jest uzupełnienie pełnych danych klienta i adresu.
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-4 py-4">
                    <div className="grid gap-4 md:grid-cols-2">
                        <div className="space-y-2">
                            <Label htmlFor="clientName">Imię i Nazwisko / Nazwa *</Label>
                            <Input
                                id="clientName"
                                value={formData.clientName}
                                onChange={(e) => setFormData({ ...formData, clientName: e.target.value })}
                                required
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="contactPhone">Telefon *</Label>
                            <Input
                                id="contactPhone"
                                value={formData.contactPhone}
                                onChange={(e) => setFormData({ ...formData, contactPhone: e.target.value })}
                                required
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="contactEmail">Email *</Label>
                            <Input
                                id="contactEmail"
                                type="email"
                                value={formData.contactEmail}
                                onChange={(e) => setFormData({ ...formData, contactEmail: e.target.value })}
                                required
                            />
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        <Checkbox 
                            id="isCompany" 
                            checked={formData.isCompany}
                            onCheckedChange={(checked) => setFormData({ ...formData, isCompany: checked as boolean })}
                        />
                        <Label htmlFor="isCompany">Firma</Label>
                    </div>

                    {formData.isCompany && (
                        <div className="grid gap-4 md:grid-cols-2">
                            <div className="space-y-2">
                                <Label htmlFor="companyName">Nazwa firmy</Label>
                                <Input
                                    id="companyName"
                                    value={formData.companyName}
                                    onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="nip">NIP</Label>
                                <Input
                                    id="nip"
                                    value={formData.nip}
                                    onChange={(e) => setFormData({ ...formData, nip: e.target.value })}
                                />
                            </div>
                        </div>
                    )}

                    <div className="space-y-4 border rounded-lg p-4">
                        <h4 className="font-medium">Adres rozliczeniowy</h4>
                        <div className="grid gap-4 md:grid-cols-2">
                            <div className="space-y-2 md:col-span-2">
                                <Label htmlFor="billingAddress">Ulica i numer *</Label>
                                <Input
                                    id="billingAddress"
                                    value={formData.billingAddress}
                                    onChange={(e) => setFormData({ ...formData, billingAddress: e.target.value })}
                                    required
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="billingPostalCode">Kod pocztowy *</Label>
                                <Input
                                    id="billingPostalCode"
                                    value={formData.billingPostalCode}
                                    onChange={(e) => setFormData({ ...formData, billingPostalCode: e.target.value })}
                                    required
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="billingCity">Miasto *</Label>
                                <Input
                                    id="billingCity"
                                    value={formData.billingCity}
                                    onChange={(e) => setFormData({ ...formData, billingCity: e.target.value })}
                                    required
                                />
                            </div>
                        </div>
                    </div>

                    <div className="space-y-4 border rounded-lg p-4">
                        <div className="flex items-center justify-between">
                            <h4 className="font-medium">Adres montażu</h4>
                            <div className="flex items-center gap-2">
                                <Checkbox 
                                    id="sameAsBilling" 
                                    checked={formData.sameAsBilling}
                                    onCheckedChange={(checked) => handleSameAsBillingChange(checked as boolean)}
                                />
                                <Label htmlFor="sameAsBilling" className="text-sm font-normal">Taki sam jak rozliczeniowy</Label>
                            </div>
                        </div>
                        
                        {!formData.sameAsBilling && (
                            <div className="grid gap-4 md:grid-cols-2">
                                <div className="space-y-2 md:col-span-2">
                                    <Label htmlFor="installationAddress">Ulica i numer *</Label>
                                    <Input
                                        id="installationAddress"
                                        value={formData.installationAddress}
                                        onChange={(e) => setFormData({ ...formData, installationAddress: e.target.value })}
                                        required
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="installationPostalCode">Kod pocztowy *</Label>
                                    <Input
                                        id="installationPostalCode"
                                        value={formData.installationPostalCode}
                                        onChange={(e) => setFormData({ ...formData, installationPostalCode: e.target.value })}
                                        required
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="installationCity">Miasto *</Label>
                                    <Input
                                        id="installationCity"
                                        value={formData.installationCity}
                                        onChange={(e) => setFormData({ ...formData, installationCity: e.target.value })}
                                        required
                                    />
                                </div>
                            </div>
                        )}
                    </div>

                    <div className="grid gap-4 md:grid-cols-2">
                        <div className="space-y-2">
                            <Label htmlFor="floorArea">Szacowany metraż (m²)</Label>
                            <Input
                                id="floorArea"
                                type="number"
                                value={formData.floorArea}
                                onChange={(e) => setFormData({ ...formData, floorArea: e.target.value })}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>Szacowany termin montażu</Label>
                            <Popover>
                                <PopoverTrigger asChild>
                                    <Button
                                        variant={"outline"}
                                        className={cn(
                                            "w-full justify-start text-left font-normal",
                                            !formData.forecastedInstallationDate && "text-muted-foreground"
                                        )}
                                    >
                                        <CalendarIcon className="mr-2 h-4 w-4" />
                                        {formData.forecastedInstallationDate ? format(formData.forecastedInstallationDate, "PPP", { locale: pl }) : <span>Wybierz datę</span>}
                                    </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-auto p-0">
                                    <Calendar
                                        mode="single"
                                        selected={formData.forecastedInstallationDate}
                                        onSelect={(date) => setFormData({ ...formData, forecastedInstallationDate: date })}
                                        initialFocus
                                    />
                                </PopoverContent>
                            </Popover>
                        </div>
                    </div>

                    <DialogFooter className="gap-2 sm:gap-0">
                        <Button type="button" variant="outline" onClick={() => setOpen(false)} disabled={isPending}>
                            Anuluj
                        </Button>
                        <Button 
                            type="button" 
                            variant="outline" 
                            onClick={handleRequestData} 
                            disabled={isPending}
                            className="border-blue-200 bg-blue-50 text-blue-700 hover:bg-blue-100 hover:text-blue-800"
                        >
                            <Send className="mr-2 h-4 w-4" />
                            Poproś o dane
                        </Button>
                        <Button type="submit" disabled={isPending} className="bg-green-600 hover:bg-green-700 text-white">
                            {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Zatwierdź i zleć pomiar
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
