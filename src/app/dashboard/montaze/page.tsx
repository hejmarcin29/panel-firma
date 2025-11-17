import Link from 'next/link';
import { asc, desc } from 'drizzle-orm';

import { CreateMontageForm } from './_components/create-montage-form';
import { MontageCard } from './_components/montage-card';
import { db } from '@/lib/db';
import {
	montageAttachments,
	montageNotes,
	montageTasks,
	montageStatuses,
	montages,
	type MontageStatus,
} from '@/lib/db/schema';

const statusLabels: Record<MontageStatus, { label: string; description: string }> = {
	lead: {
		label: 'Lead',
		description: 'Nowe zapytanie, oczekuje na kontakt.',
	},
	before_measurement: {
		label: 'Przed pomiarem',
		description: 'Ustal termin i szczegóły pomiaru.',
	},
	before_first_payment: {
		label: 'Przed 1. wpłatą',
		description: 'Klient zaakceptował wycenę, czekamy na wpłatę.',
	},
	before_installation: {
		label: 'Przed montażem',
		description: 'Przygotuj ekipę i materiały do montażu.',
	},
	before_final_invoice: {
		label: 'Przed FV i protokołem',
		description: 'Czekamy na odbiór, fakturę końcową i protokół.',
	},
};

const statusOptions = montageStatuses.map((value) => ({
	value,
	label: statusLabels[value].label,
	description: statusLabels[value].description,
}));

export default async function MontazePage() {
	const montageRows = await db.query.montages.findMany({
		orderBy: desc(montages.updatedAt),
		with: {
			notes: {
				orderBy: desc(montageNotes.createdAt),
				with: {
					author: true,
				},
			},
			attachments: {
				orderBy: desc(montageAttachments.createdAt),
				with: {
					uploader: true,
				},
			},
			tasks: {
				orderBy: [asc(montageTasks.orderIndex), asc(montageTasks.createdAt)],
			},
		},
	});

	const montagesData = montageRows.map((row) => ({
		id: row.id,
		clientName: row.clientName,
		contactPhone: row.contactPhone ?? null,
		contactEmail: row.contactEmail ?? null,
		address: row.address ?? null,
		status: row.status,
		createdAt: row.createdAt,
		updatedAt: row.updatedAt,
		notes: row.notes.map((note) => ({
			id: note.id,
			content: note.content,
			createdAt: note.createdAt,
			author: note.author
				? {
					id: note.author.id,
					name: note.author.name ?? null,
					email: note.author.email,
				}
				: null,
		})),
		attachments: row.attachments.map((attachment) => ({
			id: attachment.id,
			title: attachment.title ?? null,
			url: attachment.url,
			createdAt: attachment.createdAt,
			uploader: attachment.uploader
				? {
					id: attachment.uploader.id,
					name: attachment.uploader.name ?? null,
					email: attachment.uploader.email,
				}
				: null,
		})),
		tasks: row.tasks.map((task) => ({
			id: task.id,
			title: task.title,
			completed: Boolean(task.completed),
			updatedAt: task.updatedAt,
		})),
	}));

	return (
		<div className="space-y-10">
			<div className="space-y-2">
				<h1 className="text-2xl font-semibold">CRM montaże</h1>
				<p className="text-sm text-muted-foreground">
					Śledź status montaży, zapisuj notatki, załączaj zdjęcia i kontroluj checklistę zadań dla każdej realizacji.
				</p>
				<p className="text-xs text-muted-foreground">
					Pliki trafiają do chmury R2 – <Link className="text-primary hover:underline" href="/dashboard/montaze/galeria">otwórz galerię</Link>, aby zobaczyć wszystkie materiały.
				</p>
			</div>

			<section>
				<h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">Nowy montaż</h2>
				<p className="mb-4 text-xs text-muted-foreground">
					Dodaj klienta wraz z podstawowymi danymi, aby rozpocząć proces obsługi montaży.
				</p>
				<CreateMontageForm />
			</section>

			<section className="space-y-6">
				<h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">Lista montaży</h2>
				{montagesData.length === 0 ? (
					<p className="text-sm text-muted-foreground">
						Brak montaży w systemie. Dodaj pierwszą realizację, aby rozpocząć pracę z CRM.
					</p>
				) : (
					<div className="grid gap-6">
						{montagesData.map((montage) => (
							<MontageCard key={montage.id} montage={montage} statusOptions={statusOptions} />
						))}
					</div>
				)}
			</section>
		</div>
	);
}
