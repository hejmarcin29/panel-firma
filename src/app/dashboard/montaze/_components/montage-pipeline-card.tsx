'use client';

import { useMemo } from 'react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Separator } from '@/components/ui/separator';

import { MontageCard, type Montage, type StatusOption } from './montage-card';

function countCompleted(tasks: Montage['tasks']): number {
	return tasks.filter((task) => task.completed).length;
}

function formatTimestamp(value: Montage['updatedAt']) {
	if (!value) {
		return 'brak danych';
	}

	const date = value instanceof Date ? value : new Date(Number(value));
	if (Number.isNaN(date.getTime())) {
		return 'brak danych';
	}

	return new Intl.RelativeTimeFormat('pl', { numeric: 'auto' }).format(
		Math.round((date.getTime() - Date.now()) / (1000 * 60 * 60 * 24)),
		'day',
	);
}

function initials(name: string) {
	const matches = name
		.split(/\s+/)
		.filter(Boolean)
		.slice(0, 2)
		.map((segment) => segment[0]?.toUpperCase() ?? '');
	return matches.join('') || 'M';
}

type Props = {
	montage: Montage;
	statusOptions: StatusOption[];
};

export function MontagePipelineCard({ montage, statusOptions }: Props) {
	const completedTasks = useMemo(() => countCompleted(montage.tasks), [montage.tasks]);
	const totalTasks = montage.tasks.length;
	const hasAttachments = montage.attachments.length > 0;
	const latestUpdate = formatTimestamp(montage.updatedAt);

	return (
		<Dialog>
			<Card className="group w-full border border-border/60 bg-linear-to-br from-background via-background to-muted shadow-sm transition hover:-translate-y-0.5 hover:shadow-lg">
				<CardHeader className="space-y-3">
					<div className="flex items-start justify-between gap-3">
						<div className="flex items-center gap-3">
							<div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-sm font-semibold text-primary">
								{initials(montage.clientName)}
							</div>
							<div>
								<CardTitle className="text-base font-semibold leading-tight text-foreground">
									{montage.clientName}
								</CardTitle>
								<CardDescription>Aktualizacja: {latestUpdate}</CardDescription>
							</div>
						</div>
						<Badge variant={hasAttachments ? 'default' : 'outline'} className="text-[11px] uppercase tracking-wide">
							{hasAttachments ? `${montage.attachments.length} pl.` : 'brak plikow'}
						</Badge>
					</div>
					{montage.address ? (
						<p className="text-xs text-muted-foreground line-clamp-2">{montage.address}</p>
					) : null}
				</CardHeader>
				<CardContent className="space-y-4">
					<div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
						{montage.contactPhone ? <span>tel. {montage.contactPhone}</span> : null}
						{montage.contactEmail ? <span>{montage.contactEmail}</span> : null}
					</div>
					<div className="flex items-center gap-3 text-xs">
						<Badge variant="secondary" className="rounded-full px-2">
							{totalTasks === 0 ? 'Brak zadan' : `${completedTasks}/${totalTasks} zadan`}
						</Badge>
						<Badge variant="secondary" className="rounded-full px-2">
							{montage.notes.length} not.
						</Badge>
					</div>
					<Separator />
					<div className="flex items-center justify-between">
						<div className="flex items-center gap-2 text-[11px] uppercase tracking-wide text-muted-foreground">
							<span>Pliki</span>
							<span className="h-1 w-1 rounded-full bg-muted-foreground/60" />
							<span>{montage.attachments.length}</span>
						</div>
						<DialogTrigger asChild>
							<Button size="sm" variant="outline">
								Otworz panel
							</Button>
						</DialogTrigger>
					</div>
				</CardContent>
			</Card>
			<DialogContent className="max-h-[95vh] w-[min(960px,95vw)] overflow-y-auto p-0">
				<DialogHeader className="px-6 pt-6">
					<DialogTitle className="text-lg">Panel montazu</DialogTitle>
				</DialogHeader>
				<div className="p-6">
					<MontageCard montage={montage} statusOptions={statusOptions} />
				</div>
			</DialogContent>
		</Dialog>
	);
}
