'use client';

import { useState } from 'react';
import { Package, Loader2, FileText, Pencil } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { toast } from 'sonner';
import { generateInPostLabel, updateMontageSampleDelivery } from '../../actions';
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
    const [isGenerating, setIsGenerating] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [isGenerateOpen, setIsGenerateOpen] = useState(false);
    const [isEditOpen, setIsEditOpen] = useState(false);

    // Form State
    const [method, setMethod] = useState<'courier' | 'parcel_locker'>(sampleDelivery?.method || 'courier');
    const [recipient, setRecipient] = useState({
        name: sampleDelivery?.recipient?.name || '',
        email: sampleDelivery?.recipient?.email || '',
        phone: sampleDelivery?.recipient?.phone || '',
    });
    const [pointName, setPointName] = useState(sampleDelivery?.pointName || '');
    const [address, setAddress] = useState({
        street: sampleDelivery?.address?.street || '',
        buildingNumber: sampleDelivery?.address?.buildingNumber || '',
        city: sampleDelivery?.address?.city || '',
        postalCode: sampleDelivery?.address?.postalCode || '',
    });

    const hasDelivery = !!sampleDelivery && (
        (sampleDelivery.method === 'parcel_locker' && sampleDelivery.pointName) ||
        (sampleDelivery.method === 'courier' && sampleDelivery.address?.street)
    );
    const isSent = sampleStatus === 'sent';
    const trackingNumber = sampleDelivery?.trackingNumber;
    const labelUrl = sampleDelivery?.labelUrl;

    const handleGenerate = async () => {
        setIsGenerating(true);
        try {
            await generateInPostLabel(montageId, sampleDelivery);
            toast.success('Etykieta została wygenerowana i zapisana w notatkach.');
            setIsGenerateOpen(false);
        } catch (error) {
            console.error(error);
            toast.error(error instanceof Error ? error.message : 'Błąd generowania etykiety');
        } finally {
            setIsGenerating(false);
        }
    };

    const handleSaveDelivery = async () => {
        setIsSaving(true);
        try {
            const newDelivery = {
                ...sampleDelivery, // preserve tracking if exists
                method,
                recipient,
                pointName: method === 'parcel_locker' ? pointName : undefined,
                pointAddress: method === 'parcel_locker' ? 'Wprowadzony ręcznie' : undefined,
                address: method === 'courier' ? address : undefined,
            };

            await updateMontageSampleDelivery({
                montageId,
                delivery: newDelivery
            });
            toast.success('Dane dostawy zaktualizowane');
            setIsEditOpen(false);
        } catch (error) {
            console.error(error);
            toast.error('Błąd zapisu danych dostawy');
        } finally {
            setIsSaving(false);
        }
    };

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
        <div className="space-y-2">
            {!hasDelivery ? (
                <div className="flex flex-col gap-2">
                    <div className="text-xs text-muted-foreground italic">
                        Brak kompletnych danych dostawy.
                    </div>
                    <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={() => setIsEditOpen(true)}
                        className="w-full border-dashed"
                    >
                        <Pencil className="mr-2 h-3 w-3" />
                        Uzupełnij dane
                    </Button>
                </div>
            ) : (
                <div className="flex gap-2">
                     <Dialog open={isGenerateOpen} onOpenChange={setIsGenerateOpen}>
                        <DialogTrigger asChild>
                            <Button variant="outline" size="sm" className="flex-1 border-orange-200 text-orange-700 bg-orange-50 hover:bg-orange-100 hover:text-orange-800">
                                <Package className="mr-2 h-3 w-3" />
                                Generuj Etykietę
                            </Button>
                        </DialogTrigger>
                        <DialogContent>
                            <DialogHeader>
                                <DialogTitle>Generowanie etykiety InPost</DialogTitle>
                                <DialogDescription>
                                    Czy na pewno chcesz wygenerować etykietę przesyłki?
                                    <br /><br />
                                    <strong>Odbiorca:</strong> {sampleDelivery.recipient?.name}<br />
                                    <strong>Dostawa:</strong><br />
                                    {sampleDelivery.method === 'parcel_locker' ? (
                                        <>Paczkomat: {sampleDelivery.pointName}</>
                                    ) : (
                                        <>Kurier: {sampleDelivery.address?.street} {sampleDelivery.address?.buildingNumber}, {sampleDelivery.address?.city}</>
                                    )}
                                </DialogDescription>
                            </DialogHeader>
                            <DialogFooter>
                                <Button variant="outline" onClick={() => setIsGenerateOpen(false)}>Anuluj</Button>
                                <Button onClick={handleGenerate} disabled={isGenerating} className="bg-orange-600 hover:bg-orange-700 text-white">
                                    {isGenerating ? (
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

                    <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-9 w-9" 
                        onClick={() => setIsEditOpen(true)}
                        title="Edytuj dane dostawy"
                    >
                        <Pencil className="h-4 w-4" />
                    </Button>
                </div>
            )}

            {/* Edit / Fill Data Dialog */}
            <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
                <DialogContent className="sm:max-w-[425px]">
                    <DialogHeader>
                        <DialogTitle>Dane do wysyłki próbek</DialogTitle>
                        <DialogDescription>
                            Wprowadź dane niezbędne do wygenerowania etykiety InPost.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        <div className="space-y-2">
                            <Label>Metoda dostawy</Label>
                            <RadioGroup value={method} onValueChange={(v) => setMethod(v as 'courier' | 'parcel_locker')} className="flex gap-4">
                                <div className="flex items-center space-x-2 border rounded-md p-3 cursor-pointer hover:bg-muted/50 w-full">
                                    <RadioGroupItem value="parcel_locker" id="r1" />
                                    <Label htmlFor="r1" className="cursor-pointer">Paczkomat</Label>
                                </div>
                                <div className="flex items-center space-x-2 border rounded-md p-3 cursor-pointer hover:bg-muted/50 w-full">
                                    <RadioGroupItem value="courier" id="r2" />
                                    <Label htmlFor="r2" className="cursor-pointer">Kurier</Label>
                                </div>
                            </RadioGroup>
                        </div>

                        <div className="grid gap-2">
                            <Label>Dane odbiorcy</Label>
                            <Input 
                                placeholder="Imię i Nazwisko" 
                                value={recipient.name} 
                                onChange={e => setRecipient({...recipient, name: e.target.value})}
                            />
                            <div className="grid grid-cols-2 gap-2">
                                <Input 
                                    placeholder="Telefon (9 cyfr)" 
                                    value={recipient.phone} 
                                    onChange={e => setRecipient({...recipient, phone: e.target.value})}
                                />
                                <Input 
                                    placeholder="Email" 
                                    value={recipient.email} 
                                    onChange={e => setRecipient({...recipient, email: e.target.value})}
                                />
                            </div>
                        </div>

                        {method === 'parcel_locker' ? (
                            <div className="grid gap-2 animate-in fade-in zoom-in-95 duration-200">
                                <Label>Kod Paczkomatu (np. KRA01M)</Label>
                                <Input 
                                    placeholder="np. WAW20A" 
                                    value={pointName} 
                                    onChange={e => setPointName(e.target.value.toUpperCase())}
                                />
                                <p className="text-xs text-muted-foreground">Wpisz kod paczkomatu. Adres zostanie pobrany automatycznie przez InPost.</p>
                            </div>
                        ) : (
                            <div className="grid gap-2 animate-in fade-in zoom-in-95 duration-200">
                                <Label>Adres dostawy</Label>
                                <div className="grid grid-cols-3 gap-2">
                                    <Input 
                                        className="col-span-2"
                                        placeholder="Ulica" 
                                        value={address.street} 
                                        onChange={e => setAddress({...address, street: e.target.value})}
                                    />
                                    <Input 
                                        placeholder="Nr" 
                                        value={address.buildingNumber} 
                                        onChange={e => setAddress({...address, buildingNumber: e.target.value})}
                                    />
                                </div>
                                <div className="grid grid-cols-3 gap-2">
                                    <Input 
                                        placeholder="Kod" 
                                        value={address.postalCode} 
                                        onChange={e => setAddress({...address, postalCode: e.target.value})}
                                    />
                                    <Input 
                                        className="col-span-2"
                                        placeholder="Miasto" 
                                        value={address.city} 
                                        onChange={e => setAddress({...address, city: e.target.value})}
                                    />
                                </div>
                            </div>
                        )}
                    </div>
                    <DialogFooter>
                         <Button variant="outline" onClick={() => setIsEditOpen(false)}>Anuluj</Button>
                         <Button onClick={handleSaveDelivery} disabled={isSaving}>
                            {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Zapisz dane'}
                         </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
