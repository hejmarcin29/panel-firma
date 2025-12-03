'use server';

import { db } from '@/lib/db';
import { customers, orders, montages } from '@/lib/db/schema';
import { desc, eq, ilike, or } from 'drizzle-orm';

export type CustomerWithStats = typeof customers.$inferSelect & {
	ordersCount: number;
	montagesCount: number;
	lastActivity: Date | null;
};

export type CustomerDetails = typeof customers.$inferSelect & {
	orders: (typeof orders.$inferSelect)[];
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
		with: {
			orders: {
				columns: {
					createdAt: true,
				},
			},
			// Note: montages are not directly linked to customers table in schema yet, 
            // but usually they are linked via clientName/contactEmail or we need to add customerId to montages.
            // Based on schema, montages table has clientName, contactEmail etc but no customerId FK.
            // However, orders have customerId.
            // Let's assume for now we only count orders, or we try to match montages by email if possible.
            // Wait, looking at schema: montages has no customerId. 
            // We will match montages by email for now as a best effort or just return 0 if no link.
		},
		orderBy: [desc(customers.createdAt)],
		limit: 50,
	});

    // Since montages don't have a direct FK to customers in the provided schema (it has clientName/email),
    // we might need a separate query or just skip montages count for now if performance is key.
    // But let's try to fetch montages matching the email for the "TOP 2025" experience.
    // To avoid N+1, we should probably do this differently, but for < 50 rows it's acceptable-ish or we just skip it for the list view.
    // Let's stick to orders count for the list view to be fast.

	return rows.map((c) => {
        const lastOrderDate = c.orders.length > 0 
            ? c.orders.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())[0].createdAt 
            : null;

		return {
			...c,
			ordersCount: c.orders.length,
			montagesCount: 0, // Placeholder until we link montages to customers properly
			lastActivity: lastOrderDate,
		};
	});
}

export async function getCustomerDetails(customerId: string): Promise<CustomerDetails> {
	const customer = await db.query.customers.findFirst({
		where: eq(customers.id, customerId),
		with: {
			orders: {
				orderBy: [desc(orders.createdAt)],
				limit: 5,
			},
		},
	});

	if (!customer) {
		throw new Error('Customer not found');
	}

    // Try to find montages by email
    let customerMontages: (typeof montages.$inferSelect)[] = [];
    if (customer.email) {
        customerMontages = await db.query.montages.findMany({
            where: eq(montages.contactEmail, customer.email),
            orderBy: [desc(montages.createdAt)],
            limit: 5,
        });
    }

	return {
		...customer,
        orders: customer.orders,
		montages: customerMontages,
	};
}
