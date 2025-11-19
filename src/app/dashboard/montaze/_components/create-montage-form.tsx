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
	billingAddress: string;
	billingCity: string;
	installationAddress: string;
	installationCity: string;
	scheduledInstallationDate: string;
	materialDetails: string;
};

const initialState: FormState = {
	clientName: '',
	contactPhone: '',
	contactEmail: '',
	billingAddress: '',
	billingCity: '',
	installationAddress: '',
	installationCity: '',
	scheduledInstallationDate: '',
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
				if (key === 'billingAddress') {
					next.installationAddress = value;
				}
				if (key === 'billingCity') {
					next.installationCity = value;
				}
			}
			return next;
		});
	};

	const toggleSameAsBilling = (checked: boolean) => {
		setSameAsBilling(checked);
		if (checked) {
			setForm((prev) => ({
				...prev,
				installationAddress: prev.billingAddress,
				installationCity: prev.billingCity,
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
					billingAddress: form.billingAddress,
					billingCity: form.billingCity,
					installationAddress: form.installationAddress,
					installationCity: form.installationCity,
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
				<Label htmlFor="montage-client">Klient</Label>
				<Input
					id="montage-client"
					value={form.clientName}
					onChange={handleInputChange('clientName')}
					placeholder="np. Jan Kowalski / Firma"
					required
				/>
			</div>
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
				<div className="space-y-3">
					<Label htmlFor="montage-billing-address">Adres do faktury</Label>
					<Textarea
						id="montage-billing-address"
						value={form.billingAddress}
						onChange={handleInputChange('billingAddress')}
						placeholder="np. ul. Wiosenna 12, 00-001 Warszawa"
						rows={3}
					/>
					<div className="space-y-1">
						<Label htmlFor="montage-billing-city">Miasto (faktura)</Label>
						<Input
							id="montage-billing-city"
							value={form.billingCity}
							onChange={handleInputChange('billingCity')}
							placeholder="np. Warszawa"
						/>
					</div>
				</div>
				<div className="space-y-3">
					<div className="flex items-center gap-2">
						<Checkbox
							id="montage-installation-same"
							checked={sameAsBilling}
							onCheckedChange={(checked) => toggleSameAsBilling(Boolean(checked))}
						/>
						<Label htmlFor="montage-installation-same" className="text-sm font-medium">
							Adres montażu taki sam jak do faktury
						</Label>
					</div>
					<Textarea
						id="montage-installation-address"
						value={form.installationAddress}
						onChange={handleInputChange('installationAddress')}
						placeholder="np. ul. Letnia 8/2, 00-001 Warszawa"
						rows={3}
						disabled={sameAsBilling}
					/>
					<div className="space-y-1">
						<Label htmlFor="montage-installation-city">Miasto montażu</Label>
						<Input
							id="montage-installation-city"
							value={form.installationCity}
							onChange={handleInputChange('installationCity')}
							placeholder="np. Warszawa"
							disabled={sameAsBilling}
						/>
					</div>
				</div>
			</div>
			<div className="grid gap-4 md:grid-cols-2">
				<div>
					<Label htmlFor="montage-schedule-date">Przewidywany termin montażu</Label>
					<Input
						id="montage-schedule-date"
						type="date"
						value={form.scheduledInstallationDate}
						onChange={handleInputChange('scheduledInstallationDate')}
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
