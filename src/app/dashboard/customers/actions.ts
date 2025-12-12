'use server';

import { db } from '@/lib/db';
import { customers, montages, manualOrders } from '@/lib/db/schema';
import { desc, eq, ilike, or, inArray, isNull, and } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';

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
		? and(
            isNull(customers.deletedAt),
            or(
				ilike(customers.name, `%${query}%`),
				ilike(customers.email, `%${query}%`),
				ilike(customers.phone, `%${query}%`),
				ilike(customers.billingCity, `%${query}%`)
		    )
        )
		: isNull(customers.deletedAt);

	const rows = await db.query.customers.findMany({
		where: searchFilter,
		orderBy: [desc(customers.createdAt)],
		limit: 50,
	});

    const emails = rows.map(c => c.email).filter(Boolean) as string[];
    
    let customerOrders: Pick<typeof manualOrders.$inferSelect, 'billingEmail' | 'createdAt'>[] = [];
    let customerMontages: Pick<typeof montages.$inferSelect, 'contactEmail' | 'createdAt'>[] = [];

    if (emails.length > 0) {
        customerOrders = await db.query.manualOrders.findMany({
            where: inArray(manualOrders.billingEmail, emails),
            columns: {
                billingEmail: true,
                createdAt: true,
            }
        });

        customerMontages = await db.query.montages.findMany({
            where: inArray(montages.contactEmail, emails),
            columns: {
                contactEmail: true,
                createdAt: true,
            }
        });
    }

	return rows.map((c) => {
        const myOrders = customerOrders.filter(o => o.billingEmail === c.email);
        const lastOrderDate = myOrders.length > 0 
            ? myOrders.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())[0].createdAt 
            : null;

        const myMontages = customerMontages.filter(m => m.contactEmail === c.email);
        const lastMontageDate = myMontages.length > 0
            ? myMontages.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())[0].createdAt
            : null;

        let lastActivity = lastOrderDate;
        if (lastMontageDate) {
            if (!lastActivity || lastMontageDate > lastActivity) {
                lastActivity = lastMontageDate;
            }
        }

		return {
			...c,
			ordersCount: myOrders.length,
			montagesCount: myMontages.length, 
			lastActivity,
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

export async function deleteCustomer(id: string) {
    await db.update(customers)
        .set({ deletedAt: new Date() })
        .where(eq(customers.id, id));
    revalidatePath('/dashboard/customers');
}
