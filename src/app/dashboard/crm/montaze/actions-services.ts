'use server';

import { revalidatePath } from 'next/cache';
import { eq, and } from 'drizzle-orm';
import { db } from '@/lib/db';
import { montageServiceItems, services, montages, userServiceRates } from '@/lib/db/schema';
import { requireUser } from '@/lib/auth/session';
import { generateId } from '@/lib/utils';
import { logSystemEvent } from '@/lib/logging';

const MONTAGE_PATH = '/dashboard/crm/montaze';

export async function getMontageServices(montageId: string) {
    await requireUser();
    
    const items = await db.query.montageServiceItems.findMany({
        where: eq(montageServiceItems.montageId, montageId),
        with: {
            service: true,
        },
    });

    return items;
}

export async function addMontageService(montageId: string, serviceId: string, quantity: number) {
    await requireUser();

    // 1. Fetch the service to snapshot current prices
    const service = await db.query.services.findFirst({
        where: eq(services.id, serviceId),
    });

    if (!service) {
        throw new Error('Service not found');
    }

    // 2. Fetch Montage to find the Installer
    const montage = await db.query.montages.findFirst({
        where: eq(montages.id, montageId),
        columns: { installerId: true }
    });

    let installerRate = service.baseInstallerRate || 0;

    // 3. If installer is assigned, look for their specific rate
    if (montage?.installerId) {
        const userRate = await db.query.userServiceRates.findFirst({
            where: and(
                eq(userServiceRates.userId, montage.installerId),
                eq(userServiceRates.serviceId, serviceId)
            )
        });
        
        if (userRate) {
            installerRate = userRate.customRate;
        }
    }

    // 4. Create the item with snapshots
    await db.insert(montageServiceItems).values({
        id: generateId(),
        montageId,
        serviceId,
        quantity,
        snapshotName: service.name,
        clientPrice: service.basePriceNet || 0,
        installerRate: installerRate, // ONLY from specific rate, otherwise 0
        vatRate: service.vatRate || 0.08, // Default to 8% if not set
    });

    const user = await requireUser();
    await logSystemEvent('add_service', `Dodano usługę: ${service.name} (${quantity} szt.)`, user.id);

    revalidatePath(`${MONTAGE_PATH}/${montageId}`);
}

export async function removeMontageService(itemId: string, montageId: string) {
    const user = await requireUser();

    const item = await db.query.montageServiceItems.findFirst({
        where: eq(montageServiceItems.id, itemId),
    });

    await db.delete(montageServiceItems)
        .where(eq(montageServiceItems.id, itemId));

    if (item) {
        await logSystemEvent('remove_service', `Usunięto usługę: ${item.snapshotName}`, user.id);
    }

    revalidatePath(`${MONTAGE_PATH}/${montageId}`);
}

export async function updateMontageServiceQuantity(itemId: string, quantity: number, montageId: string) {
    const user = await requireUser();

    const item = await db.query.montageServiceItems.findFirst({
        where: eq(montageServiceItems.id, itemId),
    });

    await db.update(montageServiceItems)
        .set({ quantity })
        .where(eq(montageServiceItems.id, itemId));

    if (item) {
        await logSystemEvent('update_service_quantity', `Zmieniono ilość usługi ${item.snapshotName} z ${item.quantity} na ${quantity}`, user.id);
    }

    revalidatePath(`${MONTAGE_PATH}/${montageId}`);
}

export async function getEstimatedBaseService(method: string, pattern: string, montageId?: string) {
    await requireUser();

    let serviceId = '';
    if (pattern === 'herringbone') {
        serviceId = method === 'glue' ? 'svc_montaz_jodelka_klej' : 'svc_montaz_jodelka_klik';
    } else {
        serviceId = method === 'glue' ? 'svc_montaz_deska_klej' : 'svc_montaz_deska_klik';
    }

    const service = await db.query.services.findFirst({
        where: eq(services.id, serviceId)
    });

    if (!service) return null;

    let rate = service.baseInstallerRate || 0;

    // If montageId is provided, try to find specific installer rate
    if (montageId) {
        const montage = await db.query.montages.findFirst({
            where: eq(montages.id, montageId),
            columns: { installerId: true }
        });

        if (montage?.installerId) {
            const userRate = await db.query.userServiceRates.findFirst({
                where: and(
                    eq(userServiceRates.userId, montage.installerId),
                    eq(userServiceRates.serviceId, serviceId)
                )
            });
            
            if (userRate) {
                rate = userRate.customRate;
            }
        }
    }

    return {
        ...service,
        basePriceNet: rate, // Overwrite with installer rate for the cost estimation context
        isInstallerRate: true // Flag to indicate this is a cost rate
    };
}
