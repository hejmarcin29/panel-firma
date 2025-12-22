'use server';

import { revalidatePath } from 'next/cache';
import { eq, isNull, and } from 'drizzle-orm';
import { db } from '@/lib/db';
import { services, userServiceRates } from '@/lib/db/schema';
import { requireUser } from '@/lib/auth/session';
import { generateId } from '@/lib/utils';

const SETTINGS_PATH = '/dashboard/settings';

export async function getServices() {
    await requireUser();
    return db.query.services.findMany({
        where: isNull(services.deletedAt),
        orderBy: (services, { asc }) => [asc(services.name)],
    });
}

export async function createService(data: {
    name: string;
    unit: string;
    basePriceNet: number;
    baseInstallerRate: number;
    vatRate: number;
}) {
    await requireUser();
    
    await db.insert(services).values({
        id: generateId(),
        ...data,
    });

    revalidatePath(SETTINGS_PATH);
}

export async function updateService(id: string, data: Partial<typeof services.$inferInsert>) {
    await requireUser();
    
    await db.update(services)
        .set({ ...data, updatedAt: new Date() })
        .where(eq(services.id, id));

    revalidatePath(SETTINGS_PATH);
}

export async function deleteService(id: string) {
    await requireUser();
    
    // Soft delete to preserve history in montages
    await db.update(services)
        .set({ deletedAt: new Date() })
        .where(eq(services.id, id));
        
    revalidatePath(SETTINGS_PATH);
}

export async function getRateMatrix() {
    await requireUser();
    
    const allServices = await db.query.services.findMany({
        where: isNull(services.deletedAt),
        orderBy: (services, { asc }) => [asc(services.name)],
    });
    
    // We need to filter users who have 'installer' role.
    // Since roles is a json column (array of strings), we can't easily use 'like' if it's jsonb, 
    // but schema says `roles: json('roles').default(['user']).notNull(),`
    // In postgres, we can use sql operator. Drizzle `arrayContains` might work if it was array type.
    // But it is json.
    // Let's fetch all users and filter in JS for simplicity, or use a raw sql filter if needed.
    // Given the number of users is likely small, JS filter is fine.
    
    const allUsers = await db.query.users.findMany({
        with: {
            serviceRates: true,
        }
    });

    const installers = allUsers.filter(u => 
        Array.isArray(u.roles) && u.roles.includes('installer')
    );

    return { services: allServices, installers };
}

export async function updateInstallerRate(userId: string, serviceId: string, rate: number) {
    await requireUser();

    // Check if rate exists
    const existing = await db.query.userServiceRates.findFirst({
        where: and(
            eq(userServiceRates.userId, userId),
            eq(userServiceRates.serviceId, serviceId)
        )
    });

    if (existing) {
        await db.update(userServiceRates)
            .set({ customRate: rate, updatedAt: new Date() })
            .where(eq(userServiceRates.id, existing.id));
    } else {
        await db.insert(userServiceRates).values({
            id: generateId(),
            userId,
            serviceId,
            customRate: rate,
        });
    }

    revalidatePath(SETTINGS_PATH);
}
