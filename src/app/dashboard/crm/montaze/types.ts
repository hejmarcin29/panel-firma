import type { MontageStatus, MontageMaterialStatus, MontageInstallerStatus, MontageMaterialClaimType } from '@/lib/db/schema';

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
	isInternal: boolean;
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

export type MontageLog = {
    id: string;
    userId: string | null;
    action: string;
    details: string | null;
    ipAddress: string | null;
    userAgent: string | null;
    createdAt: Date;
};

export type MaterialsEditHistoryEntry = {
	date: string;
	changes: {
		finalPanelAmount?: number | null;
		finalSkirtingLength?: number | null;
	};
};

export type MeasurementMaterialItem = {
    id: string;
    name: string;
    quantity: string;
    supplySide: 'installer' | 'company';
    estimatedCost?: number;
};

export type Montage = {
	id: string;
	clientName: string;
    isCompany?: boolean;
    isHousingVat?: boolean | null;
    companyName?: string | null;
    nip?: string | null;
	contactEmail: string | null;
	contactPhone: string | null;
	billingAddress: string | null;
    billingPostalCode?: string | null;
	installationAddress: string | null;
    installationPostalCode?: string | null;
	billingCity: string | null;
	installationCity: string | null;
    customerId?: string | null;
	scheduledInstallationAt: TimestampValue;
	scheduledInstallationEndAt: TimestampValue;
    measurementDate?: TimestampValue;
    scheduledSkirtingInstallationAt?: TimestampValue;
    scheduledSkirtingInstallationEndAt?: TimestampValue;
	materialDetails: string | null;
    clientInfo: string | null;
	measurementDetails: string | null;
	floorArea: number | null;
	floorDetails: string | null;
	skirtingLength: number | null;
	skirtingDetails: string | null;
	panelModel: string | null;
    panelProductId?: number | null;
	panelWaste: number | null;
	skirtingModel: string | null;
    skirtingProductId?: number | null;
	skirtingWaste: number | null;
	modelsApproved: boolean;
	measurementInstallationMethod: 'click' | 'glue' | null;
    measurementFloorPattern?: 'classic' | 'herringbone' | null;
	measurementSubfloorCondition: string | null;
	measurementAdditionalWorkNeeded: boolean;
	measurementAdditionalWorkDescription: string | null;
	measurementAdditionalMaterials: MeasurementMaterialItem[] | null;
    measurementSeparateSkirting?: boolean | null;
	finalPanelAmount: number | null;
	finalSkirtingLength: number | null;
    
    // Protocol Fields
    contractNumber?: string | null;
    contractDate?: TimestampValue;
    protocolStatus?: string | null;
    protocolData?: Record<string, unknown> | null; // Using Record<string, unknown> instead of any
    clientSignatureUrl?: string | null;
    installerSignatureUrl?: string | null;

    // Skirting Protocol & Logistics
    skirtingMaterialStatus?: MontageMaterialStatus | null;
    skirtingMaterialClaimType?: MontageMaterialClaimType | null;
    skirtingProtocolData?: Record<string, unknown> | null;
    skirtingClientSignatureUrl?: string | null;

	materialsEditHistory: MaterialsEditHistoryEntry[] | null;
	additionalInfo: string | null;
	sketchUrl?: string | null;
	forecastedInstallationDate: TimestampValue;
	status: MontageStatus;
	displayId: string | null;
	materialStatus: MontageMaterialStatus;
    materialClaimType?: MontageMaterialClaimType | null;
	installerStatus: MontageInstallerStatus;
	installerId?: string | null;
	measurerId?: string | null;
	architectId?: string | null;
	installer?: { id: string; name: string | null; email: string } | null;
	measurer?: { id: string; name: string | null; email: string } | null;
	architect?: { id: string; name: string | null; email: string } | null;
    customer?: { 
        id: string; 
        source: string | null;
        name: string;
        email: string | null;
        phone: string | null;
        referralToken?: string | null;
        // referralCode?: string | null;
    } | null;
    technicalAudit?: unknown;
    materialLog?: unknown;
	createdAt: TimestampValue;
	updatedAt: TimestampValue;
	notes: MontageNote[];
	attachments: MontageAttachment[];
	tasks: MontageTask[];
	checklistItems: MontageChecklistItem[];
    quotes: MontageQuote[];
    settlement?: MontageSettlement | null;
};

export type MontageSettlement = {
    id: string;
    status: string;
    totalAmount: number;
    calculations: Record<string, unknown>;
    note?: string | null;
    overrideAmount?: number | null;
    overrideReason?: string | null;
    corrections?: unknown | null;
    createdAt: TimestampValue;
    updatedAt: TimestampValue;
};

export type QuoteItem = {
    name: string;
    quantity: number;
    unit: string;
    priceNet: number;
    vatRate: number;
    amountNet: number;
    amountGross: number;
};

export type MontageQuote = {
    id: string;
    status: string;
    totalNet: number;
    totalGross: number;
    createdAt: TimestampValue;
    items: QuoteItem[];
    signedAt?: TimestampValue;
};

export type StatusOption = {
	value: string;
	label: string;
	description: string;
};

export type AlertSettings = {
    missingMaterialStatusDays: number;
    missingInstallerStatusDays: number;
    missingMeasurerDays: number;
    missingInstallerDays: number;
    materialOrderedDays: number;
    materialInstockDays: number;
};

