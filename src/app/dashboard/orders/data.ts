export type OrderTimelineState = 'completed' | 'current' | 'pending';

export type OrderTimelineTask = {
	id: string;
	label: string;
	completed: boolean;
	autoCompleted: boolean;
	manualOverride: boolean | null;
	completionSource: 'auto' | 'manual';
};

export type OrderTimelineEntry = {
	id: string;
	title: string;
	description: string;
	timestamp: string | null;
	state: OrderTimelineState;
	statusKey: string | null;
	tasks: OrderTimelineTask[];
};

export type OrderTaskOverrides = Record<string, boolean>;

export type OrderItem = {
	id: string;
	product: string;
	quantity: number;
	unitPrice: number;
	vatRate: number;
	unitPricePerSquareMeter: number;
	totalNet: number;
	totalGross: number;
};

export type OrderAddress = {
	name: string;
	street: string;
	postalCode: string;
	city: string;
	phone: string;
	email: string;
};

export type OrderShipping = OrderAddress & {
	sameAsBilling: boolean;
};

export type OrderTotals = {
	totalNet: number;
	totalGross: number;
};

export type ManualOrderSource = 'manual' | 'woocommerce';
export type ManualOrderType = 'production' | 'sample';

export type OrderDocument = {
	id: string;
	type: string;
	status: string;
	number: string | null;
	issueDate: string | null;
	pdfUrl: string | null;
};

export type OrderAttachment = {
	id: string;
	title: string | null;
	url: string;
	createdAt: string;
	uploader: {
		id: string;
		name: string | null;
		email: string;
	} | null;
};

export type Order = {
	id: string;
	reference: string;
	customer: string;
	channel: string;
	status: string;
	currency: string;
	source: ManualOrderSource;
	type: ManualOrderType;
	sourceOrderId: string | null;
	requiresReview: boolean;
	customerNote: string | null;
	updatedAt: string;
	createdAt: string;
	statuses: OrderTimelineEntry[];
	items: OrderItem[];
	billing: OrderAddress;
	shipping: OrderShipping;
	totals: OrderTotals;
	taskOverrides: OrderTaskOverrides;
	attachments: OrderAttachment[];
};

export type OrderItemPayload = Omit<OrderItem, 'id'>;

export type ManualOrderPayload = {
	reference: string;
	status: string;
	channel: string;
	notes: string;
	currency: string;
	billing: OrderAddress;
	shipping: OrderShipping;
	items: OrderItemPayload[];
	source?: ManualOrderSource;
	type?: ManualOrderType;
	sourceOrderId?: string | null;
	requiresReview?: boolean;
};

export const initialOrders: Order[] = [];
