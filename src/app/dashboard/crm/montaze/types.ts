import type { MontageStatus, MontageMaterialStatus, MontageInstallerStatus, MontageMaterialClaimType, MontageSampleStatus } from '@/lib/db/schema';

export type TimestampValue = Date | number | string | null | undefined;

export type MontageAttachment = {
	id: string;
	title: string | null;
	url: string;
	createdAt: TimestampValue;
	noteId: string | null;
    type?: string;
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
	};
};

export type MeasurementMaterialItem = {
    id: string;
    name: string;
    quantity: string;
    unit?: string;
    supplySide: 'installer' | 'company';
    estimatedCost?: number;
};

export type MontagePayment = {
    id: string;
    name: string;
    amount: string;
    status: 'pending' | 'paid';
    invoiceNumber: string;
    proformaUrl: string | null;
    invoiceUrl: string | null;
    paidAt: Date | null;
    createdAt: Date;
    type: 'advance' | 'final' | 'other';
};

export interface AlertSettings {
    missingMaterialStatusDays: number;
    missingInstallerStatusDays: number;
    missingMeasurerDays: number;
    missingInstallerDays: number;
    materialOrderedDays: number;
    materialInstockDays: number;
}

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
	materialDetails: string | null;
    clientInfo: string | null;
	measurementDetails: string | null;
    estimatedFloorArea?: number | null;
	floorArea: number | null;
	floorDetails: string | null;
	panelModel: string | null;
    panelProductId?: number | string | null;
	panelWaste: number | null;
	modelsApproved: boolean;
	measurementInstallationMethod: 'click' | 'glue' | null;
    measurementFloorPattern?: 'classic' | 'herringbone' | null;
    measurementLayingDirection?: string | null;
    measurementSketchPhotoUrl?: string | null;
	measurementSubfloorCondition: string | null;
	measurementAdditionalWorkNeeded: boolean;
	measurementAdditionalWorkDescription: string | null;
	measurementAdditionalMaterials: MeasurementMaterialItem[] | null;
    measurementRooms?: {
        name: string;
        area: number;
    }[] | null;
    floorProducts?: {
        id: string;
        montageId: string;
        productId?: string | null;
        name: string;
        area: number;
        waste: number;
        installationMethod: 'click' | 'glue' | null;
        pattern?: string | null;
        layingDirection?: string | null;
        rooms?: {
            name: string;
            area: number;
        }[] | null;
    }[];
	finalPanelAmount: number | null;
    
    // Protocol Fields
    contractNumber?: string | null;
    contractDate?: TimestampValue;
    protocolStatus?: string | null;
    protocolData?: Record<string, unknown> | null; // Using Record<string, unknown> instead of any
    clientSignatureUrl?: string | null;
    installerSignatureUrl?: string | null;

	materialsEditHistory: MaterialsEditHistoryEntry[] | null;
	additionalInfo: string | null;
	sketchUrl?: string | null;
	forecastedInstallationDate: TimestampValue;
	status: MontageStatus;
    sampleStatus?: MontageSampleStatus | null;
    accessToken?: string | null;
    sampleDelivery?: {
        method: 'courier' | 'parcel_locker';
        pointName?: string;
        pointAddress?: string;
        products?: { id: string; name: string; sku?: string }[];
        courierAddress?: {
            street: string;
            city: string;
            postalCode: string;
        };
        address?: { // Legacy/Schema alignment
            street: string;
            buildingNumber: string;
            city: string;
            postalCode: string;
        };
        recipient: {
            name: string;
            email: string;
            phone: string;
        };
    } | null;
	displayId: string | null;
	materialStatus: MontageMaterialStatus;
    materialClaimType?: MontageMaterialClaimType | null;
	installerStatus: MontageInstallerStatus;
    payments: MontagePayment[];
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
    costEstimationCompletedAt?: TimestampValue;
    completedAt?: TimestampValue;
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

export type FloorProductState = {
    id: string;
    productId: string | null;
    name: string;
    area: number;
    waste: number;
    installationMethod: 'click' | 'glue';
    pattern: 'simple' | 'herringbone' | 'chevron' | 'tiles' | string; // Allowing string for robustness
    layingDirection: string;
    rooms: { name: string; area: number }[];
};



