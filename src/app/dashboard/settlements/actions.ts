'use server';

import { revalidatePath } from 'next/cache';
import { eq, desc } from 'drizzle-orm';
import { db } from '@/lib/db';
import { montages, users, settlements, advances, type SettlementStatus } from '@/lib/db/schema';
import { requireUser } from '@/lib/auth/session';
import { generateId } from '@/lib/utils';
import { logSystemEvent } from '@/lib/logging';

const SETTLEMENTS_PATH = '/dashboard/settlements';

export type SettlementCalculation = {
    floor: {
        area: number;
        rate: number;
        amount: number;
        method: string;
        pattern: string;
    };
    skirting: {
        length: number;
        rate: number;
        amount: number;
    };
    total: number;
};

export async function calculateSettlement(montageId: string) {
    await requireUser();

    const montage = await db.query.montages.findFirst({
        where: eq(montages.id, montageId),
        with: {
            installer: true,
        },
    });

    if (!montage) throw new Error('Montaż nie istnieje');
    if (!montage.installerId) throw new Error('Montaż nie ma przypisanego montażysty');

    const installer = await db.query.users.findFirst({
        where: eq(users.id, montage.installerId),
    });

    if (!installer || !installer.installerProfile) throw new Error('Profil montażysty niekompletny');

    const rates = installer.installerProfile.rates || {};
    
    // Determine Floor Rate
    let floorRate = 0;
    const method = montage.measurementInstallationMethod; // 'click' | 'glue'
    const pattern = montage.measurementFloorPattern || 'classic'; // 'classic' | 'herringbone'

    if (pattern === 'herringbone') {
        floorRate = method === 'glue' ? (rates.herringboneGlue || 0) : (rates.herringboneClick || 0);
    } else {
        floorRate = method === 'glue' ? (rates.classicGlue || 0) : (rates.classicClick || 0);
    }

    const floorArea = montage.floorArea || 0;
    const floorAmount = floorArea * floorRate;

    // Determine Skirting Rate
    const skirtingRate = rates.skirting || 0;
    const skirtingLength = montage.skirtingLength || 0;
    const skirtingAmount = skirtingLength * skirtingRate;

    const calculation: SettlementCalculation = {
        floor: {
            area: floorArea,
            rate: floorRate,
            amount: floorAmount,
            method: method || 'unknown',
            pattern: pattern,
        },
        skirting: {
            length: skirtingLength,
            rate: skirtingRate,
            amount: skirtingAmount,
        },
        total: floorAmount + skirtingAmount,
    };

    return calculation;
}

export async function createSettlement(montageId: string, calculation: SettlementCalculation, note?: string) {
    const user = await requireUser();
    if (!user.roles.includes('admin')) throw new Error('Brak uprawnień');

    const montage = await db.query.montages.findFirst({
        where: eq(montages.id, montageId),
    });

    if (!montage || !montage.installerId) throw new Error('Brak danych montażu');

    // Check if settlement already exists
    const existing = await db.query.settlements.findFirst({
        where: eq(settlements.montageId, montageId),
    });

    if (existing) {
        if (existing.status === 'paid' || existing.status === 'approved') {
             throw new Error('Rozliczenie jest już zatwierdzone lub wypłacone');
        }
        
        await db.update(settlements).set({
            totalAmount: calculation.total,
            calculations: calculation,
            note: note,
            updatedAt: new Date(),
        }).where(eq(settlements.id, existing.id));

        await logSystemEvent(
            'settlement.updated',
            `Zaktualizowano rozliczenie dla montażu ${montageId} na kwotę ${calculation.total.toFixed(2)} PLN`,
            user.id
        );
    } else {
        await db.insert(settlements).values({
            id: generateId('set'),
            montageId: montageId,
            installerId: montage.installerId,
            status: 'draft',
            totalAmount: calculation.total,
            calculations: calculation,
            note: note,
        });

        await logSystemEvent(
            'settlement.created',
            `Utworzono rozliczenie dla montażu ${montageId} na kwotę ${calculation.total.toFixed(2)} PLN`,
            user.id
        );
    }

    revalidatePath(SETTLEMENTS_PATH);
    revalidatePath(`/dashboard/crm/montaze/${montageId}`);
}

export async function getInstallerAdvances(installerId: string) {
    await requireUser();
    return db.query.advances.findMany({
        where: eq(advances.installerId, installerId),
        orderBy: [desc(advances.requestDate)],
    });
}

export async function requestAdvance(amount: number, description: string) {
    const user = await requireUser();
    // Installer can request for themselves, Admin can request for anyone (but here we assume current user context)
    // If admin is impersonating, it works. If admin is adding for someone else, we need installerId param.
    
    // For now, let's assume this is called by the logged-in user (Installer)
    if (!user.roles.includes('installer')) throw new Error('Tylko montażysta może wnioskować o zaliczkę');

    await db.insert(advances).values({
        id: generateId('adv'),
        installerId: user.id,
        amount: amount,
        status: 'pending',
        description: description,
    });

    revalidatePath(SETTLEMENTS_PATH);
}

export async function approveAdvance(advanceId: string) {
    const user = await requireUser();
    if (!user.roles.includes('admin')) throw new Error('Brak uprawnień');

    await db.update(advances)
        .set({ status: 'paid', paidDate: new Date(), updatedAt: new Date() })
        .where(eq(advances.id, advanceId));
        
    revalidatePath(SETTLEMENTS_PATH);
}

export async function getAllSettlements() {
    const user = await requireUser();
    if (!user.roles.includes('admin')) throw new Error('Brak uprawnień');

    return db.query.settlements.findMany({
        orderBy: [desc(settlements.createdAt)],
        with: {
            montage: {
                columns: {
                    id: true,
                    clientName: true,
                    installationAddress: true,
                    installationCity: true,
                }
            },
            installer: {
                columns: {
                    id: true,
                    name: true,
                    email: true,
                }
            }
        }
    });
}

export async function getAllAdvances() {
    const user = await requireUser();
    if (!user.roles.includes('admin')) throw new Error('Brak uprawnień');

    return db.query.advances.findMany({
        orderBy: [desc(advances.requestDate)],
        with: {
            installer: {
                columns: {
                    id: true,
                    name: true,
                    email: true,
                }
            }
        }
    });
}

export async function updateSettlementStatus(settlementId: string, status: SettlementStatus) {
    const user = await requireUser();
    if (!user.roles.includes('admin')) throw new Error('Brak uprawnień');

    const settlement = await db.query.settlements.findFirst({
        where: eq(settlements.id, settlementId),
    });

    if (!settlement) throw new Error('Rozliczenie nie istnieje');

    await db.update(settlements)
        .set({ status: status, updatedAt: new Date() })
        .where(eq(settlements.id, settlementId));

    await logSystemEvent(
        'settlement.status_changed',
        `Zmieniono status rozliczenia ${settlementId} (Montaż: ${settlement.montageId}) na ${status}`,
        user.id
    );

    revalidatePath(SETTLEMENTS_PATH);
}

export async function paySettlementWithDeductions(settlementId: string, advanceIdsToDeduct: string[]) {
    const user = await requireUser();
    if (!user.roles.includes('admin')) throw new Error('Brak uprawnień');

    const settlement = await db.query.settlements.findFirst({
        where: eq(settlements.id, settlementId),
    });

    if (!settlement) throw new Error('Rozliczenie nie istnieje');

    // 1. Mark settlement as paid
    await db.update(settlements)
        .set({ status: 'paid', updatedAt: new Date() })
        .where(eq(settlements.id, settlementId));

    // 2. Mark advances as deducted
    if (advanceIdsToDeduct.length > 0) {
        // We can't use 'inArray' easily with string[] in some drizzle versions if not imported, 
        // but let's assume we can iterate or use inArray if imported.
        // Let's iterate for safety and simplicity or use Promise.all
        
        // Better: import inArray
        // But I need to check imports.
        
        for (const advanceId of advanceIdsToDeduct) {
             await db.update(advances)
                .set({ status: 'deducted', paidDate: new Date(), updatedAt: new Date() })
                .where(eq(advances.id, advanceId));
        }
    }

    await logSystemEvent(
        'settlement.paid_with_deductions',
        `Wypłacono rozliczenie ${settlementId} (Montaż: ${settlement.montageId}). Potrącono zaliczek: ${advanceIdsToDeduct.length}`,
        user.id
    );

    revalidatePath(SETTLEMENTS_PATH);
}
