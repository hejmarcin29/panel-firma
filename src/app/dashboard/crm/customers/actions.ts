'use server';

import { db } from '@/lib/db';
import { customers, montages, orders } from '@/lib/db/schema';
import { desc, eq, ilike, or, inArray, isNull, and } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';
import { randomUUID } from 'crypto';
import type { CustomerSource } from '@/lib/db/schema';
import { generatePortalToken } from '@/lib/utils';
import { sendSms } from '@/lib/sms';
import { appSettingKeys, getAppSetting } from '@/lib/settings';
import { getCurrentSession } from '@/lib/auth/session';

export type CustomerWithStats = typeof customers.$inferSelect & {
	ordersCount: number;
	montagesCount: number;
	lastActivity: Date | null;
    architectName?: string | null;
};

export type CustomerDetails = typeof customers.$inferSelect & {
	orders: (typeof orders.$inferSelect)[];
	montages: (typeof montages.$inferSelect)[];
    architect?: {
        id: string;
        name: string | null;
    } | null;
};

export async function createCustomerAction(data: {
    name: string;
    email?: string;
    phone?: string;
    taxId?: string;
    billingStreet?: string;
    billingCity?: string;
    billingPostalCode?: string;
    billingCountry?: string;
    shippingStreet?: string;
    shippingCity?: string;
    shippingPostalCode?: string;
    shippingCountry?: string;
    source?: CustomerSource;
    architectId?: string;
}) {
    await db.insert(customers).values({
        id: randomUUID(),
        ...data,
        source: data.source || 'other',
        referralToken: generatePortalToken(),
    });
    revalidatePath('/dashboard/crm/customers');
}

export async function updateCustomerAction(id: string, data: {
    name: string;
    email?: string;
    phone?: string;
    taxId?: string;
    billingStreet?: string;
    billingCity?: string;
    billingPostalCode?: string;
    billingCountry?: string;
    shippingStreet?: string;
    shippingCity?: string;
    shippingPostalCode?: string;
    shippingCountry?: string;
    source?: CustomerSource;
    architectId?: string;
}) {
    await db.update(customers)
        .set(data)
        .where(eq(customers.id, id));
    revalidatePath('/dashboard/crm/customers');
}

export async function generateCustomerPortalAccess(customerId: string) {
    await db.update(customers)
        .set({
            referralToken: generatePortalToken(),
        })
        .where(eq(customers.id, customerId));
    revalidatePath('/dashboard/crm/customers');
}

export async function getCustomers(query?: string): Promise<CustomerWithStats[]> {
    const session = await getCurrentSession();
    if (!session) return [];

    const user = session.user;
    const isAdmin = user.roles.includes('admin');

    let allowedCustomerIds: string[] | undefined;

    if (!isAdmin) {
        const userMontages = await db.query.montages.findMany({
            where: or(
                eq(montages.installerId, user.id),
                eq(montages.measurerId, user.id)
            ),
            columns: { customerId: true }
        });
        
        allowedCustomerIds = userMontages
            .map(m => m.customerId)
            .filter((id): id is string => id !== null);
            
        if (allowedCustomerIds.length === 0) {
            return [];
        }
    }

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

    const finalFilter = allowedCustomerIds 
        ? and(searchFilter, inArray(customers.id, allowedCustomerIds))
        : searchFilter;

	const rows = await db.query.customers.findMany({
		where: finalFilter,
		orderBy: [desc(customers.createdAt)],
		limit: 50,
        with: {
            architect: {
                columns: {
                    name: true
                }
            }
        }
	});

    const customerIds = rows.map(c => c.id);
    
    let customerOrders: Pick<typeof orders.$inferSelect, 'customerId' | 'createdAt'>[] = [];
    let customerMontages: Pick<typeof montages.$inferSelect, 'customerId' | 'createdAt'>[] = [];

    if (customerIds.length > 0) {
        customerOrders = await db.query.orders.findMany({
            where: inArray(orders.customerId, customerIds),
            columns: {
                customerId: true,
                createdAt: true,
            }
        });

        customerMontages = await db.query.montages.findMany({
            where: inArray(montages.customerId, customerIds),
            columns: {
                customerId: true,
                createdAt: true,
            }
        });
    }

	return rows.map((c) => {
        const myOrders = customerOrders.filter(o => o.customerId === c.id);
        const lastOrderDate = myOrders.length > 0 
            ? myOrders.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())[0].createdAt 
            : null;

        const myMontages = customerMontages.filter(m => m.customerId === c.id);
        const lastMontageDate = myMontages.length > 0
            ? myMontages.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())[0].createdAt
            : null;

        let lastActivity = lastOrderDate;
        if (lastMontageDate) {
            if (!lastActivity || lastMontageDate > lastActivity) {
                lastActivity = lastMontageDate;
            }
        }

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const architectName = (c as any).architect?.name;

		return {
			...c,
			ordersCount: myOrders.length,
			montagesCount: myMontages.length, 
			lastActivity,
            architectName
		};
	});
}

export async function getCustomerDetails(customerId: string): Promise<CustomerDetails> {
    const session = await getCurrentSession();
    if (!session) throw new Error("Unauthorized");
    
    const user = session.user;
    const isAdmin = user.roles.includes('admin');

    if (!isAdmin) {
        const hasAccess = await db.query.montages.findFirst({
            where: and(
                eq(montages.customerId, customerId),
                or(
                    eq(montages.installerId, user.id),
                    eq(montages.measurerId, user.id)
                )
            )
        });

        if (!hasAccess) {
             throw new Error("Unauthorized access to customer details");
        }
    }

	const customer = await db.query.customers.findFirst({
		where: eq(customers.id, customerId),
        with: {
            architect: {
                columns: {
                    id: true,
                    name: true
                }
            }
        }
	});

	if (!customer) {
		throw new Error('Customer not found');
	}

    let customerOrders: (typeof orders.$inferSelect)[] = [];
    let customerMontages: (typeof montages.$inferSelect)[] = [];

    customerOrders = await db.query.orders.findMany({
        where: eq(orders.customerId, customerId),
        orderBy: [desc(orders.createdAt)],
        limit: 5,
    });

    customerMontages = await db.query.montages.findMany({
        where: and(
            eq(montages.customerId, customerId),
            isNull(montages.deletedAt)
        ),
        orderBy: [desc(montages.createdAt)],
        limit: 5,
    });

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const architect = (customer as any).architect;

	return {
		...customer,
        orders: customerOrders,
		montages: customerMontages,
        architect
	};
}

export async function deleteCustomer(id: string) {
    const session = await getCurrentSession();
    if (!session || !session.user.roles.includes('admin')) {
        throw new Error("Unauthorized");
    }

    await db.update(customers)
        .set({ deletedAt: new Date() })
        .where(eq(customers.id, id));
    revalidatePath('/dashboard/crm/customers');
}

export async function sendPortalLinkSms(customerId: string) {
    const customer = await db.query.customers.findFirst({
        where: eq(customers.id, customerId),
    });

    if (!customer) {
        throw new Error('Klient nie został znaleziony.');
    }

    if (!customer.phone) {
        throw new Error('Klient nie posiada numeru telefonu.');
    }

    let token = customer.referralToken;
    if (!token) {
        token = generatePortalToken();
        await db.update(customers)
            .set({ referralToken: token })
            .where(eq(customers.id, customerId));
    }

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://b2b.primepodloga.pl';
    const link = `${appUrl}/s/${token}`;
    const companyName = await getAppSetting(appSettingKeys.companyName) || 'Prime Podłoga';
    
    const message = `Dzień dobry, przesyłamy link do śledzenia statusu zamówienia: ${link} Pozdrawiamy, ${companyName}`;

    const result = await sendSms(customer.phone, message);

    if (!result.success) {
        throw new Error(result.error || 'Błąd wysyłki SMS');
    }

    return { success: true };
}
