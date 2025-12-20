'use client';

import { useState, useTransition, type ChangeEvent, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';

import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import { createMontage, type CustomerConflictData } from '../actions';

type FormState = {
	clientName: string;
	contactPhone: string;
	contactEmail: string;
	
    // Company fields
    isCompany: boolean;
    companyName: string;
    nip: string;

    // Billing Address
	billingAddress: string; // Street
	billingCity: string;
    billingPostalCode: string;

    // Installation Address
	installationAddress: string; // Street
	installationCity: string;
    installationPostalCode: string;

	forecastedInstallationDate: string;
	materialDetails: string;
    installerId: string;
    measurerId: string;
};

const initialState: FormState = {
	clientName: '',
	contactPhone: '',
	contactEmail: '',
    isCompany: false,
    companyName: '',
    nip: '',
	billingAddress: '',
	billingCity: '',
    billingPostalCode: '',
	installationAddress: '',
	installationCity: '',
    installationPostalCode: '',
	forecastedInstallationDate: '',
	materialDetails: '',
    installerId: '',
    measurerId: '',
};

type UserOption = { id: string; name: string | null; email: string };

type LeadOption = {
    id: string;
    clientName: string;
    displayId: string | null;
    createdAt: Date;
    contactPhone: string | null;
    address: string | null;
    materialDetails: string | null;
};

type CreateMontageFormProps = {
	onSuccess?: () => void;
    installers?: UserOption[];
    measurers?: UserOption[];
    leads?: LeadOption[];
};

export function CreateMontageForm({ onSuccess, installers = [], leads = [] }: CreateMontageFormProps) {
	const router = useRouter();
	const [form, setForm] = useState<FormState>(initialState);
	const [feedback, setFeedback] = useState<string | null>(null);
	const [error, setError] = useState<string | null>(null);
	const [isPending, startTransition] = useTransition();
	const [sameAsBilling, setSameAsBilling] = useState(true);
    const [conflictData, setConflictData] = useState<{ existing: CustomerConflictData, new: CustomerConflictData } | null>(null);
    const [selectedLeadId, setSelectedLeadId] = useState<string>('none');

    const handleLeadChange = (leadId: string) => {
        setSelectedLeadId(leadId);
        if (leadId === 'none') {
            setForm(initialState);
            return;
        }
        
        const lead = leads.find(l => l.id === leadId);
        if (lead) {
            setForm({
                ...initialState, // Reset first
                clientName: lead.clientName,
                contactPhone: lead.contactPhone || '',
                billingAddress: lead.address || '',
                installationAddress: lead.address || '',
                materialDetails: lead.materialDetails || '',
            });
            setSameAsBilling(true);
        }
    };

	const handleInputChange = (key: keyof FormState) => (
		event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
	) => {
		const value = event.target.value;
		setForm((prev) => {
			const next = { ...prev, [key]: value };
			if (sameAsBilling) {
				if (key === 'billingAddress') next.installationAddress = value;
				if (key === 'billingCity') next.installationCity = value;
                if (key === 'billingPostalCode') next.installationPostalCode = value;
			}
			return next;
		});
	};

    const handleCheckboxChange = (key: keyof FormState) => (checked: boolean) => {
        setForm(prev => ({ ...prev, [key]: checked }));
    };

	const toggleSameAsBilling = (checked: boolean) => {
		setSameAsBilling(checked);
		if (checked) {
			setForm((prev) => ({
				...prev,
				installationAddress: prev.billingAddress,
				installationCity: prev.billingCity,
                installationPostalCode: prev.billingPostalCode,
			}));
		}
	};

    const submitForm = (strategy?: 'update' | 'keep') => {
		setError(null);
		setFeedback(null);
        setConflictData(null);

        if (!form.clientName.trim()) {
             setError('Podaj nazwę klienta.');
             return;
        }
        if (!form.contactPhone.trim()) {
             setError('Podaj numer telefonu.');
             return;
        }
        if (!form.contactEmail.trim()) {
             setError('Podaj adres e-mail.');
             return;
        }
        if (!form.billingAddress.trim() || !form.billingCity.trim() || !form.billingPostalCode.trim()) {
             setError('Uzupełnij adres rozliczeniowy.');
             return;
        }
        if (!sameAsBilling) {
            if (!form.installationAddress.trim() || !form.installationCity.trim() || !form.installationPostalCode.trim()) {
                setError('Uzupełnij adres montażu.');
                return;
            }
        }

		startTransition(async () => {
			try {
				const result = await createMontage({
					clientName: form.clientName,
					contactPhone: form.contactPhone,
					contactEmail: form.contactEmail,
                    isCompany: form.isCompany,
                    companyName: form.companyName,
                    nip: form.nip,
					billingAddress: form.billingAddress,
					billingCity: form.billingCity,
                    billingPostalCode: form.billingPostalCode,
					installationAddress: form.installationAddress,
					installationCity: form.installationCity,
                    installationPostalCode: form.installationPostalCode,
					forecastedInstallationDate: form.forecastedInstallationDate || undefined,
					materialDetails: form.materialDetails,
                    customerUpdateStrategy: strategy,
                    installerId: form.installerId === 'none' || !form.installerId ? undefined : form.installerId,
                    measurerId: form.measurerId === 'none' || !form.measurerId ? undefined : form.measurerId,
                    leadId: selectedLeadId === 'none' ? undefined : selectedLeadId,
				});

                if (result.status === 'conflict') {
                    setConflictData({
                        existing: result.existingCustomer,
                        new: result.newCustomerData
                    });
                    return;
                }

				setForm(initialState);
				setSameAsBilling(true);
				setFeedback('Dodano nowy montaż.');
				onSuccess?.();
				router.push('/dashboard/crm/montaze');
				router.refresh();
			} catch (submissionError) {
				const message =
					submissionError instanceof Error
						? submissionError.message
						: 'Nie udało się utworzyć montaży.';
				setError(message);
			}
		});
    };

	const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
		event.preventDefault();
        submitForm();
	};

	return (
        <>
            <AlertDialog open={!!conflictData} onOpenChange={(open) => !open && setConflictData(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Klient już istnieje</AlertDialogTitle>
                        <AlertDialogDescription>
                            <div className="space-y-4">
                                <p>W bazie istnieje już klient o podanym adresie e-mail lub numerze telefonu, ale jego dane różnią się od wprowadzonych.</p>
                                
                                <div className="grid grid-cols-2 gap-4 text-sm">
                                    <div className="border rounded-md p-3 bg-muted/50">
                                        <p className="font-semibold mb-2 text-muted-foreground">Dane w bazie:</p>
                                        <div className="space-y-1">
                                            <p className="font-medium">{conflictData?.existing.name}</p>
                                            <p>{conflictData?.existing.billingStreet}</p>
                                            <p>{conflictData?.existing.billingPostalCode} {conflictData?.existing.billingCity}</p>
                                            {conflictData?.existing.taxId && <p className="text-xs text-muted-foreground">NIP: {conflictData?.existing.taxId}</p>}
                                        </div>
                                    </div>
                                    <div className="border rounded-md p-3 bg-blue-50/50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-800">
                                        <p className="font-semibold mb-2 text-blue-600 dark:text-blue-400">Nowe dane:</p>
                                        <div className="space-y-1">
                                            <p className="font-medium">{conflictData?.new.name}</p>
                                            <p>{conflictData?.new.billingStreet}</p>
                                            <p>{conflictData?.new.billingPostalCode} {conflictData?.new.billingCity}</p>
                                            {conflictData?.new.taxId && <p className="text-xs text-muted-foreground">NIP: {conflictData?.new.taxId}</p>}
                                        </div>
                                    </div>
                                </div>
                                
                                <p className="text-sm text-muted-foreground">
                                    Czy chcesz zaktualizować dane klienta w bazie, czy zachować istniejące (używając nowych tylko dla tego montażu)?
                                </p>
                            </div>
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel onClick={() => submitForm('keep')}>Zachowaj stare</AlertDialogCancel>
                        <AlertDialogAction onClick={() => submitForm('update')}>Zastąp nowymi</AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

		<form onSubmit={handleSubmit} className="space-y-4 rounded-xl border bg-background p-4 shadow-sm">
            {leads.length > 0 && (
                <div className="mb-6 p-4 border rounded-lg bg-muted/50">
                    <Label htmlFor="lead-select" className="mb-2 block">Wybierz z Leadów (opcjonalnie)</Label>
                    <Select value={selectedLeadId} onValueChange={handleLeadChange}>
                        <SelectTrigger id="lead-select">
                            <SelectValue placeholder="Wybierz lead..." />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="none">-- Nowy montaż (czysty formularz) --</SelectItem>
                            {leads.map(lead => (
                                <SelectItem key={lead.id} value={lead.id}>
                                    {lead.displayId} - {lead.clientName} ({new Date(lead.createdAt).toLocaleDateString()})
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
            )}
			<div>
				<Label htmlFor="montage-client">Klient (Osoba kontaktowa) *</Label>
				<Input
					id="montage-client"
					value={form.clientName}
					onChange={handleInputChange('clientName')}
					placeholder="np. Jan Kowalski"
					required
				/>
			</div>

            <div className="flex items-center gap-2">
                <Checkbox 
                    id="is-company" 
                    checked={form.isCompany}
                    onCheckedChange={handleCheckboxChange('isCompany')}
                />
                <Label htmlFor="is-company">Firma</Label>
            </div>

            {form.isCompany && (
                <div className="grid gap-4 md:grid-cols-2">
                    <div>
                        <Label htmlFor="company-name">Nazwa firmy</Label>
                        <Input
                            id="company-name"
                            value={form.companyName}
                            onChange={handleInputChange('companyName')}
                            placeholder="np. Firma Budowlana Sp. z o.o."
                        />
                    </div>
                    <div>
                        <Label htmlFor="nip">NIP</Label>
                        <Input
                            id="nip"
                            value={form.nip}
                            onChange={handleInputChange('nip')}
                            placeholder="np. 1234567890"
                        />
                    </div>
                </div>
            )}

			<div className="grid gap-4 md:grid-cols-2">
				<div>
					<Label htmlFor="montage-phone">Telefon kontaktowy *</Label>
					<Input
						id="montage-phone"
						value={form.contactPhone}
						onChange={handleInputChange('contactPhone')}
						placeholder="np. 600123123"
                        required
					/>
				</div>
				<div>
					<Label htmlFor="montage-email">E-mail *</Label>
					<Input
						id="montage-email"
						type="email"
						value={form.contactEmail}
						onChange={handleInputChange('contactEmail')}
						placeholder="np. biuro@example.pl"
                        required
					/>
				</div>
			</div>

            <div className="grid gap-4 md:grid-cols-2">
                {/* Billing Address */}
                <div className="space-y-3 border p-3 rounded-md">
                    <h4 className="font-medium text-sm">Adres do faktury / Główny</h4>
                    
                    <div>
                        <Label htmlFor="billing-street">Ulica i numer *</Label>
                        <Input
                            id="billing-street"
                            value={form.billingAddress}
                            onChange={handleInputChange('billingAddress')}
                            placeholder="np. ul. Wiosenna 12"
                            required
                        />
                    </div>
                    <div className="grid grid-cols-3 gap-2">
                        <div className="col-span-1">
                            <Label htmlFor="billing-zip">Kod *</Label>
                            <Input
                                id="billing-zip"
                                value={form.billingPostalCode}
                                onChange={handleInputChange('billingPostalCode')}
                                placeholder="00-000"
                                required
                            />
                        </div>
                        <div className="col-span-2">
                            <Label htmlFor="billing-city">Miasto *</Label>
                            <Input
                                id="billing-city"
                                value={form.billingCity}
                                onChange={handleInputChange('billingCity')}
                                placeholder="Warszawa"
                                required
                            />
                        </div>
                    </div>
                </div>

                {/* Installation Address */}
                <div className="space-y-3 border p-3 rounded-md">
                    <div className="flex items-center justify-between">
                        <h4 className="font-medium text-sm">Adres montażu</h4>
                        <div className="flex items-center gap-2">
                            <Checkbox
                                id="montage-installation-same"
                                checked={sameAsBilling}
                                onCheckedChange={(checked) => toggleSameAsBilling(Boolean(checked))}
                            />
                            <Label htmlFor="montage-installation-same" className="text-xs">
                                Taki sam
                            </Label>
                        </div>
                    </div>

                    <div>
                        <Label htmlFor="installation-street">Ulica i numer *</Label>
                        <Input
                            id="installation-street"
                            value={form.installationAddress}
                            onChange={handleInputChange('installationAddress')}
                            placeholder="np. ul. Letnia 8/2"
                            disabled={sameAsBilling}
                            required={!sameAsBilling}
                        />
                    </div>
                    <div className="grid grid-cols-3 gap-2">
                        <div className="col-span-1">
                            <Label htmlFor="installation-zip">Kod *</Label>
                            <Input
                                id="installation-zip"
                                value={form.installationPostalCode}
                                onChange={handleInputChange('installationPostalCode')}
                                placeholder="00-000"
                                disabled={sameAsBilling}
                                required={!sameAsBilling}
                            />
                        </div>
                        <div className="col-span-2">
                            <Label htmlFor="installation-city">Miasto *</Label>
                            <Input
                                id="installation-city"
                                value={form.installationCity}
                                onChange={handleInputChange('installationCity')}
                                placeholder="Warszawa"
                                disabled={sameAsBilling}
                                required={!sameAsBilling}
                            />
                        </div>
                    </div>
                </div>
            </div>

			<div className="grid gap-4 md:grid-cols-2">
				<div>
					<Label htmlFor="montage-forecast-date">Szacowany termin montażu</Label>
					<Input
						id="montage-forecast-date"
						type="date"
						value={form.forecastedInstallationDate}
						onChange={handleInputChange('forecastedInstallationDate')}
					/>
					<p className="text-xs text-muted-foreground mt-1">
						Wstępna data. Konkretny termin ustalisz po pomiarach.
					</p>
				</div>
                <div className="grid grid-cols-1 gap-4">
                    <div>
                        <Label>Przypisz Montażystę (Opiekuna)</Label>
                        <Select 
                            value={form.installerId} 
                            onValueChange={(val) => setForm(prev => ({ ...prev, installerId: val, measurerId: val }))}
                        >
                            <SelectTrigger>
                                <SelectValue placeholder="Wybierz z listy" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="none">Brak (do ustalenia później)</SelectItem>
                                {installers.map(u => (
                                    <SelectItem key={u.id} value={u.id}>{u.name || u.email}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        <p className="text-xs text-muted-foreground mt-1">
                            Ta osoba wykona pomiar oraz montaż.
                        </p>
                    </div>
                </div>
			</div>
			<div>
				<Label htmlFor="montage-material">Materiały i ilości</Label>
				<Textarea
					id="montage-material"
					value={form.materialDetails}
					onChange={handleInputChange('materialDetails')}
					placeholder="np. Rolety dzień-noc — 4 szt., Markiza tarasowa — 1 szt."
					rows={3}
				/>
			</div>
			<div className="flex items-center gap-3">
				<Button type="submit" disabled={isPending}>
					{isPending ? 'Zapisywanie...' : 'Dodaj montaż'}
				</Button>
				{feedback ? <span className="text-xs text-emerald-600">{feedback}</span> : null}
				{error ? <span className="text-xs text-destructive">{error}</span> : null}
			</div>
		</form>
        </>
	);
}
