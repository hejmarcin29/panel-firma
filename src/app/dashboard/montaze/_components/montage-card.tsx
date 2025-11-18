'use client';

import { useState, useTransition, type ElementType, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { CheckCircle2Icon, ClockIcon, FileIcon, MessageSquareIcon, PaperclipIcon } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
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

export type MontageAttachment = {
	id: string;
	title: string | null;
	url: string;
	createdAt: TimestampValue;
	noteId: string | null;
	uploader?: {
		id: string;
		name: string | null;
		email: string;
	} | null;
};

export type MontageNote = {
	id: string;
	content: string;
	createdAt: TimestampValue;
	author?: {
		id: string;
		name: string | null;
		email: string;
	} | null;
	attachments: MontageAttachment[];
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

function isImageAttachment(attachment: MontageAttachment) {
	const target = attachment.title ?? attachment.url;
	return /\.(png|jpe?g|webp|gif|svg)$/i.test(target.split('?')[0] ?? '');
}

function attachmentDisplayName(attachment: MontageAttachment) {
	if (attachment.title) {
		return attachment.title;
	}

	const url = attachment.url;
	const clean = url.split('?')[0] ?? url;
	const segments = clean.split('/');
	return segments[segments.length - 1] ?? url;
}

type TimelineEventType = 'note' | 'attachment' | 'task' | 'task-completed';

type TimelineEvent = {
	id: string;
	type: TimelineEventType;
	timestamp: TimestampValue;
	label: string;
	description: string;
};

function getTimeValue(value: TimestampValue) {
	if (!value) {
		return 0;
	}

	const date = value instanceof Date ? value : new Date(typeof value === 'number' ? value : Number(value));
	const time = date.getTime();
	return Number.isNaN(time) ? 0 : time;
}

function previewText(text: string, maxLength = 80) {
	const normalized = text.replace(/\s+/g, ' ').trim();
	if (normalized.length <= maxLength) {
		return normalized;
	}
	return `${normalized.slice(0, maxLength - 1).trimEnd()}…`;
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
	const [noteAttachmentTitle, setNoteAttachmentTitle] = useState('');
	const [taskTitle, setTaskTitle] = useState('');
	const [attachmentTitle, setAttachmentTitle] = useState('');
	const completedTasks = montage.tasks.filter((task) => task.completed).length;
	const totalTasks = montage.tasks.length;
	const openTasks = Math.max(totalTasks - completedTasks, 0);

	const timelineEvents: TimelineEvent[] = [
		...montage.notes.map((note) => ({
			id: `note-${note.id}`,
			type: 'note' as const,
			timestamp: note.createdAt,
			label: 'Dodano notatkę',
			description: previewText(note.content, 90),
		})),
		...montage.attachments.map((attachment) => ({
			id: `attachment-${attachment.id}`,
			type: 'attachment' as const,
			timestamp: attachment.createdAt,
			label: attachment.noteId ? 'Załącznik do notatki' : 'Dodano załącznik',
			description: previewText(attachmentDisplayName(attachment), 60),
		})),
		...montage.tasks.map((task) => ({
			id: `task-${task.id}`,
			type: task.completed ? ('task-completed' as const) : ('task' as const),
			timestamp: task.updatedAt,
			label: task.completed ? 'Zadanie zrealizowane' : 'Aktualizacja zadania',
			description: previewText(task.title, 80),
		})),
	]
		.filter((event) => Boolean(event.timestamp))
		.sort((a, b) => getTimeValue(b.timestamp) - getTimeValue(a.timestamp))
		.slice(0, 6);

	const timelineVisuals: Record<TimelineEventType, { icon: ElementType; className: string }> = {
		note: { icon: MessageSquareIcon, className: 'bg-primary/15 text-primary' },
		attachment: { icon: PaperclipIcon, className: 'bg-amber-500/15 text-amber-600 dark:text-amber-200' },
		task: { icon: ClockIcon, className: 'bg-sky-500/15 text-sky-600 dark:text-sky-300' },
		'task-completed': { icon: CheckCircle2Icon, className: 'bg-emerald-500/15 text-emerald-500' },
	};

	const latestActivityTimestamp = timelineEvents[0]?.timestamp ?? montage.updatedAt;

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

		const form = event.currentTarget;
		const formData = new FormData(form);
		formData.set('montageId', montage.id);
		formData.set('content', noteContent);
		formData.set('attachmentTitle', noteAttachmentTitle);

		startNoteTransition(async () => {
			try {
				await addMontageNote(formData);
				form.reset();
				setNoteContent('');
				setNoteAttachmentTitle('');
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
		<Card className="h-full border bg-background shadow-sm sm:rounded-2xl">
			<CardHeader className="gap-6 border-b border-border/60 pb-8">
				<div className="flex flex-col gap-6 xl:flex-row xl:items-end xl:justify-between">
					<div className="space-y-4">
						<div className="space-y-2">
							<CardTitle className="text-2xl font-semibold text-foreground lg:text-3xl">
								{montage.clientName}
							</CardTitle>
							<CardDescription className="text-sm">
								Utworzono {formatTimestamp(montage.createdAt)} • Aktualizacja {formatTimestamp(montage.updatedAt)}
							</CardDescription>
							{montage.address ? (
								<p className="text-sm text-muted-foreground/90">{montage.address}</p>
							) : null}
						</div>
						<div className="flex flex-wrap gap-3 text-sm text-muted-foreground">
							{montage.contactPhone ? (
								<div className="rounded-xl border border-border/60 bg-muted/20 px-3 py-2">
									<p className="text-[11px] uppercase tracking-wide text-muted-foreground/80">Telefon</p>
									<p className="font-medium text-foreground">{montage.contactPhone}</p>
								</div>
							) : null}
							{montage.contactEmail ? (
								<div className="rounded-xl border border-border/60 bg-muted/20 px-3 py-2">
									<p className="text-[11px] uppercase tracking-wide text-muted-foreground/80">E-mail</p>
									<p className="font-medium text-foreground">{montage.contactEmail}</p>
								</div>
							) : null}
						</div>
					</div>
					<div className="flex flex-col items-start gap-2 sm:items-end">
						<Label className="text-xs uppercase tracking-wide text-muted-foreground">Status</Label>
						<Select
							defaultValue={montage.status}
							onValueChange={(value) => handleStatusChange(value as MontageStatus)}
							disabled={statusPending}
						>
							<SelectTrigger className="min-w-[220px]" aria-label="Zmień status montaży">
								<SelectValue placeholder="Wybierz status" />
							</SelectTrigger>
							<SelectContent className="max-h-[340px]">
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
				<div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
					<div className="rounded-xl border border-border/60 bg-muted/20 px-4 py-3">
						<p className="text-[11px] uppercase tracking-wide text-muted-foreground">Notatki</p>
						<p className="text-xl font-semibold text-foreground">{montage.notes.length}</p>
						<p className="text-xs text-muted-foreground">Łącznie wpisów</p>
					</div>
					<div className="rounded-xl border border-border/60 bg-muted/20 px-4 py-3">
						<p className="text-[11px] uppercase tracking-wide text-muted-foreground">Załączniki</p>
						<p className="text-xl font-semibold text-foreground">{montage.attachments.length}</p>
						<p className="text-xs text-muted-foreground">Pliki w chmurze</p>
					</div>
					<div className="rounded-xl border border-border/60 bg-muted/20 px-4 py-3">
						<p className="text-[11px] uppercase tracking-wide text-muted-foreground">Zadania</p>
						<p className="text-xl font-semibold text-foreground">
							{completedTasks}/{totalTasks}
						</p>
						<p className="text-xs text-muted-foreground">Ukończone zadań</p>
					</div>
					<div className="rounded-xl border border-border/60 bg-muted/20 px-4 py-3">
						<p className="text-[11px] uppercase tracking-wide text-muted-foreground">Ostatnia aktywność</p>
						<p className="text-sm font-medium text-foreground">{formatTimestamp(latestActivityTimestamp)}</p>
						<p className="text-xs text-muted-foreground">Automatycznie odświeżane</p>
					</div>
				</div>
				<div className="space-y-2">
					<p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Oś aktywności</p>
					{timelineEvents.length === 0 ? (
						<p className="text-sm text-muted-foreground">Brak zarejestrowanej aktywności dla tego montażu.</p>
					) : (
						<div className="flex gap-3 overflow-x-auto pb-2">
							{timelineEvents.map((event) => {
								const visuals = timelineVisuals[event.type];
								const Icon = visuals.icon;
								return (
									<div
										key={event.id}
										className="flex min-w-[220px] items-start gap-3 rounded-xl border border-border/60 bg-muted/30 p-3"
									>
										<div className={cn('flex h-9 w-9 items-center justify-center rounded-full', visuals.className)}>
											<Icon className="size-4" />
										</div>
										<div className="space-y-1">
											<p className="text-xs font-semibold text-muted-foreground">{event.label}</p>
											<p className="text-sm text-foreground">{event.description}</p>
											<p className="text-[11px] text-muted-foreground">{formatTimestamp(event.timestamp)}</p>
										</div>
									</div>
								);
							})}
						</div>
					)}
				</div>
			</CardHeader>
			<CardContent className="flex-1 space-y-8 pb-32 pt-0">
				<Tabs defaultValue="notes" className="flex flex-col gap-6">
					<div className="flex flex-wrap items-center justify-between gap-3">
						<TabsList>
							<TabsTrigger value="notes">
								Notatki
								<span className="ml-2 rounded-full bg-muted px-2 py-0.5 text-xs font-semibold text-muted-foreground">
									{montage.notes.length}
								</span>
							</TabsTrigger>
							<TabsTrigger value="tasks">
								Zadania
								<span className="ml-2 rounded-full bg-muted px-2 py-0.5 text-xs font-semibold text-muted-foreground">
									{totalTasks}
								</span>
							</TabsTrigger>
						</TabsList>
						<div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
							<span>Do wykonania: {openTasks}</span>
							<span>Załączników: {montage.attachments.length}</span>
						</div>
					</div>
					<TabsContent value="notes" className="space-y-5">
						{noteError ? <span className="text-xs text-destructive">{noteError}</span> : null}
						{montage.notes.length === 0 ? (
							<div className="rounded-xl border border-dashed border-border/70 bg-muted/20 p-6 text-sm text-muted-foreground">
								Brak notatek. Dodaj pierwszą informację, aby zainicjować timeline.
							</div>
						) : (
							<ul className="space-y-3">
								{montage.notes.map((note) => {
									const hasAttachments = note.attachments.length > 0;
									return (
										<li key={note.id} className="rounded-2xl border border-border/60 bg-background p-4 shadow-sm">
											<div className="flex flex-wrap items-center justify-between gap-3 text-xs text-muted-foreground">
												<div className="flex flex-wrap items-center gap-2">
													<Badge variant="secondary">{formatTimestamp(note.createdAt)}</Badge>
													{note.author ? (
														<span className="font-medium text-foreground/80">{note.author.name ?? note.author.email}</span>
													) : null}
												</div>
												{hasAttachments ? (
													<span className="flex items-center gap-1 text-[11px] font-medium text-muted-foreground">
														<PaperclipIcon className="size-3.5" />
														{note.attachments.length}
													</span>
												) : null}
											</div>
											<p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-foreground">{note.content}</p>
											{hasAttachments ? (
												<ul className="mt-3 space-y-2 text-xs">
													{note.attachments.map((attachment) => (
														<li key={attachment.id}>
															<a
																href={attachment.url}
																target="_blank"
																rel="noopener noreferrer"
																className="group flex items-center gap-2 rounded-lg border border-border/60 bg-muted/20 px-3 py-2 transition hover:border-primary/60"
															>
																<FileIcon className="size-4 text-muted-foreground transition group-hover:text-primary" />
																<span className="truncate text-foreground group-hover:text-primary">
																	{attachmentDisplayName(attachment)}
																</span>
															</a>
														</li>
													))}
												</ul>
											) : null}
										</li>
									);
								})}
							</ul>
						)}
						<form onSubmit={submitNote} className="space-y-3 rounded-2xl border border-border/60 bg-background p-4 shadow-sm">
							<Textarea
								value={noteContent}
								onChange={(event) => setNoteContent(event.target.value)}
								placeholder="Dodaj notatkę dla ekipy montażowej"
								rows={3}
								disabled={notePending}
							/>
							<div className="flex flex-col gap-2 sm:flex-row sm:items-center">
								<Input
									name="attachment"
									type="file"
									accept="image/*,application/pdf"
									disabled={notePending}
								/>
								<Input
									name="attachmentTitle"
									placeholder="Opis załącznika (opcjonalnie)"
									value={noteAttachmentTitle}
									onChange={(event) => setNoteAttachmentTitle(event.target.value)}
									disabled={notePending}
									className="sm:flex-1"
								/>
							</div>
							<Button type="submit" size="sm" disabled={notePending} className="sm:self-end">
								{notePending ? 'Zapisywanie...' : 'Dodaj notatkę'}
							</Button>
						</form>
					</TabsContent>
					<TabsContent value="tasks" className="space-y-5">
						{taskError ? <span className="text-xs text-destructive">{taskError}</span> : null}
						{montage.tasks.length === 0 ? (
							<div className="rounded-xl border border-dashed border-border/70 bg-muted/20 p-6 text-sm text-muted-foreground">
								Brak zadań. Dodaj elementy do checklisty, aby zaplanować kolejne kroki.
							</div>
						) : (
							<ul className="space-y-3">
								{montage.tasks.map((task) => (
									<li key={task.id} className="rounded-2xl border border-border/60 bg-muted/15 p-4 shadow-sm">
										<div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
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
											<span className="text-xs text-muted-foreground">Aktualizacja: {formatTimestamp(task.updatedAt)}</span>
										</div>
									</li>
								))}
							</ul>
						)}
						<form
							onSubmit={submitTask}
							className="flex flex-col gap-3 rounded-2xl border border-dashed border-border/70 bg-muted/15 p-4 shadow-sm sm:flex-row sm:items-end"
						>
							<Input
								placeholder="Dodaj zadanie (np. zamówienie materiału)"
								value={taskTitle}
								onChange={(event) => setTaskTitle(event.target.value)}
								disabled={taskPending}
								required
								className="flex-1"
							/>
							<Button type="submit" size="sm" disabled={taskPending} className="sm:w-auto">
								{taskPending ? 'Dodawanie...' : 'Dodaj zadanie'}
							</Button>
						</form>
					</TabsContent>
				</Tabs>
			</CardContent>
			<CardFooter className="sticky bottom-0 z-20 flex-col gap-4 border-t border-border/60 bg-background/95 px-6 py-6 backdrop-blur !items-start">
				<div className="flex w-full flex-wrap items-center justify-between gap-3">
					<div>
						<p className="text-xs uppercase tracking-wide text-muted-foreground">Załączniki</p>
						<h3 className="text-base font-semibold text-foreground">Biblioteka klienta</h3>
					</div>
					{attachmentError ? <span className="text-xs text-destructive">{attachmentError}</span> : null}
				</div>
				{montage.attachments.length === 0 ? (
					<p className="text-sm text-muted-foreground">Brak załączonych materiałów. Dodaj pierwszy plik, aby udostępnić ekipie.</p>
				) : (
					<div className="w-full overflow-x-auto pb-2">
						<div className="flex gap-3">
							{montage.attachments.map((attachment) => {
								const image = isImageAttachment(attachment);
								return (
									<a
										key={attachment.id}
										href={attachment.url}
										target="_blank"
										rel="noopener noreferrer"
										className="group flex w-[220px] shrink-0 flex-col overflow-hidden rounded-2xl border border-border/60 bg-muted/10 transition hover:border-primary/60 hover:shadow-lg"
									>
										<div className="relative h-36 overflow-hidden bg-background">
											{image ? (
												<>
													{/* eslint-disable-next-line @next/next/no-img-element -- Cloud R2 attachments lack Next.js loader configuration */}
													<img
														src={attachment.url}
														alt={attachmentDisplayName(attachment)}
														className="h-full w-full object-cover transition group-hover:scale-105"
														loading="lazy"
													/>
												</>
											) : (
												<div className="flex h-full flex-col items-center justify-center gap-2 text-muted-foreground">
													<FileIcon className="size-8" />
													<span className="text-[11px] uppercase tracking-wide">
														{attachment.url.split('.').pop()?.split('?')[0] ?? 'plik'}
													</span>
												</div>
											)}
										</div>
										<div className="flex flex-1 flex-col gap-1 px-4 py-3 text-left">
											<span className="line-clamp-2 font-medium text-foreground">
												{attachmentDisplayName(attachment)}
											</span>
											<p className="text-xs text-muted-foreground">
												Dodano {formatTimestamp(attachment.createdAt)}
												{attachment.uploader ? ` • ${attachment.uploader.name ?? attachment.uploader.email}` : ''}
											</p>
											{attachment.noteId ? (
												<span className="flex items-center gap-1 text-[11px] text-muted-foreground">
													<PaperclipIcon className="size-3.5" />
													Powiązano z notatką
												</span>
											) : null}
										</div>
									</a>
								);
							})}
						</div>
					</div>
				)}
				<form
					onSubmit={submitAttachment}
					className="flex w-full flex-col gap-3 rounded-2xl border border-dashed border-border/70 bg-muted/10 p-4 sm:flex-row sm:flex-wrap sm:items-center"
				>
					<Input
						name="file"
						type="file"
						accept="image/*,application/pdf"
						disabled={attachmentPending}
						required
						className="min-w-[220px] flex-1"
					/>
					<Input
						name="title"
						placeholder="Opis (opcjonalnie)"
						value={attachmentTitle}
						onChange={(event) => setAttachmentTitle(event.target.value)}
						disabled={attachmentPending}
						className="min-w-[180px] flex-1"
					/>
					<Button type="submit" size="sm" disabled={attachmentPending} className="sm:ml-auto">
						{attachmentPending ? 'Dodawanie...' : 'Dodaj plik'}
					</Button>
				</form>
				<p className="text-[11px] text-muted-foreground">
					Pliki trafiają bezpośrednio do chmury R2 w katalogu przypisanym do klienta.
				</p>
			</CardFooter>
		</Card>
	);
}
