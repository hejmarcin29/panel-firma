'use server';

import { db } from '@/lib/db';
import { customers, orders, montages, manualOrders } from '@/lib/db/schema';
import { desc, eq, ilike, or, inArray } from 'drizzle-orm';

export type CustomerWithStats = typeof customers.$inferSelect & {
	ordersCount: number;
	montagesCount: number;
	lastActivity: Date | null;
};

export type CustomerDetails = typeof customers.$inferSelect & {
	orders: (typeof manualOrders.$inferSelect)[];
	montages: (typeof montages.$inferSelect)[];
};

export async function getCustomers(query?: string): Promise<CustomerWithStats[]> {
	const searchFilter = query
		? or(
				ilike(customers.name, `%${query}%`),
				ilike(customers.email, `%${query}%`),
				ilike(customers.phone, `%${query}%`),
				ilike(customers.billingCity, `%${query}%`)
		  )
		: undefined;

	const rows = await db.query.customers.findMany({
		where: searchFilter,
		orderBy: [desc(customers.createdAt)],
		limit: 50,
	});

    const emails = rows.map(c => c.email).filter(Boolean) as string[];
    
    let customerOrders: Pick<typeof manualOrders.$inferSelect, 'billingEmail' | 'createdAt'>[] = [];
    if (emails.length > 0) {
        customerOrders = await db.query.manualOrders.findMany({
            where: inArray(manualOrders.billingEmail, emails),
            columns: {
                billingEmail: true,
                createdAt: true,
            }
        });
    }

	return rows.map((c) => {
        const myOrders = customerOrders.filter(o => o.billingEmail === c.email);
        const lastOrderDate = myOrders.length > 0 
            ? myOrders.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())[0].createdAt 
            : null;

		return {
			...c,
			ordersCount: myOrders.length,
			montagesCount: 0, 
			lastActivity: lastOrderDate,
		};
	});
}

export async function getCustomerDetails(customerId: string): Promise<CustomerDetails> {
	const customer = await db.query.customers.findFirst({
		where: eq(customers.id, customerId),
	});

	if (!customer) {
		throw new Error('Customer not found');
	}

    let customerOrders: (typeof manualOrders.$inferSelect)[] = [];
    let customerMontages: (typeof montages.$inferSelect)[] = [];

    if (customer.email) {
        customerOrders = await db.query.manualOrders.findMany({
            where: eq(manualOrders.billingEmail, customer.email),
            orderBy: [desc(manualOrders.createdAt)],
            limit: 5,
        });

        customerMontages = await db.query.montages.findMany({
            where: eq(montages.contactEmail, customer.email),
            orderBy: [desc(montages.createdAt)],
            limit: 5,
        });
    }

	return {
		...customer,
        orders: customerOrders,
		montages: customerMontages,
	};
}
