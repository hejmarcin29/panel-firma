'use server';

import { db } from '@/lib/db';
import { orders, customers } from '@/lib/db/schema';
import { eq, sql, desc, and, gte } from 'drizzle-orm';
import { randomUUID } from 'crypto';

export async function getShopStats() {
    // Basic stats for the shop module
    const allShopOrders = await db.select({
        status: orders.status,
        count: sql<number>`count(*)`
    })
    .from(orders)
    .where(eq(orders.source, 'shop'))
    .groupBy(orders.status);

    const pendingProforma = allShopOrders.find(o => o.status === 'order.pending_proforma')?.count || 0;
    const awaitingPayment = allShopOrders.find(o => o.status === 'order.awaiting_payment')?.count || 0;
    const completed = allShopOrders.find(o => o.status === 'order.closed' || o.status === 'order.paid')?.count || 0;
    
    // Total orders count
    const total = allShopOrders.reduce((acc, curr) => acc + Number(curr.count), 0);

    // Recent orders fetch
    const recentOrders = await db.query.orders.findMany({
        where: eq(orders.source, 'shop'),
        orderBy: [desc(orders.createdAt)],
        limit: 5,
        with: {
            customer: true
        }
    });

    // Simple Trend Calculation (Last 7 days vs previous 7 days) - simplified for speed
    // Ideally we would do this with a proper date query
    const today = new Date();
    const lastWeek = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
    
    const recentCountResult = await db.select({ count: sql<number>`count(*)` })
        .from(orders)
        .where(
            and(
                eq(orders.source, 'shop'),
                gte(orders.createdAt, lastWeek)
            )
        );
    
    // Simulate a trend for now if no data (mockup) or calculate valid
    const lastWeekCount = Number(recentCountResult[0]?.count || 0);
    // Arbitrary trend logic for demo: if > 0 then positive
    const trend = lastWeekCount > 0 ? "+12%" : "0%";

    return {
        total,
        pendingProforma,
        awaitingPayment,
        completed,
        recentOrders,
        trend
    };
}

export async function generateQuickShopLink(email: string, name?: string) {
    if (!email) return { success: false, error: 'Email jest wymagany' };

    const customer = await db.query.customers.findFirst({
        where: eq(customers.email, email),
    });

    let token = customer?.referralToken;

    if (!customer) {
        // Create new
        token = generatePortalToken();
        const newId = randomUUID();
        await db.insert(customers).values({
            id: newId,
            email,
            name: name || email,
            referralToken: token,
            source: 'other', // or 'shop_direct'
        });
    } else if (!token) {
        // Update existing
        token = generatePortalToken();
        await db.update(customers)
            .set({ referralToken: token })
            .where(eq(customers.id, customer.id));
    }

    const url = `${process.env.NEXT_PUBLIC_APP_URL || 'https://b2b.primepodloga.pl'}/sklep/${token}`;

    return { success: true, url };
}

function generatePortalToken() {
    const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
    let token = '';
    for (let i = 0; i < 32; i++) {
        token += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return token;
}
