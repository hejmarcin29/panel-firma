'use client';

import { useState, useTransition, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { cn } from '@/lib/utils';

import {
	addMontageAttachment,
	addMontageNote,
	addMontageTask,
	toggleMontageTask,
	updateMontageStatus,
} from '../actions';
import type { MontageStatus } from '@/lib/db/schema';

type TimestampValue = number | Date | null | undefined;

export type MontageNote = {
	id: string;
	content: string;
	createdAt: TimestampValue;
	author?: {
		id: string;
		name: string | null;
		email: string;
	} | null;
};

export type MontageAttachment = {
	id: string;
	title: string | null;
	url: string;
	createdAt: TimestampValue;
	uploader?: {
		id: string;
		name: string | null;
		email: string;
	} | null;
};

export type MontageTask = {
	id: string;
	title: string;
	completed: boolean;
	updatedAt: TimestampValue;
};

export type Montage = {
	id: string;
	clientName: string;
	contactPhone: string | null;
	contactEmail: string | null;
	address: string | null;
	status: MontageStatus;
	createdAt: TimestampValue;
	updatedAt: TimestampValue;
	notes: MontageNote[];
	attachments: MontageAttachment[];
	tasks: MontageTask[];
};

export type StatusOption = {
	value: MontageStatus;
	label: string;
	description: string;
};

type MontageCardProps = {
	montage: Montage;
	statusOptions: StatusOption[];
};

function formatTimestamp(value: TimestampValue) {
	if (!value) {
		return 'brak daty';
	}

	const date = value instanceof Date ? value : new Date(Number(value));

	if (Number.isNaN(date.getTime())) {
		return 'brak daty';
	}

	return new Intl.DateTimeFormat('pl-PL', {
		dateStyle: 'short',
		timeStyle: 'short',
	}).format(date);
}

export function MontageCard({ montage, statusOptions }: MontageCardProps) {
	const router = useRouter();
	const [statusPending, startStatusTransition] = useTransition();
	const [notePending, startNoteTransition] = useTransition();
	const [taskPending, startTaskTransition] = useTransition();
	const [attachmentPending, startAttachmentTransition] = useTransition();
	const [noteError, setNoteError] = useState<string | null>(null);
	const [taskError, setTaskError] = useState<string | null>(null);
	const [attachmentError, setAttachmentError] = useState<string | null>(null);
	const [noteContent, setNoteContent] = useState('');
	const [taskTitle, setTaskTitle] = useState('');
	const [attachmentTitle, setAttachmentTitle] = useState('');

	const handleStatusChange = (value: MontageStatus) => {
		startStatusTransition(async () => {
			try {
				await updateMontageStatus({ montageId: montage.id, status: value });
				router.refresh();
			} catch (error) {
				console.error(error);
			}
		});
	};

	const submitNote = (event: FormEvent<HTMLFormElement>) => {
		event.preventDefault();
		setNoteError(null);

		startNoteTransition(async () => {
			try {
				await addMontageNote({ montageId: montage.id, content: noteContent });
				setNoteContent('');
				router.refresh();
			} catch (error) {
				const message =
					error instanceof Error ? error.message : 'Nie udało się dodać notatki.';
				setNoteError(message);
			}
		});
	};

	const submitTask = (event: FormEvent<HTMLFormElement>) => {
		event.preventDefault();
		setTaskError(null);

		startTaskTransition(async () => {
			try {
				await addMontageTask({ montageId: montage.id, title: taskTitle });
				setTaskTitle('');
				router.refresh();
			} catch (error) {
				const message =
					error instanceof Error ? error.message : 'Nie udało się dodać zadania.';
				setTaskError(message);
			}
		});
	};

	const submitAttachment = (event: FormEvent<HTMLFormElement>) => {
		event.preventDefault();
		setAttachmentError(null);

		startAttachmentTransition(async () => {
			try {
				const formData = new FormData(event.currentTarget);
				formData.set('title', attachmentTitle);
				formData.set('montageId', montage.id);

				const file = formData.get('file');
				if (!(file instanceof File) || file.size === 0) {
					throw new Error('Wybierz plik z dysku.');
				}

				await addMontageAttachment(formData);
				event.currentTarget.reset();
				setAttachmentTitle('');
				router.refresh();
			} catch (error) {
				const message =
					error instanceof Error ? error.message : 'Nie udało się dodać załącznika.';
				setAttachmentError(message);
			}
		});
	};

	const toggleTask = (taskId: string, nextValue: boolean) => {
		startTaskTransition(async () => {
			try {
				await toggleMontageTask({ taskId, montageId: montage.id, completed: nextValue });
				router.refresh();
			} catch (error) {
				const message =
					error instanceof Error ? error.message : 'Nie udało się zaktualizować zadania.';
				setTaskError(message);
			}
		});
	};

	return (
		<Card className="border bg-background shadow-sm">
			<CardHeader className="space-y-3">
				<div className="flex flex-wrap items-baseline justify-between gap-3">
					<div>
						<CardTitle className="text-lg">{montage.clientName}</CardTitle>
						<CardDescription>
							Utworzono: {formatTimestamp(montage.createdAt)} • Aktualizacja: {formatTimestamp(montage.updatedAt)}
						</CardDescription>
					</div>
					<div className="flex flex-wrap items-center gap-2">
						<Label className="text-xs uppercase tracking-wide text-muted-foreground">Status</Label>
						<Select
							defaultValue={montage.status}
							onValueChange={(value) => handleStatusChange(value as MontageStatus)}
							disabled={statusPending}
						>
							<SelectTrigger size="sm" aria-label="Zmień status montaży">
								<SelectValue placeholder="Wybierz status" />
							</SelectTrigger>
							<SelectContent>
								{statusOptions.map((option) => (
									<SelectItem key={option.value} value={option.value}>
										<div className="flex flex-col text-left">
											<span className="font-medium">{option.label}</span>
											<span className="text-xs text-muted-foreground">{option.description}</span>
										</div>
									</SelectItem>
								))}
							</SelectContent>
						</Select>
					</div>
				</div>
				<div className="flex flex-wrap gap-3 text-sm text-muted-foreground">
					{montage.contactPhone ? <span>Tel: {montage.contactPhone}</span> : null}
					{montage.contactEmail ? <span>E-mail: {montage.contactEmail}</span> : null}
				</div>
				{montage.address ? (
					<p className="text-sm text-foreground/80">{montage.address}</p>
				) : null}
			</CardHeader>
			<CardContent className="space-y-6">
				<section className="space-y-3">
					<div className="flex items-center justify-between">
						<h3 className="text-sm font-semibold">Notatki</h3>
						{noteError ? <span className="text-xs text-destructive">{noteError}</span> : null}
					</div>
					{montage.notes.length === 0 ? (
						<p className="text-xs text-muted-foreground">Brak notatek.</p>
					) : (
						<ul className="space-y-2">
							{montage.notes.map((note) => (
								<li key={note.id} className="rounded-lg border bg-muted/40 p-3 text-sm">
									<div className="mb-1 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
										<Badge variant="secondary">{formatTimestamp(note.createdAt)}</Badge>
										{note.author ? (
											<span>{note.author.name ?? note.author.email}</span>
										) : null}
									</div>
									<p className="whitespace-pre-wrap leading-relaxed text-foreground">{note.content}</p>
								</li>
							))}
						</ul>
					)}
					<form onSubmit={submitNote} className="space-y-2">
						<Textarea
							value={noteContent}
							onChange={(event) => setNoteContent(event.target.value)}
							placeholder="Dodaj notatkę dla ekipy montażowej"
							rows={3}
							disabled={notePending}
						/>
						<Button type="submit" size="sm" disabled={notePending}>
							{notePending ? 'Zapisywanie...' : 'Dodaj notatkę'}
						</Button>
					</form>
				</section>

				<section className="space-y-3">
					<div className="flex items-center justify-between">
						<h3 className="text-sm font-semibold">Załączniki</h3>
						{attachmentError ? <span className="text-xs text-destructive">{attachmentError}</span> : null}
					</div>
					{montage.attachments.length === 0 ? (
						<p className="text-xs text-muted-foreground">Brak załączonych materiałów.</p>
					) : (
						<ul className="space-y-2 text-sm">
							{montage.attachments.map((attachment) => (
								<li key={attachment.id} className="flex flex-wrap items-center justify-between gap-2 rounded-lg border bg-muted/30 p-3">
									<div className="space-y-1">
										<a href={attachment.url} target="_blank" rel="noopener noreferrer" className="font-medium text-primary hover:underline">
											{attachment.title ? attachment.title : attachment.url}
										</a>
										<p className="text-xs text-muted-foreground">
											Dodano {formatTimestamp(attachment.createdAt)}
											{attachment.uploader ? ` • ${attachment.uploader.name ?? attachment.uploader.email}` : ''}
										</p>
									</div>
								</li>
							))}
						</ul>
					)}
					<form onSubmit={submitAttachment} className="grid gap-2 md:grid-cols-[minmax(0,1fr)_minmax(0,0.6fr)_auto]">
						<Input
							name="file"
							type="file"
							accept="image/*,application/pdf"
							disabled={attachmentPending}
							required
						/>
						<Input
							name="title"
							placeholder="Opis (opcjonalnie)"
							value={attachmentTitle}
							onChange={(event) => setAttachmentTitle(event.target.value)}
							disabled={attachmentPending}
						/>
						<Button type="submit" size="sm" disabled={attachmentPending}>
							{attachmentPending ? 'Dodawanie...' : 'Dodaj'}
						</Button>
					</form>
					<p className="text-[11px] text-muted-foreground">
						Pliki trafiają do chmury R2 w katalogu przypisanym do klienta.
					</p>
				</section>

				<section className="space-y-3">
					<div className="flex items-center justify-between">
						<h3 className="text-sm font-semibold">Lista zadań</h3>
						{taskError ? <span className="text-xs text-destructive">{taskError}</span> : null}
					</div>
					{montage.tasks.length === 0 ? (
						<p className="text-xs text-muted-foreground">Brak zadań. Dodaj elementy do checklisty.</p>
					) : (
						<ul className="space-y-2 text-sm">
							{montage.tasks.map((task) => (
								<li key={task.id} className="flex items-center justify-between gap-3 rounded-lg border bg-muted/20 p-3">
									<label className="flex items-center gap-2 text-sm">
										<Checkbox
											checked={task.completed}
											onCheckedChange={(value) => toggleTask(task.id, Boolean(value))}
											disabled={taskPending}
										/>
										<span className={cn('leading-none', task.completed ? 'line-through text-muted-foreground' : 'text-foreground')}>
											{task.title}
										</span>
									</label>
									<span className="text-xs text-muted-foreground">aktualizacja: {formatTimestamp(task.updatedAt)}</span>
								</li>
							))}
						</ul>
					)}
					<form onSubmit={submitTask} className="flex flex-wrap items-center gap-2">
						<Input
							placeholder="Dodaj zadanie (np. zamówienie materiału)"
							value={taskTitle}
							onChange={(event) => setTaskTitle(event.target.value)}
							disabled={taskPending}
							required
							className="min-w-[220px] flex-1"
						/>
						<Button type="submit" size="sm" disabled={taskPending}>
							{taskPending ? 'Dodawanie...' : 'Dodaj zadanie'}
						</Button>
					</form>
				</section>
			</CardContent>
		</Card>
	);
}
