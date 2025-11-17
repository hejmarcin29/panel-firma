'use client';

import { useState, useTransition, FormEvent } from 'react';
import { useRouter } from 'next/navigation';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';

import { createMontage } from '../actions';

type FormState = {
	clientName: string;
	contactPhone: string;
	contactEmail: string;
	address: string;
};

const initialState: FormState = {
	clientName: '',
	contactPhone: '',
	contactEmail: '',
	address: '',
};

export function CreateMontageForm() {
	const router = useRouter();
	const [form, setForm] = useState<FormState>(initialState);
	const [feedback, setFeedback] = useState<string | null>(null);
	const [error, setError] = useState<string | null>(null);
	const [isPending, startTransition] = useTransition();

	const handleChange = (key: keyof FormState) => (event: FormEvent<HTMLInputElement | HTMLTextAreaElement>) => {
		setForm((prev) => ({ ...prev, [key]: event.currentTarget.value }));
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
					address: form.address,
				});
				setForm(initialState);
				setFeedback('Dodano nowy montaż.');
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
				<label htmlFor="montage-client" className="block text-sm font-medium text-foreground">
					Klient
				</label>
				<Input
					id="montage-client"
					value={form.clientName}
					onChange={handleChange('clientName')}
					placeholder="np. Jan Kowalski / Firma"
					required
				/>
			</div>
			<div className="grid gap-4 md:grid-cols-2">
				<div>
					<label htmlFor="montage-phone" className="block text-sm font-medium text-foreground">
						Telefon kontaktowy
					</label>
					<Input
						id="montage-phone"
						value={form.contactPhone}
						onChange={handleChange('contactPhone')}
						placeholder="np. 600123123"
					/>
				</div>
				<div>
					<label htmlFor="montage-email" className="block text-sm font-medium text-foreground">
						E-mail
					</label>
					<Input
						id="montage-email"
						type="email"
						value={form.contactEmail}
						onChange={handleChange('contactEmail')}
						placeholder="np. biuro@example.pl"
					/>
				</div>
			</div>
			<div>
				<label htmlFor="montage-address" className="block text-sm font-medium text-foreground">
					Adres / opis lokalizacji
				</label>
				<Textarea
					id="montage-address"
					value={form.address}
					onChange={handleChange('address')}
					placeholder="Dodatkowe informacje o montażu"
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
