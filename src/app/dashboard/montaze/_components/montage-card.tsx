'use client';

import { useEffect, useRef, useState, useTransition, type ChangeEvent, type ElementType, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { CheckCircle2Icon, ChevronDown, ClockIcon, FileIcon, MessageSquareIcon, PaperclipIcon, Plus } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
	Sheet,
	SheetContent,
	SheetDescription,
	SheetHeader,
	SheetTitle,
	SheetTrigger,
} from '@/components/ui/sheet';
import { cn } from '@/lib/utils';
import {
	addMontageNote,
	addMontageTask,
	toggleMontageChecklistItem,
	toggleMontageTask,
	updateMontageMaterialDetails,
	updateMontageStatus,
	uploadChecklistAttachment,
} from '../actions';
import { summarizeMaterialDetails } from '../utils';
import type { MontageStatus } from '@/lib/db/schema';
import { useIsMobile } from '@/hooks/use-mobile';
import type { Montage, MontageAttachment, StatusOption, TimestampValue } from '../types';

function formatTimestamp(value: TimestampValue) {
	if (!value) {
		return 'brak daty';
	}

	const date = value instanceof Date ? value : new Date(typeof value === 'number' ? value : Number(value));

	if (Number.isNaN(date.getTime())) {
		return 'brak daty';
	}

	return new Intl.DateTimeFormat('pl-PL', {
		dateStyle: 'short',
		timeStyle: 'short',
	}).format(date);
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

type TimelineEventType = 'note' | 'task' | 'task-completed' | 'milestone';

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
	const [materialsPending, startMaterialsTransition] = useTransition();
	const [checklistPending, startChecklistTransition] = useTransition();
	const [checklistAttachmentPending, startChecklistAttachmentTransition] = useTransition();
	const [noteError, setNoteError] = useState<string | null>(null);
	const [taskError, setTaskError] = useState<string | null>(null);
	const [checklistError, setChecklistError] = useState<string | null>(null);
	const [checklistPendingId, setChecklistPendingId] = useState<string | null>(null);
	const [checklistAttachmentError, setChecklistAttachmentError] = useState<{ id: string; message: string } | null>(null);
	const [checklistAttachmentPendingId, setChecklistAttachmentPendingId] = useState<string | null>(null);
	const [noteContent, setNoteContent] = useState('');
	const [noteAttachmentTitle, setNoteAttachmentTitle] = useState('');
	const [taskTitle, setTaskTitle] = useState('');
	const [materialsDraft, setMaterialsDraft] = useState(montage.materialDetails ?? '');
	const [materialsError, setMaterialsError] = useState<string | null>(null);
	const [materialsFeedback, setMaterialsFeedback] = useState<string | null>(null);
	const isMobile = useIsMobile();
	const [activeTab, setActiveTab] = useState<'notes' | 'tasks'>('notes');
	const [quickInfoOpen, setQuickInfoOpen] = useState(true);
	const [actionSheetOpen, setActionSheetOpen] = useState(false);
	const focusTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
	const quickInfoSectionRef = useRef<HTMLDivElement | null>(null);
	const noteFormRef = useRef<HTMLFormElement | null>(null);
	const taskFormRef = useRef<HTMLFormElement | null>(null);
	const noteTextareaRef = useRef<HTMLTextAreaElement | null>(null);
	const taskInputRef = useRef<HTMLInputElement | null>(null);
	const materialsTextareaRef = useRef<HTMLTextAreaElement | null>(null);

	const completedTasks = montage.tasks.filter((task) => task.completed).length;
	const totalTasks = montage.tasks.length;
	const openTasks = Math.max(totalTasks - completedTasks, 0);
	const totalChecklistItems = montage.checklistItems.length;
	const completedChecklistItems = montage.checklistItems.filter((item) => item.completed).length;
	const currentStatusOption = statusOptions.find((option) => option.value === montage.status) ?? null;
	const checklistProgressLabel = totalChecklistItems > 0 ? `${completedChecklistItems}/${totalChecklistItems}` : '0/0';
	const billingAddress = montage.billingAddress ?? '';
	const installationAddress = montage.installationAddress ?? '';
	const billingCity = montage.billingCity ?? '';
	const installationCity = montage.installationCity ?? '';
	const addressesMatch = Boolean(billingAddress && installationAddress)
		&& billingAddress === installationAddress
		&& (billingCity || '') === (installationCity || '');
	const scheduledInstallationDate = (() => {
		const value = montage.scheduledInstallationAt;
		if (!value) {
			return null;
		}
		const date = value instanceof Date ? value : new Date(typeof value === 'number' ? value : Number(value));
		if (Number.isNaN(date.getTime())) {
			return null;
		}
		return new Intl.DateTimeFormat('pl-PL', { dateStyle: 'long' }).format(date);
	})();
	const materialsSummary = summarizeMaterialDetails(montage.materialDetails, 160);
	const materialsQuickSummary = summarizeMaterialDetails(montage.materialDetails, 60);
	const hasMaterials = Boolean(montage.materialDetails?.trim());
	const contactEntries = [
		montage.contactPhone
			? { key: 'phone', label: 'Telefon', value: montage.contactPhone, muted: false }
			: null,
		montage.contactEmail
			? { key: 'email', label: 'E-mail', value: montage.contactEmail, muted: false }
			: null,
		{ key: 'date', label: 'Termin montażu', value: scheduledInstallationDate ?? 'Brak terminu', muted: !scheduledInstallationDate },
	].filter(Boolean) as Array<{ key: string; label: string; value: string; muted: boolean }>;

	useEffect(() => {
		setMaterialsDraft(montage.materialDetails ?? '');
	}, [montage.materialDetails]);

	useEffect(() => {
		setQuickInfoOpen(!isMobile);
	}, [isMobile]);

	useEffect(() => {
		if (!isMobile) {
			setActionSheetOpen(false);
		}
	}, [isMobile]);

	useEffect(
		() => () => {
			if (focusTimeoutRef.current) {
				clearTimeout(focusTimeoutRef.current);
			}
		},
		[],
	);

	const timelineEvents: TimelineEvent[] = [
		...montage.notes.map((note) => ({
			id: `note-${note.id}`,
			type: 'note' as const,
			timestamp: note.createdAt,
			label: 'Dodano notatkę',
			description: previewText(note.content, 90),
		})),
		...montage.tasks.map((task) => ({
			id: `task-${task.id}`,
			type: task.completed ? ('task-completed' as const) : ('task' as const),
			timestamp: task.updatedAt,
			label: task.completed ? 'Zadanie zrealizowane' : 'Aktualizacja zadania',
			description: previewText(task.title, 80),
		})),
		...montage.checklistItems
			.filter((item) => item.completed)
			.map((item) => ({
				id: `checklist-${item.id}`,
				type: 'milestone' as const,
				timestamp: item.updatedAt,
				label: 'Zamknięto etap',
				description: previewText(item.label, 80),
			})),
	]
		.filter((event) => Boolean(event.timestamp))
		.sort((a, b) => getTimeValue(b.timestamp) - getTimeValue(a.timestamp));

	const timelineVisuals: Record<TimelineEventType, { icon: ElementType; className: string }> = {
		note: { icon: MessageSquareIcon, className: 'bg-primary/15 text-primary' },
		task: { icon: ClockIcon, className: 'bg-sky-500/15 text-sky-600 dark:text-sky-300' },
		'task-completed': { icon: CheckCircle2Icon, className: 'bg-emerald-500/15 text-emerald-500' },
		milestone: { icon: CheckCircle2Icon, className: 'bg-violet-500/15 text-violet-600 dark:text-violet-200' },
	};

	const latestActivityTimestamp = timelineEvents[0]?.timestamp ?? montage.updatedAt;

	const renderQuickInfoDetails = () => (
		<>
			<form
				onSubmit={submitMaterials}
				className="space-y-2.5 rounded-xl border border-border/60 bg-muted/10 p-3.5"
			>
				<div className="flex flex-wrap items-center justify-between gap-3">
					<div className="space-y-1">
						<Label className="text-xs uppercase tracking-wide text-muted-foreground">Materiały i ilości</Label>
						<p className="text-xs text-muted-foreground">
							Zapisz co zostało zamówione, aby ekipa była gotowa do montażu.
						</p>
					</div>
					{materialsFeedback ? <span className="text-xs text-emerald-600">{materialsFeedback}</span> : null}
				</div>
				<Textarea
					ref={materialsTextareaRef}
					value={materialsDraft}
					onChange={handleMaterialsChange}
					placeholder="np. Rolety dzień-noc — 4 szt., Markiza tarasowa — 1 szt."
					rows={3}
					disabled={materialsPending}
				/>
				<div className="flex flex-wrap items-center justify-between gap-3">
					{materialsError ? (
						<span className="text-xs text-destructive">{materialsError}</span>
					) : (
						<span className="text-xs text-muted-foreground">Informacja widoczna dla całego zespołu.</span>
					)}
					<Button type="submit" size="sm" disabled={materialsPending}>
						{materialsPending ? 'Zapisywanie...' : 'Zapisz materiały'}
					</Button>
				</div>
			</form>
			<div className="grid gap-2.5 sm:grid-cols-2">
				<div className="rounded-lg border border-border/50 bg-muted/20 px-3 py-2">
					<p className="text-[11px] uppercase tracking-wide text-muted-foreground/70">Adres faktury</p>
					<p className="whitespace-pre-wrap text-sm text-foreground/90">{billingAddress ? billingAddress : 'Brak danych'}</p>
					<p className="text-xs text-muted-foreground/70">{billingCity ? `Miasto: ${billingCity}` : 'Miasto nieznane'}</p>
				</div>
				<div className="rounded-lg border border-border/50 bg-muted/20 px-3 py-2">
					<p className="text-[11px] uppercase tracking-wide text-muted-foreground/70">Adres montażu</p>
					<p className="whitespace-pre-wrap text-sm text-foreground/90">{installationAddress ? installationAddress : 'Brak danych'}</p>
					<p className="text-xs text-muted-foreground/70">{installationCity ? `Miasto: ${installationCity}` : 'Miasto nieznane'}</p>
					{addressesMatch && billingAddress ? (
						<p className="mt-1 text-[11px] text-muted-foreground/70">Adres jak na fakturze</p>
					) : null}
				</div>
			</div>
		</>
	);

	const handleQuickAction = (action: 'note' | 'task' | 'materials') => {
		if (action === 'note') {
			setActiveTab('notes');
		} else if (action === 'task') {
			setActiveTab('tasks');
		} else if (action === 'materials') {
			setQuickInfoOpen(true);
		}

		setActionSheetOpen(false);

		if (focusTimeoutRef.current) {
			clearTimeout(focusTimeoutRef.current);
		}

		focusTimeoutRef.current = setTimeout(() => {
			if (action === 'note') {
				noteFormRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
				noteTextareaRef.current?.focus();
			} else if (action === 'task') {
				taskFormRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
				taskInputRef.current?.focus();
			} else if (action === 'materials') {
				quickInfoSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
				materialsTextareaRef.current?.focus();
			}
		}, 220);
	};

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

	const handleMaterialsChange = (event: ChangeEvent<HTMLTextAreaElement>) => {
		setMaterialsDraft(event.target.value);
		if (materialsFeedback) {
			setMaterialsFeedback(null);
		}
		if (materialsError) {
			setMaterialsError(null);
		}
	};

	const submitMaterials = (event: FormEvent<HTMLFormElement>) => {
		event.preventDefault();
		setMaterialsError(null);
		setMaterialsFeedback(null);

		const value = materialsDraft;

		startMaterialsTransition(async () => {
			try {
				await updateMontageMaterialDetails({ montageId: montage.id, materialDetails: value });
				setMaterialsFeedback('Zapisano informacje o materiałach.');
				router.refresh();
			} catch (error) {
				const message =
					error instanceof Error ? error.message : 'Nie udało się zapisać informacji o materiałach.';
				setMaterialsError(message);
			}
		});
	};

	const handleChecklistToggle = (itemId: string, nextValue: boolean) => {
		setChecklistError(null);
		setChecklistPendingId(itemId);

		startChecklistTransition(async () => {
			try {
				await toggleMontageChecklistItem({ montageId: montage.id, itemId, completed: nextValue });
				router.refresh();
			} catch (error) {
				const message =
					error instanceof Error ? error.message : 'Nie udało się zaktualizować listy kontrolnej.';
				setChecklistError(message);
			} finally {
				setChecklistPendingId(null);
			}
		});
	};

	const submitChecklistAttachment = (itemId: string) => (event: FormEvent<HTMLFormElement>) => {
		event.preventDefault();
		setChecklistAttachmentError(null);

		const form = event.currentTarget;
		const formData = new FormData(form);
		formData.set('montageId', montage.id);
		formData.set('itemId', itemId);

		setChecklistAttachmentPendingId(itemId);

		startChecklistAttachmentTransition(async () => {
			try {
				await uploadChecklistAttachment(formData);
				form.reset();
				router.refresh();
			} catch (error) {
				const message =
					error instanceof Error ? error.message : 'Nie udało się dodać załącznika.';
				setChecklistAttachmentError({ id: itemId, message });
			} finally {
				setChecklistAttachmentPendingId(null);
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
			<CardHeader className="space-y-5 border-b border-border/60 pb-6">
				<div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
					<div className="flex-1 space-y-4">
						<div className="space-y-2">
							<CardTitle className="text-2xl font-semibold text-foreground lg:text-3xl">
								{montage.clientName}
							</CardTitle>
							<CardDescription className="text-sm text-muted-foreground">
								Utworzono {formatTimestamp(montage.createdAt)} • Aktualizacja {formatTimestamp(montage.updatedAt)}
							</CardDescription>
							{contactEntries.length ? (
								<div className="flex flex-wrap gap-2 pt-1">
									{contactEntries.map((entry) => (
										<div
											key={entry.key}
											className="flex items-center gap-1 rounded-full border border-border/60 bg-muted/20 px-3 py-1.5"
										>
											<span className="text-[10px] uppercase tracking-wide text-muted-foreground/80">{entry.label}</span>
											<span
												className={cn(
													'text-xs font-medium',
													entry.muted ? 'text-muted-foreground/70' : 'text-foreground',
												)}
											>
												{entry.value}
											</span>
										</div>
									))}
								</div>
							) : null}
						</div>
						{isMobile ? (
							<Collapsible open={quickInfoOpen} onOpenChange={setQuickInfoOpen} className="rounded-2xl border border-border/60 bg-muted/10">
								<CollapsibleTrigger asChild>
									<button
										type="button"
										aria-expanded={quickInfoOpen}
										className="flex w-full items-center justify-between gap-3 rounded-2xl px-3.5 py-2 text-left text-sm font-semibold text-foreground"
									>
										<span className="flex flex-col">
											<span>Szybkie informacje</span>
											<span className="text-xs font-normal text-muted-foreground">
												{hasMaterials ? materialsQuickSummary : 'Dodaj materiały, aby przygotować ekipę.'}
											</span>
										</span>
										<ChevronDown className={cn('size-4 transition-transform', quickInfoOpen ? 'rotate-180' : 'rotate-0')} />
									</button>
								</CollapsibleTrigger>
								<CollapsibleContent className="space-y-3 px-3.5 pb-3.5 pt-1.5">
									<div ref={quickInfoSectionRef} className="space-y-3.5">
										{renderQuickInfoDetails()}
									</div>
								</CollapsibleContent>
							</Collapsible>
						) : (
							<div className="space-y-3.5">{renderQuickInfoDetails()}</div>
						)}
					</div>
					<div className="flex flex-col items-start gap-2.5 sm:items-end">
						{currentStatusOption ? (
							<Badge variant="secondary" className="rounded-full px-3 py-1 text-[11px] uppercase tracking-wide text-muted-foreground">
								{currentStatusOption.label}
							</Badge>
						) : null}
						<Label className="text-xs uppercase tracking-wide text-muted-foreground">Status pipeline</Label>
						<Select
							defaultValue={montage.status}
							onValueChange={(value) => handleStatusChange(value as MontageStatus)}
							disabled={statusPending}
						>
							<SelectTrigger className="min-w-60" aria-label="Zmień status montaży">
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
				<div className="grid gap-2.5 sm:grid-cols-2 xl:grid-cols-4">
					<div className="rounded-xl border border-border/60 bg-muted/20 px-3.5 py-2.5">
						<p className="text-[11px] uppercase tracking-wide text-muted-foreground">Notatki</p>
						<p className="text-xl font-semibold text-foreground">{montage.notes.length}</p>
						<p className="text-xs text-muted-foreground">Łącznie wpisów</p>
					</div>
					<div className="rounded-xl border border-border/60 bg-muted/20 px-3.5 py-2.5">
						<p className="text-[11px] uppercase tracking-wide text-muted-foreground">Materiały</p>
						<p className="text-sm font-semibold text-foreground leading-snug line-clamp-3 min-h-14">
							{materialsSummary}
						</p>
						<p className="text-xs text-muted-foreground">
							{hasMaterials ? 'Opis widoczny dla zespołu' : 'Dodaj materiały, aby przygotować ekipę.'}
						</p>
					</div>
					<div className="rounded-xl border border-border/60 bg-muted/20 px-3.5 py-2.5">
						<p className="text-[11px] uppercase tracking-wide text-muted-foreground">Lista kontrolna</p>
						<p className="text-xl font-semibold text-foreground">{checklistProgressLabel}</p>
						<p className="text-xs text-muted-foreground">Zadania: {completedTasks}/{totalTasks}</p>
					</div>
					<div className="rounded-xl border border-border/60 bg-muted/20 px-3.5 py-2.5">
						<p className="text-[11px] uppercase tracking-wide text-muted-foreground">Ostatnia aktywność</p>
						<p className="text-sm font-medium text-foreground">{formatTimestamp(latestActivityTimestamp)}</p>
						<p className="text-xs text-muted-foreground">Automatycznie aktualizowane</p>
					</div>
				</div>
			</CardHeader>
			<CardContent className={cn('space-y-4 pt-0', isMobile ? 'pb-24' : 'pb-8')}>
				<section className="space-y-3.5 rounded-2xl border border-border/60 bg-muted/10 p-4">
					<div className="flex flex-wrap items-center justify-between gap-2.5">
						<h3 className="text-sm font-semibold text-foreground">Lista kontrolna montażu</h3>
						<div className="text-xs text-muted-foreground">{checklistProgressLabel} etapów zamkniętych</div>
					</div>
					{checklistError ? <span className="text-xs text-destructive">{checklistError}</span> : null}
					{montage.checklistItems.length === 0 ? (
						<p className="text-sm text-muted-foreground">Brak pozycji na liście kontrolnej. Dodaj je w ustawieniach panelu.</p>
					) : (
						<ul className="space-y-2.5">
							{montage.checklistItems.map((item) => (
								<li key={item.id} className="space-y-2.5 rounded-xl border border-border/60 bg-background p-3.5 shadow-sm">
									<div className="flex flex-col gap-2.5 md:flex-row md:items-center md:justify-between">
										<label className="flex items-start gap-2 text-sm font-medium text-foreground">
											<Checkbox
												checked={item.completed}
												onCheckedChange={(value) => handleChecklistToggle(item.id, Boolean(value))}
												disabled={checklistPending || checklistPendingId === item.id}
											/>
											<div className="space-y-1">
												<p>{item.label}</p>
												{item.allowAttachment ? (
													<span className="text-xs text-muted-foreground">Załącznik potwierdzający etap jest dostępny.</span>
												) : null}
											</div>
										</label>
										<div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
											<span>Aktualizacja: {formatTimestamp(item.updatedAt)}</span>
											{item.completed ? <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-emerald-700">Zakończono</span> : null}
										</div>
									</div>
									{item.allowAttachment ? (
										<div className="space-y-2.5 rounded-xl border border-dashed border-border/70 bg-muted/10 p-3.5">
											{item.attachment ? (
												<a
													href={item.attachment.url}
													target="_blank"
													rel="noopener noreferrer"
													className="group flex items-center gap-2 rounded-lg border border-border/60 bg-background px-3 py-2 text-sm transition hover:border-primary/60"
												>
													<FileIcon className="size-4 text-muted-foreground transition group-hover:text-primary" />
													<span className="truncate text-foreground group-hover:text-primary">
														{attachmentDisplayName(item.attachment)}
													</span>
												</a>
											) : (
												<p className="text-xs text-muted-foreground">Brak załącznika dla tego etapu.</p>
											)}
											<form onSubmit={submitChecklistAttachment(item.id)} className="flex flex-col gap-2 md:flex-row md:items-center md:gap-2.5">
												<input type="hidden" name="montageId" defaultValue={montage.id} />
												<input type="hidden" name="itemId" defaultValue={item.id} />
												<Input
													name="file"
													type="file"
													accept="image/*,application/pdf"
													required
													disabled={checklistAttachmentPending && checklistAttachmentPendingId === item.id}
													className="flex-1"
												/>
												<Input
													name="title"
													placeholder="Opis (opcjonalnie)"
													disabled={checklistAttachmentPending && checklistAttachmentPendingId === item.id}
													className="flex-1"
												/>
												<Button
													type="submit"
													size="sm"
													disabled={checklistAttachmentPending && checklistAttachmentPendingId === item.id}
												>
													{checklistAttachmentPending && checklistAttachmentPendingId === item.id
														? 'Wysyłanie...'
														: item.attachment
															? 'Zmień załącznik'
															: 'Dodaj załącznik'}
												</Button>
											</form>
											{checklistAttachmentError && checklistAttachmentError.id === item.id ? (
												<span className="text-xs text-destructive">{checklistAttachmentError.message}</span>
											) : null}
										</div>
									) : null}
								</li>
							))}
						</ul>
					)}
				</section>
				<Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as 'notes' | 'tasks')} className="flex flex-col gap-4">
					<div className="flex flex-wrap items-center justify-between gap-2.5">
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
							<span>Checklist: {checklistProgressLabel}</span>
							<span>Materiały: {hasMaterials ? materialsQuickSummary : 'brak'}</span>
						</div>
					</div>
					<TabsContent value="notes" className="space-y-3.5">
						{noteError ? <span className="text-xs text-destructive">{noteError}</span> : null}
						{montage.notes.length === 0 ? (
							<div className="rounded-xl border border-dashed border-border/70 bg-muted/20 p-4 text-sm text-muted-foreground">
								Brak notatek. Dodaj pierwszą informację, aby zainicjować timeline.
							</div>
						) : (
							<ul className="space-y-2.5">
								{montage.notes.map((note) => {
									const hasAttachments = note.attachments.length > 0;
									return (
										<li key={note.id} className="rounded-xl border border-border/60 bg-background p-3.5 shadow-sm">
											<div className="flex flex-wrap items-center justify-between gap-2.5 text-xs text-muted-foreground">
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
						<form
							onSubmit={submitNote}
							ref={noteFormRef}
							className="space-y-2.5 rounded-xl border border-border/60 bg-background p-3.5 shadow-sm"
						>
							<Textarea
								ref={noteTextareaRef}
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
						<div className="space-y-3.5 rounded-2xl border border-border/60 bg-muted/10 p-4">
							<div className="flex flex-wrap items-center justify-between gap-3">
								<div>
									<p className="text-xs uppercase tracking-wide text-muted-foreground">Oś aktywności</p>
									<h3 className="text-base font-semibold text-foreground">Historia zdarzeń</h3>
								</div>
								<span className="text-xs text-muted-foreground">Automatycznie generowana z notatek, zadań i listy kontrolnej.</span>
							</div>
							{timelineEvents.length === 0 ? (
								<p className="text-sm text-muted-foreground">Brak zarejestrowanej aktywności dla tego montażu.</p>
							) : (
								<div className="max-h-80 overflow-y-auto pr-1">
									<ul className="space-y-3 pr-1">
										{timelineEvents.map((event) => {
											const visuals = timelineVisuals[event.type];
											const Icon = visuals.icon;
											return (
												<li
													key={event.id}
													className="flex items-start gap-3 rounded-xl border border-border/60 bg-muted/30 p-3"
												>
													<div className={cn('flex h-9 w-9 items-center justify-center rounded-full', visuals.className)}>
														<Icon className="size-4" />
													</div>
													<div className="space-y-1">
														<p className="text-xs font-semibold text-muted-foreground">{event.label}</p>
														<p className="text-sm text-foreground">{event.description}</p>
														<p className="text-[11px] text-muted-foreground">{formatTimestamp(event.timestamp)}</p>
													</div>
												</li>
											);
										})}
									</ul>
								</div>
							)}
						</div>
					</TabsContent>
					<TabsContent value="tasks" className="space-y-4">
						{taskError ? <span className="text-xs text-destructive">{taskError}</span> : null}
						{montage.tasks.length === 0 ? (
							<div className="rounded-xl border border-dashed border-border/70 bg-muted/20 p-5 text-sm text-muted-foreground">
								Brak zadań. Dodaj elementy do checklisty, aby zaplanować kolejne kroki.
							</div>
						) : (
							<ul className="space-y-3">
								{montage.tasks.map((task) => (
									<li key={task.id} className="rounded-xl border border-border/60 bg-muted/15 p-3.5 shadow-sm">
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
							ref={taskFormRef}
							className="flex flex-col gap-2.5 rounded-xl border border-dashed border-border/70 bg-muted/15 p-3.5 shadow-sm sm:flex-row sm:items-end"
						>
							<Input
								ref={taskInputRef}
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
					{isMobile ? (
						<Sheet open={actionSheetOpen} onOpenChange={setActionSheetOpen}>
							<SheetTrigger asChild>
								<Button
									type="button"
									size="icon"
									className="fixed bottom-24 right-4 z-30 h-12 w-12 rounded-full shadow-lg shadow-primary/40 sm:hidden"
									aria-label="Szybkie działania"
								>
									<Plus className="size-5" />
								</Button>
							</SheetTrigger>
							<SheetContent side="bottom" className="space-y-5 pb-6">
								<SheetHeader>
									<SheetTitle>Szybkie działania</SheetTitle>
									<SheetDescription>Wybierz czynność, aby skupić widok na odpowiednim miejscu karty.</SheetDescription>
								</SheetHeader>
								<div className="grid gap-3">
									<Button
										type="button"
										variant="secondary"
										className="justify-start gap-2"
										onClick={() => handleQuickAction('note')}
									>
										<MessageSquareIcon className="size-4" />
										Dodaj notatkę
									</Button>
									<Button
										type="button"
										variant="secondary"
										className="justify-start gap-2"
										onClick={() => handleQuickAction('task')}
									>
										<CheckCircle2Icon className="size-4" />
										Dodaj zadanie
									</Button>
									<Button
										type="button"
										variant="secondary"
										className="justify-start gap-2"
										onClick={() => handleQuickAction('materials')}
									>
										<PaperclipIcon className="size-4" />
										Edytuj materiały
									</Button>
								</div>
							</SheetContent>
						</Sheet>
					) : null}
				</CardContent>
		</Card>
	);
}

type MontageCardProps = {
	montage: Montage;
	statusOptions: StatusOption[];
};
