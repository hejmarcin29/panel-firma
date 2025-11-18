import 'server-only';

import { appSettingKeys, getAppSetting, setAppSetting } from '@/lib/settings';

export type MontageChecklistTemplate = {
	id: string;
	label: string;
	allowAttachment: boolean;
};

export const DEFAULT_MONTAGE_CHECKLIST: readonly MontageChecklistTemplate[] = [
	{
		id: 'advance_invoice_issued',
		label: 'Wystawiono FV zaliczkową',
		allowAttachment: false,
	},
	{
		id: 'advance_invoice_paid',
		label: 'Zapłacono FV zaliczkową',
		allowAttachment: false,
	},
	{
		id: 'protocol_signed',
		label: 'Podpisano protokół odbioru',
		allowAttachment: true,
	},
	{
		id: 'final_invoice_issued',
		label: 'Wystawiono FV końcową',
		allowAttachment: false,
	},
	{
		id: 'final_invoice_paid',
		label: 'Zapłacono FV końcową',
		allowAttachment: false,
	},
] as const;

function cloneTemplates(templates: readonly MontageChecklistTemplate[]): MontageChecklistTemplate[] {
	return templates.map((template) => ({ ...template }));
}

function sanitizeTemplate(item: unknown, fallbackId: string): MontageChecklistTemplate | null {
	if (!item || typeof item !== 'object') {
		return null;
	}

	const candidate = item as Partial<MontageChecklistTemplate>;
	const label = typeof candidate.label === 'string' ? candidate.label.trim() : '';
	if (!label) {
		return null;
	}

	const id = typeof candidate.id === 'string' && candidate.id.trim() ? candidate.id.trim() : fallbackId;
	const allowAttachment = Boolean(candidate.allowAttachment);

	return { id, label, allowAttachment };
}

function parseChecklistSetting(rawValue: string | null): MontageChecklistTemplate[] {
	if (!rawValue) {
		return cloneTemplates(DEFAULT_MONTAGE_CHECKLIST);
	}

	try {
		const parsed = JSON.parse(rawValue) as unknown;
		if (!Array.isArray(parsed)) {
			return cloneTemplates(DEFAULT_MONTAGE_CHECKLIST);
		}

		const sanitized: MontageChecklistTemplate[] = [];
		for (const [index, entry] of parsed.entries()) {
			const fallbackId = `generated-${index}`;
			const normalized = sanitizeTemplate(entry, fallbackId);
			if (normalized) {
				sanitized.push(normalized);
			}
		}

		if (sanitized.length === 0) {
			return cloneTemplates(DEFAULT_MONTAGE_CHECKLIST);
		}

		return sanitized;
	} catch {
		return cloneTemplates(DEFAULT_MONTAGE_CHECKLIST);
	}
}

function dedupeTemplates(templates: MontageChecklistTemplate[]): MontageChecklistTemplate[] {
	const seen = new Set<string>();
	const result: MontageChecklistTemplate[] = [];

	for (const template of templates) {
		const id = template.id.trim();
		if (seen.has(id)) {
			continue;
		}
		seen.add(id);
		result.push({ ...template, id });
	}

	return result;
}

export async function getMontageChecklistTemplates(): Promise<MontageChecklistTemplate[]> {
	const rawValue = await getAppSetting(appSettingKeys.montageChecklist);
	const parsed = parseChecklistSetting(rawValue);
	return dedupeTemplates(parsed);
}

type PersistChecklistParams = {
	templates: MontageChecklistTemplate[];
	userId: string;
};

export async function setMontageChecklistTemplates({ templates, userId }: PersistChecklistParams): Promise<void> {
	const sanitized = templates
		.map((template, index) => {
			const label = template.label.trim();
			if (!label) {
				return null;
			}

			const id = template.id && template.id.trim() ? template.id.trim() : crypto.randomUUID();

			return {
				id,
				label,
				allowAttachment: Boolean(template.allowAttachment),
				order: index,
			};
		})
		.filter((entry): entry is { id: string; label: string; allowAttachment: boolean; order: number } => Boolean(entry));

	if (sanitized.length === 0) {
		throw new Error('Lista checkboxów nie może być pusta. Dodaj przynajmniej jeden etap.');
	}

	const deduped: typeof sanitized = [];
	const seen = new Set<string>();
	for (const entry of sanitized) {
		if (seen.has(entry.id)) {
			continue;
		}
		seen.add(entry.id);
		deduped.push(entry);
	}

	const payload = deduped
		.sort((a, b) => a.order - b.order)
		.map(({ id, label, allowAttachment }) => ({ id, label, allowAttachment }));

	await setAppSetting({
		key: appSettingKeys.montageChecklist,
		value: JSON.stringify(payload),
		userId,
	});
}
