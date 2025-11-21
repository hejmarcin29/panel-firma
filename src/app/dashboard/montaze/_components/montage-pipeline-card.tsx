'use client';

import { useMemo, type ReactNode } from 'react';

import Link from 'next/link';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import {
	Sheet,
	SheetContent,
	SheetDescription,
	SheetHeader,
	SheetTitle,
	SheetTrigger,
} from '@/components/ui/sheet';
import { useIsMobile } from '@/hooks/use-mobile';

import { MontageCard } from './montage-card';
import type { Montage, StatusOption } from '../types';
import { summarizeMaterialDetails } from '../utils';

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

function formatScheduleDate(value: Montage['scheduledInstallationAt']) {
	if (!value) {
		return null;
	}

	const date =
		value instanceof Date
			? value
			: typeof value === 'number'
				? new Date(value)
				: typeof value === 'string'
					? new Date(value)
					: null;

	if (!date || Number.isNaN(date.getTime())) {
		return null;
	}

	return new Intl.DateTimeFormat('pl-PL', { dateStyle: 'medium' }).format(date);
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
	const isMobile = useIsMobile();
	const completedTasks = useMemo(() => countCompleted(montage.tasks), [montage.tasks]);
	const totalTasks = montage.tasks.length;
	const materialsSummary = useMemo(
		() => summarizeMaterialDetails(montage.materialDetails, 72),
		[montage.materialDetails],
	);
	const hasMaterials = Boolean(montage.materialDetails?.trim());
	const latestUpdate = formatTimestamp(montage.updatedAt);
	const billingAddress = montage.billingAddress;
	const installationAddress = montage.installationAddress;
	const addressLine = installationAddress || billingAddress;
	const cityLine = montage.installationCity || montage.billingCity || null;
	const scheduledDate = useMemo(() => formatScheduleDate(montage.scheduledInstallationAt), [montage.scheduledInstallationAt]);

	const renderCard = (cta: ReactNode) => (
		<Card className="group w-full border border-border/60 bg-linear-to-br from-background via-background to-muted shadow-sm transition hover:-translate-y-0.5 hover:shadow-lg">
			<CardHeader className="space-y-4">
				<div className="flex items-start justify-between gap-3">
					<div className="flex items-center gap-3">
						<div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-sm font-semibold text-primary">
							{initials(montage.clientName)}
						</div>
						<div className="space-y-1">
							<CardTitle className="text-base font-semibold leading-tight text-foreground">
								{montage.clientName}
							</CardTitle>
							<CardDescription className="text-xs text-muted-foreground">Aktualizacja: {latestUpdate}</CardDescription>
						</div>
					</div>
					<Badge variant={hasMaterials ? 'default' : 'outline'} className="rounded-full text-[11px] uppercase tracking-wide">
						{hasMaterials ? 'materiały' : 'brak materiałów'}
					</Badge>
				</div>
				{addressLine || cityLine ? (
					<div className="space-y-1">
						{addressLine ? <p className="text-xs text-muted-foreground line-clamp-2">{addressLine}</p> : null}
						{cityLine ? <p className="text-xs font-medium text-foreground/80">Miasto: {cityLine}</p> : null}
					</div>
				) : null}
			</CardHeader>
			<CardContent className="space-y-4">
				<div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
					{montage.contactPhone ? <span>tel. {montage.contactPhone}</span> : null}
					{montage.contactEmail ? <span>{montage.contactEmail}</span> : null}
				</div>
				<div className="flex flex-wrap items-center gap-2 text-xs">
					<Badge variant="secondary" className="rounded-full px-2">
						{totalTasks === 0 ? 'Brak zadan' : `${completedTasks}/${totalTasks} zadan`}
					</Badge>
					<Badge variant="secondary" className="rounded-full px-2">
						{montage.notes.length} not.
					</Badge>
					<Badge variant="outline" className="rounded-full px-2">
						Termin: {scheduledDate ?? 'brak'}
					</Badge>
				</div>
				<Separator />
				<div className="flex items-center justify-between gap-3">
					<div className="flex-1 text-xs text-muted-foreground">
						<p className="text-[11px] uppercase tracking-wide">Materiały</p>
						<p className="mt-1 line-clamp-2 text-sm font-medium text-foreground">{materialsSummary}</p>
					</div>
					{cta}
				</div>
			</CardContent>
		</Card>
	);

	if (isMobile) {
		return renderCard(
			<Button size="sm" variant="outline" asChild>
				<Link href={`/dashboard/montaze/${montage.id}`}>Otworz panel</Link>
			</Button>,
		);
	}

	return (
		<Sheet>
			{renderCard(
				<SheetTrigger asChild>
					<Button size="sm" variant="outline">
						Otworz panel
					</Button>
				</SheetTrigger>,
			)}
			<SheetContent
				side="right"
				className="h-full w-full max-w-full border-l bg-background sm:max-w-[420px] md:max-w-[560px] lg:max-w-[660px] xl:max-w-[760px] 2xl:max-w-[860px]"
			>
				<SheetHeader className="gap-2 px-6 pt-6">
					<SheetTitle className="text-base font-semibold">Panel montazu</SheetTitle>
					<SheetDescription className="text-sm text-muted-foreground">
						Szczegoly klienta, zadania i materiały dostepne w jednym miejscu. Wszystkie zmiany zapisujemy od razu w bazie.
					</SheetDescription>
				</SheetHeader>
				<div className="flex-1 overflow-y-auto overflow-x-hidden px-6 pb-10">
					<MontageCard montage={montage} statusOptions={statusOptions} />
				</div>
			</SheetContent>
		</Sheet>
	);
}
