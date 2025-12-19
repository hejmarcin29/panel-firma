import type {
	Montage,
	MontageAttachment,
	MontageChecklistItem,
	MontageNote,
	MontageTask,
	MaterialsEditHistoryEntry,
} from './types';
import {
	montageAttachments,
	montageChecklistItems,
	montageNotes,
	montageTasks,
	montages,
    quotes,
	type MontageStatus,
	users,
    customers,
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
    quotes: Array<typeof quotes.$inferSelect>;
    installer?: typeof users.$inferSelect | null;
    measurer?: typeof users.$inferSelect | null;
    architect?: typeof users.$inferSelect | null;
    customer?: typeof customers.$inferSelect | null;
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
		isInternal: note.isInternal ?? false,
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
		source: task.source,
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
        isCompany: row.isCompany ?? false,
        companyName: row.companyName ?? null,
        nip: row.nip ?? null,
		contactEmail: row.contactEmail ?? null,
		contactPhone: row.contactPhone ?? null,
		billingAddress,
        billingPostalCode: row.billingPostalCode ?? null,
		installationAddress,
        installationPostalCode: row.installationPostalCode ?? null,
		billingCity: row.billingCity ?? null,
		installationCity: row.installationCity ?? null,
        customerId: row.customerId ?? null,
		scheduledInstallationAt: row.scheduledInstallationAt ?? null,
		scheduledInstallationEndAt: row.scheduledInstallationEndAt ?? null,
		materialDetails: row.materialDetails ?? null,
		measurementDetails: row.measurementDetails ?? null,
		floorArea: row.floorArea ?? null,
		floorDetails: row.floorDetails ?? null,
		skirtingLength: row.skirtingLength ?? null,
		skirtingDetails: row.skirtingDetails ?? null,
		panelModel: row.panelModel ?? null,
		panelWaste: row.panelWaste ?? null,
		skirtingModel: row.skirtingModel ?? null,
		skirtingWaste: row.skirtingWaste ?? null,
		modelsApproved: row.modelsApproved ?? false,
		measurementInstallationMethod: row.measurementInstallationMethod ?? null,
		measurementSubfloorCondition: row.measurementSubfloorCondition ?? null,
		measurementAdditionalWorkNeeded: row.measurementAdditionalWorkNeeded ?? false,
		measurementAdditionalWorkDescription: row.measurementAdditionalWorkDescription ?? null,
		measurementAdditionalMaterials: row.measurementAdditionalMaterials ?? null,
        measurementSeparateSkirting: row.measurementSeparateSkirting ?? null,
		finalPanelAmount: row.finalPanelAmount ?? null,
		finalSkirtingLength: row.finalSkirtingLength ?? null,
		materialsEditHistory: (row.materialsEditHistory as unknown as MaterialsEditHistoryEntry[]) ?? null,
		additionalInfo: row.additionalInfo ?? null,
		forecastedInstallationDate: row.forecastedInstallationDate ?? null,
		status: row.status as MontageStatus,
		displayId: row.displayId ?? null,
		createdAt: row.createdAt,
		updatedAt: row.updatedAt,
        materialStatus: row.materialStatus ?? 'none',
        installerStatus: row.installerStatus ?? 'none',
        installerId: row.installerId,
        measurerId: row.measurerId,
        architectId: row.architectId,
        installer: row.installer ? { id: row.installer.id, name: row.installer.name, email: row.installer.email } : null,
        measurer: row.measurer ? { id: row.measurer.id, name: row.measurer.name, email: row.measurer.email } : null,
        customer: row.customer ? { 
            id: row.customer.id, 
            source: row.customer.source,
            name: row.customer.name,
            email: row.customer.email,
            phone: row.customer.phone,
            referralToken: row.customer.referralToken,
            // referralCode: row.customer.referralCode
        } : null,
        architect: row.architect ? { id: row.architect.id, name: row.architect.name, email: row.architect.email } : null,
        technicalAudit: row.technicalAudit,
        materialLog: row.materialLog,
        
        // Protocol Fields
        contractNumber: row.contractNumber,
        contractDate: row.contractDate,
        protocolStatus: row.protocolStatus,
        protocolData: row.protocolData,
        clientSignatureUrl: row.clientSignatureUrl,
        installerSignatureUrl: row.installerSignatureUrl,

        quotes: row.quotes.map(q => ({
            id: q.id,
            status: q.status,
            totalNet: q.totalNet,
            totalGross: q.totalGross,
            createdAt: q.createdAt,
        })),
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

export function formatScheduleRange(start: Montage['scheduledInstallationAt'], end: Montage['scheduledInstallationEndAt']) {
	if (!start) {
		return null;
	}

	const startDate =
		start instanceof Date
			? start
			: typeof start === 'number'
				? new Date(start)
				: typeof start === 'string'
					? new Date(start)
					: null;

	if (!startDate || Number.isNaN(startDate.getTime())) {
		return null;
	}

	const startStr = new Intl.DateTimeFormat('pl-PL', { dateStyle: 'medium' }).format(startDate);

	if (!end) {
		return startStr;
	}

	const endDate =
		end instanceof Date
			? end
			: typeof end === 'number'
				? new Date(end)
				: typeof end === 'string'
					? new Date(end)
					: null;

	if (!endDate || Number.isNaN(endDate.getTime())) {
		return startStr;
	}

	const endStr = new Intl.DateTimeFormat('pl-PL', { dateStyle: 'medium' }).format(endDate);

    if (startStr === endStr) {
        return startStr;
    }

	return `${startStr} - ${endStr}`;
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
