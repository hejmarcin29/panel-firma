'use client';

import { FormEvent, useMemo, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';

import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';

import { updateManualOrderStatus } from '../actions';
import { statusOptions } from '../utils';

type OrderStatusFormProps = {
	orderId: string;
	currentStatus: string;
};

export function OrderStatusForm({ orderId, currentStatus }: OrderStatusFormProps) {
	const router = useRouter();
	const allowedStatuses = useMemo(() => new Set(statusOptions), []);
	const initialStatus = allowedStatuses.has(currentStatus as (typeof statusOptions)[number])
		? currentStatus
		: statusOptions[0];
	const [selectedStatus, setSelectedStatus] = useState<string>(initialStatus);
	const [note, setNote] = useState('');
	const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
	const [isPending, startTransition] = useTransition();

	const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
		event.preventDefault();
		setFeedback(null);

		startTransition(async () => {
			try {
				await updateManualOrderStatus(orderId, selectedStatus, note);
				setFeedback({ type: 'success', message: 'Status zamówienia został zaktualizowany.' });
				setNote('');
				router.refresh();
			} catch (error) {
				const message =
					error instanceof Error
						? error.message
						: 'Nie udało się zmienić statusu zamówienia.';
				setFeedback({ type: 'error', message });
			}
		});
	};

	const nothingToUpdate =
		selectedStatus === currentStatus && note.trim().length === 0;

	return (
		<form onSubmit={handleSubmit} className="w-full space-y-3">
			<div className="space-y-1.5">
				<Label htmlFor="order-status-select">Status zamówienia</Label>
				<Select value={selectedStatus} onValueChange={setSelectedStatus}>
					<SelectTrigger id="order-status-select" className="w-full">
						<SelectValue placeholder="Wybierz status" />
					</SelectTrigger>
					<SelectContent>
						{statusOptions.map((option) => (
							<SelectItem key={option} value={option}>
								{option}
							</SelectItem>
						))}
					</SelectContent>
				</Select>
			</div>
			<div className="space-y-1.5">
				<Label htmlFor="order-status-note">Notatka (opcjonalnie)</Label>
				<Textarea
					id="order-status-note"
					rows={3}
					placeholder="Dodaj krótką notatkę dla zespołu"
					value={note}
					onChange={(event) => setNote(event.target.value)}
				/>
				<p className="text-xs text-muted-foreground">
					Notatka pojawi się w osi czasu zamówienia jako dodatkowy krok.
				</p>
			</div>
			<Button type="submit" disabled={isPending || nothingToUpdate} className="w-full">
				{isPending ? 'Aktualizowanie...' : 'Zmień status'}
			</Button>
			{feedback ? (
				<p
					className={`text-xs ${feedback.type === 'success' ? 'text-emerald-600' : 'text-destructive'}`}
				>
					{feedback.message}
				</p>
			) : null}
		</form>
	);
}
