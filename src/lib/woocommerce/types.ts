export type WooMetaData = {
	id: number;
	key: string;
	value: unknown;
	display_key?: string;
	display_value?: unknown;
};

export type WooLineItem = {
	id: number;
	name: string;
	sku: string | null;
	product_id: number;
	variation_id: number;
	quantity: number;
	subtotal: string;
	subtotal_tax: string;
	total: string;
	total_tax: string;
	price: number;
	meta_data: WooMetaData[];
};

export type WooShippingLine = {
	id: number;
	method_title: string;
	method_id: string;
	instance_id: string;
	total: string;
	total_tax: string;
	taxes: Array<{
		id: number;
		total: string;
		subtotal: string;
	}>;
	tax_status: string;
	meta_data: WooMetaData[];
};

export type WooAddress = {
	first_name: string;
	last_name: string;
	company: string;
	address_1: string;
	address_2: string;
	city: string;
	state: string;
	postcode: string;
	country: string;
	email: string;
	phone: string;
};

export type WooOrder = {
	id: number;
	number: string;
	status: string;
	currency: string;
	total: string;
	total_tax: string;
	note?: string | null;
	customer_note: string | null;
	date_created: string;
	date_modified: string;
	billing: WooAddress;
	shipping: WooAddress;
	line_items: WooLineItem[];
	shipping_lines: WooShippingLine[];
	meta_data: WooMetaData[];
};
