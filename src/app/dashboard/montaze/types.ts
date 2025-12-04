import type { MontageStatus, MontageMaterialStatus, MontageInstallerStatus } from '@/lib/db/schema';

export type TimestampValue = Date | number | string | null | undefined;

export type MontageAttachment = {
	id: string;
	title: string | null;
	url: string;
	createdAt: TimestampValue;
	noteId: string | null;
	uploader: {
		id: string;
		name: string | null;
		email: string;
	} | null;
};

export type MontageNote = {
	id: string;
	content: string;
	createdAt: TimestampValue;
	author: {
		id: string;
		name: string | null;
		email: string;
	} | null;
	attachments: MontageAttachment[];
};

export type MontageTask = {
	id: string;
	title: string;
	source?: string;
	completed: boolean;
	updatedAt: TimestampValue;
	attachments?: MontageAttachment[];
};

export type MontageChecklistItem = {
	id: string;
	templateId: string | null;
	label: string;
	allowAttachment: boolean;
	completed: boolean;
	orderIndex: number;
	createdAt: TimestampValue;
	updatedAt: TimestampValue;
	attachment: MontageAttachment | null;
};

export type MaterialsEditHistoryEntry = {
	date: string;
	changes: {
		finalPanelAmount?: number | null;
		finalSkirtingLength?: number | null;
	};
};

export type Montage = {
	id: string;
	clientName: string;
	contactEmail: string | null;
	contactPhone: string | null;
	billingAddress: string | null;
	installationAddress: string | null;
	billingCity: string | null;
	installationCity: string | null;
	scheduledInstallationAt: TimestampValue;
	scheduledInstallationEndAt: TimestampValue;
	materialDetails: string | null;
	measurementDetails: string | null;
	floorArea: number | null;
	floorDetails: string | null;
	skirtingLength: number | null;
	skirtingDetails: string | null;
	panelModel: string | null;
	panelWaste: number | null;
	skirtingModel: string | null;
	skirtingWaste: number | null;
	modelsApproved: boolean;
	finalPanelAmount: number | null;
	finalSkirtingLength: number | null;
	materialsEditHistory: MaterialsEditHistoryEntry[] | null;
	additionalInfo: string | null;
	forecastedInstallationDate: TimestampValue;
	status: MontageStatus;
	displayId: string | null;
	materialStatus: MontageMaterialStatus;
	installerStatus: MontageInstallerStatus;
	createdAt: TimestampValue;
	updatedAt: TimestampValue;
	notes: MontageNote[];
	attachments: MontageAttachment[];
	tasks: MontageTask[];
	checklistItems: MontageChecklistItem[];
};

export type StatusOption = {
	value: string;
	label: string;
	description: string;
};
