'use client';

import { useState } from 'react';

import { Button } from '@/components/ui/button';
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from '@/components/ui/dialog';

import { CreateMontageForm } from './create-montage-form';

type CreateMontageDialogProps = {
	triggerClassName?: string;
};

export function CreateMontageDialog({ triggerClassName }: CreateMontageDialogProps) {
	const [open, setOpen] = useState(false);

	return (
		<Dialog open={open} onOpenChange={setOpen}>
			<DialogTrigger asChild>
				<Button className={triggerClassName}>Dodaj montaż</Button>
			</DialogTrigger>
			<DialogContent className="max-w-3xl">
				<DialogHeader>
					<DialogTitle>Dodaj nowy montaż</DialogTitle>
					<DialogDescription>
						Uzupełnij dane kontaktowe, adresowe oraz materiały. Lista kontrolna zostanie dodana automatycznie.
					</DialogDescription>
				</DialogHeader>
				<CreateMontageForm onSuccess={() => setOpen(false)} />
			</DialogContent>
		</Dialog>
	);
}
