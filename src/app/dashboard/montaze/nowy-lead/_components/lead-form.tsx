'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from '@/components/ui/popover';
import { format } from 'date-fns';
import { pl } from 'date-fns/locale';
import { CalendarIcon, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { createExtendedLead } from '../../actions';

interface Product {
    id: number;
    name: string;
}

interface LeadFormProps {
    assignedProducts: Product[];
    userId?: string;
    isArchitect?: boolean;
}

export function LeadForm({ assignedProducts }: LeadFormProps) {
    const router = useRouter();
    const [isPending, startTransition] = useTransition();
    
    // Form State
    const [formData, setFormData] = useState({
        clientName: '',
        isCompany: false,
        companyName: '',
        nip: '',
        phone: '',
        email: '',
        billingStreet: '',
        billingPostalCode: '',
        billingCity: '',
        sameAsBilling: true,
        shippingStreet: '',
        shippingPostalCode: '',
        shippingCity: '',
        productId: '',
        floorArea: '',
        estimatedDate: undefined as Date | undefined,
        notes: '',
    });

    const [file, setFile] = useState<File | null>(null);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!formData.clientName.trim()) {
            toast.error('Podaj nazwę klienta');
            return;
        }

        const submitData = new FormData();
        submitData.append('clientName', formData.clientName);
        submitData.append('isCompany', formData.isCompany.toString());
        if (formData.isCompany) {
            submitData.append('companyName', formData.companyName);
            submitData.append('nip', formData.nip);
        }
        submitData.append('phone', formData.phone);
        submitData.append('email', formData.email);
        
        submitData.append('billingStreet', formData.billingStreet);
        submitData.append('billingPostalCode', formData.billingPostalCode);
        submitData.append('billingCity', formData.billingCity);
        
        if (formData.sameAsBilling) {
            submitData.append('shippingStreet', formData.billingStreet);
            submitData.append('shippingPostalCode', formData.billingPostalCode);
            submitData.append('shippingCity', formData.billingCity);
        } else {
            submitData.append('shippingStreet', formData.shippingStreet);
            submitData.append('shippingPostalCode', formData.shippingPostalCode);
            submitData.append('shippingCity', formData.shippingCity);
        }

        if (formData.productId) {
            submitData.append('productId', formData.productId);
        }
        if (formData.floorArea) {
            submitData.append('floorArea', formData.floorArea);
        }
        if (formData.estimatedDate) {
            submitData.append('estimatedDate', formData.estimatedDate.toISOString());
        }
        if (formData.notes) {
            submitData.append('notes', formData.notes);
        }
        if (file) {
            submitData.append('file', file);
        }

        startTransition(async () => {
            try {
                await createExtendedLead(submitData);
                toast.success('Zgłoszenie zostało wysłane');
                router.push('/dashboard/montaze');
            } catch (error) {
                console.error(error);
                toast.error('Wystąpił błąd podczas wysyłania zgłoszenia');
            }
        });
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-8">
            {/* Sekcja 1: Dane Klienta */}
            <div className="space-y-4">
                <h3 className="text-lg font-medium">Dane Klienta</h3>
                <div className="grid gap-4">
                    <div className="grid gap-2">
                        <Label htmlFor="clientName">Imię i Nazwisko (Osoba kontaktowa) *</Label>
                        <Input
                            id="clientName"
                            placeholder="np. Jan Kowalski"
                            value={formData.clientName}
                            onChange={(e) => setFormData({ ...formData, clientName: e.target.value })}
                            disabled={isPending}
                        />
                    </div>

                    <div className="flex items-center space-x-2">
                        <Checkbox 
                            id="isCompany" 
                            checked={formData.isCompany}
                            onCheckedChange={(checked) => setFormData({ ...formData, isCompany: checked as boolean })}
                            disabled={isPending}
                        />
                        <Label htmlFor="isCompany">Firma</Label>
                    </div>

                    {formData.isCompany && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="grid gap-2">
                                <Label htmlFor="companyName">Nazwa Firmy</Label>
                                <Input
                                    id="companyName"
                                    value={formData.companyName}
                                    onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
                                    disabled={isPending}
                                />
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="nip">NIP</Label>
                                <Input
                                    id="nip"
                                    value={formData.nip}
                                    onChange={(e) => setFormData({ ...formData, nip: e.target.value })}
                                    disabled={isPending}
                                />
                            </div>
                        </div>
                    )}

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="grid gap-2">
                            <Label htmlFor="phone">Telefon kontaktowy</Label>
                            <Input
                                id="phone"
                                placeholder="np. 600 123 123"
                                value={formData.phone}
                                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                disabled={isPending}
                            />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="email">E-mail</Label>
                            <Input
                                id="email"
                                type="email"
                                placeholder="np. biuro@example.pl"
                                value={formData.email}
                                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                disabled={isPending}
                            />
                        </div>
                    </div>
                </div>
            </div>

            {/* Sekcja 2: Adresy */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Adres do faktury */}
                <div className="space-y-4 p-4 border rounded-lg bg-card">
                    <h3 className="font-medium">Adres do faktury / Główny</h3>
                    <div className="grid gap-4">
                        <div className="grid gap-2">
                            <Label htmlFor="billingStreet">Ulica i numer</Label>
                            <Input
                                id="billingStreet"
                                placeholder="np. ul. Wiosenna 12"
                                value={formData.billingStreet}
                                onChange={(e) => setFormData({ ...formData, billingStreet: e.target.value })}
                                disabled={isPending}
                            />
                        </div>
                        <div className="grid grid-cols-3 gap-2">
                            <div className="grid gap-2 col-span-1">
                                <Label htmlFor="billingPostalCode">Kod</Label>
                                <Input
                                    id="billingPostalCode"
                                    placeholder="00-000"
                                    value={formData.billingPostalCode}
                                    onChange={(e) => setFormData({ ...formData, billingPostalCode: e.target.value })}
                                    disabled={isPending}
                                />
                            </div>
                            <div className="grid gap-2 col-span-2">
                                <Label htmlFor="billingCity">Miasto</Label>
                                <Input
                                    id="billingCity"
                                    placeholder="Warszawa"
                                    value={formData.billingCity}
                                    onChange={(e) => setFormData({ ...formData, billingCity: e.target.value })}
                                    disabled={isPending}
                                />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Adres montażu */}
                <div className="space-y-4 p-4 border rounded-lg bg-card">
                    <div className="flex items-center justify-between">
                        <h3 className="font-medium">Adres montażu</h3>
                        <div className="flex items-center space-x-2">
                            <Checkbox 
                                id="sameAsBilling" 
                                checked={formData.sameAsBilling}
                                onCheckedChange={(checked) => setFormData({ ...formData, sameAsBilling: checked as boolean })}
                                disabled={isPending}
                            />
                            <Label htmlFor="sameAsBilling">Taki sam</Label>
                        </div>
                    </div>
                    
                    {!formData.sameAsBilling && (
                        <div className="grid gap-4 animate-in fade-in slide-in-from-top-2">
                            <div className="grid gap-2">
                                <Label htmlFor="shippingStreet">Ulica i numer</Label>
                                <Input
                                    id="shippingStreet"
                                    placeholder="np. ul. Letnia 8/2"
                                    value={formData.shippingStreet}
                                    onChange={(e) => setFormData({ ...formData, shippingStreet: e.target.value })}
                                    disabled={isPending}
                                />
                            </div>
                            <div className="grid grid-cols-3 gap-2">
                                <div className="grid gap-2 col-span-1">
                                    <Label htmlFor="shippingPostalCode">Kod</Label>
                                    <Input
                                        id="shippingPostalCode"
                                        placeholder="00-000"
                                        value={formData.shippingPostalCode}
                                        onChange={(e) => setFormData({ ...formData, shippingPostalCode: e.target.value })}
                                        disabled={isPending}
                                    />
                                </div>
                                <div className="grid gap-2 col-span-2">
                                    <Label htmlFor="shippingCity">Miasto</Label>
                                    <Input
                                        id="shippingCity"
                                        placeholder="Warszawa"
                                        value={formData.shippingCity}
                                        onChange={(e) => setFormData({ ...formData, shippingCity: e.target.value })}
                                        disabled={isPending}
                                    />
                                </div>
                            </div>
                        </div>
                    )}
                    {formData.sameAsBilling && (
                        <div className="text-sm text-muted-foreground py-8 text-center italic">
                            Adres montażu jest taki sam jak adres na fakturze.
                        </div>
                    )}
                </div>
            </div>

            {/* Sekcja 3: Szczegóły Realizacji */}
            <div className="space-y-4">
                <h3 className="text-lg font-medium">Szczegóły Realizacji</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="grid gap-2">
                        <Label htmlFor="product">Wybierz podłogę / materiał</Label>
                        <Select 
                            value={formData.productId} 
                            onValueChange={(value) => setFormData({ ...formData, productId: value })}
                            disabled={isPending}
                        >
                            <SelectTrigger>
                                <SelectValue placeholder="Wybierz z listy..." />
                            </SelectTrigger>
                            <SelectContent>
                                {assignedProducts.map((product) => (
                                    <SelectItem key={product.id} value={product.id.toString()}>
                                        {product.name}
                                    </SelectItem>
                                ))}
                                {assignedProducts.length === 0 && (
                                    <SelectItem value="none" disabled>Brak przypisanych produktów</SelectItem>
                                )}
                            </SelectContent>
                        </Select>
                        <p className="text-xs text-muted-foreground">
                            Lista zawiera tylko produkty przypisane do Twojego konta.
                        </p>
                    </div>

                    <div className="grid gap-2">
                        <Label htmlFor="floorArea">Szacowany metraż (m²)</Label>
                        <Input
                            id="floorArea"
                            type="number"
                            placeholder="np. 50"
                            value={formData.floorArea}
                            onChange={(e) => setFormData({ ...formData, floorArea: e.target.value })}
                            disabled={isPending}
                        />
                    </div>

                    <div className="grid gap-2">
                        <Label>Szacowany termin montażu</Label>
                        <Popover>
                            <PopoverTrigger asChild>
                                <Button
                                    variant={"outline"}
                                    className={cn(
                                        "w-full justify-start text-left font-normal",
                                        !formData.estimatedDate && "text-muted-foreground"
                                    )}
                                    disabled={isPending}
                                >
                                    <CalendarIcon className="mr-2 h-4 w-4" />
                                    {formData.estimatedDate ? format(formData.estimatedDate, "PPP", { locale: pl }) : <span>Wybierz datę</span>}
                                </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0">
                                <Calendar
                                    mode="single"
                                    selected={formData.estimatedDate}
                                    onSelect={(date) => setFormData({ ...formData, estimatedDate: date })}
                                    initialFocus
                                />
                            </PopoverContent>
                        </Popover>
                        <p className="text-xs text-muted-foreground">
                            Wstępna data. Konkretny termin ustalisz po pomiarach.
                        </p>
                    </div>

                    <div className="grid gap-2">
                        <Label htmlFor="file">Załącznik (Rzut / Projekt)</Label>
                        <div className="flex items-center gap-2">
                            <Input
                                id="file"
                                type="file"
                                onChange={(e) => setFile(e.target.files?.[0] || null)}
                                disabled={isPending}
                                className="cursor-pointer"
                            />
                        </div>
                    </div>
                </div>

                <div className="grid gap-2">
                    <Label htmlFor="notes">Dodatkowe uwagi</Label>
                    <Textarea
                        id="notes"
                        placeholder="Np. Klient prosi o kontakt po 16:00, mieszkanie na 4 piętrze..."
                        value={formData.notes}
                        onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                        disabled={isPending}
                        className="min-h-25"
                    />
                </div>
            </div>

            <div className="flex justify-end pt-4">
                <Button type="submit" size="lg" disabled={isPending}>
                    {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Wyślij zgłoszenie
                </Button>
            </div>
        </form>
    );
}
