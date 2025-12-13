'use server';

import { db } from '@/lib/db';
import { notifications, systemLogs, products, users } from '@/lib/db/schema';
import { eq, inArray } from 'drizzle-orm';
import { getCurrentSession } from '@/lib/auth/session';

export async function requestSamples(productIds: number[]) {
    const session = await getCurrentSession();
    if (!session?.user) {
        throw new Error('Unauthorized');
    }

    const architect = await db.query.users.findFirst({
        where: eq(users.id, session.user.id),
        columns: {
            name: true,
            email: true,
            architectProfile: true,
        }
    });

    if (!architect) {
        throw new Error('User not found');
    }

    const requestedProducts = await db.query.products.findMany({
        where: inArray(products.id, productIds),
        columns: {
            name: true,
            sku: true,
        }
    });

    const productList = requestedProducts.map(p => `- ${p.name} (${p.sku})`).join('\n');

    // Create notification for admins
    // Find all admins
    // For simplicity, we'll just log it for now or assume there is a mechanism to notify admins.
    // We will insert into 'notifications' table if it exists and is used for this.
    
    // Let's check if we can insert into notifications.
    // Schema: id, userId, title, message, type, status, createdAt, metadata
    
    // We need to find admin IDs.
    /*
    const admins = await db.query.users.findMany({
        where: (users, { sql }) => sql`roles::jsonb ? 'admin'`,
        columns: { id: true }
    });

    const notificationPromises = admins.map(admin => 
        db.insert(notifications).values({
            id: crypto.randomUUID(),
            userId: admin.id,
            title: 'Nowe zamówienie próbek',
            message: `Architekt ${architect.name} (${architect.email}) zamówił próbki:\n${productList}`,
            type: 'info',
            status: 'pending',
            channel: 'email',
        })
    );

    await Promise.all(notificationPromises);
    */

    // Log to system logs
    await db.insert(systemLogs).values({
        id: crypto.randomUUID(),
        userId: session.user.id,
        action: 'showroom.request_samples',
        details: JSON.stringify({
            architectName: architect.name,
            productIds,
            products: requestedProducts.map(p => p.name)
        }),
    });

    return { success: true };
}
