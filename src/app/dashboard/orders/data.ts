export type OrderTimelineState = 'completed' | 'current' | 'pending';

export type OrderTimelineEntry = {
	id: string;
	title: string;
	description: string;
	timestamp: string | null;
	state: OrderTimelineState;
};

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

export type Order = {
	id: string;
	reference: string;
	customer: string;
	channel: string;
	status: string;
	currency: string;
	updatedAt: string;
	createdAt: string;
	statuses: OrderTimelineEntry[];
	items: OrderItem[];
	billing: OrderAddress;
	shipping: OrderShipping;
	totals: OrderTotals;
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
};

export const initialOrders: Order[] = [];
