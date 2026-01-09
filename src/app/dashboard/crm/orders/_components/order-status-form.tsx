'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useDebouncedCallback } from 'use-debounce';
import { Loader2, Check } from 'lucide-react';

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
import { normalizeStatus, statusOptions } from '../utils';

type OrderStatusFormProps = {
	orderId: string;
	currentStatus: string;
};

export function OrderStatusForm({ orderId, currentStatus }: OrderStatusFormProps) {
	const router = useRouter();
	const normalizedCurrentStatus = useMemo(() => normalizeStatus(currentStatus), [currentStatus]);
	const [selectedStatus, setSelectedStatus] = useState<string>(normalizedCurrentStatus);
	const [note, setNote] = useState('');
	const [isSaving, setIsSaving] = useState(false);

	useEffect(() => {
		setSelectedStatus(normalizedCurrentStatus);
	}, [normalizedCurrentStatus]);

	const debouncedSave = useDebouncedCallback(async (status: string, currentNote: string) => {
		if (status === normalizedCurrentStatus && !currentNote.trim()) return;
		
		setIsSaving(true);
		try {
			await updateManualOrderStatus(orderId, status, currentNote);
			if (currentNote.trim()) setNote(''); // Clear note after successful save
			router.refresh();
		} catch (error) {
			console.error('Failed to update status:', error);
		} finally {
			setIsSaving(false);
		}
	}, 1000);

	const handleStatusChange = (value: string) => {
		setSelectedStatus(value);
		debouncedSave(value, note);
	};

	const handleNoteChange = (value: string) => {
		setNote(value);
		debouncedSave(selectedStatus, value);
	};

	return (
		<div className="w-full space-y-3">
			<div className="flex items-center justify-between">
				<Label htmlFor="order-status-select">Status zamówienia</Label>
				{isSaving ? (
					<span className="text-xs text-muted-foreground flex items-center gap-1">
						<Loader2 className="w-3 h-3 animate-spin" />
						Zapisywanie...
					</span>
				) : (
					<span className="text-xs text-emerald-600 flex items-center gap-1 opacity-0 transition-opacity duration-500 data-[visible=true]:opacity-100" data-visible={!isSaving}>
						<Check className="w-3 h-3" />
						Zapisano
					</span>
				)}
			</div>
			<div className="space-y-1.5">
				<Select value={selectedStatus} onValueChange={handleStatusChange}>
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
					onChange={(event) => handleNoteChange(event.target.value)}
				/>
				<p className="text-xs text-muted-foreground">
					Notatka pojawi się w osi czasu zamówienia jako dodatkowy krok.
				</p>
			</div>
		</div>
	);
}
