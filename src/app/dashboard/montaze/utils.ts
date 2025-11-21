import type {
	Montage,
	MontageAttachment,
	MontageChecklistItem,
	MontageNote,
	MontageTask,
} from './types';
import {
	montageAttachments,
	montageChecklistItems,
	montageNotes,
	montageTasks,
	montages,
	type MontageStatus,
	users,
} from '@/lib/db/schema';

function normalizeAttachmentUrl(rawUrl: string, publicBaseUrl: string | null): string {
	if (!publicBaseUrl) {
		return rawUrl;
	}

	try {
		const candidate = new URL(rawUrl);
		const base = new URL(publicBaseUrl.endsWith('/') ? publicBaseUrl : `${publicBaseUrl}/`);

		const sameHost = candidate.host === base.host;
		const basePath = base.pathname.endsWith('/') ? base.pathname : `${base.pathname}/`;
		const alreadyNormalized = sameHost && candidate.pathname.startsWith(basePath);
		if (alreadyNormalized) {
			return rawUrl;
		}

		const normalizedPath = candidate.pathname.replace(/^\/+/g, '');
		const resolved = new URL(normalizedPath, base);
		resolved.search = candidate.search;
		resolved.hash = candidate.hash;
		return resolved.toString();
	} catch {
		return rawUrl;
	}
}

export type MontageRow = typeof montages.$inferSelect & {
	notes: Array<
		(typeof montageNotes.$inferSelect) & {
			author: typeof users.$inferSelect | null;
			attachments: Array<
				(typeof montageAttachments.$inferSelect) & {
					uploader: typeof users.$inferSelect | null;
				}
			>;
		}
	>;
	tasks: Array<typeof montageTasks.$inferSelect>;
	checklistItems: Array<
		(typeof montageChecklistItems.$inferSelect) & {
			attachment: ((typeof montageAttachments.$inferSelect) & {
				uploader: typeof users.$inferSelect | null;
			}) | null;
		}
	>;
	attachments: Array<
		(typeof montageAttachments.$inferSelect) & {
			uploader: typeof users.$inferSelect | null;
		}
	>;
};

function mapAttachment(
	attachment: MontageRow['attachments'][number],
	publicBaseUrl: string | null,
): MontageAttachment {
	return {
		id: String(attachment.id),
		title: attachment.title ?? null,
		url: normalizeAttachmentUrl(String(attachment.url), publicBaseUrl),
		createdAt: attachment.createdAt,
		noteId: attachment.noteId ? String(attachment.noteId) : null,
		uploader: attachment.uploader
			? {
				id: String(attachment.uploader.id),
				name: attachment.uploader.name ?? null,
				email: attachment.uploader.email,
			}
			: null,
	};
}

function mapNote(note: MontageRow['notes'][number], publicBaseUrl: string | null): MontageNote {
	return {
		id: String(note.id),
		content: note.content,
		createdAt: note.createdAt,
		author: note.author
			? {
				id: String(note.author.id),
				name: note.author.name ?? null,
				email: note.author.email,
			}
			: null,
		attachments: note.attachments.map((attachment) => mapAttachment(attachment, publicBaseUrl)),
	};
}

function mapChecklistItem(
	item: MontageRow['checklistItems'][number],
	publicBaseUrl: string | null,
): MontageChecklistItem {
	return {
		id: String(item.id),
		templateId: item.templateId ?? null,
		label: item.label,
		allowAttachment: Boolean(item.allowAttachment),
		completed: Boolean(item.completed),
		orderIndex: Number(item.orderIndex ?? 0),
		createdAt: item.createdAt,
		updatedAt: item.updatedAt,
		attachment: item.attachment ? mapAttachment(item.attachment, publicBaseUrl) : null,
	};
}

function mapTask(task: MontageRow['tasks'][number]): MontageTask {
	return {
		id: String(task.id),
		title: task.title,
		completed: Boolean(task.completed),
		updatedAt: task.updatedAt,
	};
}

export function mapMontageRow(row: MontageRow, publicBaseUrl: string | null): Montage {
	const billingAddress = row.billingAddress ?? row.address ?? null;
	const installationAddress = row.installationAddress ?? row.address ?? null;

	return {
		id: String(row.id),
		clientName: row.clientName,
		contactEmail: row.contactEmail ?? null,
		contactPhone: row.contactPhone ?? null,
		billingAddress,
		installationAddress,
		billingCity: row.billingCity ?? null,
		installationCity: row.installationCity ?? null,
		scheduledInstallationAt: row.scheduledInstallationAt ?? null,
		materialDetails: row.materialDetails ?? null,
		status: row.status as MontageStatus,
		createdAt: row.createdAt,
		updatedAt: row.updatedAt,
		notes: row.notes.map((note) => mapNote(note, publicBaseUrl)),
		attachments: row.attachments.map((attachment) => mapAttachment(attachment, publicBaseUrl)),
		tasks: row.tasks.map(mapTask),
		checklistItems: row.checklistItems.map((item) => mapChecklistItem(item, publicBaseUrl)),
	};
}

export function formatRelativeDate(value: Montage['updatedAt']) {
	if (!value) {
		return 'brak danych';
	}

	const date = value instanceof Date ? value : new Date(typeof value === 'number' ? value : Number(value));
	if (Number.isNaN(date.getTime())) {
		return 'brak danych';
	}

	return new Intl.RelativeTimeFormat('pl', { numeric: 'auto' }).format(
		Math.round((date.getTime() - Date.now()) / (1000 * 60 * 60 * 24)),
		'day',
	);
}

export function formatScheduleDate(value: Montage['scheduledInstallationAt']) {
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

export function summarizeMaterialDetails(value: Montage['materialDetails'], maxLength = 80) {
	if (!value) {
		return 'Brak materiałów';
	}

	const normalized = value
		.split(/\r?\n+/)
		.map((segment) => segment.trim())
		.filter(Boolean)
		.join(', ')
		.replace(/\s{2,}/g, ' ')
		.trim();

	if (!normalized) {
		return 'Brak materiałów';
	}

	if (normalized.length <= maxLength) {
		return normalized;
	}

	return `${normalized.slice(0, Math.max(0, maxLength - 1)).trimEnd()}…`;
}
