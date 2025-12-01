'use client';

import { useState, useTransition, type ChangeEvent, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';

import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';

import { createMontage } from '../actions';

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

	scheduledInstallationDate: string;
	scheduledInstallationEndDate: string;
	materialDetails: string;
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
	scheduledInstallationDate: '',
	scheduledInstallationEndDate: '',
	materialDetails: '',
};

type CreateMontageFormProps = {
	onSuccess?: () => void;
};

export function CreateMontageForm({ onSuccess }: CreateMontageFormProps) {
	const router = useRouter();
	const [form, setForm] = useState<FormState>(initialState);
	const [feedback, setFeedback] = useState<string | null>(null);
	const [error, setError] = useState<string | null>(null);
	const [isPending, startTransition] = useTransition();
	const [sameAsBilling, setSameAsBilling] = useState(true);

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

	const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
		event.preventDefault();
		setError(null);
		setFeedback(null);

		startTransition(async () => {
			try {
				await createMontage({
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
					scheduledInstallationDate: form.scheduledInstallationDate || undefined,
					materialDetails: form.materialDetails,
				});
				setForm(initialState);
				setSameAsBilling(true);
				setFeedback('Dodano nowy montaż.');
				onSuccess?.();
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

	return (
		<form onSubmit={handleSubmit} className="space-y-4 rounded-xl border bg-background p-4 shadow-sm">
			<div>
				<Label htmlFor="montage-client">Klient (Osoba kontaktowa)</Label>
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
					<Label htmlFor="montage-phone">Telefon kontaktowy</Label>
					<Input
						id="montage-phone"
						value={form.contactPhone}
						onChange={handleInputChange('contactPhone')}
						placeholder="np. 600123123"
					/>
				</div>
				<div>
					<Label htmlFor="montage-email">E-mail</Label>
					<Input
						id="montage-email"
						type="email"
						value={form.contactEmail}
						onChange={handleInputChange('contactEmail')}
						placeholder="np. biuro@example.pl"
					/>
				</div>
			</div>

            <div className="grid gap-4 md:grid-cols-2">
                {/* Billing Address */}
                <div className="space-y-3 border p-3 rounded-md">
                    <h4 className="font-medium text-sm">Adres do faktury / Główny</h4>
                    
                    <div>
                        <Label htmlFor="billing-street">Ulica i numer</Label>
                        <Input
                            id="billing-street"
                            value={form.billingAddress}
                            onChange={handleInputChange('billingAddress')}
                            placeholder="np. ul. Wiosenna 12"
                        />
                    </div>
                    <div className="grid grid-cols-3 gap-2">
                        <div className="col-span-1">
                            <Label htmlFor="billing-zip">Kod</Label>
                            <Input
                                id="billing-zip"
                                value={form.billingPostalCode}
                                onChange={handleInputChange('billingPostalCode')}
                                placeholder="00-000"
                            />
                        </div>
                        <div className="col-span-2">
                            <Label htmlFor="billing-city">Miasto</Label>
                            <Input
                                id="billing-city"
                                value={form.billingCity}
                                onChange={handleInputChange('billingCity')}
                                placeholder="Warszawa"
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
                        <Label htmlFor="installation-street">Ulica i numer</Label>
                        <Input
                            id="installation-street"
                            value={form.installationAddress}
                            onChange={handleInputChange('installationAddress')}
                            placeholder="np. ul. Letnia 8/2"
                            disabled={sameAsBilling}
                        />
                    </div>
                    <div className="grid grid-cols-3 gap-2">
                        <div className="col-span-1">
                            <Label htmlFor="installation-zip">Kod</Label>
                            <Input
                                id="installation-zip"
                                value={form.installationPostalCode}
                                onChange={handleInputChange('installationPostalCode')}
                                placeholder="00-000"
                                disabled={sameAsBilling}
                            />
                        </div>
                        <div className="col-span-2">
                            <Label htmlFor="installation-city">Miasto</Label>
                            <Input
                                id="installation-city"
                                value={form.installationCity}
                                onChange={handleInputChange('installationCity')}
                                placeholder="Warszawa"
                                disabled={sameAsBilling}
                            />
                        </div>
                    </div>
                </div>
            </div>

			<div className="grid gap-4 md:grid-cols-2">
				<div>
					<Label htmlFor="montage-schedule-date">Przewidywany termin montażu (od)</Label>
					<Input
						id="montage-schedule-date"
						type="date"
						value={form.scheduledInstallationDate}
						onChange={handleInputChange('scheduledInstallationDate')}
					/>
				</div>
				<div>
					<Label htmlFor="montage-schedule-end-date">Przewidywany termin montażu (do)</Label>
					<Input
						id="montage-schedule-end-date"
						type="date"
						value={form.scheduledInstallationEndDate}
						onChange={handleInputChange('scheduledInstallationEndDate')}
					/>
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
	);
}
